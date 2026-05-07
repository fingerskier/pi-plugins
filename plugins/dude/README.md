# Dude Pi Plugin

Pi package port of [`dude-claude-plugin`](https://github.com/fingerskier/dude-claude-plugin).

Dude is local semantic memory and issue/spec tracking. This Pi version starts the upstream Dude MCP server with `npx -y dude-claude-plugin mcp` and exposes its tools in Pi with a `dude_` prefix. Claude skills were copied and rewritten to reference Pi tool names.

> If you use hosted Reqall memory, prefer `@reqall/pi-plugin`. This package preserves the local Dude workflow.

## Install

```bash
pi install ./plugins/dude
# or one run only
pi -e ./plugins/dude
```

## Tools

Run `dude_mcp_status` in Pi to list loaded tools. Tool names are prefixed, e.g. `dude_search`, `dude_upsert_record`, `dude_list_records`.

## Configuration

- `DUDE_MCP_AUTOLOAD=0` disables startup MCP discovery.
- `DUDE_MCP_COMMAND=/path/to/server` overrides `npx`.

## Skills

Copied Pi skills:

- `/skill:issues`
- `/skill:projects`
- `/skill:review-issues`
- `/skill:review-spec`
- `/skill:specifications`
