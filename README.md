# mcpdiet (CLI)

_Ship lean agents._

## What it is

Local-first CLI guardrails around MCP/agent runs; reduce context bloat and leave an audit trail for agent activity.

- Local-first by default
- Budgets + allowlists (planned)
- Audit logs you can export (planned)

## Install

```bash
npm i -g @lowloadlabs/mcpdiet-cli
```

## Verify

```bash
mcpdiet --help
mcpdiet doctor
```

## Quickstart

```bash
mcpdiet init
mcpdiet doctor
```

`mcpdiet init` creates a `.mcpdiet.json` file and a `.mcpdiet/` directory in your project to store configuration and local artifacts.

## Commands

- `mcpdiet --help`: show CLI help
- `mcpdiet init`: initialize local config (`.mcpdiet.json` and `.mcpdiet/`)
- `mcpdiet doctor`: run diagnostics and verify your environment

## Links

- npm: https://www.npmjs.com/package/@lowloadlabs/mcpdiet-cli
- GitHub: https://github.com/Jrjoseph831/mcpdiet

## License

MIT
