import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const packageDir = resolve(process.argv[2] ?? ".");
const packagePath = join(packageDir, "package.json");
const relativeName = basename(packageDir);

function fail(message) {
  console.error(`validate-package: ${relativeName}: ${message}`);
  process.exitCode = 1;
}

if (!existsSync(packagePath)) {
  fail("missing package.json");
  process.exit();
}

const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
if (!pkg.name?.startsWith("@fingerskier/")) fail(`package name must use @fingerskier/* scope (${pkg.name})`);
if (pkg.private) fail("publishable packages must not be private");

if (relativeName === "shared") {
  if (!existsSync(join(packageDir, "src", "mcp-stdio.ts"))) fail("missing src/mcp-stdio.ts");
  if (!pkg.exports?.["./mcp-stdio"]) fail("missing ./mcp-stdio export");
  for (const rel of ["dist/mcp-stdio.js", "dist/mcp-stdio.d.ts"]) {
    if (!pkg.files?.includes(rel)) fail(`shared package files should include ${rel}`);
    if (!existsSync(join(packageDir, rel))) fail(`shared build output missing: ${rel}`);
  }
} else {
  if (!relativeName.startsWith("pi-")) fail("Pi packages must be named packages/pi-<plugin>");
  const expectedName = `@fingerskier/${relativeName}`;
  if (pkg.name !== expectedName) fail(`package name mismatch (${pkg.name} !== ${expectedName})`);
  if (!pkg.keywords?.includes("pi-package")) fail("keywords must include pi-package");
  if (!pkg.pi) fail("missing pi manifest");
  if (!pkg.publishConfig || pkg.publishConfig.access !== "public") fail("missing publishConfig.access=public");

  for (const [resourceKey] of [["extensions"], ["skills"], ["prompts"], ["themes"]]) {
    for (const rel of pkg.pi?.[resourceKey] ?? []) {
      if (!existsSync(join(packageDir, rel))) fail(`pi.${resourceKey} path missing: ${rel}`);
    }
  }

  if ((pkg.pi?.extensions ?? []).length && pkg.dependencies?.["@fingerskier/pi-shared"] !== "workspace:*") {
    fail("extension package must depend on @fingerskier/pi-shared via workspace:*");
  }

  for (const rel of pkg.files ?? []) {
    if (!existsSync(join(packageDir, rel))) fail(`files entry missing: ${rel}`);
  }
}

if (!process.exitCode) console.log(`Validated ${pkg.name}`);
