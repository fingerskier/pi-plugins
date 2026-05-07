import { createMcpStdioExtension, npxCommand } from "@fingerskier/pi-shared/mcp-stdio";

const invocation = npxCommand("dude-claude-plugin", ["mcp"]);

export default createMcpStdioExtension({
	slug: "dude",
	label: "Dude",
	toolPrefix: "dude",
	command: process.env.DUDE_MCP_COMMAND ?? invocation.command,
	args: process.env.DUDE_MCP_COMMAND ? [] : invocation.args,
	autoloadEnv: "DUDE_MCP_AUTOLOAD",
	promptGuidelines: [
		"Use dude_* tools for local semantic memory, issue/spec tracking, and project context when Reqall is not the desired backend.",
	],
});
