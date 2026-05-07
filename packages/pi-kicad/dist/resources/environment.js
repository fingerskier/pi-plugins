import { getBackendState } from "../backends/select.js";
import { getCliVersion } from "../backends/cli.js";
export function registerEnvironment(server) {
    server.resource("server-info", "edith://info", {
        mimeType: "application/json",
        description: "Server version, KiCad version, available backends (CLI/IPC), KiCad installation path",
    }, async () => {
        const state = await getBackendState();
        const kicadVersion = state.cliAvailable ? await getCliVersion() : null;
        const info = {
            server: { name: "edith", version: "0.1.0" },
            kicad: {
                version: kicadVersion,
                path: process.env.KICAD_PATH ?? null,
                cliPath: state.kicadCliPath,
            },
            backends: {
                cli: state.cliAvailable,
                ipc: state.ipcAvailable,
            },
        };
        return {
            contents: [
                {
                    uri: "edith://info",
                    mimeType: "application/json",
                    text: JSON.stringify(info, null, 2),
                },
            ],
        };
    });
}
//# sourceMappingURL=environment.js.map