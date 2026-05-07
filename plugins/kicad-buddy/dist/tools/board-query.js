import { z } from "zod";
import { ipcCall } from "../backends/ipc.js";
import { selectBackend } from "../backends/select.js";
const ipcRequired = async () => {
    await selectBackend("ipc");
};
const INCLUDE_OPTIONS = ["footprints", "tracks", "nets", "layers", "design_rules"];
export function registerBoardQuery(server) {
    server.tool("get_board_state", "Query live board state from running KiCad instance. Returns a timestamped snapshot of footprints, tracks, nets, layers, and/or design rules. Use for periodic state refresh and diffing.", {
        file: z.string().optional().describe("Path to .kicad_pcb (uses currently open board if omitted)"),
        include: z
            .array(z.enum(INCLUDE_OPTIONS))
            .optional()
            .describe("Which data to include (default: all)"),
    }, async ({ file, include }) => {
        try {
            await ipcRequired();
            const sections = include ?? [...INCLUDE_OPTIONS];
            const result = {
                timestamp: new Date().toISOString(),
            };
            if (sections.includes("footprints")) {
                result.footprints = await ipcCall("board.get_footprints", { file });
            }
            if (sections.includes("tracks")) {
                result.tracks = await ipcCall("board.get_tracks", { file });
            }
            if (sections.includes("nets")) {
                result.nets = await ipcCall("board.get_nets", { file });
            }
            if (sections.includes("layers")) {
                result.layers = await ipcCall("board.get_enabled_layers", { file });
            }
            if (sections.includes("design_rules")) {
                result.design_rules = await ipcCall("board.get_design_rules", { file });
            }
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error querying board state: ${message}` }],
                isError: true,
            };
        }
    });
    server.tool("get_selection", "Read the current selection in KiCad's board editor. Returns details of all currently selected items.", {
        file: z.string().optional().describe("Path to .kicad_pcb (uses currently open board if omitted)"),
    }, async ({ file }) => {
        try {
            await ipcRequired();
            const result = await ipcCall("board.get_selection", { file });
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error reading selection: ${message}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=board-query.js.map