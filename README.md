# Fingerskier Pi Plugins

A marketplace-style repository of [Pi](https://pi.dev) packages ported from Fingerskier Claude plugins.

Pi does not currently have a `claude plugin marketplace add` equivalent. This repo uses `marketplace.json` as a catalog, and each directory under `plugins/` is a Pi package with its own `package.json` `pi` manifest.

## Install

Clone the repo, then install a package by local path:

```bash
git clone https://github.com/fingerskier/pi-plugins.git
cd pi-plugins
pi install ./plugins/terse
pi install ./plugins/cron
```

For one run without adding to settings:

```bash
pi -e ./plugins/terse
```

When individual packages are published to npm, they can also be installed with:

```bash
pi install npm:@fingerskier/pi-plugin-terse
```

## Available Plugins

| Plugin | Resources | Description | Install |
|---|---|---|---|
| [build123d](./plugins/build123d) | extension, skill | CAD modeling with build123d; create, render, inspect, and export 3D models | `pi install ./plugins/build123d` |
| [cron](./plugins/cron) | extension, skill | Schedule one-time and recurring agent jobs and cron-like prompts | `pi install ./plugins/cron` |
| [dude](./plugins/dude) | extension, skills | Local semantic memory and issue/spec tracking | `pi install ./plugins/dude` |
| [email](./plugins/email) | skill | Placeholder skill for IMAP/SMTP email automation design | `pi install ./plugins/email` |
| [fleet](./plugins/fleet) | extension, skill | AWS service inspection for EC2, S3, Lambda, ECS, CloudWatch, CloudFormation, STS | `pi install ./plugins/fleet` |
| [kicad](./plugins/kicad) | extension, skill | KiCad project inspection and fabrication workflows | `pi install ./plugins/kicad` |
| [micropython](./plugins/micropython) | extension, skill | Interact with MicroPython boards over serial | `pi install ./plugins/micropython` |
| [mozart](./plugins/mozart) | extension, skills | MIDI analysis, editing, and composition | `pi install ./plugins/mozart` |
| [terse](./plugins/terse) | prompt, skill | Ultra-compressed communication mode | `pi install ./plugins/terse` |
| [theology](./plugins/theology) | skills | Exegetical theology research skills | `pi install ./plugins/theology` |

## MCP-backed Ports

Pi has no built-in MCP client configuration. MCP-backed ports use `shared/mcp-stdio.ts`, a Pi extension helper that:

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
- `kicad` bundles upstream KiCad MCP `dist/` and expects dependencies to be installed if using a local clone.
- Set `<PLUGIN>_MCP_AUTOLOAD=0` to skip MCP tool discovery during Pi startup and load later via `<prefix>_mcp_status`.

## Catalog

`marketplace.json` lists plugin metadata, upstream Claude source paths, resource types, and local install commands. The schema is documented in `schemas/pi-marketplace.schema.json`.

## Development

```bash
npm install
npm test
```

`npm test` validates the marketplace catalog and typechecks the shared Pi extension bridge plus plugin entrypoints.

## License

[MIT](./LICENSE)
