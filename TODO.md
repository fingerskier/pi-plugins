# Monorepo Implementation Follow-up

Convert this repository into a pnpm workspace monorepo for agent/plugin packages.

Goals:
- Root-level pnpm workspace
- Packages live under ./packages/*
- Existing plugin content under /plugins should be migrated into appropriately named packages
- Use npm scoped package names: @fingerskier/<name>
- Preserve existing functionality
- Ensure packages are independently publishable
- Share common utilities/types/config where appropriate

Required structure:

/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  packages/
    pi-<plugin-name>/
    claude-<plugin-name>/
    codex-<plugin-name>/
    shared/

Tasks:
1. Ensure we have a pnpm workspace
2. Ensure we have root scripts for:
   - build
   - test
   - lint
   - clean
3. Ensure each plugin has its own package
4. Ensure we have proper package.json files
5. Ensure we have properly configured TypeScript project references if TS is used
6. Deduplicate shared dependencies/utilities into packages/shared
7. Ensure local package linking works through workspace references
8. Verify all packages build successfully
9. Verify package entrypoints resolve correctly
10. Add/update README documentation for:
    - workspace layout
    - creating new plugins
    - local development
    - publishing packages

Validation requirements:
- `pnpm install` succeeds from repo root
- `pnpm -r build` succeeds
- `pnpm -r test` succeeds (if tests exist)
- No broken imports after migration
- All package names use @fingerskier/* scope
- Workspace dependency graph resolves correctly
- Existing plugin behavior remains functional

Prefer:
- ESM
- minimal boilerplate
- strict TS settings
- reusable shared tooling/config
- clean package boundaries

After implementation:
- provide a concise migration summary
- list any assumptions or unresolved issues
- identify packages that may still need manual cleanup
