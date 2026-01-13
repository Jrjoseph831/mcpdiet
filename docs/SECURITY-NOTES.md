# Security Notes: Threat Model & Guardrails

## Threat Model
- Local attacker with access to the user's account
- Malicious or malformed input files
- Accidental misuse of CLI commands

## Design Guardrails
- All file writes are restricted to the current working directory's `.mcpdiet` folder
- No path traversal above the working directory is allowed
- Child process execution uses Node's `spawn`/`execFile` with `shell: false` (never shell=true)
- No network calls are made by the CLI
- Logs and run artifacts are stored only in `.mcpdiet/runs/`
- No collection or transmission of PII
- All config and manifest files are written as UTF-8 (no BOM)

## Platform Notes
- Windows: Handles PowerShell/cmd, avoids shebang/encoding pitfalls
- macOS/Linux: Standard Node.js execution, no shell-specific dependencies

---

## Node CLI Security Hardening Notes

### Input Validation
- All CLI arguments are validated for type, length, and allowed values.
- Rejects unexpected or dangerous input (e.g., path traversal, shell metacharacters).

### Dependency Management
- Only maintained and trusted packages are used.
- Regularly run `npm audit` and update dependencies.

### Command Execution
- No use of `eval`, `Function`, or dynamic code execution.
- Any shell commands (if present) are sanitized and use child_process safely.

### Error Handling
- Errors are logged without exposing sensitive data.
- Stack traces are suppressed in user-facing output.

### Sensitive Data
- No secrets, credentials, or PII are stored or logged.

See SECURITY.md for policy and checklist.
