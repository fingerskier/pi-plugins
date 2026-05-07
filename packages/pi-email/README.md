# Email Pi Plugin

Pi skill placeholder for the legacy `claude-email-extension` concept.

The upstream `../Claude/claude-email-extension` repository currently contains feature notes only (IMAP/SMTP read/send/reply/delete/move/folder ideas), not a working MCP server. This package ports those notes into a Pi skill so future implementation work has a discoverable home.

## Install

```bash
pi install npm:@fingerskier/pi-email
# local workspace clone
pi install ./packages/pi-email
# one run only
pi -e npm:@fingerskier/pi-email
```

## Skill

`/skill:email` loads design and safety guidance for email automation.

## Safety

Never send, delete, or move email without explicit user confirmation. Keep credentials out of prompts and logs.
