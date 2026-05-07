import { execa } from "execa";
import { resolve, join } from "node:path";
import { existsSync } from "node:fs";
const DEFAULT_TIMEOUT = 60_000;
let cachedCliPath = null;
function findKicadCli() {
    if (cachedCliPath)
        return cachedCliPath;
    const kicadPath = process.env.KICAD_PATH;
    if (kicadPath) {
        const candidates = [
            join(kicadPath, "bin", "kicad-cli.exe"),
            join(kicadPath, "bin", "kicad-cli"),
            join(kicadPath, "kicad-cli.exe"),
            join(kicadPath, "kicad-cli"),
        ];
        for (const candidate of candidates) {
            if (existsSync(candidate)) {
                cachedCliPath = candidate;
                return cachedCliPath;
            }
        }
    }
    // Common install paths as fallback
    const fallbacks = process.platform === "win32"
        ? [
            "C:/Program Files/KiCad/10.0/bin/kicad-cli.exe",
            "C:/Program Files/KiCad/9.0/bin/kicad-cli.exe",
            "C:/Program Files/KiCad/8.0/bin/kicad-cli.exe",
        ]
        : [
            "/usr/bin/kicad-cli",
            "/usr/local/bin/kicad-cli",
            "/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli",
        ];
    for (const path of fallbacks) {
        if (existsSync(path)) {
            cachedCliPath = path;
            return cachedCliPath;
        }
    }
    // Last resort: hope it's on PATH
    cachedCliPath = "kicad-cli";
    return cachedCliPath;
}
export function getCliPath() {
    return findKicadCli();
}
export async function runKicadCli(options) {
    const cliPath = findKicadCli();
    try {
        const result = await execa(cliPath, options.args, {
            timeout: options.timeout ?? DEFAULT_TIMEOUT,
            cwd: options.cwd,
            reject: false,
        });
        return {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode ?? 1,
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            stdout: "",
            stderr: message,
            exitCode: 1,
        };
    }
}
export async function checkCliAvailable() {
    try {
        const result = await runKicadCli({ args: ["version"], timeout: 5_000 });
        return result.exitCode === 0;
    }
    catch {
        return false;
    }
}
export async function getCliVersion() {
    const result = await runKicadCli({ args: ["version"], timeout: 5_000 });
    if (result.exitCode === 0) {
        return result.stdout.trim();
    }
    return null;
}
/** Resolve a file path, making it absolute if relative */
export function resolveFile(file, cwd) {
    return resolve(cwd ?? process.cwd(), file);
}
//# sourceMappingURL=cli.js.map