# SKiDL Pi Plugin

Pi package port of [`skidl-claude-plugin`](https://github.com/fingerskier/skidl-claude-plugin).

This package bundles the upstream Python MCP server source and a Pi extension that exposes its circuit-design tools with a `skidl_` prefix. The first MCP start creates a private venv under `~/.pi/agent/data/skidl/venv`, installs this package into it, then runs `skidl-mcp`.

## Install

```bash
pi install npm:@fingerskier/pi-skidl
# local workspace clone
pi install ./packages/pi-skidl
# one run only
pi -e npm:@fingerskier/pi-skidl
```

Host requirements: Python 3.10+ available as `python` (or set `SKIDL_PYTHON`) and KiCad installed for symbol libraries.

## Tools

Run `skidl_mcp_status` in Pi to list loaded tools. Expected tools include:

- `skidl_create_circuit`, `skidl_list_circuits`, `skidl_switch_circuit`
- `skidl_add_part`, `skidl_search_parts`, `skidl_list_parts`, `skidl_get_part_info`
- `skidl_create_net`, `skidl_connect`, `skidl_connect_pins`, `skidl_create_bus`
- `skidl_run_erc`, `skidl_check_connections`, `skidl_validate_footprints`
- `skidl_generate_netlist`, `skidl_generate_svg`, `skidl_generate_bom`, `skidl_generate_kicad_schematic`, `skidl_export_python`

## Configuration

- `SKIDL_MCP_AUTOLOAD=0` disables startup MCP discovery.
- `SKIDL_PI_DATA=/path/to/data` controls the venv/cache directory.
- `SKIDL_PYTHON=python3` selects the Python executable.
- `SKIDL_MCP_COMMAND=/path/to/skidl-mcp` runs an external server instead of the bundled launcher.
- `SKIDL_MCP_ARGS="..."` passes extra arguments to the launcher or command override.

## Skills and Prompts

- `/skill:skidl` loads circuit-design workflow guidance.
- Prompt templates such as `/skidl-voltage-divider`, `/skidl-power-supply`, `/skidl-microcontroller`, and `/skidl-usb-interface` mirror the upstream design templates.

## Upstream Notes

See [`README.upstream.md`](./README.upstream.md) for the original Claude plugin documentation.
