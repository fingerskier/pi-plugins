import { z } from "zod";
import { runKicadCli, resolveFile } from "../backends/cli.js";
export function registerFabrication(server) {
    server.tool("export_fabrication", "Export a complete fabrication package: Gerbers + drill files + pick-and-place position file.", {
        file: z.string().describe("Path to .kicad_pcb file"),
        output_dir: z.string().describe("Destination directory"),
        layers: z
            .array(z.string())
            .optional()
            .describe("Layer list override; defaults to all copper + mask + silk + edge"),
        drill_format: z
            .enum(["excellon", "gerber"])
            .default("excellon")
            .describe("Drill file format"),
        position_format: z
            .enum(["ascii", "csv", "gerber"])
            .default("csv")
            .describe("Position file format"),
    }, async ({ file, output_dir, layers, drill_format, position_format }) => {
        const resolvedFile = resolveFile(file);
        const results = [];
        // Gerbers
        const gerberArgs = ["pcb", "export", "gerbers", "-o", output_dir];
        if (layers?.length) {
            for (const l of layers)
                gerberArgs.push("-l", l);
        }
        gerberArgs.push(resolvedFile);
        const gerberResult = await runKicadCli({ args: gerberArgs, timeout: 120_000 });
        results.push(gerberResult.exitCode === 0
            ? "Gerbers: exported"
            : `Gerbers: FAILED - ${gerberResult.stderr}`);
        // Drill
        const drillArgs = ["pcb", "export", "drill", "-o", output_dir];
        if (drill_format === "gerber")
            drillArgs.push("--format", "gerber");
        drillArgs.push(resolvedFile);
        const drillResult = await runKicadCli({ args: drillArgs, timeout: 60_000 });
        results.push(drillResult.exitCode === 0
            ? "Drill: exported"
            : `Drill: FAILED - ${drillResult.stderr}`);
        // Position
        const posArgs = ["pcb", "export", "pos", "-o", output_dir, "--format", position_format];
        posArgs.push(resolvedFile);
        const posResult = await runKicadCli({ args: posArgs, timeout: 60_000 });
        results.push(posResult.exitCode === 0
            ? "Position: exported"
            : `Position: FAILED - ${posResult.stderr}`);
        const anyFailed = [gerberResult, drillResult, posResult].some((r) => r.exitCode !== 0);
        return {
            content: [{ type: "text", text: results.join("\n") }],
            isError: anyFailed,
        };
    });
    server.tool("export_gerbers", "Export Gerber files with layer selection and aperture control.", {
        file: z.string().describe("Path to .kicad_pcb file"),
        output: z.string().describe("Output directory"),
        layers: z.array(z.string()).optional().describe("Layers to include"),
    }, async ({ file, output, layers }) => {
        const args = ["pcb", "export", "gerbers", "-o", output];
        if (layers?.length) {
            for (const l of layers)
                args.push("-l", l);
        }
        args.push(resolveFile(file));
        const result = await runKicadCli({ args, timeout: 120_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error exporting Gerbers: ${result.stderr}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: result.stdout || "Gerbers exported" }] };
    });
    server.tool("export_drill", "Export Excellon or Gerber X2 drill files.", {
        file: z.string().describe("Path to .kicad_pcb file"),
        output: z.string().describe("Output directory"),
        format: z.enum(["excellon", "gerber"]).default("excellon").describe("Drill file format"),
    }, async ({ file, output, format }) => {
        const args = ["pcb", "export", "drill", "-o", output];
        if (format === "gerber")
            args.push("--format", "gerber");
        args.push(resolveFile(file));
        const result = await runKicadCli({ args, timeout: 60_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error exporting drill: ${result.stderr}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: result.stdout || "Drill files exported" }] };
    });
    server.tool("export_position", "Export pick-and-place position files.", {
        file: z.string().describe("Path to .kicad_pcb file"),
        output: z.string().describe("Output file path"),
        format: z.enum(["ascii", "csv", "gerber"]).default("csv").describe("Position file format"),
    }, async ({ file, output, format }) => {
        const args = ["pcb", "export", "pos", "-o", output, "--format", format];
        args.push(resolveFile(file));
        const result = await runKicadCli({ args, timeout: 60_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error exporting position: ${result.stderr}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: result.stdout || "Position file exported" }] };
    });
    server.tool("export_bom", "Export bill of materials from schematic with field selection, grouping, and sorting.", {
        file: z.string().describe("Path to .kicad_sch file"),
        output: z.string().describe("Output file path"),
        fields: z
            .array(z.string())
            .optional()
            .describe('Fields to include (e.g. ["Reference", "Value", "Footprint", "MPN"])'),
        group_by: z.array(z.string()).optional().describe("Fields to group by"),
        sort_by: z.string().optional().describe("Field to sort by"),
        exclude_dnp: z.boolean().default(true).describe("Exclude do-not-populate components"),
    }, async ({ file, output, fields, group_by, sort_by, exclude_dnp }) => {
        const args = ["sch", "export", "bom", "-o", output];
        if (fields?.length)
            args.push("--fields", fields.join(","));
        if (group_by?.length)
            args.push("--group-by", group_by.join(","));
        if (sort_by)
            args.push("--sort-field", sort_by);
        if (exclude_dnp)
            args.push("--exclude-dnp");
        args.push(resolveFile(file));
        const result = await runKicadCli({ args, timeout: 60_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error exporting BOM: ${result.stderr}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: result.stdout || "BOM exported" }] };
    });
    server.tool("export_netlist", "Export netlist in specified format.", {
        file: z.string().describe("Path to .kicad_sch file"),
        output: z.string().describe("Output file path"),
        format: z
            .enum(["kicad", "kicad_xml", "cadstar", "orcad", "spice", "spice_model", "pads", "allegro"])
            .default("kicad")
            .describe("Netlist format"),
    }, async ({ file, output, format }) => {
        const args = ["sch", "export", "netlist", "-o", output, "--format", format];
        args.push(resolveFile(file));
        const result = await runKicadCli({ args, timeout: 60_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error exporting netlist: ${result.stderr}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: result.stdout || "Netlist exported" }] };
    });
}
//# sourceMappingURL=fabrication.js.map