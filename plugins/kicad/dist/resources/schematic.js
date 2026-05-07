import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile } from "node:fs/promises";
import { resolveFile } from "../backends/cli.js";
import { parseSExpr, findAllDeep, findByTag } from "../util/sexpr.js";
export function registerSchematic(server) {
    server.resource("schematic-summary", new ResourceTemplate("edith://schematic/{file}", { list: undefined }), {
        mimeType: "application/json",
        description: "Sheet hierarchy, component count, net count, power symbols",
    }, async (uri, variables) => {
        try {
            const file = resolveFile(String(variables.file));
            const raw = await readFile(file, "utf-8");
            const tree = parseSExpr(raw);
            // Find the kicad_sch root
            let root = tree;
            for (const node of tree) {
                if (Array.isArray(node) && node[0] === "kicad_sch") {
                    root = node;
                    break;
                }
            }
            const symbols = findAllDeep(root, "symbol");
            const sheets = findAllDeep(root, "sheet");
            const wires = findAllDeep(root, "wire");
            const labels = findAllDeep(root, "label");
            const globalLabels = findAllDeep(root, "global_label");
            const powerSymbols = findAllDeep(root, "power");
            const junctions = findAllDeep(root, "junction");
            // Count component instances (lib_id references, not library definitions)
            const symbolInstances = symbols.filter((s) => {
                // Symbol instances have a lib_id property; library definitions don't at top level
                const libId = findByTag(s, "lib_id");
                return libId.length > 0;
            });
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "application/json",
                        text: JSON.stringify({
                            component_count: symbolInstances.length,
                            sheet_count: sheets.length + 1, // +1 for root sheet
                            wire_count: wires.length,
                            label_count: labels.length,
                            global_label_count: globalLabels.length,
                            power_symbol_count: powerSymbols.length,
                            junction_count: junctions.length,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "application/json",
                        text: JSON.stringify({ error: message }),
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=schematic.js.map