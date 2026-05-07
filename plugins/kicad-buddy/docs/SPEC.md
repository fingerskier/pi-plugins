# Implementation Spec

Edith is a stdio MCP server that wraps KiCad automation as tools, resources, and
prompts (defined in [MCP.md](MCP.md)). It uses two backends — `kicad-cli` for stateless
file-based operations and `kicad-python` IPC API for live board editing — and selects
the appropriate one automatically.

---

## Tech Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Runtime | Node.js (ES2022, ESM) | Matches Wright pattern; `tsx` for dev |
| Language | TypeScript (strict) | Type safety for tool schemas |
| MCP SDK | `@modelcontextprotocol/sdk` | Official MCP SDK, stdio transport |
| Validation | `zod` | Tool parameter schemas (SDK convention) |
| CLI execution | `execa` | Spawn `kicad-cli` subprocesses with timeout/abort |
| IPC client | `kicad-python` via child process | Spawn Python bridge for IPC API calls |
| Config | Environment variables | `KICAD_PATH`, `KICAD_API_PORT` |

No database — Edith is stateless. It operates on files the caller points it at.

---

## Project Structure

```
edith/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Server bootstrap, transport setup
│   ├── backends/
│   │   ├── types.ts          # Shared backend interfaces
│   │   ├── cli.ts            # kicad-cli wrapper (spawn + parse)
│   │   ├── ipc.ts            # kicad-python IPC bridge
│   │   └── select.ts         # Backend selection logic
│   ├── tools/
│   │   ├── verification.ts   # run_drc, run_erc
│   │   ├── fabrication.ts    # export_fabrication, export_gerbers, export_drill, export_position, export_bom, export_netlist
│   │   ├── interchange.ts    # export_ipc2581, export_odb, export_ipc_d356, export_gencad
│   │   ├── plotting.ts       # plot_pcb, plot_schematic
│   │   ├── models.ts         # export_3d, render_pcb
│   │   ├── library.ts        # export_footprint_svg, export_symbol_svg, convert_library
│   │   ├── board-edit.ts     # create_board_items, modify_board_items, select_items, expand_text_variables
│   │   ├── transactions.ts   # begin_transaction, commit_transaction, rollback_transaction
│   │   ├── session.ts        # open_document, close_document, ping
│   │   └── jobsets.ts        # run_jobset
│   ├── resources/
│   │   ├── environment.ts    # edith://info
│   │   ├── project.ts        # edith://project/{file}
│   │   ├── board.ts          # edith://board/{file}/** (10 resources)
│   │   ├── schematic.ts      # edith://schematic/{file}
│   │   └── libraries.ts      # edith://libraries/**
│   └── prompts/
│       ├── design-review.ts
│       ├── manufacturing-prep.ts
│       ├── library-conversion.ts
│       ├── board-exploration.ts
│       └── model-export.ts
└── bridge/
    └── ipc_bridge.py         # Python script: stdin JSON-RPC → kicad-python → stdout JSON
```

### Registration Pattern

Each module exports a `register(server: McpServer)` function. The entry point imports
and calls them all:

```typescript
// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { registerVerification } from "./tools/verification.js"
import { registerFabrication } from "./tools/fabrication.js"
// ... etc

const server = new McpServer({ name: "edith", version: "1.0.0" })

registerVerification(server)
registerFabrication(server)
// ... etc

const transport = new StdioServerTransport()
await server.connect(transport)
```

---

## Backends

### `kicad-cli` (CLI backend)

Wraps the `kicad-cli` binary. Every operation is a subprocess spawn.

```typescript
// src/backends/cli.ts
interface CliOptions {
  args: string[]
  timeout?: number   // default 60s
  cwd?: string
}

async function runKicadCli(options: CliOptions): Promise<CliResult>
```

**Path resolution:** `KICAD_PATH` env var points to the KiCad installation directory.
The CLI binary is at `${KICAD_PATH}/bin/kicad-cli` (Linux/Mac) or
`${KICAD_PATH}/bin/kicad-cli.exe` (Windows). Auto-detect from common install paths
as fallback.

**Error handling:** Parse stderr for error messages. Non-zero exit codes become MCP
error responses with the CLI output included.

**Timeout:** Default 60s, overridable per-call. 3D exports and renders may need longer
(up to 300s).

### `kicad-python` IPC (IPC backend)

The IPC API requires a running KiCad instance or headless `kicad-cli api-server`.
Edith communicates with `kicad-python` through a Python bridge subprocess.

```
Edith (Node) ←JSON-RPC over stdio→ ipc_bridge.py ←kicad-python→ KiCad IPC API
```

**Bridge protocol:** Newline-delimited JSON on stdin/stdout. Each request is:
```json
{"id": 1, "method": "board.get_footprints", "params": {"file": "/path/to.kicad_pcb"}}
```
Response:
```json
{"id": 1, "result": [...]}
```
or
```json
{"id": 1, "error": {"code": -1, "message": "..."}}
```

**Lifecycle:** The bridge process is spawned lazily on first IPC tool/resource call
and kept alive for the session. A ping is sent to verify connectivity.

**Fallback:** If the bridge fails to connect (no KiCad running, no api-server), IPC-only
tools return an error explaining what's needed. Dual-backend tools fall back to CLI.

### Backend Selection

```typescript
// src/backends/select.ts
type Backend = "cli" | "ipc" | "cli_preferred" | "ipc_preferred"

// Tools declare their backend preference:
//   "cli"            — CLI only (export_bom, export_netlist, convert_library, etc.)
//   "ipc"            — IPC only (board editing, transactions, session management)
//   "cli_preferred"  — CLI default, IPC if available (most export tools)
//   "ipc_preferred"  — IPC default, CLI fallback (verification, plotting)

async function selectBackend(preference: Backend): Promise<"cli" | "ipc">
```

The selection function checks IPC availability (cached after first check, refreshed
on ping failure) and resolves the preference to a concrete backend.

---

## Tool Implementation Map

How each tool maps to underlying KiCad commands.

### Verification

| Tool | CLI command | IPC method |
|------|------------|------------|
| `run_drc` | `kicad-cli pcb drc --format json <file>` | `board.run_drc()` (KiCad 11+) |
| `run_erc` | `kicad-cli sch erc --format json <file>` | — |

### Fabrication & Manufacturing

| Tool | CLI command | IPC method |
|------|------------|------------|
| `export_fabrication` | Orchestrates: `pcb export gerbers` + `pcb export drill` + `pcb export pos` | Orchestrates IPC equivalents |
| `export_gerbers` | `kicad-cli pcb export gerbers` | `board.export_gerbers()` |
| `export_drill` | `kicad-cli pcb export drill` | `board.export_drill()` |
| `export_position` | `kicad-cli pcb export pos` | `board.export_position()` |
| `export_bom` | `kicad-cli sch export bom` | — |
| `export_netlist` | `kicad-cli sch export netlist --format <fmt>` | — |

### Interchange Formats

| Tool | CLI command | IPC method |
|------|------------|------------|
| `export_ipc2581` | `kicad-cli pcb export ipc2581` | `board.export_ipc2581()` |
| `export_odb` | `kicad-cli pcb export odb` | `board.export_odb()` |
| `export_ipc_d356` | `kicad-cli pcb export ipcd356` | `board.export_ipc_d356()` |
| `export_gencad` | `kicad-cli pcb export gencad` | `board.export_gencad()` |

### Plotting

| Tool | CLI command | IPC method |
|------|------------|------------|
| `plot_pcb` | `kicad-cli pcb export pdf/svg/dxf/ps` | `board.export_pdf()` etc. |
| `plot_schematic` | `kicad-cli sch export pdf/svg/dxf/ps/hpgl` | — |

### 3D & Rendering

| Tool | CLI command | IPC method |
|------|------------|------------|
| `export_3d` | `kicad-cli pcb export step/glb/stl/ply/brep/xao/vrml` | `board.export_3d()` |
| `render_pcb` | `kicad-cli pcb render --format png/jpeg` | `board.export_render()` |

### Library

| Tool | CLI command |
|------|------------|
| `export_footprint_svg` | `kicad-cli fp export svg` |
| `export_symbol_svg` | `kicad-cli sym export svg` |
| `convert_library` | `kicad-cli fp/sym upgrade --from <format>` |

### Board Editing (IPC only)

| Tool | IPC method |
|------|------------|
| `create_board_items` | `board.create_items()` inside begin/push commit |
| `modify_board_items` | `board.create_items()` with modify semantics |
| `select_items` | `board.add_to_selection()` / `board.clear_selection()` |
| `expand_text_variables` | `board.expand_text_variables()` |

### Transactions (IPC only)

| Tool | IPC method |
|------|------------|
| `begin_transaction` | `board.begin_commit()` |
| `commit_transaction` | `board.push_commit()` |
| `rollback_transaction` | `board.drop_commit()` |

### Session (IPC only)

| Tool | IPC method |
|------|------------|
| `open_document` | `kicad.open_document()` |
| `close_document` | `kicad.close_document()` |
| `ping` | `kicad.ping()` + `kicad.get_version()` |

### Jobsets (CLI only)

| Tool | CLI command |
|------|------------|
| `run_jobset` | `kicad-cli jobset run <file>` |

---

## Resource Implementation Map

Resources query data without side effects. Most use the IPC backend when available
and fall back to parsing KiCad files directly (S-expression format) via CLI.

| Resource | Primary source | Fallback |
|----------|---------------|----------|
| `edith://info` | CLI version + IPC ping | CLI only |
| `edith://project/{file}` | Parse `.kicad_pro` JSON | — |
| `edith://board/{file}` | IPC `board.get_*()` | Parse `.kicad_pcb` S-expr header |
| `edith://board/{file}/footprints` | IPC `board.get_footprints()` | Parse S-expr |
| `edith://board/{file}/nets` | IPC `board.get_connected_items()` | Parse S-expr |
| `edith://board/{file}/design-rules` | IPC `board.get_design_rules()` | Parse S-expr |
| `edith://board/{file}/custom-rules` | Read `.kicad_dru` file | — |
| `edith://board/{file}/layers` | IPC `board.get_enabled_layers()` | Parse S-expr |
| `edith://board/{file}/graphics-defaults` | IPC `board.get_graphics_defaults()` | Parse S-expr |
| `edith://board/{file}/stats` | IPC `board.export_stats()` | Compute from S-expr |
| `edith://board/{file}/bounds` | IPC `board.get_item_bounding_box()` | Parse S-expr |
| `edith://board/{file}/connectivity/{net}` | IPC `board.get_connected_items()` | — (IPC only) |
| `edith://schematic/{file}` | Parse `.kicad_sch` S-expr | — |
| `edith://libraries/footprints` | Scan `KICAD_PATH` library dirs | — |
| `edith://libraries/symbols` | Scan `KICAD_PATH` library dirs | — |

### S-Expression Parser

KiCad files (`.kicad_pcb`, `.kicad_sch`, `.kicad_pro`) use S-expression format.
A lightweight parser is needed for CLI-only fallback mode. This doesn't need to
understand the full KiCad schema — just enough to extract the fields exposed by
resources (footprint list, net names, design rules, layers, board outline).

```typescript
// src/util/sexpr.ts
function parseSExpr(input: string): SExprNode[]
function findNodes(tree: SExprNode[], path: string[]): SExprNode[]
```

The `.kicad_pro` file is plain JSON, no S-expr parsing needed.

---

## Prompt Implementation

Prompts return structured messages that guide the agent through multi-step workflows.
Each prompt composes tool calls and resource reads into a sequence.

| Prompt | Injects context from | Guides agent to call |
|--------|---------------------|---------------------|
| `design-review` | `edith://board/{file}`, `edith://board/{file}/design-rules`, `edith://board/{file}/footprints` | `run_drc`, `run_erc`, then manual checks |
| `manufacturing-prep` | `edith://board/{file}` | `run_drc` → `export_fabrication` → `export_bom` → `render_pcb` |
| `library-conversion` | — | `convert_library` → `export_footprint_svg` / `export_symbol_svg` |
| `board-exploration` | `edith://board/{file}`, `edith://board/{file}/footprints`, `edith://board/{file}/nets` | `render_pcb` |
| `3d-model-export` | `edith://board/{file}` | `export_3d` and/or `render_pcb` |

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KICAD_PATH` | Yes | KiCad installation directory |
| `KICAD_API_HOST` | No | IPC API host (default `localhost`) |
| `KICAD_API_PORT` | No | IPC API port (default `2024`) |
| `EDITH_CLI_TIMEOUT` | No | Default CLI timeout in ms (default `60000`) |
| `EDITH_LOG_LEVEL` | No | `error` / `warn` / `info` / `debug` (default `warn`) |

### MCP Client Configuration

```json
{
  "mcpServers": {
    "edith": {
      "command": "npx",
      "args": ["edith"],
      "env": {
        "KICAD_PATH": "/usr/lib/kicad"
      }
    }
  }
}
```

Development:
```json
{
  "mcpServers": {
    "edith": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/path/to/edith",
      "env": {
        "KICAD_PATH": "/usr/lib/kicad"
      }
    }
  }
}
```

---

## Error Handling

All errors return MCP-compliant responses with `isError: true`:

```typescript
return {
  content: [{ type: "text", text: `Error: ${message}` }],
  isError: true,
}
```

**Error categories:**
- **File not found** — KiCad file doesn't exist at the given path
- **Backend unavailable** — IPC-only tool called without KiCad running
- **CLI failure** — Non-zero exit code; include stderr in response
- **Timeout** — CLI command exceeded timeout; suggest increasing `EDITH_CLI_TIMEOUT`
- **IPC error** — Bridge returned error; include kicad-python error message

---

## Package Configuration

```json
{
  "name": "edith",
  "version": "0.1.0",
  "type": "module",
  "bin": { "edith": "./dist/index.js" },
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "execa": "^9.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^3.0.0"
  }
}
```

---

## Implementation Order

Build in layers, each independently testable:

### Phase 1 — Skeleton + CLI backend
1. `package.json`, `tsconfig.json`, project scaffolding
2. `src/index.ts` — server bootstrap with stdio transport
3. `src/backends/cli.ts` — kicad-cli subprocess wrapper
4. `src/backends/select.ts` — backend selection (CLI-only initially)
5. `src/tools/verification.ts` — `run_drc`, `run_erc` (validates CLI backend works)
6. `src/resources/environment.ts` — `edith://info` (validates resource registration)

**Milestone:** Server starts, `run_drc` returns JSON results, `edith://info` returns KiCad version.

### Phase 2 — Export tools (CLI)
7. `src/tools/fabrication.ts` — all 6 fabrication/manufacturing tools
8. `src/tools/interchange.ts` — 4 interchange format tools
9. `src/tools/plotting.ts` — `plot_pcb`, `plot_schematic`
10. `src/tools/models.ts` — `export_3d`, `render_pcb`
11. `src/tools/library.ts` — `export_footprint_svg`, `export_symbol_svg`, `convert_library`
12. `src/tools/jobsets.ts` — `run_jobset`

**Milestone:** All CLI-backed tools operational. Can export gerbers, plot schematics, render 3D.

### Phase 3 — Resources (file parsing)
13. `src/util/sexpr.ts` — S-expression parser
14. `src/resources/project.ts` — parse `.kicad_pro` JSON
15. `src/resources/board.ts` — 10 board resources via S-expr parsing
16. `src/resources/schematic.ts` — schematic summary via S-expr parsing
17. `src/resources/libraries.ts` — scan KiCad library directories

**Milestone:** All resources return data from KiCad files without IPC.

### Phase 4 — IPC backend
18. `bridge/ipc_bridge.py` — Python bridge script
19. `src/backends/ipc.ts` — Node-side IPC client (spawn bridge, JSON-RPC)
20. Update `src/backends/select.ts` — IPC availability detection + preference resolution
21. `src/tools/board-edit.ts` — `create_board_items`, `modify_board_items`, `select_items`, `expand_text_variables`
22. `src/tools/transactions.ts` — `begin_transaction`, `commit_transaction`, `rollback_transaction`
23. `src/tools/session.ts` — `open_document`, `close_document`, `ping`
24. Upgrade existing tools/resources to prefer IPC when available

**Milestone:** Full IPC support. Board editing works against running KiCad instance.

### Phase 5 — Prompts
25. `src/prompts/design-review.ts`
26. `src/prompts/manufacturing-prep.ts`
27. `src/prompts/library-conversion.ts`
28. `src/prompts/board-exploration.ts`
29. `src/prompts/model-export.ts`

**Milestone:** All 5 prompts registered and returning structured workflow guidance.

### Phase 6 — Polish
30. CI-friendly error messages and exit codes
31. Windows path handling (backslash normalization, `.exe` suffix)
32. npm publish config (`bin`, `files`, `engines`)

---

## Testing Strategy

**Unit tests** (`vitest`):
- S-expression parser against real KiCad file fragments
- CLI argument builder functions (assert correct flag ordering)
- Backend selection logic (mock IPC availability)

**Integration tests** (require `kicad-cli` installed):
- Run `run_drc` against a test `.kicad_pcb` fixture
- Export gerbers and verify output files exist
- Plot schematic to PDF and verify non-empty output
- Read resources from a test project

**Test fixtures:**
- `test/fixtures/test-project.kicad_pro` — minimal KiCad project
- `test/fixtures/test-board.kicad_pcb` — simple 2-layer board with a few components
- `test/fixtures/test-schematic.kicad_sch` — matching schematic

**IPC tests** (require running KiCad or headless api-server):
- Marked as `skip` by default; enabled via `EDITH_TEST_IPC=1`
- Ping, open document, read footprints, create item, rollback
