# MCP Service

Edith exposes KiCad automation as MCP tools, resources, and prompts. Operations use
either `kicad-cli` (stateless, file-based) or the `kicad-python` IPC API (stateful,
requires a running KiCad instance or headless `kicad-cli api-server`). The server
selects the appropriate backend automatically.

All file parameters accept absolute paths or paths relative to the working directory.

---

## Tools

Tools perform actions: verification, exports, board modifications, and session management.

### Verification

| Tool | Description | Backend |
|------|-------------|---------|
| `run_drc` | Run design rule check on a PCB. Returns violations as structured JSON with severity, location, and rule reference. | CLI / IPC |
| `run_erc` | Run electrical rule check on a schematic. Returns violations as structured JSON. | CLI / IPC |

**Parameters (both):**
- `file` (string, required) -- Path to `.kicad_pcb` or `.kicad_sch`
- `format` (enum: `"json" | "report"`, default `"json"`)
- `severity_filter` (enum: `"error" | "warning" | "all"`, default `"all"`)

### Fabrication & Manufacturing Export

| Tool | Description | Backend |
|------|-------------|---------|
| `export_fabrication` | Export a complete fabrication package: Gerbers + drill files + pick-and-place position file. Creates a zip-ready output directory. | CLI / IPC |
| `export_gerbers` | Export Gerber files with layer selection and aperture control. | CLI / IPC |
| `export_drill` | Export Excellon or Gerber X2 drill files. | CLI / IPC |
| `export_position` | Export pick-and-place position files (ASCII/CSV/Gerber). | CLI / IPC |
| `export_bom` | Export bill of materials from schematic with field selection, grouping, and sorting. | CLI |
| `export_netlist` | Export netlist in specified format. | CLI |

**`export_fabrication` parameters:**
- `file` (string, required) -- Path to `.kicad_pcb`
- `output_dir` (string, required) -- Destination directory
- `layers` (string[], optional) -- Layer list override; defaults to all copper + mask + silk + edge
- `drill_format` (enum: `"excellon" | "gerber"`, default `"excellon"`)
- `position_format` (enum: `"ascii" | "csv" | "gerber"`, default `"csv"`)
- `zip` (boolean, default `true`) -- Bundle output into a zip archive

**`export_bom` parameters:**
- `file` (string, required) -- Path to `.kicad_sch`
- `output` (string, required) -- Output file path
- `fields` (string[], optional) -- Fields to include (e.g. `["Reference", "Value", "Footprint", "MPN"]`)
- `group_by` (string[], optional) -- Fields to group by
- `sort_by` (string, optional) -- Field to sort by
- `exclude_dnp` (boolean, default `true`) -- Exclude do-not-populate components

**`export_netlist` parameters:**
- `file` (string, required) -- Path to `.kicad_sch`
- `output` (string, required) -- Output file path
- `format` (enum: `"kicad" | "kicad_xml" | "cadstar" | "orcad" | "spice" | "spice_model" | "pads" | "allegro"`, default `"kicad"`)

### Interchange Format Export

| Tool | Description | Backend |
|------|-------------|---------|
| `export_ipc2581` | Export IPC-2581 file for manufacturing data exchange. | CLI / IPC |
| `export_odb` | Export ODB++ package. | CLI / IPC |
| `export_ipc_d356` | Export IPC-D-356 netlist for electrical test. | CLI / IPC |
| `export_gencad` | Export GenCAD format. | CLI / IPC |

**Common parameters:**
- `file` (string, required) -- Path to `.kicad_pcb`
- `output` (string, required) -- Output file path

### 2D Plotting

| Tool | Description | Backend |
|------|-------------|---------|
| `plot_pcb` | Plot PCB layers to PDF, SVG, DXF, or PostScript. | CLI / IPC |
| `plot_schematic` | Plot schematic sheets to PDF, SVG, DXF, PostScript, or HPGL. | CLI |

**`plot_pcb` parameters:**
- `file` (string, required) -- Path to `.kicad_pcb`
- `output` (string, required) -- Output file path
- `format` (enum: `"pdf" | "svg" | "dxf" | "ps"`, default `"pdf"`)
- `layers` (string[], optional) -- Layers to include; defaults to all visible
- `theme` (string, optional) -- Color theme name
- `mirror` (boolean, default `false`)
- `exclude_dnp` (boolean, default `false`)

**`plot_schematic` parameters:**
- `file` (string, required) -- Path to `.kicad_sch`
- `output` (string, required) -- Output file path
- `format` (enum: `"pdf" | "svg" | "dxf" | "ps" | "hpgl"`, default `"pdf"`)
- `pages` (enum: `"all" | "current"`, default `"all"`)
- `theme` (string, optional) -- Color theme name

### 3D Export & Rendering

| Tool | Description | Backend |
|------|-------------|---------|
| `export_3d` | Export 3D model of the PCB. | CLI / IPC |
| `render_pcb` | Render a raytraced image of the PCB. | CLI / IPC |

**`export_3d` parameters:**
- `file` (string, required) -- Path to `.kicad_pcb`
- `output` (string, required) -- Output file path
- `format` (enum: `"step" | "glb" | "stl" | "ply" | "brep" | "xao" | "vrml"`, default `"step"`)
- `include_tracks` (boolean, default `true`)
- `include_pads` (boolean, default `true`)
- `include_zones` (boolean, default `true`)
- `include_silkscreen` (boolean, default `true`)
- `include_soldermask` (boolean, default `true`)

**`render_pcb` parameters:**
- `file` (string, required) -- Path to `.kicad_pcb`
- `output` (string, required) -- Output image path
- `format` (enum: `"png" | "jpeg"`, default `"png"`)
- `width` (number, default `1600`) -- Image width in pixels
- `height` (number, default `900`) -- Image height in pixels
- `zoom` (number, optional) -- Zoom factor
- `pan_x` (number, optional) -- Horizontal pan offset
- `pan_y` (number, optional) -- Vertical pan offset
- `rotate_x` (number, optional) -- X rotation in degrees
- `rotate_z` (number, optional) -- Z rotation in degrees
- `perspective` (boolean, default `true`)
- `quality` (enum: `"low" | "medium" | "high"`, default `"medium"`)

### Library Operations

| Tool | Description | Backend |
|------|-------------|---------|
| `export_footprint_svg` | Export footprint from a library as SVG. | CLI |
| `export_symbol_svg` | Export symbol from a library as SVG. | CLI |
| `convert_library` | Convert footprint/symbol libraries from foreign formats to KiCad format. | CLI |

**`export_footprint_svg` / `export_symbol_svg` parameters:**
- `library` (string, required) -- Path to library file
- `name` (string, required) -- Footprint or symbol name
- `output` (string, required) -- Output SVG path

**`convert_library` parameters:**
- `input` (string, required) -- Path to source library file
- `output` (string, required) -- Output directory
- `source_format` (enum: `"altium" | "eagle" | "easyeda" | "easyeda_pro" | "cadstar" | "geda"`)
- `type` (enum: `"footprint" | "symbol"`)

### Board Editing (IPC API)

These tools require a running KiCad instance or headless API server.

| Tool | Description | Backend |
|------|-------------|---------|
| `create_board_items` | Create one or more items on the board (footprints, tracks, vias, zones, graphics, text). Accepts an array of item descriptors. | IPC |
| `modify_board_items` | Modify properties of existing board items by reference. | IPC |
| `select_items` | Set or clear the selection in the board editor. | IPC |
| `expand_text_variables` | Expand text variables (e.g., `${REVISION}`, `${DATE}`) in the context of a board. | IPC |

**`create_board_items` parameters:**
- `items` (array, required) -- Array of item descriptors. Each item has:
  - `type` (enum: `"footprint" | "track" | "via" | "zone" | "arc" | "circle" | "rect" | "polygon" | "line" | "text" | "textbox" | "dimension" | "group"`)
  - `properties` (object) -- Type-specific properties (position, layer, width, net, text content, etc.)
- `commit_message` (string, optional) -- Undo label for the transaction

### Board Transactions (IPC API)

| Tool | Description | Backend |
|------|-------------|---------|
| `begin_transaction` | Begin a board edit transaction. Groups subsequent changes into a single undo step. | IPC |
| `commit_transaction` | Push the current transaction; changes become visible and undoable as one step. | IPC |
| `rollback_transaction` | Drop the current transaction, discarding uncommitted changes. | IPC |

### Session Management

| Tool | Description | Backend |
|------|-------------|---------|
| `open_document` | Open a KiCad document (`.kicad_pcb`, `.kicad_sch`, `.kicad_pro`) in the running KiCad instance. | IPC |
| `close_document` | Close a document in KiCad. | IPC |
| `ping` | Check connectivity to KiCad IPC API. Returns version info. | IPC |

### Jobsets

| Tool | Description | Backend |
|------|-------------|---------|
| `run_jobset` | Run a predefined KiCad jobset configuration file. | CLI |

**Parameters:**
- `file` (string, required) -- Path to `.kicad_jobset` file
- `stop_on_error` (boolean, default `true`)
- `destinations` (string[], optional) -- Filter to specific output destinations

---

## Resources

Resources provide read-only access to board data, project metadata, and environment info.
All board/schematic resources use URI templates with the file path as parameter.

### Environment

| Resource | URI | Description |
|----------|-----|-------------|
| Server info | `edith://info` | Server version, KiCad version, available backends (CLI/IPC), KiCad installation path |

### Project

| Resource | URI | Description |
|----------|-----|-------------|
| Project metadata | `edith://project/{file}` | Project title block, text variables, sheet structure, revision info |

### Board (PCB)

| Resource | URI | Description |
|----------|-----|-------------|
| Board summary | `edith://board/{file}` | Board outline dimensions, layer stackup, copper layer count, component/net/track/via/zone counts |
| Footprints | `edith://board/{file}/footprints` | All footprints: reference, value, footprint type, position, rotation, layer, DNP flag |
| Nets | `edith://board/{file}/nets` | Net list with pad connections and net classes |
| Design rules | `edith://board/{file}/design-rules` | Clearances, trace widths, via sizes, diff pair rules |
| Custom DRC rules | `edith://board/{file}/custom-rules` | Custom design rule expressions (`.kicad_dru` content) |
| Layers | `edith://board/{file}/layers` | Enabled layers with names, types, and visibility |
| Graphics defaults | `edith://board/{file}/graphics-defaults` | Default line widths, text sizes, and other drawing defaults |
| Board statistics | `edith://board/{file}/stats` | Area, component density, drill counts, via types |
| Bounding box | `edith://board/{file}/bounds` | Board bounding box and origin coordinates |
| Connectivity | `edith://board/{file}/connectivity/{net}` | Items connected to a specific net: pads, tracks, vias, zones |

### Schematic

| Resource | URI | Description |
|----------|-----|-------------|
| Schematic summary | `edith://schematic/{file}` | Sheet hierarchy, component count, net count, power symbols |

### Libraries

| Resource | URI | Description |
|----------|-----|-------------|
| Footprint libraries | `edith://libraries/footprints` | Available footprint libraries and their paths |
| Symbol libraries | `edith://libraries/symbols` | Available symbol libraries and their paths |

---

## Prompts

Prompts provide guided, multi-step workflows. Each injects context about the target
design and coaches the agent through a structured process.

### `design-review`

Comprehensive design review combining DRC/ERC results with manual checks.

**Parameters:**
- `pcb_file` (string, required) -- Path to `.kicad_pcb`
- `schematic_file` (string, optional) -- Path to `.kicad_sch` for ERC + cross-checking

**Workflow:**
1. Run DRC and ERC, collect violations
2. Read board summary, design rules, and footprint list
3. Check for: unconnected nets, clearance issues, missing courtyard, silkscreen overlap, drill-to-edge distance
4. Check for: bypass capacitors near ICs, appropriate trace widths for power nets, thermal relief on ground planes
5. Summarize findings with severity and actionable recommendations

### `manufacturing-prep`

Guide through preparing a design for PCB fabrication and assembly.

**Parameters:**
- `pcb_file` (string, required) -- Path to `.kicad_pcb`
- `schematic_file` (string, optional) -- Path to `.kicad_sch` for BOM
- `output_dir` (string, required) -- Where to write manufacturing files
- `fab_house` (string, optional) -- Target fabrication house for format preferences (e.g., `"jlcpcb"`, `"oshpark"`, `"pcbway"`)

**Workflow:**
1. Run DRC; block export if errors remain
2. Export fabrication package (Gerbers + drill + position)
3. Export BOM with MPN fields
4. Render top and bottom views for visual sanity check
5. Generate manufacturing notes checklist: layer count, board thickness, surface finish, impedance control requirements
6. Summarize file manifest with sizes and checksums

### `library-conversion`

Guide through converting component libraries from another EDA tool to KiCad format.

**Parameters:**
- `source_path` (string, required) -- Path to source library files
- `source_format` (enum: `"altium" | "eagle" | "easyeda" | "cadstar" | "geda"`)
- `output_dir` (string, required) -- Destination for converted libraries

**Workflow:**
1. Identify source files and their types (schematic symbols, PCB footprints, integrated libraries)
2. Run conversion for each file
3. Export SVGs of converted footprints/symbols for visual verification
4. Report conversion statistics: success count, warnings, failures

### `board-exploration`

Interactively explore and understand an unfamiliar PCB design.

**Parameters:**
- `pcb_file` (string, required) -- Path to `.kicad_pcb`
- `schematic_file` (string, optional) -- Path to `.kicad_sch`

**Workflow:**
1. Read board summary, layer stackup, and design rules
2. List all footprints grouped by type (ICs, passives, connectors, etc.)
3. Identify power nets and their connected components
4. Render a top-view image for visual reference
5. Summarize: board purpose (inferred), key ICs, interface connectors, power architecture

### `3d-model-export`

Guide through exporting 3D models for mechanical integration or visualization.

**Parameters:**
- `pcb_file` (string, required) -- Path to `.kicad_pcb`
- `purpose` (enum: `"mechanical_integration" | "visualization" | "simulation"`)

**Workflow:**
1. For mechanical integration: export STEP with all components, recommend import settings for CAD tools
2. For visualization: export GLB for web viewers or render high-quality raytraced images from multiple angles
3. For simulation: export BREP/XAO for FEA/thermal tools, or VRML for electromagnetic simulation
4. List any footprints missing 3D models
