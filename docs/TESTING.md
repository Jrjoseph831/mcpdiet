# Testing mcpdiet CLI

## How to Run Tests

1. Install dependencies:
   npm install
2. Run tests:
   npm test

## What Tests Cover
- CLI argument parsing and help output
- `init` command: creates expected files/dirs in a temp directory
- `doctor` command: validates config, handles missing/invalid JSON
- `run` command: executes a child process, captures stdout/stderr, creates run artifacts
- Ensures no BOM at start of bin/mcpdiet.js

## Windows Notes
- Tests are designed to pass on Windows (PowerShell/cmd)
- No reliance on Unix-only features
- All file paths use Node's cross-platform APIs

---

## CLI Smoke Tests

These tests verify basic CLI functionality and security guardrails.

### 1. Help/Version
- `node bin/mcpdiet.js --help` should show usage info
- `node bin/mcpdiet.js --version` should show version

### 2. Input Validation
- Invalid arguments should result in a clear error, not a crash
- Dangerous input (e.g., `../../etc/passwd`) should be rejected

### 3. File Write Guard
- Attempt to write outside `.mcpdiet` should fail

### 4. No Network Calls
- CLI should not make any network requests

### 5. Error Handling
- Errors should not leak stack traces or sensitive info

## How to Run
Run the above commands manually or automate with a test script. See below for a sample Node.js smoke test.

```js
// test/smoke.js
const { execFile } = require('child_process');
execFile('node', ['bin/mcpdiet.js', '--help'], (err, stdout, stderr) => {
  if (err) throw err;
  console.log(stdout);
});
```
