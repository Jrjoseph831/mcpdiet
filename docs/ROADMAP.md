# ROADMAP

## PR Plan (polish)
- [x] Package metadata and publish hygiene (package.json)
- [x] CLI UX polish and safety hardening
- [x] Docs coherence (start, testing, security, release)
- [ ] CI clarity (workflow steps and Node matrix)
- [ ] Tests reliability (deterministic, cross-platform)

## Paid-worthy next features
- Policy enforcement: budgets (token/time/bytes) enforced, allowlist enforcement
- Redaction: configurable patterns + automatic redaction in logs
- Export: bundle run artifacts (json + logs) to zip/tgz for audits
- Summaries: run summary (exit code, duration, stdout/stderr bytes)
- CI integration: GitHub Action wrapper + artifact upload
- Multi-project support: named profiles/configs per repo or tool
- Tamper-evidence: hash chain of run records, optional signing
