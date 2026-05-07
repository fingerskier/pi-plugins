---
name: dex
description: Schedule recurring agent jobs from Pi. Use when the user asks for cron-like reminders, recurring checks, scheduled prompts, or inspecting/completing scheduled jobs.
---

# Dex Scheduling Skill

Use `dex_*` Pi tools exposed by this package. They bridge the upstream Dex MCP server.

## Workflow

- `dex_add_dex_job`: create a job with `name`, cron expression, and prompt.
- `dex_list_dex_jobs`: inspect configured jobs and next run times.
- `dex_run_dex_jobs`: check due jobs and retrieve prompts to execute.
- After executing a due job prompt, call `dex_complete_dex_job` with status and result.
- `dex_remove_dex_job`: remove jobs by ID when the user asks.

Use explicit cron expressions. Confirm timezone assumptions with the user for important schedules.
