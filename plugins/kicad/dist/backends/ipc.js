/**
 * IPC backend — native Node.js implementation using NNG + protobuf.
 *
 * Replaces the former Python bridge (ipc_bridge.py) with direct NNG FFI
 * calls to KiCad's IPC API using protobuf messages.
 *
 * Exports `ipcCall(method, params)` with the same interface as before
 * so tool files can remain unchanged.
 */
import { KiCadClient, packAny, unpackAny } from "./kicad-client.js";
let client = null;
function ensureClient() {
    if (client?.connected)
        return client;
    client = new KiCadClient();
    client.connect();
    return client;
}
// DocumentType enum values (from kiapi.common.types.enums)
const DOCTYPE = {
    PCB: 2, // DOCTYPE_PCB
    SCHEMATIC: 1, // DOCTYPE_SCHEMATIC
};
// KiCadObjectType enum values (from kiapi.common.types.enums)
const OBJECT_TYPE = {
    KOT_PCB_FOOTPRINT: 37,
    KOT_PCB_TRACE: 38,
    KOT_PCB_ARC: 39,
    KOT_PCB_VIA: 40,
};
/** Get the board DocumentSpecifier for a PCB.
 *  Tries GetOpenDocuments first (KiCad 11+), falls back to constructing
 *  a DocumentSpecifier from the file path if the command isn't supported. */
function getBoardDoc(c, file) {
    // Try GetOpenDocuments (may not be supported in KiCad 10)
    try {
        const result = c.getOpenDocuments(DOCTYPE.PCB);
        if (result.documents?.length) {
            return result.documents[0];
        }
    }
    catch {
        // GetOpenDocuments not supported — fall through to file-based approach
    }
    // Construct DocumentSpecifier from file path
    if (file) {
        return { type: DOCTYPE.PCB, board_filename: file };
    }
    throw new Error("No file path provided and GetOpenDocuments is not supported by this KiCad version. " +
        "Pass the .kicad_pcb file path explicitly, or use KiCad 11+ for auto-detection.");
}
const methods = {
    // ── Session ────────────────────────────────────────────────────────────
    ping(c) {
        c.ping();
        const ver = c.getVersion();
        return { alive: true, version: ver.version?.full_version ?? "unknown" };
    },
    open_document(_c, _params) {
        // KiCad 10's IPC API doesn't support opening documents programmatically.
        // The document must be opened manually in KiCad.
        throw new Error("open_document is not supported by KiCad 10's IPC API. " +
            "Please open the project manually in KiCad.");
    },
    close_document(_c, _params) {
        throw new Error("close_document is not supported by KiCad 10's IPC API.");
    },
    // ── Board queries ──────────────────────────────────────────────────────
    "board.get_footprints"(c, params) {
        const doc = getBoardDoc(c, params.file);
        const result = c.send("kiapi.common.commands.GetItems", {
            header: { document: doc },
            types: [OBJECT_TYPE.KOT_PCB_FOOTPRINT],
        }, "kiapi.common.commands.GetItemsResponse");
        return (result.items ?? []).map((item) => {
            try {
                const { message } = unpackAny(item);
                return message;
            }
            catch {
                return item;
            }
        });
    },
    "board.get_tracks"(c, params) {
        const doc = getBoardDoc(c, params.file);
        const result = c.send("kiapi.common.commands.GetItems", {
            header: { document: doc },
            types: [OBJECT_TYPE.KOT_PCB_TRACE, OBJECT_TYPE.KOT_PCB_ARC],
        }, "kiapi.common.commands.GetItemsResponse");
        return (result.items ?? []).map((item) => {
            try {
                const { message } = unpackAny(item);
                return message;
            }
            catch {
                return item;
            }
        });
    },
    "board.get_nets"(c, params) {
        const doc = getBoardDoc(c, params.file);
        const result = c.send("kiapi.board.commands.GetNets", { board: doc }, "kiapi.board.commands.NetsResponse");
        return result.nets ?? [];
    },
    "board.get_enabled_layers"(c, params) {
        const doc = getBoardDoc(c, params.file);
        const result = c.send("kiapi.board.commands.GetBoardEnabledLayers", { board: doc }, "kiapi.board.commands.BoardEnabledLayersResponse");
        return result.layers ?? [];
    },
    "board.get_copper_layer_count"(c, params) {
        const doc = getBoardDoc(c, params.file);
        const result = c.send("kiapi.board.commands.GetBoardEnabledLayers", { board: doc }, "kiapi.board.commands.BoardEnabledLayersResponse");
        return result.copper_layer_count;
    },
    "board.get_design_rules"(c, params) {
        const doc = getBoardDoc(c, params.file);
        const result = c.send("kiapi.board.commands.GetGraphicsDefaults", { board: doc }, "kiapi.board.commands.GraphicsDefaultsResponse");
        return result;
    },
    "board.get_graphics_defaults"(c, params) {
        return methods["board.get_design_rules"](c, params);
    },
    "board.get_selection"(c, params) {
        const doc = getBoardDoc(c, params.file);
        const result = c.send("kiapi.common.commands.GetSelection", { header: { document: doc } }, "kiapi.common.commands.SelectionResponse");
        return (result.items ?? []).map((item) => {
            try {
                const { typeName, message } = unpackAny(item);
                return { ...message, _type: typeName.split(".").pop() };
            }
            catch {
                return item;
            }
        });
    },
    // ── Board edits ────────────────────────────────────────────────────────
    "board.create_items"(c, params) {
        const doc = getBoardDoc(c, params.file);
        const items = params.items;
        if (!items?.length)
            return { created: 0 };
        // Items should be protobuf Any-packed messages
        const packedItems = items.map((item) => {
            // If item has type and properties, pack it
            if (item.type && item.properties) {
                // Map simple type names to protobuf type names
                const typeMap = {
                    track: "kiapi.board.types.Track",
                    via: "kiapi.board.types.Via",
                    footprint: "kiapi.board.types.Footprint",
                    zone: "kiapi.board.types.Zone",
                    text: "kiapi.board.types.BoardText",
                    arc: "kiapi.board.types.Arc",
                };
                const protoName = typeMap[item.type];
                if (protoName) {
                    return packAny(protoName, item.properties);
                }
            }
            return item;
        });
        const result = c.send("kiapi.common.commands.CreateItems", {
            header: { document: doc },
            items: packedItems,
        }, "kiapi.common.commands.CreateItemsResponse");
        return { created: result.created_items?.length ?? 0 };
    },
    "board.add_to_selection"(c, params) {
        const doc = getBoardDoc(c, params.file);
        const items = params.items;
        if (!items?.length)
            return { selected: true };
        const kiids = items.map((ref) => ({ value: ref }));
        c.send("kiapi.common.commands.AddToSelection", {
            header: { document: doc },
            items: kiids,
        }, "kiapi.common.commands.SelectionResponse");
        return { selected: true };
    },
    "board.clear_selection"(c, params) {
        const doc = getBoardDoc(c, params.file);
        c.send("kiapi.common.commands.ClearSelection", { header: { document: doc } }, "google.protobuf.Empty");
        return { cleared: true };
    },
    "board.expand_text_variables"(c, params) {
        const doc = getBoardDoc(c, params.file);
        const text = params.text;
        const result = c.send("kiapi.common.commands.ExpandTextVariables", { document: doc, text: [text] }, "kiapi.common.commands.ExpandTextVariablesResponse");
        return { expanded: result.text?.[0] ?? text };
    },
    // ── Transactions ───────────────────────────────────────────────────────
    "board.begin_commit"(c, params) {
        const doc = getBoardDoc(c, params.file);
        const result = c.send("kiapi.common.commands.BeginCommit", { header: { document: doc } }, "kiapi.common.commands.BeginCommitResponse");
        return { transaction: "started", id: result.id };
    },
    "board.push_commit"(c, params) {
        const doc = getBoardDoc(c, params.file);
        // CommitAction.CMA_COMMIT = 1
        c.send("kiapi.common.commands.EndCommit", { header: { document: doc }, action: 1 }, "kiapi.common.commands.EndCommitResponse");
        return { transaction: "committed" };
    },
    "board.drop_commit"(c, params) {
        const doc = getBoardDoc(c, params.file);
        // CommitAction.CMA_DROP = 2
        c.send("kiapi.common.commands.EndCommit", { header: { document: doc }, action: 2 }, "kiapi.common.commands.EndCommitResponse");
        return { transaction: "rolled_back" };
    },
};
// ── Public API (same interface as the old Python bridge) ─────────────────────
export async function ipcCall(method, params = {}) {
    const handler = methods[method];
    if (!handler) {
        throw new Error(`Unknown IPC method: ${method}`);
    }
    const c = ensureClient();
    return handler(c, params);
}
export async function checkIpcAvailable() {
    try {
        const c = ensureClient();
        c.ping();
        return true;
    }
    catch {
        return false;
    }
}
export function shutdownBridge() {
    if (client) {
        client.close();
        client = null;
    }
}
//# sourceMappingURL=ipc.js.map