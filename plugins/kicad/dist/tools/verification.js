import { z } from "zod";
import { runKicadCli, resolveFile } from "../backends/cli.js";
import { selectBackend } from "../backends/select.js";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFile, unlink } from "node:fs/promises";
import { randomBytes } from "node:crypto";
export function registerVerification(server) {
    server.tool("run_drc", "Run design rule check on a PCB. Returns violations as structured JSON with severity, location, and rule reference.", {
        file: z.string().describe("Path to .kicad_pcb file"),
        format: z.enum(["json", "report"]).default("json").describe("Output format"),
        severity_filter: z
            .enum(["error", "warning", "all"])
            .default("all")
            .describe("Filter results by severity"),
    }, async ({ file, format, severity_filter }) => {
        const backend = await selectBackend("cli_preferred");
        if (backend === "cli") {
            const resolvedFile = resolveFile(file);
            const ext = format === "json" ? "json" : "txt";
            const outFile = join(tmpdir(), `edith-drc-${randomBytes(4).toString("hex")}.${ext}`);
            const args = ["pcb", "drc", "--format", format, "--output", outFile];
            if (severity_filter === "error") {
                args.push("--severity-error");
            }
            else if (severity_filter === "warning") {
                args.push("--severity-warning", "--severity-error");
            }
            else {
                args.push("--severity-all");
            }
            args.push("--exit-code-violations", resolvedFile);
            const result = await runKicadCli({ args, timeout: 120_000 });
            // Read the output file if it was created
            let output = "";
            try {
                output = await readFile(outFile, "utf-8");
                await unlink(outFile).catch(() => { });
            }
            catch {
                output = result.stdout || result.stderr;
            }
            // exit-code-violations uses non-zero for violations found — not a tool error
            if (!output && result.exitCode !== 0 && result.stderr) {
                return {
                    content: [{ type: "text", text: `Error running DRC: ${result.stderr}` }],
                    isError: true,
                };
            }
            return {
                content: [{ type: "text", text: output || result.stdout || "DRC complete — no output generated" }],
            };
        }
        // IPC path — Phase 4
        return {
            content: [{ type: "text", text: "IPC backend not yet implemented for DRC" }],
            isError: true,
        };
    });
    server.tool("run_erc", "Run electrical rule check on a schematic. Returns violations as structured JSON.", {
        file: z.string().describe("Path to .kicad_sch file"),
        format: z.enum(["json", "report"]).default("json").describe("Output format"),
        severity_filter: z
            .enum(["error", "warning", "all"])
            .default("all")
            .describe("Filter results by severity"),
    }, async ({ file, format, severity_filter }) => {
        const backend = await selectBackend("cli_preferred");
        if (backend === "cli") {
            const resolvedFile = resolveFile(file);
            const ext = format === "json" ? "json" : "txt";
            const outFile = join(tmpdir(), `edith-erc-${randomBytes(4).toString("hex")}.${ext}`);
            const args = ["sch", "erc", "--format", format, "--output", outFile];
            if (severity_filter === "error") {
                args.push("--severity-error");
            }
            else if (severity_filter === "warning") {
                args.push("--severity-warning", "--severity-error");
            }
            else {
                args.push("--severity-all");
            }
            args.push("--exit-code-violations", resolvedFile);
            const result = await runKicadCli({ args, timeout: 120_000 });
            let output = "";
            try {
                output = await readFile(outFile, "utf-8");
                await unlink(outFile).catch(() => { });
            }
            catch {
                output = result.stdout || result.stderr;
            }
            if (!output && result.exitCode !== 0 && result.stderr) {
                return {
                    content: [{ type: "text", text: `Error running ERC: ${result.stderr}` }],
                    isError: true,
                };
            }
            return {
                content: [{ type: "text", text: output || result.stdout || "ERC complete — no output generated" }],
            };
        }
        return {
            content: [{ type: "text", text: "IPC backend not yet implemented for ERC" }],
            isError: true,
        };
    });
}
//# sourceMappingURL=verification.js.map