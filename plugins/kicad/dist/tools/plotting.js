import { z } from "zod";
import { runKicadCli, resolveFile } from "../backends/cli.js";
export function registerPlotting(server) {
    server.tool("plot_pcb", "Plot PCB layers to PDF, SVG, DXF, or PostScript.", {
        file: z.string().describe("Path to .kicad_pcb file"),
        output: z.string().describe("Output file path"),
        format: z.enum(["pdf", "svg", "dxf", "ps"]).default("pdf").describe("Output format"),
        layers: z.array(z.string()).optional().describe("Layers to include; defaults to all visible"),
        theme: z.string().optional().describe("Color theme name"),
        mirror: z.boolean().default(false).describe("Mirror output"),
        exclude_dnp: z.boolean().default(false).describe("Exclude DNP components"),
    }, async ({ file, output, format, layers, theme, mirror, exclude_dnp }) => {
        const args = ["pcb", "export", format, "-o", output];
        if (layers?.length) {
            args.push("-l", layers.join(","));
        }
        if (theme)
            args.push("--theme", theme);
        if (mirror)
            args.push("--mirror");
        if (exclude_dnp)
            args.push("--exclude-dnp");
        args.push(resolveFile(file));
        const result = await runKicadCli({ args, timeout: 120_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error plotting PCB: ${result.stderr}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: result.stdout || `PCB plotted to ${format.toUpperCase()}` }] };
    });
    server.tool("plot_schematic", "Plot schematic sheets to PDF, SVG, DXF, PostScript, or HPGL.", {
        file: z.string().describe("Path to .kicad_sch file"),
        output: z.string().describe("Output file path"),
        format: z.enum(["pdf", "svg", "dxf", "ps", "hpgl"]).default("pdf").describe("Output format"),
        pages: z.enum(["all", "current"]).default("all").describe("Which pages to plot"),
        theme: z.string().optional().describe("Color theme name"),
    }, async ({ file, output, format, pages, theme }) => {
        const args = ["sch", "export", format, "-o", output];
        if (pages === "current")
            args.push("--pages", "current");
        if (theme)
            args.push("--theme", theme);
        args.push(resolveFile(file));
        const result = await runKicadCli({ args, timeout: 120_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error plotting schematic: ${result.stderr}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: result.stdout || `Schematic plotted to ${format.toUpperCase()}` }] };
    });
}
//# sourceMappingURL=plotting.js.map