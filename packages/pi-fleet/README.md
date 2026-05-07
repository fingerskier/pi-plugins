# Fleet Pi Plugin

Pi package port of [`fleet-claude-plugin`](https://github.com/fingerskier/fleet-claude-plugin).

Fleet inspects AWS resources across STS, EC2, S3, Lambda, ECS, CloudWatch, and CloudFormation. This Pi version starts the upstream Fleet MCP stdio server with `npx -y fleet-claude-plugin mcp` and exposes its tools in Pi with a `fleet_` prefix.

## Install

```bash
pi install npm:@fingerskier/pi-fleet
# local workspace clone
pi install ./packages/pi-fleet
# one run only
pi -e npm:@fingerskier/pi-fleet
```

## Requirements

Use normal AWS credential environment/configuration (`AWS_PROFILE`, `AWS_REGION`, SSO/session env vars, etc.).

## Tools

Run `fleet_mcp_status` in Pi to list loaded tools.

## Configuration

- `FLEET_MCP_AUTOLOAD=0` disables startup MCP discovery.
- `FLEET_MCP_COMMAND=/path/to/server` overrides `npx`.

## Skill

`/skill:fleet` adds AWS safety and inspection workflow guidance.
