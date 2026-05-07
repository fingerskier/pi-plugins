# @fingerskier/pi-shared

Shared runtime utilities for Fingerskier Pi packages.

Currently exports the MCP stdio bridge used by MCP-backed Pi packages:

```ts
import { createMcpStdioExtension } from "@fingerskier/pi-shared/mcp-stdio";
```

This is a normal runtime dependency, not a Pi package by itself.
