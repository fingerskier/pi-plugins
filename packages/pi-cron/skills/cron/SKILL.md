---
name: cron
description: Schedule one-time or recurring agent jobs from Pi. Use when the user asks for cron-like reminders, recurring checks, scheduled prompts, or inspecting/completing scheduled jobs.
---

# Cron Scheduling Skill

Use `cron_*` Pi tools exposed by this package. They bridge the upstream scheduler MCP server and expose Cron-oriented Pi aliases.

## Workflow

- `cron_add_job`: create a job with `name`, cron expression, and prompt.
- `cron_list_jobs`: inspect configured jobs and next run times.
- `cron_run_jobs`: check due jobs and retrieve prompts to execute.
- After executing a due job prompt, call `cron_complete_job` with status and result.
- `cron_remove_job`: remove jobs by ID when the user asks or after a one-time job completes.

Use explicit cron expressions. Confirm timezone assumptions with the user for important schedules. For one-time work, schedule the desired run and remove the job after successful completion if the backing scheduler reports it as recurring.
