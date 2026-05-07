import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
async function scanLibraryDir(dir, extension) {
    if (!existsSync(dir))
        return [];
    const results = [];
    try {
        const entries = await readdir(dir);
        for (const entry of entries) {
            const fullPath = join(dir, entry);
            if (entry.endsWith(extension)) {
                results.push({ name: entry.replace(extension, ""), path: fullPath });
            }
            else {
                // Check if it's a directory containing library files
                try {
                    const info = await stat(fullPath);
                    if (info.isDirectory() && fullPath.endsWith(extension)) {
                        results.push({ name: entry.replace(extension, ""), path: fullPath });
                    }
                }
                catch {
                    // Skip inaccessible entries
                }
            }
        }
    }
    catch {
        // Directory not readable
    }
    return results;
}
function getKicadLibraryPaths() {
    const kicadPath = process.env.KICAD_PATH;
    if (!kicadPath)
        return [];
    // Common library locations relative to KICAD_PATH
    const candidates = [
        join(kicadPath, "share", "kicad", "footprints"),
        join(kicadPath, "share", "kicad", "symbols"),
        join(kicadPath, "share", "footprints"),
        join(kicadPath, "share", "symbols"),
        // Windows-specific paths
        join(kicadPath, "share", "kicad", "library"),
    ];
    return candidates.filter((p) => existsSync(p));
}
export function registerLibraries(server) {
    server.resource("footprint-libraries", "edith://libraries/footprints", {
        mimeType: "application/json",
        description: "Available footprint libraries and their paths",
    }, async () => {
        const paths = getKicadLibraryPaths();
        const libraries = [];
        for (const dir of paths) {
            const found = await scanLibraryDir(dir, ".pretty");
            libraries.push(...found);
        }
        return {
            contents: [
                {
                    uri: "edith://libraries/footprints",
                    mimeType: "application/json",
                    text: JSON.stringify({ kicad_path: process.env.KICAD_PATH ?? null, count: libraries.length, libraries }, null, 2),
                },
            ],
        };
    });
    server.resource("symbol-libraries", "edith://libraries/symbols", {
        mimeType: "application/json",
        description: "Available symbol libraries and their paths",
    }, async () => {
        const paths = getKicadLibraryPaths();
        const libraries = [];
        for (const dir of paths) {
            const found = await scanLibraryDir(dir, ".kicad_sym");
            libraries.push(...found);
        }
        return {
            contents: [
                {
                    uri: "edith://libraries/symbols",
                    mimeType: "application/json",
                    text: JSON.stringify({ kicad_path: process.env.KICAD_PATH ?? null, count: libraries.length, libraries }, null, 2),
                },
            ],
        };
    });
}
//# sourceMappingURL=libraries.js.map