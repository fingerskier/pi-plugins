import { rmSync } from "node:fs";

for (const path of [".tsbuildinfo", "packages/shared/dist"]) {
  rmSync(path, { recursive: true, force: true });
}
