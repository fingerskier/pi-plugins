# build123d Pi Plugin

Pi package port of [`build123d-claude-plugin`](https://github.com/fingerskier/build123d-claude-plugin).

This package bundles the upstream Python MCP server source and a Pi extension that exposes its tools with a `build123d_` prefix. The first MCP start creates a private venv under `~/.pi/agent/data/build123d/venv`, installs this package into it, then runs `build123d-mcp`.

## Install

```bash
pi install ./plugins/build123d
# or one run only
pi -e ./plugins/build123d
```

Host requirement: Python 3.10+ available as `python` (or set `BUILD123D_PYTHON`).

## Tools

Run `build123d_mcp_status` in Pi to list loaded tools. Expected tools include:

- `build123d_execute_build123d`
- `build123d_export_stl`
- `build123d_export_step`
- `build123d_render_image`
- `build123d_list_models`
- `build123d_get_model_info`
- `build123d_delete_model`

## Configuration

- `BUILD123D_MCP_AUTOLOAD=0` disables startup MCP discovery.
- `BUILD123D_OUTPUT_DIR=./cad-output` controls export/render output.
- `BUILD123D_PI_DATA=/path/to/data` controls the venv/cache directory.
- `BUILD123D_PYTHON=python3` selects the Python executable.

## Skill and Reference

- `/skill:build123d` loads CAD workflow guidance.
- `docs/BUILD123D_REFERENCE.md` is copied from the upstream Claude guide.

## Upstream Notes

See [`README.upstream.md`](./README.upstream.md) for the original Claude plugin documentation.
