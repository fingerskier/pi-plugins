---
name: skidl
description: Design electronic schematics and PCB netlists from Pi using SKiDL. Use for circuit creation, KiCad library parts, nets/buses, ERC, BOMs, SVG schematics, KiCad schematic export, and standalone SKiDL Python.
---

# SKiDL Circuit Design Skill

Use the `skidl_*` Pi tools exposed by this package. They bridge the upstream SKiDL MCP server for programmatic electronic schematic design.

## Workflow

1. Create or select a circuit with `skidl_create_circuit`, `skidl_list_circuits`, and `skidl_switch_circuit`.
2. Search and add parts with `skidl_search_parts` and `skidl_add_part`. Prefer explicit values, references, and footprints.
3. Create nets/buses with `skidl_create_net`, `skidl_add_power_nets`, `skidl_create_bus`, then wire pins with `skidl_connect` or `skidl_connect_pins`.
4. Inspect with `skidl_get_circuit_info`, `skidl_list_parts`, `skidl_get_part_info`, and `skidl_list_nets`.
5. Validate before handoff with `skidl_check_connections`, `skidl_run_erc`, and `skidl_validate_footprints`.
6. Generate outputs with `skidl_generate_bom`, `skidl_generate_netlist`, `skidl_generate_svg`, `skidl_generate_kicad_schematic`, or `skidl_export_python`.

## Setup

- Python 3.10+ must be available as `python` or via `SKIDL_PYTHON`.
- KiCad should be installed for symbol libraries and footprint names.
- The first tool load creates a venv under `~/.pi/agent/data/skidl/venv`; override with `SKIDL_PI_DATA`.
- Set `SKIDL_MCP_AUTOLOAD=0` to defer server startup until `skidl_mcp_status`.

## Prompt Templates

This package includes Pi prompt templates for common designs, all prefixed with `skidl-`, including voltage dividers, amplifiers, filters, power supplies, MCU support circuits, buses, motor drivers, USB interfaces, and RF matching.

## Safety

Ask before writing or overwriting project files. Confirm footprints, connector pinouts, voltage/current ratings, thermal margins, and regulatory/safety constraints against datasheets before fabrication. Run ERC/footprint validation after generated changes when possible.
