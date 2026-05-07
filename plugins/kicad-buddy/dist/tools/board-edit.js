import { z } from "zod";
import { ipcCall } from "../backends/ipc.js";
import { selectBackend } from "../backends/select.js";
const ipcRequired = async () => {
    await selectBackend("ipc");
};
export function registerBoardEdit(server) {
    server.tool("create_board_items", "Create one or more items on the board (footprints, tracks, vias, zones, graphics, text). Requires running KiCad instance.", {
        file: z.string().optional().describe("Path to .kicad_pcb (uses currently open board if omitted)"),
        items: z
            .array(z.object({
            type: z
                .enum([
                "footprint", "track", "via", "zone", "arc", "circle", "rect",
                "polygon", "line", "text", "textbox", "dimension", "group",
            ])
                .describe("Item type"),
            properties: z.record(z.unknown()).describe("Type-specific properties"),
        }))
            .describe("Array of item descriptors"),
        commit_message: z.string().optional().describe("Undo label for the transaction"),
    }, async ({ file, items, commit_message }) => {
        try {
            await ipcRequired();
            const result = await ipcCall("board.create_items", {
                file,
                items,
                commit_message,
            });
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error creating items: ${message}` }],
                isError: true,
            };
        }
    });
    server.tool("modify_board_items", "Modify properties of existing board items by reference. Requires running KiCad instance.", {
        file: z.string().optional().describe("Path to .kicad_pcb"),
        items: z
            .array(z.object({
            reference: z.string().describe("Item reference (e.g., footprint reference designator)"),
            properties: z.record(z.unknown()).describe("Properties to update"),
        }))
            .describe("Items to modify"),
    }, async ({ file, items }) => {
        try {
            await ipcRequired();
            // Modify is implemented via create_items with existing references
            const result = await ipcCall("board.create_items", { file, items });
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error modifying items: ${message}` }],
                isError: true,
            };
        }
    });
    server.tool("select_items", "Set or clear the selection in the board editor.", {
        file: z.string().optional().describe("Path to .kicad_pcb"),
        items: z.array(z.string()).optional().describe("Item references to select (empty to clear)"),
        clear: z.boolean().default(false).describe("Clear current selection first"),
    }, async ({ file, items, clear }) => {
        try {
            await ipcRequired();
            if (clear) {
                await ipcCall("board.clear_selection", { file });
            }
            if (items?.length) {
                await ipcCall("board.add_to_selection", { file, items });
            }
            return {
                content: [{ type: "text", text: clear && !items?.length ? "Selection cleared" : `Selected ${items?.length ?? 0} items` }],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error: ${message}` }],
                isError: true,
            };
        }
    });
    server.tool("expand_text_variables", "Expand text variables (e.g., ${REVISION}, ${DATE}) in the context of a board.", {
        file: z.string().optional().describe("Path to .kicad_pcb"),
        text: z.string().describe("Text containing variables to expand"),
    }, async ({ file, text }) => {
        try {
            await ipcRequired();
            const result = await ipcCall("board.expand_text_variables", { file, text });
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error: ${message}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=board-edit.js.map