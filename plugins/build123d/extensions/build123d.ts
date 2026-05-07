import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { createMcpStdioExtension, splitArgs } from "../../../shared/mcp-stdio.ts";

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const dataRoot = process.env.BUILD123D_PI_DATA ?? join(homedir(), ".pi", "agent", "data", "build123d");
const python = process.env.BUILD123D_PYTHON ?? process.env.PYTHON ?? (process.platform === "win32" ? "python.exe" : "python");
const launcherArgs = [
	join(pluginRoot, "bin", "launch.py"),
	"--output-dir",
	process.env.BUILD123D_OUTPUT_DIR ?? "./cad-output",
	...splitArgs(process.env.BUILD123D_MCP_ARGS),
];

export default createMcpStdioExtension({
	slug: "build123d",
	label: "build123d",
	toolPrefix: "build123d",
	command: process.env.BUILD123D_MCP_COMMAND ?? python,
	args: process.env.BUILD123D_MCP_COMMAND ? splitArgs(process.env.BUILD123D_MCP_ARGS) : launcherArgs,
	autoloadEnv: "BUILD123D_MCP_AUTOLOAD",
	env: {
		PI_PLUGIN_ROOT: pluginRoot,
		PI_PLUGIN_DATA: dataRoot,
		CLAUDE_PLUGIN_ROOT: pluginRoot,
		CLAUDE_PLUGIN_DATA: dataRoot,
	},
	promptGuidelines: [
		"Use build123d_* tools for CAD modeling; keep generated files under the configured build123d output directory.",
	],
});
