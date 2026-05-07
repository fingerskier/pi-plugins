import { createMcpStdioExtension, npxCommand } from "../../../shared/mcp-stdio.ts";

const invocation = npxCommand("mozart-claude-plugin", ["mcp"]);

export default createMcpStdioExtension({
	slug: "mozart",
	label: "Mozart",
	toolPrefix: "mozart",
	command: process.env.MOZART_MCP_COMMAND ?? invocation.command,
	args: process.env.MOZART_MCP_COMMAND ? [] : invocation.args,
	autoloadEnv: "MOZART_MCP_AUTOLOAD",
	promptGuidelines: [
		"Use mozart_* tools when working with MIDI files, composition, musical analysis, or playback/editing workflows.",
	],
});
