import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { createMcpStdioExtension, splitArgs } from "../../../shared/mcp-stdio.ts";

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const dataRoot = process.env.MICROPYTHON_PI_DATA ?? join(homedir(), ".pi", "agent", "data", "micropython");
const python = process.env.MICROPYTHON_PYTHON ?? process.env.PYTHON ?? (process.platform === "win32" ? "python.exe" : "python");
const launcherArgs = [join(pluginRoot, "bin", "launch.py"), ...splitArgs(process.env.MICROPYTHON_MCP_ARGS)];

export default createMcpStdioExtension({
	slug: "micropython",
	label: "MicroPython",
	toolPrefix: "micropython",
	command: process.env.MICROPYTHON_MCP_COMMAND ?? python,
	args: process.env.MICROPYTHON_MCP_COMMAND ? splitArgs(process.env.MICROPYTHON_MCP_ARGS) : launcherArgs,
	autoloadEnv: "MICROPYTHON_MCP_AUTOLOAD",
	env: {
		PI_PLUGIN_ROOT: pluginRoot,
		PI_PLUGIN_DATA: dataRoot,
		CLAUDE_PLUGIN_ROOT: pluginRoot,
		CLAUDE_PLUGIN_DATA: dataRoot,
	},
	promptGuidelines: [
		"Use micropython_* tools for connected MicroPython boards; ask before flashing, deleting, or overwriting device files.",
	],
});
