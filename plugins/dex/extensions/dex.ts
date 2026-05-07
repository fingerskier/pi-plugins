import { createMcpStdioExtension, npxCommand } from "../../../shared/mcp-stdio.ts";

const invocation = npxCommand("dex-claude-plugin");

export default createMcpStdioExtension({
	slug: "dex",
	label: "Dex",
	toolPrefix: "dex",
	command: process.env.DEX_MCP_COMMAND ?? invocation.command,
	args: process.env.DEX_MCP_COMMAND ? [] : invocation.args,
	autoloadEnv: "DEX_MCP_AUTOLOAD",
	promptGuidelines: [
		"Use dex_* tools when the user asks to schedule recurring Pi/agent work or inspect scheduled jobs.",
	],
});
