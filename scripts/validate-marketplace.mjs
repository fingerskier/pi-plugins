import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const marketplacePath = join(root, "marketplace.json");
const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));

function fail(message) {
  console.error(`validate-marketplace: ${message}`);
  process.exitCode = 1;
}

if (!Array.isArray(marketplace.plugins)) fail("plugins must be an array");

const names = new Set();
const packages = new Set();
for (const plugin of marketplace.plugins ?? []) {
  for (const key of ["name", "package", "path", "description", "category", "status", "pi", "upstream"]) {
    if (plugin[key] === undefined) fail(`${plugin.name ?? "<unknown>"}: missing ${key}`);
  }
  if (names.has(plugin.name)) fail(`duplicate plugin name ${plugin.name}`);
  names.add(plugin.name);
  if (packages.has(plugin.package)) fail(`duplicate package ${plugin.package}`);
  packages.add(plugin.package);

  const expectedPath = `packages/pi-${plugin.name}`;
  const expectedPackage = `@fingerskier/pi-${plugin.name}`;
  if (plugin.path !== expectedPath) fail(`${plugin.name}: path must be ${expectedPath}`);
  if (plugin.package !== expectedPackage) fail(`${plugin.name}: package must be ${expectedPackage}`);
  if (plugin.pi?.install !== `pi install npm:${plugin.package}`) {
    fail(`${plugin.name}: pi.install must be pi install npm:${plugin.package}`);
  }
  if (plugin.pi?.localInstall !== `pi install ./${plugin.path}`) {
    fail(`${plugin.name}: pi.localInstall must be pi install ./${plugin.path}`);
  }

  const pluginDir = join(root, plugin.path);
  if (!existsSync(pluginDir)) fail(`${plugin.name}: path does not exist: ${plugin.path}`);
  const packagePath = join(pluginDir, "package.json");
  if (!existsSync(packagePath)) {
    fail(`${plugin.name}: missing package.json`);
    continue;
  }
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  if (pkg.name !== plugin.package) fail(`${plugin.name}: package name mismatch (${pkg.name} !== ${plugin.package})`);
  if (!pkg.keywords?.includes("pi-package")) fail(`${plugin.name}: package.json keywords must include pi-package`);
  if (!pkg.pi) fail(`${plugin.name}: package.json missing pi manifest`);
  if (!pkg.publishConfig || pkg.publishConfig.access !== "public") fail(`${plugin.name}: package.json missing publishConfig.access=public`);

  for (const [resourceKey, resourceType] of [["extensions", "extension"], ["skills", "skill"], ["prompts", "prompt"], ["themes", "theme"]]) {
    const resources = pkg.pi?.[resourceKey] ?? [];
    if (resources.length && !plugin.pi.resources.includes(resourceType)) {
      fail(`${plugin.name}: marketplace pi.resources missing ${resourceType}`);
    }
    for (const rel of resources) {
      if (!existsSync(join(pluginDir, rel))) fail(`${plugin.name}: pi.${resourceKey} path missing: ${rel}`);
    }
  }

  if (!existsSync(join(pluginDir, "README.md"))) fail(`${plugin.name}: missing README.md`);
}

if (!existsSync(join(root, "packages", "shared", "package.json"))) fail("missing packages/shared package");

if (!process.exitCode) {
  console.log(`Validated ${marketplace.plugins.length} Pi marketplace plugin entries.`);
}
