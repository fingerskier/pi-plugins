import { z } from "zod";
import { runKicadCli, resolveFile } from "../backends/cli.js";
export function registerJobsets(server) {
    server.tool("run_jobset", "Run a predefined KiCad jobset configuration file.", {
        file: z.string().describe("Path to .kicad_jobset file"),
        stop_on_error: z.boolean().default(true).describe("Stop on first error"),
        destinations: z.array(z.string()).optional().describe("Filter to specific output destinations"),
    }, async ({ file, stop_on_error, destinations }) => {
        const args = ["jobset", "run"];
        if (stop_on_error)
            args.push("--stop-on-error");
        if (destinations?.length) {
            for (const d of destinations)
                args.push("--destination", d);
        }
        args.push(resolveFile(file));
        const result = await runKicadCli({ args, timeout: 300_000 });
        if (result.exitCode !== 0) {
            return {
                content: [{ type: "text", text: `Jobset error: ${result.stderr || result.stdout}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: result.stdout || "Jobset completed" }] };
    });
}
//# sourceMappingURL=jobsets.js.map