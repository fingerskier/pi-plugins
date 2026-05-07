import { z } from "zod";
import { ipcCall } from "../backends/ipc.js";
import { selectBackend } from "../backends/select.js";
export function registerTransactions(server) {
    server.tool("begin_transaction", "Begin a board edit transaction. Groups subsequent changes into a single undo step. Requires running KiCad instance.", {
        file: z.string().optional().describe("Path to .kicad_pcb"),
    }, async ({ file }) => {
        try {
            await selectBackend("ipc");
            const result = await ipcCall("board.begin_commit", { file });
            return { content: [{ type: "text", text: JSON.stringify(result) }] };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error: ${message}` }],
                isError: true,
            };
        }
    });
    server.tool("commit_transaction", "Push the current transaction; changes become visible and undoable as one step.", {
        file: z.string().optional().describe("Path to .kicad_pcb"),
    }, async ({ file }) => {
        try {
            await selectBackend("ipc");
            const result = await ipcCall("board.push_commit", { file });
            return { content: [{ type: "text", text: JSON.stringify(result) }] };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error: ${message}` }],
                isError: true,
            };
        }
    });
    server.tool("rollback_transaction", "Drop the current transaction, discarding uncommitted changes.", {
        file: z.string().optional().describe("Path to .kicad_pcb"),
    }, async ({ file }) => {
        try {
            await selectBackend("ipc");
            const result = await ipcCall("board.drop_commit", { file });
            return { content: [{ type: "text", text: JSON.stringify(result) }] };
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
//# sourceMappingURL=transactions.js.map