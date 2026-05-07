# Monorepo Implementation Follow-up

Status: implemented in this repository. Remaining work is operational publishing/release cleanup.

Completed:
- [x] Root-level pnpm workspace (`pnpm-workspace.yaml`).
- [x] Packages live under `./packages/*`.
- [x] Existing Pi plugin content migrated from `./plugins/*` to `./packages/pi-*`.
- [x] Package names use the `@fingerskier/*` scope, e.g. `@fingerskier/pi-micropython`.
- [x] Shared MCP stdio bridge moved into `@fingerskier/pi-shared`.
- [x] MCP-backed plugin packages depend on the published `@fingerskier/pi-shared` version while local pnpm links the workspace package.
- [x] Root scripts exist for `build`, `test`, `lint`, and `clean`.
- [x] TypeScript project references are configured for the shared package and TS extension packages.
- [x] Marketplace and README docs use npm install targets such as `pi install npm:@fingerskier/pi-micropython`.

Remaining before public release:
- [ ] Publish fixed versions of MCP-backed `@fingerskier/pi-*` packages to npm after verifying no package manifest contains `workspace:` dependencies.
- [ ] Run live smoke tests for MCP-backed packages after npm publish (`pi install npm:@fingerskier/pi-micropython`, etc.).
- [ ] Decide whether to add CI for `pnpm install`, `pnpm -r build`, and `pnpm -r test`.
- [ ] Consider separate Claude/Codex package workspaces only if/when those package targets are needed.
