import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";

const DEFAULT_PROTOCOL_VERSION = "2024-11-05";
const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;
const DEFAULT_TOOL_TIMEOUT_MS = 120_000;
const MAX_STDERR_LINES = 80;

interface JsonRpcRequest {
	jsonrpc: "2.0";
	id: number;
	method: string;
	params?: unknown;
}

interface JsonRpcNotification {
	jsonrpc: "2.0";
	method: string;
	params?: unknown;
}

interface JsonRpcResponse {
	jsonrpc?: "2.0";
	id?: number;
	result?: unknown;
	error?: { code?: number; message?: string; data?: unknown };
}

interface McpTool {
	name: string;
	description?: string;
	inputSchema?: Record<string, unknown>;
}

interface McpListToolsResult {
	tools?: McpTool[];
	nextCursor?: string;
}

interface McpToolResult {
	content?: Array<Record<string, unknown>>;
	isError?: boolean;
	[key: string]: unknown;
}

type PendingRequest = {
	resolve: (value: unknown) => void;
	reject: (error: Error) => void;
	timer: NodeJS.Timeout;
	signal?: AbortSignal;
	onAbort?: () => void;
};

export interface McpStdioPluginConfig {
	/** Stable short id used for status command/tool names, e.g. "cron". */
	slug: string;
	/** Human-readable name for UI/status text. */
	label: string;
	/** Child process command that starts an MCP stdio server. */
	command: string;
	/** Child process arguments. */
	args?: string[];
	/** Working directory for the MCP server. Defaults to Pi's process cwd. */
	cwd?: string;
	/** Environment variables to add/override for the MCP process. */
	env?: Record<string, string | undefined>;
	/** Prefix for Pi tool names. Defaults to slug. */
	toolPrefix?: string;
	/** Optional mapper for the MCP tool name segment before applying the Pi prefix. */
	toolNameMap?: (name: string) => string;
	/** Optional mapper for text returned by MCP tools before displaying it in Pi. */
	resultTextMap?: (text: string) => string;
	/** Set this environment variable to 0/false/off to skip startup tool discovery. */
	autoloadEnv?: string;
	/** Startup/list timeout. */
	startupTimeoutMs?: number;
	/** Per-tool-call timeout. */
	toolTimeoutMs?: number;
	/** Extra guidance appended to each registered tool. */
	promptGuidelines?: string[];
}

export function npxCommand(packageName: string, args: string[] = []): { command: string; args: string[] } {
	return {
		command: process.platform === "win32" ? "npx.cmd" : "npx",
		args: ["-y", packageName, ...args],
	};
}

export function splitArgs(value: string | undefined): string[] {
	if (!value?.trim()) return [];
	const matches = value.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
	return matches.map((part) => part.replace(/^(["'])(.*)\1$/, "$2"));
}

function envFlagEnabled(name: string | undefined): boolean {
	if (!name) return true;
	const value = process.env[name];
	if (value === undefined) return true;
	return !["0", "false", "off", "no"].includes(value.toLowerCase());
}

function sanitizeToolName(name: string): string {
	return name.replace(/[^A-Za-z0-9_-]/g, "_");
}

function prefixedToolName(prefix: string, name: string): string {
	return sanitizeToolName(`${prefix}_${name}`);
}

function normalizeSchema(schema: Record<string, unknown> | undefined): Record<string, unknown> {
	if (!schema || typeof schema !== "object") return Type.Object({}) as unknown as Record<string, unknown>;
	if (schema.type === "object") return schema;
	return { type: "object", properties: {}, additionalProperties: true };
}

function contentText(part: Record<string, unknown>): string {
	if (typeof part.text === "string") return part.text;
	return JSON.stringify(part, null, 2);
}

function toPiContent(
	content: Array<Record<string, unknown>> | undefined,
	textMap: (text: string) => string = (text) => text,
): Array<Record<string, unknown>> {
	if (!content?.length) return [{ type: "text", text: textMap("(MCP tool returned no content.)") }];
	return content.map((part) => {
		if (part.type === "text") return { type: "text", text: textMap(contentText(part)) };
		if (part.type === "image" && typeof part.data === "string" && typeof part.mimeType === "string") {
			return { type: "image", data: part.data, mimeType: part.mimeType };
		}
		return { type: "text", text: textMap(contentText(part)) };
	});
}

function formatError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

class McpStdioClient {
	private child?: ChildProcessWithoutNullStreams;
	private nextId = 1;
	private pending = new Map<number, PendingRequest>();
	private stdoutBuffer = "";
	private stderrLines: string[] = [];
	private startPromise?: Promise<void>;

	constructor(private readonly config: McpStdioPluginConfig) {}

	get stderrTail(): string {
		return this.stderrLines.slice(-20).join("\n");
	}

	get running(): boolean {
		return !!this.child && this.child.exitCode === null;
	}

	async listTools(signal?: AbortSignal): Promise<McpTool[]> {
		await this.ensureStarted(signal);
		const tools: McpTool[] = [];
		let cursor: string | undefined;
		do {
			const result = await this.request("tools/list", cursor ? { cursor } : {}, this.config.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS, signal) as McpListToolsResult;
			tools.push(...(result.tools ?? []));
			cursor = result.nextCursor;
		} while (cursor);
		return tools;
	}

	async callTool(name: string, args: Record<string, unknown>, signal?: AbortSignal): Promise<McpToolResult> {
		await this.ensureStarted(signal);
		return this.request("tools/call", { name, arguments: args }, this.config.toolTimeoutMs ?? DEFAULT_TOOL_TIMEOUT_MS, signal) as Promise<McpToolResult>;
	}

	async close(): Promise<void> {
		const child = this.child;
		this.child = undefined;
		this.startPromise = undefined;
		for (const [id, pending] of this.pending) {
			this.clearPending(id, pending);
			pending.reject(new Error(`${this.config.label} MCP process closed.`));
		}
		if (!child) return;
		await new Promise<void>((resolve) => {
			const timer = setTimeout(() => {
				if (child.exitCode === null) child.kill("SIGKILL");
				resolve();
			}, 2_000);
			child.once("close", () => {
				clearTimeout(timer);
				resolve();
			});
			try {
				child.stdin.end();
			} catch {
				resolve();
			}
		});
	}

	private async ensureStarted(signal?: AbortSignal): Promise<void> {
		if (this.running) return;
		if (this.startPromise) return this.startPromise;
		this.startPromise = this.start(signal).finally(() => {
			this.startPromise = undefined;
		});
		return this.startPromise;
	}

	private async start(signal?: AbortSignal): Promise<void> {
		this.stderrLines = [];
		this.stdoutBuffer = "";
		const env = { ...process.env, ...this.config.env } as NodeJS.ProcessEnv;
		for (const key of Object.keys(env)) if (env[key] === undefined) delete env[key];

		const cwd = this.config.cwd ?? process.cwd();
		const child = spawn(this.config.command, this.config.args ?? [], {
			cwd,
			env,
			stdio: ["pipe", "pipe", "pipe"],
			windowsHide: true,
		});
		this.child = child;

		child.stderr.on("data", (chunk: Buffer) => this.captureStderr(chunk));
		child.stdout.on("data", (chunk: Buffer) => this.captureStdout(chunk));
		child.once("close", (code, signalName) => {
			if (this.child === child) this.child = undefined;
			const message = `${this.config.label} MCP process exited (${signalName ?? code ?? "unknown"}).${this.stderrTail ? `\n${this.stderrTail}` : ""}`;
			for (const [id, pending] of this.pending) {
				this.clearPending(id, pending);
				pending.reject(new Error(message));
			}
		});

		await new Promise<void>((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error(`${this.config.label} MCP spawn timed out.`)), this.config.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS);
			child.once("spawn", () => {
				clearTimeout(timer);
				resolve();
			});
			child.once("error", (error) => {
				clearTimeout(timer);
				reject(error);
			});
		});

		try {
			await this.request("initialize", {
				protocolVersion: DEFAULT_PROTOCOL_VERSION,
				capabilities: {},
				clientInfo: { name: `pi-${this.config.slug}-plugin`, version: "0.1.0" },
			}, this.config.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS, signal);
			this.notify("notifications/initialized", {});
		} catch (error) {
			await this.close();
			throw error;
		}
	}

	private captureStderr(chunk: Buffer): void {
		const text = chunk.toString("utf8").replace(/\r/g, "");
		for (const line of text.split("\n")) {
			if (!line) continue;
			this.stderrLines.push(line);
			if (this.stderrLines.length > MAX_STDERR_LINES) this.stderrLines.shift();
		}
	}

	private captureStdout(chunk: Buffer): void {
		this.stdoutBuffer += chunk.toString("utf8");
		let newline = this.stdoutBuffer.indexOf("\n");
		while (newline !== -1) {
			const line = this.stdoutBuffer.slice(0, newline).replace(/\r$/, "");
			this.stdoutBuffer = this.stdoutBuffer.slice(newline + 1);
			this.handleLine(line);
			newline = this.stdoutBuffer.indexOf("\n");
		}
	}

	private handleLine(line: string): void {
		if (!line.trim()) return;
		let message: JsonRpcResponse;
		try {
			message = JSON.parse(line) as JsonRpcResponse;
		} catch {
			this.captureStderr(Buffer.from(`[stdout non-json] ${line}`));
			return;
		}
		if (typeof message.id !== "number") return;
		const pending = this.pending.get(message.id);
		if (!pending) return;
		this.clearPending(message.id, pending);
		if (message.error) {
			pending.reject(new Error(`${message.error.message ?? "MCP error"}${message.error.data ? `: ${JSON.stringify(message.error.data)}` : ""}`));
		} else {
			pending.resolve(message.result);
		}
	}

	private request(method: string, params: unknown, timeoutMs: number, signal?: AbortSignal): Promise<unknown> {
		if (!this.child?.stdin || this.child.exitCode !== null) throw new Error(`${this.config.label} MCP process is not running.`);
		const id = this.nextId++;
		const payload: JsonRpcRequest = { jsonrpc: "2.0", id, method, params };
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				const pending = this.pending.get(id);
				if (!pending) return;
				this.clearPending(id, pending);
				reject(new Error(`${this.config.label} MCP request timed out: ${method}.${this.stderrTail ? `\n${this.stderrTail}` : ""}`));
			}, timeoutMs);
			const onAbort = () => {
				const pending = this.pending.get(id);
				if (!pending) return;
				this.clearPending(id, pending);
				this.notify("notifications/cancelled", { requestId: id, reason: "Pi tool call aborted" });
				reject(new Error(`${this.config.label} MCP request aborted: ${method}.`));
			};
			if (signal?.aborted) {
				clearTimeout(timer);
				reject(new Error(`${this.config.label} MCP request aborted: ${method}.`));
				return;
			}
			signal?.addEventListener("abort", onAbort, { once: true });
			this.pending.set(id, { resolve, reject, timer, signal, onAbort });
			this.child!.stdin.write(JSON.stringify(payload) + "\n", (error) => {
				if (!error) return;
				const pending = this.pending.get(id);
				if (!pending) return;
				this.clearPending(id, pending);
				reject(error);
			});
		});
	}

	private notify(method: string, params: unknown): void {
		if (!this.child?.stdin || this.child.exitCode !== null) return;
		const payload: JsonRpcNotification = { jsonrpc: "2.0", method, params };
		this.child.stdin.write(JSON.stringify(payload) + "\n");
	}

	private clearPending(id: number, pending: PendingRequest): void {
		this.pending.delete(id);
		clearTimeout(pending.timer);
		if (pending.signal && pending.onAbort) pending.signal.removeEventListener("abort", pending.onAbort);
	}
}

export function createMcpStdioExtension(config: McpStdioPluginConfig) {
	return async function mcpStdioPiExtension(pi: ExtensionAPI) {
		const client = new McpStdioClient(config);
		const registeredToolNames = new Set<string>();
		const toolPrefix = config.toolPrefix ?? config.slug;
		const mappedToolName = (name: string) => config.toolNameMap?.(name) ?? name;
		const piToolName = (name: string) => prefixedToolName(toolPrefix, mappedToolName(name));
		let lastLoadError: string | undefined;

		const registerTools = async (signal?: AbortSignal): Promise<McpTool[]> => {
			const tools = await client.listTools(signal);
			for (const tool of tools) {
				const alias = mappedToolName(tool.name);
				const piName = piToolName(tool.name);
				if (registeredToolNames.has(piName)) continue;
				registeredToolNames.add(piName);
				pi.registerTool({
					name: piName,
					label: `${config.label}: ${alias}`,
					description: `${tool.description ?? `${config.label} MCP tool ${tool.name}`}\n\nPi alias: ${alias}. Original MCP tool: ${tool.name}.`,
					promptSnippet: `${config.label} MCP tool: ${tool.description ?? alias}`,
					promptGuidelines: config.promptGuidelines,
					parameters: normalizeSchema(tool.inputSchema) as never,
					async execute(_toolCallId, params, signal) {
						const result = await client.callTool(tool.name, params as Record<string, unknown>, signal);
						return {
							content: toPiContent(result.content, config.resultTextMap) as never,
							details: { mcpServer: config.slug, mcpTool: tool.name, piTool: piName, isMcpError: !!result.isError },
							isError: !!result.isError,
						} as never;
					},
				});
			}
			lastLoadError = undefined;
			return tools;
		};

		pi.registerTool({
			name: prefixedToolName(toolPrefix, "mcp_status"),
			label: `${config.label}: MCP Status`,
			description: `Check, load, or reload the ${config.label} MCP stdio bridge tools.`,
			parameters: Type.Object({
				reload: Type.Optional(Type.Boolean({ description: "Restart the MCP server before listing tools." })),
			}),
			async execute(_toolCallId, params, signal) {
				const input = params as { reload?: boolean };
				if (input.reload) await client.close();
				try {
					const tools = await registerTools(signal);
					const names = tools.map((tool) => `- ${piToolName(tool.name)} (MCP: ${tool.name})`).join("\n");
					return {
						content: [{ type: "text", text: `${config.label} MCP bridge running. Registered ${tools.length} tool(s).\n${names || "No MCP tools reported."}` }],
						details: { mcpServer: config.slug, tools: tools.map((tool) => tool.name) },
					};
				} catch (error) {
					lastLoadError = formatError(error);
					return {
						content: [{ type: "text", text: `${config.label} MCP bridge failed: ${lastLoadError}${client.stderrTail ? `\n\nMCP stderr:\n${client.stderrTail}` : ""}` }],
						details: { mcpServer: config.slug, error: lastLoadError, stderr: client.stderrTail },
						isError: true,
					} as never;
				}
			},
		});

		pi.registerCommand(`${config.slug}-mcp-reload`, {
			description: `Restart and reload ${config.label} MCP tools`,
			handler: async (_args, ctx) => {
				await client.close();
				try {
					const tools = await registerTools(ctx.signal);
					ctx.ui.notify(`${config.label}: loaded ${tools.length} MCP tool(s).`, "info");
				} catch (error) {
					lastLoadError = formatError(error);
					ctx.ui.notify(`${config.label}: MCP load failed: ${lastLoadError}`, "error");
				}
			},
		});

		pi.on("session_start", async (_event, ctx) => {
			if (!ctx.hasUI) return;
			const theme = ctx.ui.theme;
			ctx.ui.setStatus(config.slug, lastLoadError ? theme.fg("warning", `${config.slug}: mcp error`) : theme.fg("muted", config.slug));
		});

		pi.on("session_shutdown", async () => {
			await client.close();
		});

		if (envFlagEnabled(config.autoloadEnv ?? `${config.slug.toUpperCase().replace(/-/g, "_")}_MCP_AUTOLOAD`)) {
			try {
				await registerTools();
			} catch (error) {
				lastLoadError = formatError(error);
				// Keep Pi startup alive; the status tool and reload command can retry with full diagnostics.
			}
		}
	};
}
