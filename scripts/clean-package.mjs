import { existsSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const cwd = resolve(process.argv[2] ?? ".");

function cleanPythonArtifacts(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["__pycache__", ".pytest_cache", ".venv-test"].includes(entry.name)) {
        rmSync(path, { recursive: true, force: true });
        continue;
      }
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      cleanPythonArtifacts(path);
      continue;
    }
    if (entry.isFile() && /\.py[co]$/.test(entry.name)) {
      rmSync(path, { force: true });
    }
  }
}

if (cwd.endsWith(`${process.platform === "win32" ? "\\" : "/"}shared`) || cwd.endsWith("/shared") || cwd.endsWith("\\shared")) {
  rmSync(join(cwd, "dist"), { recursive: true, force: true });
}

cleanPythonArtifacts(cwd);
