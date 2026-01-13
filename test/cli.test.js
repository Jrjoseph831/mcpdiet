const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { test } = require('node:test');

const bin = path.resolve(__dirname, '..', 'bin', 'mcpdiet.js');
const node = process.execPath;

function mkdtemp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mcpdiet-'));
}

test('--help should print usage and exit 0', () => {
  const r = spawnSync(node, [bin, '--help'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /Usage:/);
});

test('doctor in fresh dir reports missing config (exit non-zero)', () => {
  const tmp = mkdtemp();
  const r = spawnSync(node, [bin, 'doctor'], { cwd: tmp, encoding: 'utf8' });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stdout + r.stderr, /Config: MISSING|Config: FAIL/);
});

test('init creates .mcpdiet.json and folders; doctor then OK', () => {
  const tmp = mkdtemp();
  let r = spawnSync(node, [bin, 'init'], { cwd: tmp, encoding: 'utf8' });
  assert.strictEqual(r.status, 0);
  assert.ok(fs.existsSync(path.join(tmp, '.mcpdiet.json')));
  assert.ok(fs.existsSync(path.join(tmp, '.mcpdiet')));
  assert.ok(fs.existsSync(path.join(tmp, '.mcpdiet', 'policies')));

  r = spawnSync(node, [bin, 'doctor'], { cwd: tmp, encoding: 'utf8' });
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout + r.stderr, /Config: OK/);
});

test('run creates run record and logs, status lists it', () => {
  const tmp = mkdtemp();
  spawnSync(node, [bin, 'init'], { cwd: tmp, encoding: 'utf8' });

  const r = spawnSync(node, [bin, 'run', '--', node, '-e', "console.log('hello')"], { cwd: tmp, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, `run failed, status=${r.status}\nSTDOUT:\n${r.stdout}\nSTDERR:\n${r.stderr}`);

  const runsDir = path.join(tmp, '.mcpdiet', 'runs');
  const entries = fs.readdirSync(runsDir).filter(n => fs.statSync(path.join(runsDir, n)).isDirectory());
  assert.ok(entries.length >= 1, 'no run dirs found');
  const runDir = path.join(runsDir, entries[0]);
  const runJson = path.join(runDir, 'run.json');
  const stdout = path.join(runDir, 'stdout.log');
  assert.ok(fs.existsSync(runJson), 'run.json missing');
  assert.ok(fs.existsSync(stdout), 'stdout.log missing');
  const out = fs.readFileSync(stdout, 'utf8');
  assert.match(out, /hello/);

  const s = spawnSync(node, [bin, 'status'], { cwd: tmp, encoding: 'utf8' });
  assert.strictEqual(s.status, 0);
  assert.match(s.stdout + s.stderr, /exit:/);
});
