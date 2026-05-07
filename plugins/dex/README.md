# Dex Pi Plugin

Pi package port of [`dex-claude-plugin`](https://github.com/fingerskier/dex-claude-plugin).

Dex schedules recurring agent jobs. This Pi version registers a TypeScript extension that starts the upstream Dex MCP stdio server with `npx -y dex-claude-plugin` and exposes its tools in Pi with a `dex_` prefix.

## Install

```bash
pi install ./plugins/dex
# or one run only
pi -e ./plugins/dex
```

## Tools

Run `dex_mcp_status` in Pi to list loaded tools. Expected tools include:

- `dex_add_dex_job`
- `dex_remove_dex_job`
- `dex_list_dex_jobs`
- `dex_run_dex_jobs`
- `dex_complete_dex_job`

## Configuration

- `DEX_MCP_AUTOLOAD=0` disables startup MCP discovery.
- `DEX_MCP_COMMAND=/path/to/server` overrides `npx` (no args unless your command handles them).

## Skill

`/skill:dex` loads scheduling workflow guidance.
