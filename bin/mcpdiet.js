#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const cwd = process.cwd();
const argv = process.argv.slice(2);
const cmd = argv[0];

const help = `mcpdiet - LowLoad Labs
Usage:
  mcpdiet [command] [options]

Commands:
  --help, help        Show this help
  --version           Show package version
  init                Initialize .mcpdiet config and folders
  doctor              Run diagnostics (Node, permissions, config, policies)
  run -- <cmd...>     Run a command and record logs
  status              Show recent runs
`;

const defaultPaths = {
  rootDir: '.mcpdiet',
  runsDir: '.mcpdiet/runs',
  policiesDir: '.mcpdiet/policies'
};

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: 'utf8' });
}

function writeJsonIfMissing(filePath, data) {
  if (fs.existsSync(filePath)) return false;
  writeJson(filePath, data);
  return true;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
}

function packageVersion() {
  try {
    const p = path.join(cwd, 'package.json');
    if (fs.existsSync(p)) {
      const pj = loadJson(p);
      return pj.version || 'unknown';
    }
  } catch (e) {}
  return 'unknown';
}

function resolvePaths(cfg) {
  if (!cfg || !cfg.paths) return { ...defaultPaths };
  return {
    rootDir: cfg.paths.rootDir || defaultPaths.rootDir,
    runsDir: cfg.paths.runsDir || defaultPaths.runsDir,
    policiesDir: cfg.paths.policiesDir || defaultPaths.policiesDir
  };
}

function usageRun() {
  console.error('Usage: mcpdiet run -- <command> [args]');
}

if (!cmd || cmd === '--help' || cmd === 'help') {
  console.log(help);
  process.exit(0);
}

if (cmd === '--version') {
  console.log(packageVersion());
  process.exit(0);
}

if (cmd === 'init') {
  try {
    const cfgPath = path.join(cwd, '.mcpdiet.json');
    const rootDir = path.join(cwd, defaultPaths.rootDir);
    const runsDir = path.join(cwd, defaultPaths.runsDir);
    const policiesDir = path.join(cwd, defaultPaths.policiesDir);

    ensureDir(rootDir);
    ensureDir(runsDir);
    ensureDir(policiesDir);

    writeJsonIfMissing(path.join(policiesDir, 'allowlist.json'), { allow: [], deny: [] });
    writeJsonIfMissing(path.join(policiesDir, 'budgets.json'), { maxCallsPerRun: 200, maxToolSchemaBytes: 250000, maxRunLogKB: 256 });
    writeJsonIfMissing(path.join(policiesDir, 'redactions.json'), { env: ["OPENAI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"], patterns: [] });

    if (!fs.existsSync(cfgPath)) {
      const cfg = { schemaVersion: 1, projectName: path.basename(cwd), createdAt: new Date().toISOString(), paths: { ...defaultPaths } };
      writeJson(cfgPath, cfg);
      console.log('Created', cfgPath);
    } else {
      try {
        const existing = loadJson(cfgPath);
        if (!Object.prototype.hasOwnProperty.call(existing, 'schemaVersion')) {
          existing.schemaVersion = 1;
          if (!existing.paths) existing.paths = { ...defaultPaths };
          writeJson(cfgPath, existing);
          console.log('Migrated existing .mcpdiet.json to schemaVersion 1');
        } else {
          console.log('.mcpdiet.json already present');
        }
      } catch (e) {
        console.error('Failed to read existing .mcpdiet.json:', e && e.message ? e.message : e);
        process.exit(2);
      }
    }

    console.log('Initialized .mcpdiet structure.');
    process.exit(0);
  } catch (err) {
    console.error('init failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
}

if (cmd === 'doctor') {
  try {
    const results = [];

    const nodeVer = process.versions.node || '0.0.0';
    const major = parseInt(nodeVer.split('.')[0], 10) || 0;
    if (major >= 18) results.push({ ok: true, msg: `Node: OK (${nodeVer})` });
    else results.push({ ok: false, msg: `Node: FAIL (requires >=18, found ${nodeVer})` });

    try {
      fs.accessSync(cwd, fs.constants.W_OK);
      results.push({ ok: true, msg: `Write access: OK (${cwd})` });
    } catch (e) {
      results.push({ ok: false, msg: `Write access: FAIL (${cwd})` });
    }

    const cfgPath = path.join(cwd, '.mcpdiet.json');
    if (!fs.existsSync(cfgPath)) {
      results.push({ ok: false, msg: 'Config: MISSING (.mcpdiet.json not found)' });
      results.forEach(r => console.log(r.msg));
      process.exit(1);
    }

    let cfg;
    try {
      cfg = loadJson(cfgPath);
    } catch (e) {
      results.push({ ok: false, msg: 'Config: FAIL (invalid JSON)' });
      results.forEach(r => console.log(r.msg));
      process.exit(1);
    }

    if (cfg && cfg.schemaVersion === 1) results.push({ ok: true, msg: `Config: OK (${cfgPath})` });
    else results.push({ ok: false, msg: 'Config: FAIL (unsupported schemaVersion)' });

    const pathsCfg = resolvePaths(cfg);
    const policiesDir = path.join(cwd, pathsCfg.policiesDir);
    const policyFiles = ['allowlist.json', 'budgets.json', 'redactions.json'];
    let policyErrors = 0;
    policyFiles.forEach(f => {
      const p = path.join(policiesDir, f);
      if (!fs.existsSync(p)) {
        results.push({ ok: false, msg: `Policy ${f}: MISSING (${p})` });
        policyErrors++;
      } else {
        try {
          loadJson(p);
          results.push({ ok: true, msg: `Policy ${f}: OK (${p})` });
        } catch (e) {
          results.push({ ok: false, msg: `Policy ${f}: FAIL (invalid JSON)` });
          policyErrors++;
        }
      }
    });

    results.forEach(r => console.log(r.msg));
    const anyFail = results.some(r => !r.ok);
    if (anyFail || policyErrors > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error during doctor:', err && err.message ? err.message : err);
    process.exit(2);
  }
}

if (cmd === 'run') {
  try {
    const rest = argv.slice(1);
    if (!rest.length) {
      usageRun();
      process.exit(1);
    }
    const dashIndex = rest.indexOf('--');
    const cmdParts = dashIndex !== -1 ? rest.slice(dashIndex + 1) : rest;
    if (!cmdParts.length) {
      usageRun();
      process.exit(1);
    }

    const command = cmdParts[0];
    const commandArgs = cmdParts.slice(1);

    let pathsCfg = { ...defaultPaths };
    const cfgPath = path.join(cwd, '.mcpdiet.json');
    if (fs.existsSync(cfgPath)) {
      try {
        const cfg = loadJson(cfgPath);
        pathsCfg = resolvePaths(cfg);
      } catch (e) {}
    }

    const runsBase = path.join(cwd, pathsCfg.runsDir);
    ensureDir(runsBase);

    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const runDir = path.join(runsBase, id);
    ensureDir(runDir);

    const startedAt = new Date().toISOString();
    const runMeta = {
      id,
      startedAt,
      cwd,
      command,
      args: commandArgs,
      nodeVersion: process.versions.node,
      platform: process.platform
    };

    const runJsonPath = path.join(runDir, 'run.json');
    const stdoutPath = path.join(runDir, 'stdout.log');
    const stderrPath = path.join(runDir, 'stderr.log');
    writeJson(runJsonPath, runMeta);

    const outStream = fs.createWriteStream(stdoutPath, { flags: 'a' });
    const errStream = fs.createWriteStream(stderrPath, { flags: 'a' });

    const child = spawn(command, commandArgs, { shell: process.platform === 'win32', windowsHide: false, cwd });

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
      outStream.write(chunk);
    });
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
      errStream.write(chunk);
    });

    child.on('error', (err) => {
      console.error('Failed to start child process:', err && err.message ? err.message : err);
    });

    child.on('close', (code, signal) => {
      const finishedAt = new Date().toISOString();
      const updated = Object.assign({}, runMeta, { finishedAt, exitCode: code, signal });
      try {
        writeJson(runJsonPath, updated);
      } catch (e) {
        console.error('Failed to write run.json:', e && e.message ? e.message : e);
      }
      outStream.end();
      errStream.end();
      process.exit(code === null ? 1 : code);
    });
    return;
  } catch (err) {
    console.error('run failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
}

if (cmd === 'status') {
  try {
    let pathsCfg = { ...defaultPaths };
    const cfgPath = path.join(cwd, '.mcpdiet.json');
    if (fs.existsSync(cfgPath)) {
      try {
        const cfg = loadJson(cfgPath);
        pathsCfg = resolvePaths(cfg);
      } catch (e) {}
    }

    const runsBase = path.join(cwd, pathsCfg.runsDir);
    if (!fs.existsSync(runsBase)) {
      console.log('No runs found.');
      process.exit(0);
    }

    const runDirs = fs.readdirSync(runsBase).filter((name) => {
      try { return fs.statSync(path.join(runsBase, name)).isDirectory(); } catch (e) { return false; }
    });

    const runs = runDirs.map((d) => {
      const p = path.join(runsBase, d, 'run.json');
      try { return loadJson(p); } catch (e) { return null; }
    }).filter(Boolean).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, 10);

    if (!runs.length) {
      console.log('No runs found.');
      process.exit(0);
    }

    runs.forEach((r) => {
      const code = (typeof r.exitCode === 'number') ? r.exitCode : (r.finishedAt ? 'unknown' : 'running');
      const argStr = r.args && r.args.length ? ` ${r.args.join(' ')}` : '';
      console.log(`${r.id} | ${r.startedAt} | exit:${code} | ${r.command}${argStr}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('status failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
}

console.error('Unknown command:', cmd, '| argv:', JSON.stringify(argv));
console.log();
console.log(help);
process.exit(1);
