/**
 * NNG (nanomsg next generation) transport for KiCad IPC API.
 * Uses koffi FFI to call KiCad's bundled nng.dll directly — no Python dependency.
 */
/** Resolve the default KiCad API socket path */
export declare function defaultSocketUrl(): string;
export declare class NngReqSocket {
    private sendTimeoutMs;
    private recvTimeoutMs;
    private sock;
    private _connected;
    constructor(sendTimeoutMs?: number, recvTimeoutMs?: number);
    connect(url?: string): void;
    /** Send a request and receive a reply (blocking REQ/REP pattern) */
    sendRecv(data: Buffer): Buffer;
    get connected(): boolean;
    close(): void;
}
