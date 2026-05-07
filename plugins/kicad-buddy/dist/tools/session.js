import { z } from "zod";
import { ipcCall } from "../backends/ipc.js";
import { selectBackend, resetBackendState } from "../backends/select.js";
export function registerSession(server) {
    server.tool("open_document", "Open a KiCad document (.kicad_pcb, .kicad_sch, .kicad_pro) in the running KiCad instance.", {
        file: z.string().describe("Path to KiCad document"),
    }, async ({ file }) => {
        try {
            await selectBackend("ipc");
            const result = await ipcCall("open_document", { file });
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
    server.tool("close_document", "Close a document in KiCad.", {
        file: z.string().describe("Path to KiCad document"),
    }, async ({ file }) => {
        try {
            await selectBackend("ipc");
            const result = await ipcCall("close_document", { file });
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
    server.tool("ping", "Check connectivity to KiCad IPC API. Returns version info.", {}, async () => {
        try {
            resetBackendState();
            await selectBackend("ipc");
            const result = await ipcCall("ping");
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `KiCad IPC not available: ${message}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=session.js.map