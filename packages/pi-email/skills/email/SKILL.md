---
name: email
description: Draft, review, and plan email workflows for IMAP/SMTP integrations. Use when the user asks about the legacy claude-email-extension or wants to design/read/send/reply/delete/move email automation from Pi.
---

# Email Integration Skill

This is a Pi skill placeholder for the legacy `claude-email-extension` idea. The upstream Claude repo only contains product notes, not a working MCP server yet.

## Scope

Help design or implement email automation with:

- IMAP read/search/folder operations
- SMTP send/reply workflows
- safe credential handling through environment variables or OS secret storage
- explicit user confirmation before sending, deleting, or moving messages

## Safety

Never send, delete, or move email without explicit user confirmation. Avoid printing secrets, OAuth tokens, SMTP passwords, or full private message bodies unless the user asks for them.
