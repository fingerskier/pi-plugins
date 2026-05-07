import { createMcpStdioExtension, npxCommand } from "@fingerskier/pi-shared/mcp-stdio";

const invocation = npxCommand("dex-claude-plugin");
const commandOverride = process.env.CRON_MCP_COMMAND ?? process.env.DEX_MCP_COMMAND;

const toolAliases: Record<string, string> = {
	add_dex_job: "add_job",
	remove_dex_job: "remove_job",
	list_dex_jobs: "list_jobs",
	run_dex_jobs: "run_jobs",
	complete_dex_job: "complete_job",
};

function toCronToolName(name: string): string {
	return toolAliases[name] ?? name.replace(/dex/g, "cron");
}

function toCronText(text: string): string {
	let mapped = text;
	for (const [mcpName, piAlias] of Object.entries(toolAliases)) {
		mapped = mapped.replaceAll(mcpName, `cron_${piAlias}`);
	}
	return mapped
		.replace(/\bDex\b/g, "Cron")
		.replace(/\bdex\b/g, "cron");
}

export default createMcpStdioExtension({
	slug: "cron",
	label: "Cron",
	toolPrefix: "cron",
	toolNameMap: toCronToolName,
	resultTextMap: toCronText,
	command: commandOverride ?? invocation.command,
	args: commandOverride ? [] : invocation.args,
	autoloadEnv: "CRON_MCP_AUTOLOAD",
	promptGuidelines: [
		"Use cron_* tools when the user asks to schedule one-time or recurring Pi/agent work or inspect scheduled jobs.",
		"For one-time jobs, schedule the desired run and remove the job after successful completion if the backing scheduler does not support one-shot runs.",
	],
});
