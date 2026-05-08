import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { createMcpStdioExtension, splitArgs } from "@fingerskier/pi-shared/mcp-stdio";

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const dataRoot = process.env.SKIDL_PI_DATA ?? join(homedir(), ".pi", "agent", "data", "skidl");
const python = process.env.SKIDL_PYTHON ?? process.env.PYTHON ?? (process.platform === "win32" ? "python.exe" : "python");
const launcherArgs = [join(pluginRoot, "bin", "launch.py"), ...splitArgs(process.env.SKIDL_MCP_ARGS)];

export default createMcpStdioExtension({
	slug: "skidl",
	label: "SKiDL",
	toolPrefix: "skidl",
	command: process.env.SKIDL_MCP_COMMAND ?? python,
	args: process.env.SKIDL_MCP_COMMAND ? splitArgs(process.env.SKIDL_MCP_ARGS) : launcherArgs,
	autoloadEnv: "SKIDL_MCP_AUTOLOAD",
	env: {
		PI_PLUGIN_ROOT: pluginRoot,
		PI_PLUGIN_DATA: dataRoot,
		CLAUDE_PLUGIN_ROOT: pluginRoot,
		CLAUDE_PLUGIN_DATA: dataRoot,
	},
	promptGuidelines: [
		"Use skidl_* tools for programmatic electronic circuit design; verify component choices, run ERC/connection/footprint checks when possible, and ask before overwriting KiCad/schematic/netlist/BOM files.",
	],
});
