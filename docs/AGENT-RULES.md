# Agent Rules (for Copilot/Cursor)

These rules exist to keep the repo clean and prevent “agent chaos”.

## Workflow
1. Before editing, list the files you will change (max 6 files per batch).
2. Make the smallest change that achieves the goal.
3. After editing, provide a verification checklist (exact commands to run).
4. Do not add dependencies unless necessary.

## Guardrails
- Keep the CLI stable: don’t rename commands/flags without updating docs.
- Prefer Node built-ins over new libraries.
- No hidden network calls. If something will contact the internet, document it.
- Don’t store secrets in repo. Ever.

## Output style
- When you propose changes, include:
  - What changed
  - Why it changed
  - How to verify

## Repo conventions
- Keep docs in `/docs`
- Keep public site files in `/public`
- Keep CLI entrypoint in `/bin`

# Release / Publish Guide

Publishing target: `@lowloadlabs/mcpdiet-cli`

## Before you publish
1. Run:
```
npm install
node ./bin/mcpdiet.js --help

npm logout
npm login
npm whoami

npm publish --access public

npm publish
```

Common problems

“token expired”: run npm logout then npm login

“not authorized”: you’re not publishing as an org member with rights

“2FA required”: enable npm 2FA for publish
