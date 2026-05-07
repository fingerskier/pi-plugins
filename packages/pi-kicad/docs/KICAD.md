# KiCad Automation

## `kicad-cli` — Command Reference

The CLI has 6 top-level subcommands: `fp`, `jobset`, `pcb`, `sch`, `sym`, and `version`.

### PCB Commands

The largest command surface.

- **DRC** — Run design rule checks; output as report or JSON with exit codes for CI
- **Fabrication exports:**
  - Gerbers (single-layer or multi-layer per file)
  - Excellon/Gerber drill files
  - Pick-and-place position files (ASCII/CSV/Gerber)
  - IPC-2581, IPC-D-356 netlist, ODB++, GenCAD
- **2D plotting:** PDF (single/multi-page/separate files), SVG, DXF, PostScript — with layer selection, theme support, DNP handling
- **3D model exports:** STEP, GLB (binary glTF), STL, PLY, BREP (OCCT native), XAO (SALOME/Gmsh), VRML — with granular control over tracks, pads, zones, silkscreen, and soldermask inclusion
- **Rendering:** Raytraced PNG/JPEG renders with camera control (zoom, pan, rotate, perspective), lighting, and quality presets

### Schematic Commands

- **ERC** — Electrical rule check with JSON output
- **BOM export** — Field selection, grouping, sorting, filtering, delimiter control
- **Netlist export** — Formats: KiCad S-expr, KiCad XML, CADSTAR, OrCAD PCB2, SPICE, SPICE model, PADS, Allegro
- **Plotting:** PDF, SVG, DXF, PostScript, HPGL (pen plotter)

### Footprint & Symbol Commands

- **SVG export** from libraries
- **Format upgrade** — Converts from legacy KiCad, Altium (`.SchLib`/`.PcbLib`/`.IntLib`), CADSTAR, Eagle XML, EasyEDA/JLCEDA Std/Pro, GEDA/PCB

### Jobsets

Run predefined job configurations with `--stop-on-error` and destination filtering — the CI/CD hook.

---

## `kicad-python` — IPC API Reference

Official Python bindings (`pip install kicad-python`).

### Connection & Documents (`KiCad` class)

- `ping()`, `get_version()`
- `get_board()`, `get_project()`, `get_open_documents()`
- `open_document()`, `close_document()`
- `run_action()`, `get_text_extents()`, `get_text_as_shapes()`

Supports both GUI mode and headless mode via `kicad-cli api-server` (KiCad 11+).

### Board (`Board` class)

The richest API surface.

#### Query / Read

- `get_footprints()`, `get_dimensions()`, `get_groups()`, `get_barcodes()`
- `get_connected_items()`, `get_enabled_layers()`, `get_copper_layer_count()`
- `get_design_rules()`, `get_custom_design_rules()`, `get_graphics_defaults()`
- `get_editor_appearance_settings()`, `get_active_layer()`, `get_as_string()`
- `get_item_bounding_box()`, `check_padstack_presence_on_layers()` — spatial queries
- Accessible items: tracks, vias, pads, footprints, zones, graphics, text, dimensions, groups, barcodes

#### Modify / Write

- `create_items()`, `add_to_selection()`, `clear_selection()`, `expand_text_variables()`

#### Transactions

- `begin_commit()` / `push_commit()` / `drop_commit()`
- Groups changes into single undo steps; changes appear live in the editor only on push

#### Export (KiCad 11+, available via IPC API)

- `export_gerbers()`, `export_drill()`, `export_pdf()`, `export_svg()`, `export_dxf()`
- `export_3d()`, `export_render()`, `export_position()`
- `export_ipc2581()`, `export_ipc_d356()`, `export_odb()`, `export_gencad()`
- `export_ps()`, `export_stats()`

### Common Types

Geometry primitives: `Arc`, `Bezier`, `Circle`, `Polygon`, `Rectangle`, `Segment`, `CompoundShape`, `Text`, `TextBox`

Plus: `GraphicAttributes` (stroke/fill), `Color`, `LibraryIdentifier`, `TitleBlockInfo`, `SheetPath`

### Project

Project-level metadata access.

### Geometry Utilities

`Vector2`, `Box2`, `PolygonWithHoles`, unit conversion.
