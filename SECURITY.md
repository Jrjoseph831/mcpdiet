# Security Policy

## Reporting Vulnerabilities
If you discover a security vulnerability in mcpdiet, please report it by opening an issue on GitHub or emailing the maintainer listed in package.json. Do not disclose vulnerabilities publicly until they have been addressed.

## Security Model
mcpdiet is local-first and offline by default:
- No network calls are made by the CLI.
- All file writes are constrained to `paths.rootDir` under the project directory.
- Child processes are started with `spawn` and `shell: false`.
- Run logs are stored locally in `.mcpdiet/runs/`.
- Policy files are stored locally in `.mcpdiet/policies/`.
- Redaction policy files are stored locally; enforcement is planned and not yet applied to logs.

Note: mcpdiet does not sandbox or constrain the commands you run. It records runs and artifacts.

## Security Scope
In-scope issues:
- Arbitrary file writes outside the project directory or configured `paths.rootDir`
- Unsafe command execution (e.g., shell injection)
- Insecure handling of sensitive data (PII)
- Encoding or packaging issues that could lead to code execution or data loss

Out-of-scope:
- Network security (no network features)
- Third-party package vulnerabilities (report upstream)
- Malicious commands provided by the user

## Security Practices
- Input validation for all CLI arguments
- Avoids `eval` or dynamic code execution
- Disables shell execution in child processes
- Handles errors gracefully without leaking sensitive data
- No sensitive data stored in code or logs

## Security Checklist
- [x] Input validation
- [x] Shell execution disabled
- [x] Error handling
- [x] No sensitive data exposure by default

See docs/SECURITY-NOTES.md for details.
