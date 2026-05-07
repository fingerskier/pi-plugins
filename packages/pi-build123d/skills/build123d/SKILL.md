---
name: build123d
description: CAD modeling with build123d from Pi. Use when creating, inspecting, rendering, or exporting parametric 3D models, STL files, STEP files, enclosures, brackets, and other mechanical parts.
---

# build123d CAD Skill

Use the `build123d_*` Pi tools exposed by this package. They bridge the upstream build123d MCP server.

## Workflow

1. Read `docs/BUILD123D_REFERENCE.md` when you need API details.
2. Create or edit build123d Python code.
3. Call `build123d_execute_build123d` with code and a `model_name`.
4. Inspect with `build123d_get_model_info` or `build123d_list_models`.
5. Render with `build123d_render_image` when visual confirmation helps.
6. Export with `build123d_export_stl` for printing or `build123d_export_step` for CAD interchange.

## Safety

The upstream executor validates AST and blocks dangerous builtins/imports. Do not attempt to bypass those guardrails. Keep generated files under the configured output directory (`BUILD123D_OUTPUT_DIR`, default `./cad-output`).
