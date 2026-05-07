/**
 * Native KiCad IPC API client — protobuf over NNG, no Python.
 *
 * Loads the KiCad API proto schema from a binary FileDescriptorSet,
 * manages the NNG connection, and provides typed send/recv helpers.
 */
import protobuf from "protobufjs";
import descriptor from "protobufjs/ext/descriptor/index.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { NngReqSocket, defaultSocketUrl } from "./nng.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
const DESCRIPTOR_PATH = join(__dirname, "..", "..", "proto", "kicad-api.bin");
// ── Proto schema ────────────────────────────────────────────────────────────
let _root = null;
function getRoot() {
    if (_root)
        return _root;
    const buf = readFileSync(DESCRIPTOR_PATH);
    const decodedSet = descriptor.FileDescriptorSet.decode(buf);
    _root = protobuf.Root.fromDescriptor(decodedSet);
    return _root;
}
/** Look up a protobuf message type by fully-qualified name */
export function protoType(name) {
    return getRoot().lookupType(name);
}
/** Look up a protobuf enum by fully-qualified name */
export function protoEnum(name) {
    return getRoot().lookupEnum(name);
}
// ── Well-known type URLs ────────────────────────────────────────────────────
const TYPE_URL_PREFIX = "type.googleapis.com/";
function typeUrlFor(typeName) {
    return TYPE_URL_PREFIX + typeName;
}
/** Pack a protobuf message into google.protobuf.Any */
export function packAny(typeName, msg) {
    const T = protoType(typeName);
    const encoded = T.encode(T.create(msg)).finish();
    return { type_url: typeUrlFor(typeName), value: encoded };
}
/** Unpack a google.protobuf.Any into a decoded object */
export function unpackAny(any) {
    const typeName = any.type_url.replace(TYPE_URL_PREFIX, "");
    const T = protoType(typeName);
    const decoded = T.toObject(T.decode(any.value), {
        longs: String,
        enums: String,
        defaults: true,
    });
    return { typeName, message: decoded };
}
// ── Envelope types (cached) ─────────────────────────────────────────────────
let _ApiRequest;
let _ApiResponse;
function ApiRequest() {
    return (_ApiRequest ??= protoType("kiapi.common.ApiRequest"));
}
function ApiResponse() {
    return (_ApiResponse ??= protoType("kiapi.common.ApiResponse"));
}
// ApiStatusCode values
export const ApiStatusCode = {
    AS_UNKNOWN: 0,
    AS_OK: 1,
    AS_TIMEOUT: 2,
    AS_BAD_REQUEST: 3,
    AS_NOT_READY: 4,
    AS_UNHANDLED: 5,
    AS_TOKEN_MISMATCH: 6,
    AS_BUSY: 7,
    AS_UNIMPLEMENTED: 8,
};
// ── Client ──────────────────────────────────────────────────────────────────
export class KiCadClient {
    socket;
    kicadToken = "";
    clientName;
    constructor(clientName = "kicad-buddy") {
        this.clientName = clientName;
        this.socket = new NngReqSocket();
    }
    connect(url) {
        this.socket.connect(url ?? defaultSocketUrl());
    }
    get connected() {
        return this.socket.connected;
    }
    close() {
        this.socket.close();
        this.kicadToken = "";
    }
    /**
     * Send a protobuf command to KiCad and return the decoded response.
     *
     * @param commandTypeName  Fully-qualified protobuf type name (e.g. "kiapi.common.commands.Ping")
     * @param commandFields    Fields to set on the command message
     * @param responseTypeName Fully-qualified response type name (e.g. "kiapi.common.commands.GetVersionResponse")
     *                         Pass "google.protobuf.Empty" for void responses.
     * @returns Decoded response as a plain object
     */
    send(commandTypeName, commandFields, responseTypeName) {
        const Req = ApiRequest();
        const Resp = ApiResponse();
        // Build the command message
        const CmdType = protoType(commandTypeName);
        const cmdMsg = CmdType.create(commandFields);
        const cmdBytes = CmdType.encode(cmdMsg).finish();
        // Wrap in ApiRequest envelope
        const envelope = Req.create({
            header: {
                kicad_token: this.kicadToken,
                client_name: this.clientName,
            },
            message: {
                type_url: typeUrlFor(commandTypeName),
                value: cmdBytes,
            },
        });
        const reqBuf = Buffer.from(Req.encode(envelope).finish());
        // Send and receive via NNG
        const replyBuf = this.socket.sendRecv(reqBuf);
        // Decode ApiResponse envelope
        const response = Resp.toObject(Resp.decode(replyBuf), {
            longs: String,
            enums: Number,
            defaults: true,
        });
        // Cache token from first successful response
        if (!this.kicadToken && response.header?.kicad_token) {
            this.kicadToken = response.header.kicad_token;
        }
        // Check status
        if (response.status?.status !== ApiStatusCode.AS_OK) {
            const code = response.status?.status ?? 0;
            const msg = response.status?.error_message || `API error code ${code}`;
            throw new Error(msg);
        }
        // Decode the response message
        if (responseTypeName === "google.protobuf.Empty") {
            return {};
        }
        const RespType = protoType(responseTypeName);
        const decoded = RespType.toObject(RespType.decode(response.message.value), {
            longs: String,
            enums: String,
            defaults: true,
        });
        return decoded;
    }
    // ── Convenience methods ─────────────────────────────────────────────────
    ping() {
        this.send("kiapi.common.commands.Ping", {}, "google.protobuf.Empty");
    }
    getVersion() {
        return this.send("kiapi.common.commands.GetVersion", {}, "kiapi.common.commands.GetVersionResponse");
    }
    getOpenDocuments(docType) {
        return this.send("kiapi.common.commands.GetOpenDocuments", { type: docType }, "kiapi.common.commands.GetOpenDocumentsResponse");
    }
}
//# sourceMappingURL=kicad-client.js.map