// test/smoke.js
const { execFile } = require('child_process');
const assert = require('assert');
const path = require('path');

const node = process.execPath;
const bin = path.resolve(__dirname, '..', 'bin', 'mcpdiet.js');

execFile(node, [bin, '--help'], { encoding: 'utf8' }, (err, stdout) => {
  assert(!err, 'Help should not error');
  assert(stdout.includes('Usage:'), 'Help output missing');
  execFile(node, [bin, 'run', '--', '../../etc/passwd'], { encoding: 'utf8' }, (err2, stdout2, stderr2) => {
    assert(err2, 'Expected non-zero exit for unsafe input');
    assert(stderr2.includes('Security error'), 'Should reject dangerous input');
    console.log('Smoke tests passed.');
  });
});
