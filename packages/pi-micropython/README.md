# MicroPython Pi Plugin

Pi package port of [`micropython-claude-plugin`](https://github.com/fingerskier/micropython-claude-plugin).

This package bundles the upstream Python MCP server source and a Pi extension that exposes its tools with a `micropython_` prefix. The first MCP start creates a private venv under `~/.pi/agent/data/micropython/venv`, installs this package into it, then runs `micropython-claude`.

## Install

```bash
pi install npm:@fingerskier/pi-micropython
# local workspace clone
pi install ./packages/pi-micropython
# one run only
pi -e npm:@fingerskier/pi-micropython
```

Host requirement: Python 3.10+ available as `python` (or set `MICROPYTHON_PYTHON`).

## Tools

Run `micropython_mcp_status` in Pi to list loaded tools. Expected groups include connection, file operations, image backup/restore, and execution/REPL tools.

## Configuration

- `MICROPYTHON_MCP_AUTOLOAD=0` disables startup MCP discovery.
- `MICROPYTHON_PI_DATA=/path/to/data` controls the venv/cache directory.
- `MICROPYTHON_PYTHON=python3` selects the Python executable.
- `MICROPYTHON_MCP_ARGS='--port COM4 --baudrate 115200'` passes server args.

## Skill

`/skill:micropython` loads device workflow and safety guidance.

## Safety

Tools affect physical devices. Confirm before deleting files, overwriting firmware/filesystems, pushing images, or resetting hardware.

## Upstream Notes

See [`README.upstream.md`](./README.upstream.md) for the original Claude plugin documentation.
