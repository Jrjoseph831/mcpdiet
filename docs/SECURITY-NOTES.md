# Security Notes: Threat Model and Guardrails

## Threat Model
- Local attacker with access to the user's account
- Malicious or malformed config/input
- Accidental misuse of CLI commands

## Guardrails
- All file writes are constrained to `paths.rootDir` under the project directory
- Prevents path traversal outside `paths.rootDir`
- Child process execution uses `spawn` with `shell: false`
- No network calls are made by the CLI
- Logs and run artifacts are stored in `.mcpdiet/runs/`
- Policy files are stored in `.mcpdiet/policies/`
- Redaction policy is applied to run logs, run metadata, and console output
- Config and policy JSON are written as UTF-8 (no BOM)

## Platform Notes
- Windows: PowerShell/cmd supported, no shell-specific dependencies
- macOS/Linux: Standard Node.js execution

See SECURITY.md for policy and reporting.
