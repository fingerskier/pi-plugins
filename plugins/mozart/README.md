# Mozart Pi Plugin

Pi package port of [`mozart-claude-plugin`](https://github.com/fingerskier/mozart-claude-plugin).

Mozart loads, inspects, edits, composes, and saves MIDI files. This Pi version starts the upstream Mozart MCP stdio server with `npx -y mozart-claude-plugin mcp` and exposes its tools in Pi with a `mozart_` prefix. Claude skills were copied and rewritten to reference Pi tool names.

## Install

```bash
pi install ./plugins/mozart
# or one run only
pi -e ./plugins/mozart
```

## Tools

Run `mozart_mcp_status` in Pi to list loaded tools. Expected tools include `mozart_load_midi`, `mozart_midi_info`, `mozart_get_measures`, `mozart_create_midi`, and `mozart_save_midi`.

## Configuration

- `MOZART_MCP_AUTOLOAD=0` disables startup MCP discovery.
- `MOZART_MCP_COMMAND=/path/to/server` overrides `npx`.

## Skills

- `/skill:play`
- `/skill:compose`
