# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in mcpdiet, please report it by opening an issue on GitHub or emailing the maintainer listed in package.json. Do not disclose vulnerabilities publicly until they have been addressed.

## Security Scope

This CLI is designed for local, offline use only. No network calls are made by default. Security issues considered in-scope:
- Arbitrary file writes outside the working directory
- Unsafe command execution (e.g., shell injection)
- Insecure handling of sensitive data (PII)
- Encoding or packaging issues that could lead to code execution or data loss

Out-of-scope:
- Network security (no network features)
- Third-party package vulnerabilities (report upstream)

## Security Practices
- Input validation for all CLI arguments
- Avoids use of unsafe eval or dynamic code execution
- Uses only maintained dependencies
- Handles errors gracefully, avoiding information leaks
- No sensitive data stored in code or logs

## Security Checklist
- [x] Input validation
- [x] Dependency checks
- [x] Error handling
- [x] No sensitive data exposure

See docs/SECURITY-NOTES.md for details.
