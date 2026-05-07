export interface CliResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
export interface CliOptions {
    args: string[];
    timeout?: number;
    cwd?: string;
}
export interface IpcRequest {
    id: number;
    method: string;
    params: Record<string, unknown>;
}
export interface IpcResponse {
    id: number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
    };
}
export type BackendPreference = "cli" | "ipc" | "cli_preferred" | "ipc_preferred";
export interface BackendState {
    cliAvailable: boolean;
    ipcAvailable: boolean;
    kicadCliPath: string | null;
}
