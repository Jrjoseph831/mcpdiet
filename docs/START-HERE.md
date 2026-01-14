# START HERE

Prereqs
- Node 18+

Install (global)
```bash
npm i -g @lowloadlabs/mcpdiet-cli
```

Local dev (optional)
```bash
npm install
npm link
```

Quickstart (PowerShell)
```powershell
mcpdiet init
mcpdiet doctor
mcpdiet run -- node -e "console.log('hello')"
mcpdiet status
```

What gets created
- `.mcpdiet.json`
- `.mcpdiet/` with `runs/` and `policies/`
