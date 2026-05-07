/**
 * IPC backend — native Node.js implementation using NNG + protobuf.
 *
 * Replaces the former Python bridge (ipc_bridge.py) with direct NNG FFI
 * calls to KiCad's IPC API using protobuf messages.
 *
 * Exports `ipcCall(method, params)` with the same interface as before
 * so tool files can remain unchanged.
 */
export declare function ipcCall(method: string, params?: Record<string, unknown>): Promise<unknown>;
export declare function checkIpcAvailable(): Promise<boolean>;
export declare function shutdownBridge(): void;
