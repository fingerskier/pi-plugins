import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpStdioExtension, splitArgs } from "@fingerskier/pi-shared/mcp-stdio";

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const localServer = join(pluginRoot, "dist", "index.js");
const commandOverride = process.env.KICAD_MCP_COMMAND ?? process.env.KICAD_BUDDY_MCP_COMMAND;
const serverArgs = process.env.KICAD_MCP_ARGS ?? process.env.KICAD_BUDDY_MCP_ARGS;

export default createMcpStdioExtension({
	slug: "kicad",
	label: "KiCad",
	toolPrefix: "kicad",
	command: commandOverride ?? process.env.NODE ?? "node",
	args: commandOverride ? splitArgs(serverArgs) : [localServer, ...splitArgs(serverArgs)],
	autoloadEnv: "KICAD_MCP_AUTOLOAD",
	cwd: process.cwd(),
	env: {
		KICAD_PLUGIN_ROOT: pluginRoot,
		KICAD_BUDDY_ROOT: pluginRoot,
	},
	promptGuidelines: [
		"Use kicad_* tools for KiCad project inspection and generation; ask before modifying board/schematic files.",
	],
});
