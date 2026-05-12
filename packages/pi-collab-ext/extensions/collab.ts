import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

type ModelLike = NonNullable<ExtensionContext["model"]>;
type ModelCandidate = Pick<ModelLike, "provider" | "id" | "name">;
type NotifyType = "info" | "warning" | "error";
type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

const THINKING_LEVELS = new Set<ThinkingLevel>(["off", "minimal", "low", "medium", "high", "xhigh"]);
const STATUS_KEY = "collab";
const USAGE = `Usage:
/collab [{"model":"gpt-5.5","job":"do code review and write FINDINGS.md"},{"model":"opus-4.7","job":"implement a fix for the top issue in FINDINGS.md"}]

Object form:
/collab {"restoreModel":true,"steps":[{"model":"anthropic/claude-opus-4-7","job":"review recent changes"}]}`;
const EXAMPLE_PLAN = `[{"model":"gpt-5.5","job":"do code review and write FINDINGS.md"},{"model":"opus-4.7","job":"implement a fix for the top issue in FINDINGS.md"},{"model":"gpt-5.5","job":"review recent changes and cleanup any related issues"}]`;

export interface CollabStep {
	model: string;
	job: string;
	thinkingLevel?: ThinkingLevel;
}

export interface CollabPlan {
	steps: CollabStep[];
	restoreModel: boolean;
	name?: string;
}

interface ActiveCollabRun {
	id: number;
	plan: CollabPlan;
	startedAt: number;
	originalModel: ModelLike | undefined;
	nextIndex: number;
	currentIndex: number | undefined;
	currentModel: string | undefined;
	awaitingAgentEnd: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWhitespace(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

function normalizeStep(value: unknown, index: number): CollabStep {
	if (!isRecord(value)) throw new Error(`Step ${index + 1} must be an object with model and job strings.`);
	const model = typeof value.model === "string" ? normalizeWhitespace(value.model) : "";
	const job = typeof value.job === "string" ? value.job.trim() : "";
	if (!model) throw new Error(`Step ${index + 1} is missing a non-empty model string.`);
	if (!job) throw new Error(`Step ${index + 1} is missing a non-empty job string.`);

	const step: CollabStep = { model, job };
	if (value.thinkingLevel !== undefined) {
		if (typeof value.thinkingLevel !== "string" || !THINKING_LEVELS.has(value.thinkingLevel as ThinkingLevel)) {
			throw new Error(`Step ${index + 1} has invalid thinkingLevel. Use one of: ${Array.from(THINKING_LEVELS).join(", ")}.`);
		}
		step.thinkingLevel = value.thinkingLevel as ThinkingLevel;
	}
	return step;
}

export function parseCollabInput(raw: string): CollabPlan {
	const trimmed = raw.trim();
	if (!trimmed) throw new Error("Provide a JSON array of {model, job} steps. Use /collab with no arguments for an example.");

	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed);
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`Invalid JSON for collab workflow: ${reason}`);
	}

	const wrapper = Array.isArray(parsed) ? { steps: parsed } : parsed;
	if (!isRecord(wrapper)) throw new Error("Collab input must be a JSON array or an object with a steps array.");
	if (!Array.isArray(wrapper.steps)) throw new Error("Collab input must include a steps array.");
	if (wrapper.steps.length === 0) throw new Error("Collab workflow needs at least one step.");

	const restoreModel = wrapper.restoreModel === true;
	const name = typeof wrapper.name === "string" && wrapper.name.trim() ? wrapper.name.trim() : undefined;
	return {
		steps: wrapper.steps.map((step, index) => normalizeStep(step, index)),
		restoreModel,
		name,
	};
}

export function normalizeModelText(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function selectorTokens(selector: string): string[] {
	return selector
		.toLowerCase()
		.split(/[^a-z0-9]+/g)
		.map((token) => token.trim())
		.filter(Boolean);
}

export function getModelMatchScore(selector: string, candidate: ModelCandidate): number {
	const wanted = selector.trim().toLowerCase();
	if (!wanted) return 0;

	const providerId = `${candidate.provider}/${candidate.id}`.toLowerCase();
	const id = candidate.id.toLowerCase();
	const name = candidate.name.toLowerCase();
	if (wanted === providerId) return 110;
	if (wanted === id || wanted === name) return 100;

	const normalizedWanted = normalizeModelText(wanted);
	const normalizedProviderId = normalizeModelText(providerId);
	const normalizedId = normalizeModelText(id);
	const normalizedName = normalizeModelText(name);
	if (normalizedWanted === normalizedProviderId) return 95;
	if (normalizedWanted === normalizedId || normalizedWanted === normalizedName) return 90;

	const haystack = `${providerId} ${name}`;
	if (haystack.includes(wanted)) return 80;
	if (normalizedProviderId.includes(normalizedWanted) || normalizedName.includes(normalizedWanted)) return 70;

	const tokens = selectorTokens(selector);
	if (tokens.length > 0 && tokens.every((token) => haystack.includes(token))) return 60;
	return 0;
}

function formatModel(model: ModelCandidate): string {
	return `${model.provider}/${model.id}`;
}

function formatCandidates(candidates: ModelCandidate[], limit = 8): string {
	return candidates
		.slice(0, limit)
		.map((model) => formatModel(model))
		.join(", ");
}

async function resolveModel(ctx: ExtensionContext, selector: string): Promise<ModelLike> {
	const [provider, ...modelParts] = selector.split("/");
	if (provider && modelParts.length > 0) {
		const modelId = modelParts.join("/");
		const exact = ctx.modelRegistry.find(provider, modelId) as ModelLike | undefined;
		if (exact) {
			if (!ctx.modelRegistry.hasConfiguredAuth(exact)) throw new Error(`No auth configured for ${formatModel(exact)}.`);
			return exact;
		}
	}

	const available = ctx.modelRegistry.getAvailable() as ModelLike[];
	const matches = available
		.map((model) => ({ model, score: getModelMatchScore(selector, model) }))
		.filter((match) => match.score > 0)
		.sort((a, b) => b.score - a.score || formatModel(a.model).localeCompare(formatModel(b.model)));

	if (matches.length === 0) {
		const allMatches = (ctx.modelRegistry.getAll() as ModelLike[])
			.map((model) => ({ model, score: getModelMatchScore(selector, model) }))
			.filter((match) => match.score > 0)
			.sort((a, b) => b.score - a.score || formatModel(a.model).localeCompare(formatModel(b.model)));
		if (allMatches.length > 0) {
			throw new Error(`Model "${selector}" matched ${formatCandidates(allMatches.map((match) => match.model))}, but none have configured auth.`);
		}
		throw new Error(`No available model matched "${selector}". Use /model or provider/id (for example anthropic/claude-opus-4-7).`);
	}

	const bestScore = matches[0].score;
	const bestMatches = matches.filter((match) => match.score === bestScore);
	if (bestMatches.length > 1) {
		throw new Error(`Model "${selector}" is ambiguous: ${formatCandidates(bestMatches.map((match) => match.model))}. Use provider/id.`);
	}

	return bestMatches[0].model;
}

export function formatStepPrompt(step: CollabStep, index: number, total: number, workflowName?: string): string {
	const title = workflowName ? `Pi Collab step ${index + 1}/${total}: ${workflowName}` : `Pi Collab step ${index + 1}/${total}`;
	return `${title}

Model requested: ${step.model}

Job:
${step.job}

Workflow notes:
- This is one step in a pi-collab-ext sequential workflow.
- Complete only this job; do not attempt later workflow steps yourself.
- When this job is complete, provide a concise summary. pi-collab-ext will advance to the next step automatically.`;
}

function sendWorkflowPrompt(pi: ExtensionAPI, ctx: ExtensionContext, prompt: string): void {
	if (ctx.isIdle()) {
		pi.sendUserMessage(prompt);
	} else {
		pi.sendUserMessage(prompt, { deliverAs: "followUp" });
	}
}

function lastAssistantFailure(messages: unknown[]): string | undefined {
	for (let index = messages.length - 1; index >= 0; index--) {
		const message = messages[index];
		if (!isRecord(message) || message.role !== "assistant") continue;
		const stopReason = typeof message.stopReason === "string" ? message.stopReason : undefined;
		const errorMessage = typeof message.errorMessage === "string" ? message.errorMessage : undefined;
		if (stopReason === "aborted") return "the current step was aborted";
		if (stopReason === "error") return errorMessage ? `provider error: ${errorMessage}` : "provider error";
		if (errorMessage) return errorMessage;
	}
	return undefined;
}

export default function collabExtension(pi: ExtensionAPI): void {
	let activeRun: ActiveCollabRun | undefined;
	let nextRunId = 1;

	function notify(ctx: ExtensionContext, message: string, type: NotifyType = "info"): void {
		if (ctx.hasUI) ctx.ui.notify(message, type);
	}

	function updateStatus(ctx: ExtensionContext): void {
		if (!ctx.hasUI) return;
		if (!activeRun) {
			ctx.ui.setStatus(STATUS_KEY, undefined);
			return;
		}
		const total = activeRun.plan.steps.length;
		const current = activeRun.currentIndex === undefined ? activeRun.nextIndex + 1 : activeRun.currentIndex + 1;
		const model = activeRun.currentModel ? ` ${activeRun.currentModel}` : "";
		ctx.ui.setStatus(STATUS_KEY, `collab ${current}/${total}${model}`);
	}

	async function finishRun(ctx: ExtensionContext, message: string, type: NotifyType = "info"): Promise<void> {
		const run = activeRun;
		activeRun = undefined;
		if (run?.plan.restoreModel && run.originalModel) {
			const restored = await pi.setModel(run.originalModel);
			if (!restored) notify(ctx, `Collab could not restore ${formatModel(run.originalModel)}; auth is no longer available.`, "warning");
		}
		updateStatus(ctx);
		if (run) {
			pi.appendEntry("collab-run", {
				runId: run.id,
				name: run.plan.name,
				steps: run.plan.steps.length,
				completedAt: Date.now(),
				message,
			});
		}
		notify(ctx, message, type);
	}

	async function startNextStep(ctx: ExtensionContext): Promise<void> {
		const run = activeRun;
		if (!run) return;

		if (run.nextIndex >= run.plan.steps.length) {
			await finishRun(ctx, `Collab run complete (${run.plan.steps.length}/${run.plan.steps.length} steps).`);
			return;
		}

		const stepIndex = run.nextIndex;
		const step = run.plan.steps[stepIndex];
		run.nextIndex += 1;
		run.currentIndex = stepIndex;

		let model: ModelLike;
		try {
			model = await resolveModel(ctx, step.model);
		} catch (error) {
			const reason = error instanceof Error ? error.message : String(error);
			await finishRun(ctx, `Collab stopped before step ${stepIndex + 1}: ${reason}`, "error");
			return;
		}

		const switched = await pi.setModel(model);
		if (!switched) {
			await finishRun(ctx, `Collab stopped before step ${stepIndex + 1}: no auth for ${formatModel(model)}.`, "error");
			return;
		}
		if (step.thinkingLevel) pi.setThinkingLevel(step.thinkingLevel);

		run.currentModel = formatModel(model);
		run.awaitingAgentEnd = true;
		updateStatus(ctx);
		pi.appendEntry("collab-step", {
			runId: run.id,
			step: stepIndex + 1,
			total: run.plan.steps.length,
			requestedModel: step.model,
			resolvedModel: formatModel(model),
			job: step.job,
		});
		notify(ctx, `Collab step ${stepIndex + 1}/${run.plan.steps.length}: ${formatModel(model)}`, "info");
		sendWorkflowPrompt(pi, ctx, formatStepPrompt(step, stepIndex, run.plan.steps.length, run.plan.name));
	}

	async function startRun(plan: CollabPlan, ctx: ExtensionContext): Promise<void> {
		if (activeRun) throw new Error(`A collab run is already active (${activeRun.currentIndex === undefined ? 0 : activeRun.currentIndex + 1}/${activeRun.plan.steps.length}). Use /collab-stop first.`);
		activeRun = {
			id: nextRunId++,
			plan,
			startedAt: Date.now(),
			originalModel: ctx.model,
			nextIndex: 0,
			currentIndex: undefined,
			currentModel: undefined,
			awaitingAgentEnd: false,
		};
		notify(ctx, `Starting collab run with ${plan.steps.length} step${plan.steps.length === 1 ? "" : "s"}.`, "info");
		await startNextStep(ctx);
	}

	pi.registerCommand("collab", {
		description: "Run sequential multi-model collaboration steps from a JSON array",
		handler: async (args, ctx) => {
			const trimmed = args.trim();
			if (!trimmed) {
				if (ctx.hasUI) ctx.ui.setEditorText(`/collab ${EXAMPLE_PLAN}`);
				notify(ctx, USAGE, "info");
				return;
			}

			let plan: CollabPlan;
			try {
				plan = parseCollabInput(trimmed);
			} catch (error) {
				const reason = error instanceof Error ? error.message : String(error);
				notify(ctx, reason, "error");
				return;
			}
			if (activeRun) {
				notify(ctx, `A collab run is already active. Use /collab-stop before starting another.`, "warning");
				return;
			}

			await ctx.waitForIdle();
			try {
				await startRun(plan, ctx);
			} catch (error) {
				const reason = error instanceof Error ? error.message : String(error);
				notify(ctx, reason, "error");
			}
		},
	});

	pi.registerCommand("collab-status", {
		description: "Show the active collab workflow status",
		handler: async (_args, ctx) => {
			if (!activeRun) {
				notify(ctx, "No collab run is active.", "info");
				return;
			}
			const elapsedSeconds = Math.round((Date.now() - activeRun.startedAt) / 1000);
			const current = activeRun.currentIndex === undefined ? 0 : activeRun.currentIndex + 1;
			notify(ctx, `Collab run ${activeRun.id}: step ${current}/${activeRun.plan.steps.length}, next ${activeRun.nextIndex + 1}, elapsed ${elapsedSeconds}s.`, "info");
		},
	});

	pi.registerCommand("collab-stop", {
		description: "Stop advancing the active collab workflow; pass 'abort' to abort the current model turn",
		handler: async (args, ctx) => {
			if (!activeRun) {
				notify(ctx, "No collab run is active.", "info");
				return;
			}
			const runId = activeRun.id;
			activeRun = undefined;
			updateStatus(ctx);
			if (args.trim().toLowerCase() === "abort") ctx.abort();
			notify(ctx, `Stopped collab run ${runId}.`, "warning");
		},
	});

	pi.on("agent_end", async (event, ctx) => {
		if (!activeRun?.awaitingAgentEnd) return;
		activeRun.awaitingAgentEnd = false;
		const failed = lastAssistantFailure(event.messages);
		if (failed) {
			const step = activeRun.currentIndex === undefined ? "current step" : `step ${activeRun.currentIndex + 1}`;
			await finishRun(ctx, `Collab stopped after ${step}: ${failed}`, "error");
			return;
		}
		await startNextStep(ctx);
	});

	pi.on("session_shutdown", () => {
		activeRun = undefined;
	});
}
