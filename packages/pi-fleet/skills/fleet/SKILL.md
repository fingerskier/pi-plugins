---
name: fleet
description: Inspect AWS accounts and resources from Pi using Fleet tools. Use for EC2, S3, Lambda, ECS, CloudWatch, CloudFormation, and STS monitoring, diagnostics, and inventory.
---

# Fleet AWS Skill

Use `fleet_*` Pi tools exposed by this package. They bridge the upstream Fleet MCP server.

## Guidance

- Prefer read-only inspection unless the user explicitly asks for a change.
- Confirm AWS account/region before interpreting results.
- Ask before destructive, cost-incurring, or production-impacting operations.
- Respect normal AWS credential resolution (`AWS_PROFILE`, `AWS_REGION`, SSO/session env vars, instance metadata, etc.).

## Service Filtering

The upstream Fleet server can enable subsets of services via its environment/config. If tools are missing, run `fleet_mcp_status` and check Fleet environment settings.
