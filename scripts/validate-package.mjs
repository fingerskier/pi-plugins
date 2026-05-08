import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = resolve(process.argv[2] ?? ".");
const packagePath = join(packageDir, "package.json");
const relativeName = basename(packageDir);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sharedPackage = JSON.parse(readFileSync(join(root, "packages", "shared", "package.json"), "utf8"));

function fail(message) {
  console.error(`validate-package: ${relativeName}: ${message}`);
  process.exitCode = 1;
}

function collectSourceFiles(path) {
  if (!existsSync(path)) return [];
  const stat = statSync(path);
  if (stat.isFile()) return /\.[cm]?[jt]s$/.test(path) ? [path] : [];
  if (!stat.isDirectory()) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => collectSourceFiles(join(path, entry.name)));
}

function dependencyUsesWorkspaceProtocol(pkg) {
  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    for (const [name, version] of Object.entries(pkg[field] ?? {})) {
      if (typeof version === "string" && version.startsWith("workspace:")) {
        fail(`${field}.${name} must not use workspace: protocol in publishable packages`);
      }
    }
  }
}

function packageImportsSharedRuntime(pkg) {
  const extensionPaths = pkg.pi?.extensions ?? [];
  return extensionPaths
    .flatMap((rel) => collectSourceFiles(join(packageDir, rel)))
    .some((path) => readFileSync(path, "utf8").includes("@fingerskier/pi-shared"));
}

if (!existsSync(packagePath)) {
  fail("missing package.json");
  process.exit();
}

const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
if (!pkg.name?.startsWith("@fingerskier/")) fail(`package name must use @fingerskier/* scope (${pkg.name})`);
if (pkg.private) fail("publishable packages must not be private");
dependencyUsesWorkspaceProtocol(pkg);

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

  if (packageImportsSharedRuntime(pkg)) {
    const sharedDependency = pkg.dependencies?.["@fingerskier/pi-shared"];
    if (sharedDependency !== sharedPackage.version) {
      fail(`packages importing @fingerskier/pi-shared must depend on version ${sharedPackage.version} without workspace: protocol`);
    }
  }

  for (const rel of pkg.files ?? []) {
    if (!existsSync(join(packageDir, rel))) fail(`files entry missing: ${rel}`);
  }
}

if (!process.exitCode) console.log(`Validated ${pkg.name}`);
