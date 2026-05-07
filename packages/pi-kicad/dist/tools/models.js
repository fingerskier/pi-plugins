import { z } from "zod";
import { runKicadCli, resolveFile } from "../backends/cli.js";
export function registerModels(server) {
    server.tool("export_3d", "Export 3D model of the PCB.", {
        file: z.string().describe("Path to .kicad_pcb file"),
        output: z.string().describe("Output file path"),
        format: z
            .enum(["step", "glb", "stl", "ply", "brep", "xao", "vrml"])
            .default("step")
            .describe("3D format"),
        include_tracks: z.boolean().default(true),
        include_pads: z.boolean().default(true),
        include_zones: z.boolean().default(true),
        include_silkscreen: z.boolean().default(true),
        include_soldermask: z.boolean().default(true),
    }, async ({ file, output, format, include_tracks, include_pads, include_zones, include_silkscreen, include_soldermask, }) => {
        const args = ["pcb", "export", format, "-o", output];
        if (!include_tracks)
            args.push("--no-tracks");
        if (!include_pads)
            args.push("--no-pads");
        if (!include_zones)
            args.push("--no-zones");
        if (!include_silkscreen)
            args.push("--no-silkscreen");
        if (!include_soldermask)
            args.push("--no-soldermask");
        args.push(resolveFile(file));
        const result = await runKicadCli({ args, timeout: 300_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error exporting 3D model: ${result.stderr}` }],
                isError: true,
            };
        }
        return {
            content: [
                { type: "text", text: result.stdout || `3D model exported as ${format.toUpperCase()}` },
            ],
        };
    });
    server.tool("render_pcb", "Render a raytraced image of the PCB.", {
        file: z.string().describe("Path to .kicad_pcb file"),
        output: z.string().describe("Output image path"),
        format: z.enum(["png", "jpeg"]).default("png").describe("Image format"),
        width: z.number().default(1600).describe("Image width in pixels"),
        height: z.number().default(900).describe("Image height in pixels"),
        zoom: z.number().optional().describe("Zoom factor"),
        pan_x: z.number().optional().describe("Horizontal pan offset"),
        pan_y: z.number().optional().describe("Vertical pan offset"),
        rotate_x: z.number().optional().describe("X rotation in degrees"),
        rotate_z: z.number().optional().describe("Z rotation in degrees"),
        perspective: z.boolean().default(true).describe("Use perspective projection"),
        quality: z.enum(["low", "medium", "high"]).default("medium").describe("Render quality"),
    }, async ({ file, output, format, width, height, zoom, pan_x, pan_y, rotate_x, rotate_z, perspective, quality, }) => {
        const args = [
            "pcb",
            "render",
            "--format",
            format,
            "--width",
            String(width),
            "--height",
            String(height),
            "--quality",
            quality,
            "-o",
            output,
        ];
        if (zoom !== undefined)
            args.push("--zoom", String(zoom));
        if (pan_x !== undefined)
            args.push("--pan-x", String(pan_x));
        if (pan_y !== undefined)
            args.push("--pan-y", String(pan_y));
        if (rotate_x !== undefined)
            args.push("--rotate-x", String(rotate_x));
        if (rotate_z !== undefined)
            args.push("--rotate-z", String(rotate_z));
        if (!perspective)
            args.push("--orthographic");
        args.push(resolveFile(file));
        const result = await runKicadCli({ args, timeout: 300_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Error rendering PCB: ${result.stderr}` }],
                isError: true,
            };
        }
        return {
            content: [{ type: "text", text: result.stdout || `PCB rendered to ${output}` }],
        };
    });
}
//# sourceMappingURL=models.js.map