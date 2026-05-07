import { checkCliAvailable } from "./cli.js";
import { checkIpcAvailable } from "./ipc.js";
let state = null;
export async function getBackendState() {
    if (state)
        return state;
    const [cliAvailable, ipcAvailable] = await Promise.all([
        checkCliAvailable(),
        checkIpcAvailable().catch(() => false),
    ]);
    state = {
        cliAvailable,
        ipcAvailable,
        kicadCliPath: cliAvailable ? (await import("./cli.js")).getCliPath() : null,
    };
    return state;
}
export function resetBackendState() {
    state = null;
}
export async function selectBackend(preference) {
    const s = await getBackendState();
    switch (preference) {
        case "cli":
            if (!s.cliAvailable)
                throw new Error("kicad-cli is not available");
            return "cli";
        case "ipc":
            if (!s.ipcAvailable)
                throw new Error("KiCad IPC API is not available. Start KiCad or run 'kicad-cli api-server'.");
            return "ipc";
        case "cli_preferred":
            if (s.cliAvailable)
                return "cli";
            if (s.ipcAvailable)
                return "ipc";
            throw new Error("Neither kicad-cli nor KiCad IPC API is available");
        case "ipc_preferred":
            if (s.ipcAvailable)
                return "ipc";
            if (s.cliAvailable)
                return "cli";
            throw new Error("Neither KiCad IPC API nor kicad-cli is available");
    }
}
//# sourceMappingURL=select.js.map