import { z } from "zod";
import { runKicadCli, resolveFile } from "../backends/cli.js";
export function registerLibrary(server) {
    server.tool("export_footprint_svg", "Export footprint from a library as SVG.", {
        library: z.string().describe("Path to footprint library file"),
        name: z.string().describe("Footprint name"),
        output: z.string().describe("Output SVG path"),
    }, async ({ library, name, output }) => {
        const args = ["fp", "export", "svg", "-o", output, "-f", name, resolveFile(library)];
        const result = await runKicadCli({ args, timeout: 30_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error exporting footprint SVG: ${result.stderr}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: result.stdout || "Footprint SVG exported" }] };
    });
    server.tool("export_symbol_svg", "Export symbol from a library as SVG.", {
        library: z.string().describe("Path to symbol library file"),
        name: z.string().describe("Symbol name"),
        output: z.string().describe("Output SVG path"),
    }, async ({ library, name, output }) => {
        const args = ["sym", "export", "svg", "-o", output, "-s", name, resolveFile(library)];
        const result = await runKicadCli({ args, timeout: 30_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error exporting symbol SVG: ${result.stderr}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: result.stdout || "Symbol SVG exported" }] };
    });
    server.tool("convert_library", "Convert footprint/symbol libraries from foreign formats to KiCad format.", {
        input: z.string().describe("Path to source library file"),
        output: z.string().describe("Output directory"),
        source_format: z
            .enum(["altium", "eagle", "easyeda", "easyeda_pro", "cadstar", "geda"])
            .describe("Source format"),
        type: z.enum(["footprint", "symbol"]).describe("Library type"),
    }, async ({ input, output, source_format, type }) => {
        const cmd = type === "footprint" ? "fp" : "sym";
        const args = [cmd, "upgrade", "--from", source_format, "-o", output, resolveFile(input)];
        const result = await runKicadCli({ args, timeout: 120_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error converting library: ${result.stderr}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: result.stdout || "Library converted" }] };
    });
}
//# sourceMappingURL=library.js.map