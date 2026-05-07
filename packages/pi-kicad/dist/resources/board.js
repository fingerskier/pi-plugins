import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile } from "node:fs/promises";
import { resolveFile } from "../backends/cli.js";
import { parseSExpr, findByTag, findFirstByTag, findAllDeep, strAt, getProp, } from "../util/sexpr.js";
async function loadBoard(file) {
    const raw = await readFile(resolveFile(file), "utf-8");
    return parseSExpr(raw);
}
function boardRoot(tree) {
    // The top-level list should be (kicad_pcb ...)
    for (const node of tree) {
        if (Array.isArray(node) && node[0] === "kicad_pcb")
            return node;
    }
    return tree;
}
function jsonResource(uri, data) {
    return {
        contents: [
            {
                uri: uri.href,
                mimeType: "application/json",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
}
function errorResource(uri, err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResource(uri, { error: message });
}
export function registerBoard(server) {
    // Board summary
    server.resource("board-summary", new ResourceTemplate("edith://board/{file}", { list: undefined }), {
        mimeType: "application/json",
        description: "Board outline dimensions, layer stackup, copper layer count, component/net/track/via/zone counts",
    }, async (uri, variables) => {
        try {
            const tree = await loadBoard(String(variables.file));
            const root = boardRoot(tree);
            const general = findFirstByTag(root, "general");
            const setup = findFirstByTag(root, "setup");
            const layers = findByTag(root, "layers");
            const footprints = findAllDeep(root, "footprint");
            const nets = findByTag(root, "net");
            const tracks = findAllDeep(root, "segment");
            const vias = findAllDeep(root, "via");
            const zones = findByTag(root, "zone");
            const layerList = layers.length > 0 ? layers[0].slice(1) : [];
            const copperLayers = layerList.filter((l) => Array.isArray(l) && typeof l[2] === "string" && l[2].includes("Cu"));
            return jsonResource(uri, {
                copper_layer_count: copperLayers.length,
                total_layers: layerList.length,
                footprint_count: footprints.length,
                net_count: nets.length,
                track_count: tracks.length,
                via_count: vias.length,
                zone_count: zones.length,
                has_general: !!general,
                has_setup: !!setup,
            });
        }
        catch (err) {
            return errorResource(uri, err);
        }
    });
    // Footprints
    server.resource("board-footprints", new ResourceTemplate("edith://board/{file}/footprints", { list: undefined }), {
        mimeType: "application/json",
        description: "All footprints: reference, value, footprint type, position, rotation, layer, DNP flag",
    }, async (uri, variables) => {
        try {
            const tree = await loadBoard(String(variables.file));
            const root = boardRoot(tree);
            const footprints = findAllDeep(root, "footprint");
            const items = footprints.map((fp) => {
                const libId = strAt(fp, 1);
                const atNode = getProp(fp, "at");
                const layerNode = getProp(fp, "layer");
                const refProp = findAllDeep(fp, "fp_text").find((t) => strAt(t, 1) === "reference");
                const valProp = findAllDeep(fp, "fp_text").find((t) => strAt(t, 1) === "value");
                // KiCad 8+ uses (property "Reference" "R1") instead of fp_text
                const propNodes = findAllDeep(fp, "property");
                const refFromProp = propNodes.find((p) => strAt(p, 1) === "Reference");
                const valFromProp = propNodes.find((p) => strAt(p, 1) === "Value");
                const dnpNode = getProp(fp, "dnp");
                return {
                    footprint: libId,
                    reference: refProp ? strAt(refProp, 2) : refFromProp ? strAt(refFromProp, 2) : undefined,
                    value: valProp ? strAt(valProp, 2) : valFromProp ? strAt(valFromProp, 2) : undefined,
                    x: atNode ? strAt(atNode, 1) : undefined,
                    y: atNode ? strAt(atNode, 2) : undefined,
                    rotation: atNode ? strAt(atNode, 3) : "0",
                    layer: layerNode ? strAt(layerNode, 1) : undefined,
                    dnp: !!dnpNode,
                };
            });
            return jsonResource(uri, items);
        }
        catch (err) {
            return errorResource(uri, err);
        }
    });
    // Nets
    server.resource("board-nets", new ResourceTemplate("edith://board/{file}/nets", { list: undefined }), {
        mimeType: "application/json",
        description: "Net list with names",
    }, async (uri, variables) => {
        try {
            const tree = await loadBoard(String(variables.file));
            const root = boardRoot(tree);
            const nets = findByTag(root, "net");
            const items = nets.map((n) => ({
                id: strAt(n, 1),
                name: strAt(n, 2),
            }));
            return jsonResource(uri, items);
        }
        catch (err) {
            return errorResource(uri, err);
        }
    });
    // Design rules
    server.resource("board-design-rules", new ResourceTemplate("edith://board/{file}/design-rules", { list: undefined }), {
        mimeType: "application/json",
        description: "Clearances, trace widths, via sizes, diff pair rules",
    }, async (uri, variables) => {
        try {
            const tree = await loadBoard(String(variables.file));
            const root = boardRoot(tree);
            const setup = findFirstByTag(root, "setup");
            if (!setup)
                return jsonResource(uri, { error: "No setup section found" });
            // Extract key design rule values
            const rules = {};
            for (const child of setup) {
                if (Array.isArray(child) && child.length >= 2 && typeof child[0] === "string") {
                    rules[child[0]] = strAt(child, 1);
                }
            }
            return jsonResource(uri, rules);
        }
        catch (err) {
            return errorResource(uri, err);
        }
    });
    // Custom DRC rules
    server.resource("board-custom-rules", new ResourceTemplate("edith://board/{file}/custom-rules", { list: undefined }), {
        mimeType: "text/plain",
        description: "Custom design rule expressions (.kicad_dru content)",
    }, async (uri, variables) => {
        try {
            const pcbFile = resolveFile(String(variables.file));
            const druFile = pcbFile.replace(/\.kicad_pcb$/, ".kicad_dru");
            const content = await readFile(druFile, "utf-8").catch(() => "(no custom rules file)");
            return {
                contents: [{ uri: uri.href, mimeType: "text/plain", text: content }],
            };
        }
        catch (err) {
            return errorResource(uri, err);
        }
    });
    // Layers
    server.resource("board-layers", new ResourceTemplate("edith://board/{file}/layers", { list: undefined }), {
        mimeType: "application/json",
        description: "Enabled layers with names, types, and visibility",
    }, async (uri, variables) => {
        try {
            const tree = await loadBoard(String(variables.file));
            const root = boardRoot(tree);
            const layersNode = findFirstByTag(root, "layers");
            if (!layersNode)
                return jsonResource(uri, []);
            const items = layersNode.slice(1).map((l) => {
                if (!Array.isArray(l))
                    return { raw: l };
                return {
                    id: strAt(l, 0),
                    name: strAt(l, 1),
                    type: strAt(l, 2),
                };
            });
            return jsonResource(uri, items);
        }
        catch (err) {
            return errorResource(uri, err);
        }
    });
    // Graphics defaults
    server.resource("board-graphics-defaults", new ResourceTemplate("edith://board/{file}/graphics-defaults", { list: undefined }), {
        mimeType: "application/json",
        description: "Default line widths, text sizes, and other drawing defaults",
    }, async (uri, variables) => {
        try {
            const tree = await loadBoard(String(variables.file));
            const root = boardRoot(tree);
            const setup = findFirstByTag(root, "setup");
            if (!setup)
                return jsonResource(uri, {});
            const defaults = findFirstByTag(setup, "defaults");
            if (!defaults)
                return jsonResource(uri, {});
            const result = {};
            for (const child of defaults) {
                if (Array.isArray(child) && child.length >= 2 && typeof child[0] === "string") {
                    result[child[0]] = strAt(child, 1);
                }
            }
            return jsonResource(uri, result);
        }
        catch (err) {
            return errorResource(uri, err);
        }
    });
    // Board statistics
    server.resource("board-stats", new ResourceTemplate("edith://board/{file}/stats", { list: undefined }), {
        mimeType: "application/json",
        description: "Area, component density, drill counts, via types",
    }, async (uri, variables) => {
        try {
            const tree = await loadBoard(String(variables.file));
            const root = boardRoot(tree);
            const footprints = findAllDeep(root, "footprint");
            const tracks = findAllDeep(root, "segment");
            const vias = findAllDeep(root, "via");
            const zones = findByTag(root, "zone");
            const arcs = findAllDeep(root, "arc");
            const pads = findAllDeep(root, "pad");
            // Count unique drill sizes from vias
            const drillSizes = new Set();
            for (const v of vias) {
                const size = getProp(v, "drill");
                if (size)
                    drillSizes.add(strAt(size, 1) ?? "");
            }
            return jsonResource(uri, {
                footprints: footprints.length,
                tracks: tracks.length,
                arcs: arcs.length,
                vias: vias.length,
                zones: zones.length,
                pads: pads.length,
                unique_drill_sizes: drillSizes.size,
            });
        }
        catch (err) {
            return errorResource(uri, err);
        }
    });
    // Bounding box
    server.resource("board-bounds", new ResourceTemplate("edith://board/{file}/bounds", { list: undefined }), {
        mimeType: "application/json",
        description: "Board bounding box and origin coordinates",
    }, async (uri, variables) => {
        try {
            const tree = await loadBoard(String(variables.file));
            const root = boardRoot(tree);
            const general = findFirstByTag(root, "general");
            const result = {};
            if (general) {
                for (const child of general) {
                    if (Array.isArray(child) && typeof child[0] === "string") {
                        result[child[0]] = child.slice(1).map((v) => (typeof v === "string" ? v : null));
                    }
                }
            }
            // Also check for setup origin
            const setup = findFirstByTag(root, "setup");
            if (setup) {
                const origin = findFirstByTag(setup, "aux_axis_origin");
                if (origin) {
                    result.aux_axis_origin = { x: strAt(origin, 1), y: strAt(origin, 2) };
                }
                const gridOrigin = findFirstByTag(setup, "grid_origin");
                if (gridOrigin) {
                    result.grid_origin = { x: strAt(gridOrigin, 1), y: strAt(gridOrigin, 2) };
                }
            }
            return jsonResource(uri, result);
        }
        catch (err) {
            return errorResource(uri, err);
        }
    });
}
//# sourceMappingURL=board.js.map