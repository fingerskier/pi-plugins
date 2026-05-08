import type { ExtensionAPI, ExtensionContext, ReadonlyFooterDataProvider, Theme } from "@mariozechner/pi-coding-agent";

type FooterComponent = {
	render(width: number): string[];
	invalidate(): void;
	dispose?(): void;
};

type UsageTotals = {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
	cost: number;
};

type UsageShape = {
	input?: number;
	output?: number;
	cacheRead?: number;
	cacheWrite?: number;
	cost?: {
		total?: number;
	};
};

type StatsPart = {
	text: string;
	tone: "dim" | "successBilling" | "warning" | "error";
};

type ModelLike = NonNullable<ExtensionContext["model"]>;

const ANSI_PATTERN = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;
const ANSI_AT_START = /^\x1b\[[0-9;?]*[ -/]*[@-~]/;
const OVERAGE_FLAG_KEYS = [
	"overage",
	"usingOverage",
	"using_overage",
	"extraUsage",
	"extra_usage",
	"maxed",
	"usageMaxed",
	"usage_maxed",
	"quotaExceeded",
	"quota_exceeded",
	"limitReached",
	"limit_reached",
] as const;
const OVERAGE_NESTED_KEYS = ["usage", "quota", "limits", "subscription", "billing"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function finiteNumber(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sanitizeStatusText(text: string): string {
	return text.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim();
}

function stripAnsi(text: string): string {
	return text.replace(ANSI_PATTERN, "");
}

function isCombining(codePoint: number): boolean {
	return (
		(codePoint >= 0x0300 && codePoint <= 0x036f) ||
		(codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
		(codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
		(codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
		(codePoint >= 0xfe20 && codePoint <= 0xfe2f)
	);
}

function isWide(codePoint: number): boolean {
	return (
		codePoint >= 0x1100 &&
		(codePoint <= 0x115f ||
			codePoint === 0x2329 ||
			codePoint === 0x232a ||
			(codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
			(codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
			(codePoint >= 0xf900 && codePoint <= 0xfaff) ||
			(codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
			(codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
			(codePoint >= 0xff00 && codePoint <= 0xff60) ||
			(codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
			(codePoint >= 0x1f300 && codePoint <= 0x1f64f) ||
			(codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
			(codePoint >= 0x20000 && codePoint <= 0x3fffd))
	);
}

function charWidth(char: string): number {
	const codePoint = char.codePointAt(0) ?? 0;
	if (codePoint === 0 || codePoint < 32 || (codePoint >= 0x7f && codePoint < 0xa0)) return 0;
	if (isCombining(codePoint)) return 0;
	return isWide(codePoint) ? 2 : 1;
}

function visibleWidth(text: string): number {
	let width = 0;
	for (const char of stripAnsi(text)) {
		width += charWidth(char);
	}
	return width;
}

function truncateToWidth(text: string, maxWidth: number, ellipsis = "..."): string {
	if (maxWidth <= 0) return "";
	if (visibleWidth(text) <= maxWidth) return text;

	const ellipsisWidth = visibleWidth(ellipsis);
	if (ellipsisWidth >= maxWidth) return truncateToWidth(stripAnsi(ellipsis), maxWidth, "");

	const targetWidth = maxWidth - ellipsisWidth;
	let output = "";
	let width = 0;
	for (let index = 0; index < text.length; ) {
		const ansi = ANSI_AT_START.exec(text.slice(index));
		if (ansi) {
			output += ansi[0];
			index += ansi[0].length;
			continue;
		}

		const codePoint = text.codePointAt(index);
		if (codePoint === undefined) break;
		const char = String.fromCodePoint(codePoint);
		const nextWidth = width + charWidth(char);
		if (nextWidth > targetWidth) break;
		output += char;
		width = nextWidth;
		index += char.length;
	}

	return output + ellipsis;
}

function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

function collectUsage(ctx: ExtensionContext): UsageTotals {
	const totals: UsageTotals = {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
		cost: 0,
	};

	for (const entry of ctx.sessionManager.getEntries()) {
		if (entry.type !== "message" || entry.message.role !== "assistant") continue;
		const usage = entry.message.usage as UsageShape | undefined;
		if (!usage) continue;
		totals.input += finiteNumber(usage.input);
		totals.output += finiteNumber(usage.output);
		totals.cacheRead += finiteNumber(usage.cacheRead);
		totals.cacheWrite += finiteNumber(usage.cacheWrite);
		totals.cost += finiteNumber(usage.cost?.total);
	}

	return totals;
}

function hasOverageFlag(value: unknown, depth = 0): boolean {
	if (!isRecord(value) || depth > 1) return false;
	for (const key of OVERAGE_FLAG_KEYS) {
		if (value[key] === true) return true;
	}
	for (const key of OVERAGE_NESTED_KEYS) {
		if (hasOverageFlag(value[key], depth + 1)) return true;
	}
	return false;
}

function isUsingSubscription(ctx: ExtensionContext, model: ModelLike | undefined): boolean {
	if (!model) return false;
	try {
		return ctx.modelRegistry.isUsingOAuth(model);
	} catch {
		return false;
	}
}

function isSubscriptionOverage(ctx: ExtensionContext, model: ModelLike | undefined): boolean {
	if (!model || !isUsingSubscription(ctx, model)) return false;

	const credential = ctx.modelRegistry.authStorage.get(model.provider) as unknown;
	if (hasOverageFlag(credential)) return true;

	// Pi warns that Anthropic subscription auth in third-party harnesses draws from
	// Anthropic extra usage, which is billed per-token rather than covered by the
	// base Claude subscription.
	return model.provider === "anthropic";
}

function renderPart(theme: Theme, part: StatsPart): string {
	switch (part.tone) {
		case "successBilling":
			return `${theme.fg("dim", "$")}${theme.fg("success", "✓")}`;
		case "warning":
			return theme.fg("warning", part.text);
		case "error":
			return theme.fg("error", part.text);
		case "dim":
		default:
			return theme.fg("dim", part.text);
	}
}

function renderParts(theme: Theme, parts: StatsPart[]): string {
	return parts.map((part) => renderPart(theme, part)).join(theme.fg("dim", " "));
}

function createStatsParts(ctx: ExtensionContext): StatsPart[] {
	const totals = collectUsage(ctx);
	const parts: StatsPart[] = [];
	if (totals.input) parts.push({ text: `↑${formatTokens(totals.input)}`, tone: "dim" });
	if (totals.output) parts.push({ text: `↓${formatTokens(totals.output)}`, tone: "dim" });
	if (totals.cacheRead) parts.push({ text: `R${formatTokens(totals.cacheRead)}`, tone: "dim" });
	if (totals.cacheWrite) parts.push({ text: `W${formatTokens(totals.cacheWrite)}`, tone: "dim" });

	const model = ctx.model;
	const usingSubscription = isUsingSubscription(ctx, model);
	const subscriptionOverage = isSubscriptionOverage(ctx, model);
	if (usingSubscription && !subscriptionOverage) {
		parts.push({ text: "$✓", tone: "successBilling" });
	} else if (totals.cost || subscriptionOverage) {
		parts.push({ text: `$${totals.cost.toFixed(3)}`, tone: "dim" });
	}

	const contextUsage = ctx.getContextUsage();
	const contextWindow = contextUsage?.contextWindow ?? model?.contextWindow ?? 0;
	const contextPercentValue = contextUsage?.percent ?? 0;
	const contextPercent = contextUsage?.percent !== null ? contextPercentValue.toFixed(1) : "?";
	const contextDisplay =
		contextPercent === "?" ? `?/${formatTokens(contextWindow)}` : `${contextPercent}%/${formatTokens(contextWindow)}`;
	const tone = contextPercentValue > 90 ? "error" : contextPercentValue > 70 ? "warning" : "dim";
	parts.push({ text: contextDisplay, tone });

	return parts;
}

function createPwdLine(ctx: ExtensionContext, footerData: ReadonlyFooterDataProvider): string {
	let pwd = ctx.sessionManager.getCwd();
	const home = process.env.HOME || process.env.USERPROFILE;
	if (home && pwd.startsWith(home)) {
		pwd = `~${pwd.slice(home.length)}`;
	}

	const branch = footerData.getGitBranch();
	if (branch) {
		pwd = `${pwd} (${branch})`;
	}

	const sessionName = ctx.sessionManager.getSessionName();
	if (sessionName) {
		pwd = `${pwd} • ${sessionName}`;
	}

	return pwd;
}

function getThinkingLevel(ctx: ExtensionContext): string {
	let thinkingLevel = "off";
	for (const entry of ctx.sessionManager.getEntries()) {
		if (entry.type === "thinking_level_change") {
			thinkingLevel = entry.thinkingLevel;
		}
	}
	return thinkingLevel;
}

function createRightSide(ctx: ExtensionContext, footerData: ReadonlyFooterDataProvider, statsWidth: number, width: number): string {
	const model = ctx.model;
	const modelName = model?.id || "no-model";
	let rightSide = modelName;

	if (model?.reasoning) {
		const thinkingLevel = getThinkingLevel(ctx);
		rightSide = thinkingLevel === "off" ? `${modelName} • thinking off` : `${modelName} • ${thinkingLevel}`;
	}

	if (footerData.getAvailableProviderCount() > 1 && model) {
		const withProvider = `(${model.provider}) ${rightSide}`;
		if (statsWidth + 2 + visibleWidth(withProvider) <= width) {
			rightSide = withProvider;
		}
	}

	return rightSide;
}

export function createBillingFooter(ctx: ExtensionContext, theme: Theme, footerData: ReadonlyFooterDataProvider): FooterComponent {
	return {
		invalidate() {},
		render(width: number): string[] {
			const safeWidth = Math.max(0, width);
			const pwdLine = truncateToWidth(theme.fg("dim", createPwdLine(ctx, footerData)), safeWidth, theme.fg("dim", "..."));

			let statsLeft = renderParts(theme, createStatsParts(ctx));
			let statsLeftWidth = visibleWidth(statsLeft);
			if (statsLeftWidth > safeWidth) {
				statsLeft = truncateToWidth(statsLeft, safeWidth, theme.fg("dim", "..."));
				statsLeftWidth = visibleWidth(statsLeft);
			}

			const rightSideText = createRightSide(ctx, footerData, statsLeftWidth, safeWidth);
			const rightSideWidth = visibleWidth(rightSideText);
			let statsLine: string;
			if (statsLeftWidth + 2 + rightSideWidth <= safeWidth) {
				const padding = " ".repeat(safeWidth - statsLeftWidth - rightSideWidth);
				statsLine = statsLeft + padding + theme.fg("dim", rightSideText);
			} else {
				const availableForRight = safeWidth - statsLeftWidth - 2;
				if (availableForRight > 0) {
					const truncatedRight = truncateToWidth(rightSideText, availableForRight, "");
					const padding = " ".repeat(Math.max(0, safeWidth - statsLeftWidth - visibleWidth(truncatedRight)));
					statsLine = statsLeft + padding + theme.fg("dim", truncatedRight);
				} else {
					statsLine = statsLeft;
				}
			}

			const lines = [pwdLine, statsLine];
			const extensionStatuses = footerData.getExtensionStatuses();
			if (extensionStatuses.size > 0) {
				const statusLine = Array.from(extensionStatuses.entries())
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([, text]) => sanitizeStatusText(text))
					.join(" ");
				lines.push(truncateToWidth(statusLine, safeWidth, theme.fg("dim", "...")));
			}

			return lines;
		},
	};
}

export default function billingFooter(pi: ExtensionAPI): void {
	pi.on("session_start", (_event, ctx) => {
		if (!ctx.hasUI) return;
		ctx.ui.setFooter((_tui, theme, footerData) => createBillingFooter(ctx, theme, footerData));
	});
}
