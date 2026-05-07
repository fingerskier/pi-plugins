import { z } from "zod";
import { runKicadCli, resolveFile } from "../backends/cli.js";
function makeInterchangeTool(server, name, description, subcommand) {
    server.tool(name, description, {
        file: z.string().describe("Path to .kicad_pcb file"),
        output: z.string().describe("Output file path"),
    }, async ({ file, output }) => {
        const args = ["pcb", "export", subcommand, "-o", output, resolveFile(file)];
        const result = await runKicadCli({ args, timeout: 120_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error: ${result.stderr}` }],
                isError: true,
            };
        }
        return {
            content: [{ type: "text", text: result.stdout || `${name} export complete` }],
        };
    });
}
export function registerInterchange(server) {
    makeInterchangeTool(server, "export_ipc2581", "Export IPC-2581 file for manufacturing data exchange.", "ipc2581");
    makeInterchangeTool(server, "export_odb", "Export ODB++ package.", "odb");
    makeInterchangeTool(server, "export_ipc_d356", "Export IPC-D-356 netlist for electrical test.", "ipcd356");
    makeInterchangeTool(server, "export_gencad", "Export GenCAD format.", "gencad");
}
//# sourceMappingURL=interchange.js.map