import { createMcpStdioExtension, npxCommand } from "../../../shared/mcp-stdio.ts";

const invocation = npxCommand("fleet-claude-plugin", ["mcp"]);

export default createMcpStdioExtension({
	slug: "fleet",
	label: "Fleet",
	toolPrefix: "fleet",
	command: process.env.FLEET_MCP_COMMAND ?? invocation.command,
	args: process.env.FLEET_MCP_COMMAND ? [] : invocation.args,
	autoloadEnv: "FLEET_MCP_AUTOLOAD",
	promptGuidelines: [
		"Use fleet_* tools for read-mostly AWS inspection; ask before destructive or cost-incurring cloud changes.",
	],
});
