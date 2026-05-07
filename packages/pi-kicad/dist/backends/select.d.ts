import type { BackendPreference, BackendState } from "./types.js";
export declare function getBackendState(): Promise<BackendState>;
export declare function resetBackendState(): void;
export declare function selectBackend(preference: BackendPreference): Promise<"cli" | "ipc">;
