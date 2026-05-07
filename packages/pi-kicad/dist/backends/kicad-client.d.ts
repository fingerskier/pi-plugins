/**
 * Native KiCad IPC API client — protobuf over NNG, no Python.
 *
 * Loads the KiCad API proto schema from a binary FileDescriptorSet,
 * manages the NNG connection, and provides typed send/recv helpers.
 */
import protobuf from "protobufjs";
/** Look up a protobuf message type by fully-qualified name */
export declare function protoType(name: string): protobuf.Type;
/** Look up a protobuf enum by fully-qualified name */
export declare function protoEnum(name: string): protobuf.Enum;
/** Pack a protobuf message into google.protobuf.Any */
export declare function packAny(typeName: string, msg: Record<string, unknown>): {
    type_url: string;
    value: Uint8Array;
};
/** Unpack a google.protobuf.Any into a decoded object */
export declare function unpackAny(any: {
    type_url: string;
    value: Uint8Array;
}): {
    typeName: string;
    message: Record<string, unknown>;
};
export declare const ApiStatusCode: {
    readonly AS_UNKNOWN: 0;
    readonly AS_OK: 1;
    readonly AS_TIMEOUT: 2;
    readonly AS_BAD_REQUEST: 3;
    readonly AS_NOT_READY: 4;
    readonly AS_UNHANDLED: 5;
    readonly AS_TOKEN_MISMATCH: 6;
    readonly AS_BUSY: 7;
    readonly AS_UNIMPLEMENTED: 8;
};
export declare class KiCadClient {
    private socket;
    private kicadToken;
    private clientName;
    constructor(clientName?: string);
    connect(url?: string): void;
    get connected(): boolean;
    close(): void;
    /**
     * Send a protobuf command to KiCad and return the decoded response.
     *
     * @param commandTypeName  Fully-qualified protobuf type name (e.g. "kiapi.common.commands.Ping")
     * @param commandFields    Fields to set on the command message
     * @param responseTypeName Fully-qualified response type name (e.g. "kiapi.common.commands.GetVersionResponse")
     *                         Pass "google.protobuf.Empty" for void responses.
     * @returns Decoded response as a plain object
     */
    send<T = Record<string, unknown>>(commandTypeName: string, commandFields: Record<string, unknown>, responseTypeName: string): T;
    ping(): void;
    getVersion(): {
        version: {
            major: number;
            minor: number;
            patch: number;
            full_version: string;
        };
    };
    getOpenDocuments(docType: number): {
        documents: Array<Record<string, unknown>>;
    };
}
