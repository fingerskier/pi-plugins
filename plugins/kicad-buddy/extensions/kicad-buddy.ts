import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpStdioExtension, splitArgs } from "../../../shared/mcp-stdio.ts";

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const localServer = join(pluginRoot, "dist", "index.js");

export default createMcpStdioExtension({
	slug: "kicad-buddy",
	label: "KiCad Buddy",
	toolPrefix: "kicad",
	command: process.env.KICAD_BUDDY_MCP_COMMAND ?? process.env.NODE ?? "node",
	args: process.env.KICAD_BUDDY_MCP_COMMAND ? splitArgs(process.env.KICAD_BUDDY_MCP_ARGS) : [localServer, ...splitArgs(process.env.KICAD_BUDDY_MCP_ARGS)],
	autoloadEnv: "KICAD_BUDDY_MCP_AUTOLOAD",
	cwd: process.cwd(),
	env: {
		KICAD_BUDDY_ROOT: pluginRoot,
	},
	promptGuidelines: [
		"Use kicad_* tools for KiCad project inspection and generation; ask before modifying board/schematic files.",
	],
});
