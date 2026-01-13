// test/smoke.js
const { execFile } = require('child_process');
const assert = require('assert');

execFile('node', ['bin/mcpdiet.js', '--help'], (err, stdout, stderr) => {
  assert(!err, 'Help should not error');
  assert(stdout.includes('Usage:'), 'Help output missing');
  execFile('node', ['bin/mcpdiet.js', 'run', '--', '../../etc/passwd'], (err2, stdout2, stderr2) => {
    assert(stderr2.includes('Security error'), 'Should reject dangerous input');
    console.log('Smoke tests passed.');
  });
});
