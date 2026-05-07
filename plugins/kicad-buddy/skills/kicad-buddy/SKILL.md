---
name: kicad-buddy
description: Inspect and automate KiCad projects from Pi. Use for schematic/PCB queries, DRC/ERC, fabrication outputs, plots, 3D model export, footprints, symbols, and KiCad IPC or kicad-cli workflows.
---

# KiCad Buddy Skill

Use `kicad_*` Pi tools exposed by this package. They bridge the upstream KiCad Buddy MCP server.

## Setup

- KiCad must be installed.
- Set `KICAD_PATH` when your platform requires it.
- Open or point the tool at a KiCad project before project-specific operations.

## Safety

Ask before modifying schematic/board files, libraries, footprints, or project settings. Prefer query/validation tools before edits. Run DRC/ERC after generated changes when possible.

## References

Detailed upstream notes are bundled under `docs/` and `README.upstream.md`.
