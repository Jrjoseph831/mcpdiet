# mcpdiet (CLI)

_Ship lean agents._

## What it is

Local-first CLI guardrails around MCP/agent runs; reduce context bloat and leave an audit trail for agent activity.

- Local-first by default
- Budgets + allowlists enforced via policy files
- Audit logs you can export (planned)

## Install

```bash
npm i -g @lowloadlabs/mcpdiet-cli
```

## Quickstart (Windows PowerShell)

```powershell
mcpdiet init
mcpdiet doctor
mcpdiet run -- node -e "console.log('hello')"
mcpdiet status
```

- `mcpdiet init` creates `.mcpdiet.json`, `.mcpdiet/`, `.mcpdiet/runs/`, `.mcpdiet/policies/` and the default policy files when missing.
- Migration note: if you have an older `.mcpdiet.json` without `schemaVersion`, `mcpdiet init` will add `"schemaVersion": 1` in-place without removing your other keys.

## Commands

- `mcpdiet --help` / `mcpdiet --version`
- `mcpdiet init`: initialize config and policy files; migrates existing config to `schemaVersion: 1` if missing.
- `mcpdiet doctor`: check Node version, write access, config validity, and policy JSON files. Exit codes: 0 OK, 2 failure.
- `mcpdiet run -- <command...>` (or `mcpdiet run <command...>`): runs the command, streams stdout/stderr to console and to `.mcpdiet/runs/<id>/stdout.log` and `stderr.log`, and writes run metadata to `.mcpdiet/runs/<id>/run.json` (id, timestamps, cwd, command, args, nodeVersion, platform, exitCode, signal).
- `mcpdiet status`: list the last 10 runs from `.mcpdiet/runs/*/run.json` (newest first) with id, start time, exit code, and command.

## Files created by `init` and `run`

- `.mcpdiet.json` (schemaVersion: 1, projectName, createdAt, paths)
- `.mcpdiet/`
  - `runs/<id>/run.json`, `stdout.log`, `stderr.log`
  - `policies/allowlist.json`, `budgets.json`, `redactions.json`

## Links

- npm: https://www.npmjs.com/package/@lowloadlabs/mcpdiet-cli
- GitHub: https://github.com/Jrjoseph831/mcpdiet

## License

MIT
