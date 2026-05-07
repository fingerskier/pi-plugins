# Fingerskier Pi Packages

A pnpm workspace of publishable [Pi](https://pi.dev) packages ported from Fingerskier Claude plugins.

The end goal is direct npm installation of individual Pi packages, for example:

```bash
pi install npm:@fingerskier/pi-micropython
```

> Pi npm package specs use standard npm names. Scoped packages include the `@`, so use `npm:@fingerskier/pi-micropython` rather than `npm:fingerskier/pi-micropython`.

## Workspace Layout

```text
packages/
  shared/             # @fingerskier/pi-shared runtime utilities
  pi-build123d/       # @fingerskier/pi-build123d
  pi-cron/            # @fingerskier/pi-cron
  pi-dude/            # @fingerskier/pi-dude
  pi-email/           # @fingerskier/pi-email
  pi-fleet/           # @fingerskier/pi-fleet
  pi-kicad/           # @fingerskier/pi-kicad
  pi-micropython/     # @fingerskier/pi-micropython
  pi-mozart/          # @fingerskier/pi-mozart
  pi-terse/           # @fingerskier/pi-terse
  pi-theology/        # @fingerskier/pi-theology
```

`marketplace.json` is the catalog. Each `packages/pi-*` directory is an independently publishable Pi package with its own `package.json` `pi` manifest.

## Available Packages

| Package | Resources | Description | Install |
|---|---|---|---|
| [@fingerskier/pi-build123d](./packages/pi-build123d) | extension, skill | CAD modeling with build123d; create, render, inspect, and export 3D models | `pi install npm:@fingerskier/pi-build123d` |
| [@fingerskier/pi-cron](./packages/pi-cron) | extension, skill | Schedule one-time and recurring agent jobs and cron-like prompts | `pi install npm:@fingerskier/pi-cron` |
| [@fingerskier/pi-dude](./packages/pi-dude) | extension, skills | Local semantic memory and issue/spec tracking | `pi install npm:@fingerskier/pi-dude` |
| [@fingerskier/pi-email](./packages/pi-email) | skill | Placeholder skill for IMAP/SMTP email automation design | `pi install npm:@fingerskier/pi-email` |
| [@fingerskier/pi-fleet](./packages/pi-fleet) | extension, skill | AWS service inspection for EC2, S3, Lambda, ECS, CloudWatch, CloudFormation, STS | `pi install npm:@fingerskier/pi-fleet` |
| [@fingerskier/pi-kicad](./packages/pi-kicad) | extension, skill | KiCad project inspection and fabrication workflows | `pi install npm:@fingerskier/pi-kicad` |
| [@fingerskier/pi-micropython](./packages/pi-micropython) | extension, skill | Interact with MicroPython boards over serial | `pi install npm:@fingerskier/pi-micropython` |
| [@fingerskier/pi-mozart](./packages/pi-mozart) | extension, skills | MIDI analysis, editing, and composition | `pi install npm:@fingerskier/pi-mozart` |
| [@fingerskier/pi-terse](./packages/pi-terse) | prompt, skill | Ultra-compressed communication mode | `pi install npm:@fingerskier/pi-terse` |
| [@fingerskier/pi-theology](./packages/pi-theology) | skills | Exegetical theology research skills | `pi install npm:@fingerskier/pi-theology` |

For local development before publishing, install by path:

```bash
pi install ./packages/pi-micropython
pi -e ./packages/pi-terse
```

## Development

```bash
pnpm install
pnpm run build
pnpm run test
pnpm run lint
```

Useful direct validation commands:

```bash
pnpm -r build
pnpm -r test
node scripts/validate-marketplace.mjs
```

`pnpm install` links workspace dependencies such as `@fingerskier/pi-shared` by package name/version. MCP-backed packages import the shared bridge from that package instead of reaching across package boundaries, and published package manifests avoid the npm-incompatible `workspace:` protocol.

## Creating a New Pi Package

1. Create `packages/pi-<name>/package.json` named `@fingerskier/pi-<name>`.
2. Add `"pi-package"` to `keywords`.
3. Add a `pi` manifest for `extensions`, `skills`, `prompts`, or `themes`.
4. For MCP-backed extensions, depend on the current `@fingerskier/pi-shared` version and import from `@fingerskier/pi-shared/mcp-stdio`.
5. Add the package to `marketplace.json` with both npm and local install commands.
6. Run `pnpm install && pnpm run test`.

## Publishing

Publish with pnpm/npm after confirming package manifests contain no `workspace:` dependencies:

```bash
pnpm -r --filter @fingerskier/pi-shared --filter './packages/pi-*' publish --access public
```

Publish `@fingerskier/pi-shared` before or together with packages that depend on it. After publish, users can install packages with `pi install npm:@fingerskier/pi-<name>`.

## MCP-backed Ports

Pi has no built-in MCP client configuration. MCP-backed ports use `@fingerskier/pi-shared/mcp-stdio`, a Pi extension helper that:

1. starts the upstream MCP stdio server,
2. calls `initialize` and `tools/list`,
3. registers each MCP tool as a native Pi tool with a plugin prefix, and
4. forwards Pi tool calls to MCP `tools/call`.

Examples:

- Cron's legacy Dex MCP `add_dex_job` becomes Pi tool `cron_add_job`.
- Mozart MCP `load_midi` becomes Pi tool `mozart_load_midi`.
- build123d MCP `execute_build123d` becomes Pi tool `build123d_execute_build123d`.

Each MCP-backed package also registers `<prefix>_mcp_status` and a `/<slug>-mcp-reload` command for diagnostics/retry.

## Runtime Notes

- Node-backed ports (`cron`, `dude`, `fleet`, `mozart`) default to `npx -y <upstream-claude-package>`.
- Python-backed ports (`build123d`, `micropython`) bundle source and self-bootstrap a venv under `~/.pi/agent/data/<plugin>/venv` on first use.
- `kicad` bundles upstream KiCad MCP `dist/` and has KiCad/runtime dependencies declared in its package.
- Set `<PLUGIN>_MCP_AUTOLOAD=0` to skip MCP tool discovery during Pi startup and load later via `<prefix>_mcp_status`.

## License

[MIT](./LICENSE)
