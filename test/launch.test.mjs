import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('launcher uses private platform log locations, preserves overrides and refuses symlinks', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-launch-test-'));
  try {
    const bin = path.join(tmp, 'bin'), home = path.join(tmp, 'home'); fs.mkdirSync(bin); fs.mkdirSync(home);
    fs.copyFileSync(path.join(repo, 'launch.sh'), path.join(tmp, 'launch.sh'));
    fs.writeFileSync(path.join(bin, 'lsof'), '#!/bin/sh\nexit 0\n', { mode: 0o700 }); // no server or browser is launched
    const launch = (platform, extra = {}) => {
      fs.writeFileSync(path.join(bin, 'uname'), `#!/bin/sh\necho ${platform}\n`, { mode: 0o700 });
      return execFileSync('/bin/bash', ['launch.sh'], { cwd: tmp, env: { PATH: bin + path.delimiter + process.env.PATH, HOME: home, PORT: '4190', SKILLDEX_DATA: path.join(tmp, 'data'), SKILLDEX_NO_OPEN: '1', ...extra }, stdio: 'pipe' });
    };
    launch('Darwin');
    const mac = path.join(home, 'Library/Logs/Skill Dex/launch.log');
    assert.equal(fs.statSync(mac).mode & 0o777, 0o600);
    assert.equal(fs.statSync(path.dirname(mac)).mode & 0o777, 0o700);
    launch('Linux');
    const linux = path.join(home, '.local/state/skill-dex/launch.log');
    assert.equal(fs.statSync(linux).mode & 0o777, 0o600);
    assert.equal(fs.statSync(path.dirname(linux)).mode & 0o777, 0o700);
    const state = path.join(tmp, 'state'); launch('Linux', { XDG_STATE_HOME: state });
    assert.equal(fs.statSync(path.join(state, 'skill-dex/launch.log')).mode & 0o777, 0o600);
    const override = path.join(tmp, 'custom/log'); launch('Linux', { SKILLDEX_LOG: override });
    assert.equal(fs.statSync(override).mode & 0o777, 0o600);
    const target = path.join(tmp, 'target'); fs.writeFileSync(target, 'untouched');
    const link = path.join(tmp, 'log-link'); fs.symlinkSync(target, link);
    assert.throws(() => launch('Linux', { SKILLDEX_LOG: link }));
    assert.equal(fs.readFileSync(target, 'utf8'), 'untouched');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
