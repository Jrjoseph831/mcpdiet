# Testing mcpdiet CLI

## Local
```bash
npm install
npm test
npm run pack:check
```

`npm test` runs `node --test` across `test/cli.test.js` and `test/smoke.js`.

## CI
CI runs on push and pull requests and executes:
- `npm ci`
- `npm test`
- `npm run pack:check`

## Windows Notes
- Tests are designed to pass on Windows (PowerShell/cmd).
- No reliance on Unix-only features.
- All file paths use Node's cross-platform APIs.
