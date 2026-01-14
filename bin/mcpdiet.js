#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const cwd = process.cwd();
const argv = process.argv.slice(2);
const cmd = argv[0];

const EXIT_OK = 0;
const EXIT_USAGE = 1;
const EXIT_DOCTOR_FAIL = 2;
const EXIT_ERROR = 2;

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

function isPathWithin(base, target) {
  const rel = path.relative(base, target);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function resolvePathWithinRoot(rootDir, value, label) {
  const fromCwd = path.resolve(cwd, value);
  if (isPathWithin(rootDir, fromCwd)) return fromCwd;
  const fromRoot = path.resolve(rootDir, value);
  if (isPathWithin(rootDir, fromRoot)) return fromRoot;
  throw new Error(`Config paths.${label} must be within paths.rootDir.`);
}

function resolveSafePaths(cfg) {
  const pathsCfg = resolvePaths(cfg);
  const rootDir = path.resolve(cwd, pathsCfg.rootDir);
  if (!isPathWithin(cwd, rootDir)) {
    throw new Error('Config paths.rootDir must be within the project directory.');
  }
  const runsDir = resolvePathWithinRoot(rootDir, pathsCfg.runsDir, 'runsDir');
  const policiesDir = resolvePathWithinRoot(rootDir, pathsCfg.policiesDir, 'policiesDir');
  return { rootDir, runsDir, policiesDir };
}

function loadConfigIfExists(cfgPath) {
  if (!fs.existsSync(cfgPath)) return null;
  return loadJson(cfgPath);
}

function usageRun() {
  console.error('Usage: mcpdiet run -- <command> [args]');
}

// Minimal security check: reject dangerous input for run command
function isSafeArg(arg) {
  // Reject path traversal, control chars, and empty args
  if (!arg || typeof arg !== 'string') return false;
  if (arg.match(/[\0\r\n]/)) return false;
  if (arg.match(/(^|[\\\/])\.\.([\\\/]|$)/)) return false; // path traversal
  return true;
}

if (!cmd || cmd === '--help' || cmd === 'help') {
  console.log(help);
  process.exit(EXIT_OK);
}

if (cmd === '--version') {
  console.log(packageVersion());
  process.exit(EXIT_OK);
}

if (cmd === 'init') {
  try {
    const cfgPath = path.join(cwd, '.mcpdiet.json');
    const existed = fs.existsSync(cfgPath);
    let cfg = null;
    let migratedSchema = false;
    let addedPaths = false;

    if (existed) {
      cfg = loadJson(cfgPath);
      if (!Object.prototype.hasOwnProperty.call(cfg, 'schemaVersion')) {
        cfg.schemaVersion = 1;
        migratedSchema = true;
      }
      if (!cfg.paths) {
        cfg.paths = { ...defaultPaths };
        addedPaths = true;
      }
    } else {
      cfg = {
        schemaVersion: 1,
        projectName: path.basename(cwd),
        createdAt: new Date().toISOString(),
        paths: { ...defaultPaths }
      };
    }

    let pathsCfg;
    try {
      pathsCfg = resolveSafePaths(cfg);
    } catch (e) {
      console.error('Config error:', e && e.message ? e.message : e);
      process.exit(EXIT_ERROR);
    }

    ensureDir(pathsCfg.rootDir);
    ensureDir(pathsCfg.runsDir);
    ensureDir(pathsCfg.policiesDir);

    writeJsonIfMissing(path.join(pathsCfg.policiesDir, 'allowlist.json'), { allow: [], deny: [] });
    writeJsonIfMissing(path.join(pathsCfg.policiesDir, 'budgets.json'), { maxCallsPerRun: 200, maxToolSchemaBytes: 250000, maxRunLogKB: 256 });
    writeJsonIfMissing(path.join(pathsCfg.policiesDir, 'redactions.json'), { env: ["OPENAI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"], patterns: [] });

    if (!existed) {
      writeJson(cfgPath, cfg);
      console.log('Created', cfgPath);
    } else if (migratedSchema || addedPaths) {
      writeJson(cfgPath, cfg);
      if (migratedSchema) {
        console.log('Migrated existing .mcpdiet.json to schemaVersion 1');
      } else if (addedPaths) {
        console.log('Updated .mcpdiet.json with default paths');
      }
    } else {
      console.log('.mcpdiet.json already present');
    }

    console.log('Initialized .mcpdiet structure.');
    process.exit(EXIT_OK);
  } catch (err) {
    console.error('init failed:', err && err.message ? err.message : err);
    process.exit(EXIT_ERROR);
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
      process.exit(EXIT_DOCTOR_FAIL);
    }

    let cfg;
    try {
      cfg = loadJson(cfgPath);
    } catch (e) {
      results.push({ ok: false, msg: 'Config: FAIL (invalid JSON)' });
      results.forEach(r => console.log(r.msg));
      process.exit(EXIT_DOCTOR_FAIL);
    }

    if (cfg && cfg.schemaVersion === 1) results.push({ ok: true, msg: `Config: OK (${cfgPath})` });
    else results.push({ ok: false, msg: 'Config: FAIL (unsupported schemaVersion)' });

    let pathsCfg;
    try {
      pathsCfg = resolveSafePaths(cfg);
    } catch (e) {
      results.push({ ok: false, msg: `Paths: FAIL (${e && e.message ? e.message : e})` });
      results.forEach(r => console.log(r.msg));
      process.exit(EXIT_DOCTOR_FAIL);
    }

    const policiesDir = pathsCfg.policiesDir;
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
    if (anyFail || policyErrors > 0) process.exit(EXIT_DOCTOR_FAIL);
    process.exit(EXIT_OK);
  } catch (err) {
    console.error('Unexpected error during doctor:', err && err.message ? err.message : err);
    process.exit(EXIT_ERROR);
  }
}

if (cmd === 'run') {
  try {
    const rest = argv.slice(1);
    if (!rest.length) {
      usageRun();
      process.exit(EXIT_USAGE);
    }
    const dashIndex = rest.indexOf('--');
    const cmdParts = dashIndex !== -1 ? rest.slice(dashIndex + 1) : rest;
    if (!cmdParts.length) {
      usageRun();
      process.exit(EXIT_USAGE);
    }
    // Security: validate all command args
    if (!cmdParts.every(isSafeArg)) {
      console.error('Security error: unsafe argument detected.');
      process.exit(EXIT_USAGE);
    }

    const command = cmdParts[0];
    const commandArgs = cmdParts.slice(1);

    const cfgPath = path.join(cwd, '.mcpdiet.json');
    let pathsCfg;
    try {
      const cfg = loadConfigIfExists(cfgPath);
      pathsCfg = resolveSafePaths(cfg);
    } catch (e) {
      console.error('Config error:', e && e.message ? e.message : e);
      process.exit(EXIT_ERROR);
    }

    const runsBase = pathsCfg.runsDir;
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

    let finalized = false;
    function finalize(exitCode, signal) {
      if (finalized) return;
      finalized = true;
      const finishedAt = new Date().toISOString();
      const updated = Object.assign({}, runMeta, { finishedAt, exitCode, signal });
      try {
        writeJson(runJsonPath, updated);
      } catch (e) {
        console.error('Failed to write run.json:', e && e.message ? e.message : e);
      }
      let pending = 2;
      const done = () => {
        pending -= 1;
        if (pending <= 0) process.exit(exitCode);
      };
      outStream.on('finish', done);
      errStream.on('finish', done);
      outStream.on('error', done);
      errStream.on('error', done);
      outStream.end();
      errStream.end();
    }

    const child = spawn(command, commandArgs, {
      shell: false,
      windowsHide: false,
      windowsVerbatimArguments: false,
      cwd
    });

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        process.stdout.write(chunk);
        outStream.write(chunk);
      });
    }
    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        process.stderr.write(chunk);
        errStream.write(chunk);
      });
    }

    child.on('error', (err) => {
      console.error('Failed to start child process:', err && err.message ? err.message : err);
      finalize(EXIT_ERROR, null);
    });

    function handleSignal(signal) {
      try { child.kill(signal); } catch (e) {}
      finalize(EXIT_ERROR, signal);
    }
    process.once('SIGINT', () => handleSignal('SIGINT'));
    process.once('SIGTERM', () => handleSignal('SIGTERM'));

    child.on('close', (code, signal) => {
      const exitCode = (typeof code === 'number') ? code : EXIT_ERROR;
      finalize(exitCode, signal);
    });
    return;
  } catch (err) {
    console.error('run failed:', err && err.message ? err.message : err);
    process.exit(EXIT_ERROR);
  }
}

if (cmd === 'status') {
  try {
    const cfgPath = path.join(cwd, '.mcpdiet.json');
    let pathsCfg;
    try {
      const cfg = loadConfigIfExists(cfgPath);
      pathsCfg = resolveSafePaths(cfg);
    } catch (e) {
      console.error('Config error:', e && e.message ? e.message : e);
      process.exit(EXIT_ERROR);
    }

    const runsBase = pathsCfg.runsDir;
    if (!fs.existsSync(runsBase)) {
      console.log('No runs found.');
      process.exit(EXIT_OK);
    }

    const runDirs = fs.readdirSync(runsBase).filter((name) => {
      try { return fs.statSync(path.join(runsBase, name)).isDirectory(); } catch (e) { return false; }
    });

    const runs = runDirs.map((d) => {
      const p = path.join(runsBase, d, 'run.json');
      try { return loadJson(p); } catch (e) { return null; }
    }).filter(Boolean).sort((a, b) => {
      const aTime = Date.parse(a.startedAt) || 0;
      const bTime = Date.parse(b.startedAt) || 0;
      return bTime - aTime;
    }).slice(0, 10);

    if (!runs.length) {
      console.log('No runs found.');
      process.exit(EXIT_OK);
    }

    runs.forEach((r) => {
      const code = (typeof r.exitCode === 'number') ? r.exitCode : (r.finishedAt ? 'unknown' : 'running');
      const argStr = r.args && r.args.length ? ` ${r.args.join(' ')}` : '';
      console.log(`${r.id} | ${r.startedAt} | exit:${code} | ${r.command}${argStr}`);
    });
    process.exit(EXIT_OK);
  } catch (err) {
    console.error('status failed:', err && err.message ? err.message : err);
    process.exit(EXIT_ERROR);
  }
}

console.error(`Unknown command: ${cmd}. Run "mcpdiet --help".`);
process.exit(EXIT_USAGE);
