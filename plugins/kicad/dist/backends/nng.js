/**
 * NNG (nanomsg next generation) transport for KiCad IPC API.
 * Uses koffi FFI to call KiCad's bundled nng.dll directly — no Python dependency.
 */
import koffi from "koffi";
import { platform, env } from "node:process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
// NNG constants
const NNG_FLAG_ALLOC = 1;
// Locate nng.dll
function findNngLibrary() {
    // Check env override first
    if (env.KICAD_NNG_LIB)
        return env.KICAD_NNG_LIB;
    if (platform === "win32") {
        // Search common KiCad install paths
        const bases = [
            "C:/Program Files/KiCad",
            "C:/Program Files (x86)/KiCad",
        ];
        for (const base of bases) {
            // Try versioned dirs (10.0, 9.0, etc.) newest first
            for (const ver of ["10.0", "9.0", "8.0"]) {
                const p = join(base, ver, "bin", "nng.dll");
                if (existsSync(p))
                    return p;
            }
        }
        throw new Error("Cannot find nng.dll. Install KiCad or set KICAD_NNG_LIB to the path of nng.dll");
    }
    // Linux/Mac: try system-installed libnng
    for (const p of ["/usr/lib/libnng.so", "/usr/local/lib/libnng.so", "/usr/lib/libnng.dylib"]) {
        if (existsSync(p))
            return p;
    }
    throw new Error("Cannot find libnng. Install nng or set KICAD_NNG_LIB.");
}
/** Resolve the default KiCad API socket path */
export function defaultSocketUrl() {
    const fromEnv = env.KICAD_API_SOCKET;
    if (fromEnv)
        return fromEnv;
    if (platform === "win32") {
        const tmp = env.LOCALAPPDATA
            ? join(env.LOCALAPPDATA, "Temp")
            : tmpdir();
        return `ipc://${join(tmp, "kicad", "api.sock")}`;
    }
    // Check Flatpak path first
    const home = env.HOME ?? "";
    const flatpakSock = join(home, ".var/app/org.kicad.KiCad/cache/tmp/kicad/api.sock");
    if (existsSync(flatpakSock)) {
        return `ipc://${flatpakSock}`;
    }
    return "ipc:///tmp/kicad/api.sock";
}
// Lazy-loaded NNG FFI bindings
let lib = null;
let ffi = null;
function ensureFfi() {
    if (ffi)
        return ffi;
    lib = koffi.load(findNngLibrary());
    ffi = {
        nng_req0_open: lib.func("int nng_req0_open(_Out_ int *sock)"),
        nng_dial: lib.func("int nng_dial(int sock, const char *url, _Out_ int *dialer, int flags)"),
        nng_setopt_ms: lib.func("int nng_setopt_ms(int sock, const char *opt, int ms)"),
        nng_send: lib.func("int nng_send(int sock, const void *data, size_t size, int flags)"),
        nng_recv: lib.func("int nng_recv(int sock, _Out_ void **data, _Out_ size_t *size, int flags)"),
        nng_free: lib.func("void nng_free(void *ptr, size_t size)"),
        nng_close: lib.func("int nng_close(int sock)"),
        nng_strerror: lib.func("const char *nng_strerror(int err)"),
    };
    return ffi;
}
function checkNng(rv, op) {
    if (rv !== 0) {
        const msg = ensureFfi().nng_strerror(rv);
        throw new Error(`NNG ${op} failed: ${msg}`);
    }
}
export class NngReqSocket {
    sendTimeoutMs;
    recvTimeoutMs;
    sock = -1;
    _connected = false;
    constructor(sendTimeoutMs = 10_000, recvTimeoutMs = 30_000) {
        this.sendTimeoutMs = sendTimeoutMs;
        this.recvTimeoutMs = recvTimeoutMs;
    }
    connect(url) {
        const f = ensureFfi();
        const sockArr = [0];
        checkNng(f.nng_req0_open(sockArr), "req0_open");
        this.sock = sockArr[0];
        f.nng_setopt_ms(this.sock, "send-timeout", this.sendTimeoutMs);
        f.nng_setopt_ms(this.sock, "recv-timeout", this.recvTimeoutMs);
        const dialUrl = url ?? defaultSocketUrl();
        const dialerArr = [0];
        checkNng(f.nng_dial(this.sock, dialUrl, dialerArr, 0), "dial");
        this._connected = true;
    }
    /** Send a request and receive a reply (blocking REQ/REP pattern) */
    sendRecv(data) {
        if (!this._connected)
            throw new Error("NNG socket not connected");
        const f = ensureFfi();
        checkNng(f.nng_send(this.sock, data, data.length, 0), "send");
        const dataPtrArr = [null];
        const sizeArr = [0];
        checkNng(f.nng_recv(this.sock, dataPtrArr, sizeArr, NNG_FLAG_ALLOC), "recv");
        const replySize = Number(sizeArr[0]);
        const replyBuf = Buffer.from(koffi.decode(dataPtrArr[0], koffi.types.uint8, replySize));
        f.nng_free(dataPtrArr[0], replySize);
        return replyBuf;
    }
    get connected() {
        return this._connected;
    }
    close() {
        if (this.sock >= 0) {
            ensureFfi().nng_close(this.sock);
            this.sock = -1;
            this._connected = false;
        }
    }
}
//# sourceMappingURL=nng.js.map