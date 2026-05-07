# KiCad Pi Plugin

Pi package port of the `../Claude/kicad_buddy` MCP service, renamed for Pi as `kicad`.

This package bundles the upstream built JavaScript server (`dist/`) and a Pi extension that exposes its tools with a `kicad_` prefix.

## Install

```bash
pi install ./plugins/kicad
# or one run only
pi -e ./plugins/kicad
```

If installing from a local clone and dependencies are missing, run:

```bash
cd plugins/kicad
npm install --omit=dev
```

## Requirements

- Node.js 20+
- KiCad installed
- `KICAD_PATH` set when your platform requires it

## Tools

Run `kicad_mcp_status` in Pi to list loaded tools.

## Configuration

- `KICAD_MCP_AUTOLOAD=0` disables startup MCP discovery.
- `KICAD_MCP_COMMAND=/path/to/server` overrides `node dist/index.js`.
- `KICAD_MCP_ARGS='...'` appends or supplies server args.
- Legacy `KICAD_BUDDY_MCP_COMMAND` and `KICAD_BUDDY_MCP_ARGS` are accepted as migration fallbacks.

## Skill and References

- `/skill:kicad` loads workflow and safety guidance.
- Upstream docs are bundled under `docs/` and `README.upstream.md`.
