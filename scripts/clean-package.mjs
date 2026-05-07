import { rmSync } from "node:fs";
import { join, resolve } from "node:path";

const cwd = resolve(process.argv[2] ?? ".");
if (cwd.endsWith(`${process.platform === "win32" ? "\\" : "/"}shared`) || cwd.endsWith("/shared") || cwd.endsWith("\\shared")) {
  rmSync(join(cwd, "dist"), { recursive: true, force: true });
}
