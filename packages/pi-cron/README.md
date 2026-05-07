# Cron Pi Plugin

Pi package port of the legacy [`dex-claude-plugin`](https://github.com/fingerskier/dex-claude-plugin), renamed for Pi as `cron`.

Cron schedules one-time or recurring agent jobs. This Pi version registers a TypeScript extension that starts the upstream scheduler MCP stdio server with `npx -y dex-claude-plugin` and exposes its tools in Pi with a `cron_` prefix and Cron-oriented aliases.

## Install

```bash
pi install npm:@fingerskier/pi-cron
# local workspace clone
pi install ./packages/pi-cron
# one run only
pi -e npm:@fingerskier/pi-cron
```

## Tools

Run `cron_mcp_status` in Pi to list loaded tools. Expected tools include:

- `cron_add_job`
- `cron_remove_job`
- `cron_list_jobs`
- `cron_run_jobs`
- `cron_complete_job`

## Configuration

- `CRON_MCP_AUTOLOAD=0` disables startup MCP discovery.
- `CRON_MCP_COMMAND=/path/to/server` overrides `npx` (no args unless your command handles them).
- `DEX_MCP_COMMAND` is accepted as a legacy fallback override during migration.

## Skill

`/skill:cron` loads scheduling workflow guidance.
