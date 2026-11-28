// node --test updates.test.mjs — check, skip and update against a fixture skill and a fake source repository in the
// system temp folder. Never touches ~/.omp or Seguimiento/: every path is injected.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createUpdates } from './updates.mjs';

const T = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-upd-test-'));
const w = (p, s, mode) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); if (mode) fs.chmodSync(p, mode); };
const git = (cwd, ...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { cwd, encoding: 'utf8' }).trim();
const read = p => fs.readFileSync(p, 'utf8');
const SRC = path.join(T, 'src'), SRC2 = path.join(T, 'src2');
const SKILLS = path.join(T, 'skills'), TER = path.join(T, 'terceros'), FIX = path.join(TER, 'fix');
const spector = path.join(T, 'fake-skillspector');
let c1, c2;

test.before(() => {
  // Fake source with the skill in skills/fix, version 1.0
  w(path.join(SRC, 'README.md'), 'repo\n');
  w(path.join(SRC, 'skills/fix/SKILL.md'), '---\nname: fix\ndescription: Fixture\nmetadata:\n  version: "1.0"\n---\nBody v1\n');
  w(path.join(SRC, 'skills/fix/notes.md'), 'notes v1\n');
  w(path.join(SRC, 'skills/fix/extra.md'), 'extra v1\n');
  w(path.join(SRC, 'skills/fix/scripts/a.sh'), 'echo a\n', 0o755);
  git(SRC, 'init', '-q', '-b', 'main'); git(SRC, 'add', '.'); git(SRC, 'commit', '-qm', 'first');
  c1 = git(SRC, 'rev-parse', 'HEAD');
  // Installed copy: his own edit to notes.md and a LICENSE he added; recorded in the parent ORIGEN.md table
  fs.cpSync(path.join(SRC, 'skills/fix'), FIX, { recursive: true });
  w(path.join(FIX, 'notes.md'), 'notes v1 + my edit\n');
  w(path.join(FIX, 'LICENSE'), 'MIT\n');
  fs.rmSync(path.join(FIX, 'extra.md')); // he deleted this one
  w(path.join(TER, 'ORIGEN.md'), `# Skills\n\n| Skill | Repositorio | Ruta en el repositorio | Commit | Cambios locales |\n|---|---|---|---|---|\n| fix | ${SRC} | skills/fix | ${c1.slice(0, 7)} | LICENSE copiada |\n`);
  fs.mkdirSync(SKILLS); fs.symlinkSync(FIX, path.join(SKILLS, 'fix'));
  // A skill of his own (symlink to his folder, no source), a plain folder with no source, and one with its own ORIGEN.md
  w(path.join(T, 'mine/own/SKILL.md'), '---\nname: own\n---\n'); fs.symlinkSync(path.join(T, 'mine/own'), path.join(SKILLS, 'own'));
  w(path.join(SKILLS, 'plain/SKILL.md'), '---\nname: plain\n---\n');
  w(path.join(SRC2, 'SKILL.md'), '---\nname: inner\n---\nroot skill\n');
  git(SRC2, 'init', '-q', '-b', 'main'); git(SRC2, 'add', '.'); git(SRC2, 'commit', '-qm', 'one');
  fs.cpSync(SRC2, path.join(SKILLS, 'inner'), { recursive: true, filter: s => !s.includes('.git') });
  w(path.join(SKILLS, 'inner/ORIGEN.md'), `# Origen\n\n- Fuente: ${SRC2}\n- Commit: ${git(SRC2, 'rev-parse', 'HEAD')}\n`);
  w(path.join(T, 'managed/learned/SKILL.md'), '---\nname: learned\n---\n');
  // New upstream version: SKILL.md and notes.md change, a.sh goes, b.py comes; then an unrelated commit
  w(path.join(SRC, 'skills/fix/SKILL.md'), '---\nname: fix\ndescription: Fixture\nmetadata:\n  version: "1.1"\n---\nBody v2\n');
  w(path.join(SRC, 'skills/fix/notes.md'), 'notes v2\n');
  w(path.join(SRC, 'skills/fix/extra.md'), 'extra v2\n');
  fs.rmSync(path.join(SRC, 'skills/fix/scripts/a.sh'));
  w(path.join(SRC, 'skills/fix/scripts/b.py'), 'print("b")\n');
  git(SRC, 'add', '-A'); git(SRC, 'commit', '-qm', 'Clearer notes and a Python helper');
  c2 = git(SRC, 'rev-parse', 'HEAD');
  w(path.join(SRC, 'README.md'), 'repo v2\n'); git(SRC, 'commit', '-qam', 'unrelated');
  w(spector, '#!/bin/sh\necho \'{"risk_assessment":{"score":0,"recommendation":"SAFE"},"analysis_completeness":{"coverage_percent":100},"issues":[]}\'\n', 0o755);
});
test.after(() => fs.rmSync(T, { recursive: true, force: true }));

const make = () => createUpdates({
  skillsDir: SKILLS, managedDir: path.join(T, 'managed'), statePath: path.join(T, 'state.json'),
  metaPath: path.join(T, 'skills-meta.json'),
  backupDir: path.join(T, 'backups'), cacheDir: path.join(T, 'cache'), spector, loadTriage: () => [],
});
const item = (u, id) => u.get().items.find(i => i.id === id);
const snapshot = d => fs.readdirSync(d, { recursive: true }).sort().map(f => { const p = path.join(d, f); return fs.statSync(p).isFile() ? `${f}:${read(p)}` : f; }).join('|');

test('check lists the update with its files, versions, local edits and security, and changes nothing', async () => {
  const u = make(), before = snapshot(FIX);
  await u.check();
  const s = u.get();
  assert.ok(s.last_checked);
  assert.equal(s.own, 1); assert.equal(s.selfLearned, 1);
  const fix = item(u, 'fix');
  assert.equal(fix.status, 'update');
  assert.equal(fix.latest.commit, c2, 'latest is the last commit that touched the skill folder');
  assert.equal(fix.base.version, '1.0'); assert.equal(fix.latest.version, '1.1');
  const ch = Object.fromEntries(fix.files.map(f => [f.path, f.change]));
  assert.deepEqual(ch, { 'SKILL.md': 'modified', 'extra.md': 'modified', 'notes.md': 'modified', 'scripts/a.sh': 'removed', 'scripts/b.py': 'added' });
  assert.equal(fix.files.find(f => f.path === 'extra.md').yours, 'deleted');
  assert.equal(fix.files.find(f => f.path === 'notes.md').yours, 'edited');
  assert.equal(fix.files.find(f => f.path === 'SKILL.md').yours, null);
  assert.deepEqual(fix.localEdits.added, ['LICENSE']);
  assert.equal(fix.security.status, 'done'); assert.equal(fix.security.level, 'limpia');
  assert.equal(fix.can.ok, true);
  assert.match(fix.summary, /Clearer notes/);
  assert.equal(item(u, 'inner').status, 'up-to-date');
  assert.equal(item(u, 'plain').status, 'unknown');
  assert.equal(item(u, 'own'), undefined, 'his own skills are not checked');
  assert.equal(item(u, 'learned'), undefined, 'self-learned skills are not checked');
  assert.equal(snapshot(FIX), before);
});

test('skip hides the version without touching the skill; unskip brings it back', () => {
  const u = make(), before = snapshot(FIX);
  u.skip('fix', c2);
  assert.equal(item(u, 'fix').status, 'skipped');
  assert.equal(u.get().skipped.fix[0].commit, c2);
  u.unskip('fix', c2);
  assert.equal(item(u, 'fix').status, 'update');
  assert.equal(u.get().skipped.fix, undefined);
  assert.equal(snapshot(FIX), before);
});

test('a skipped version stays skipped on the next check', async () => {
  const u = make();
  u.skip('fix', c2);
  await u.check();
  assert.equal(item(u, 'fix').status, 'skipped');
  u.unskip('fix', c2);
  assert.equal(item(u, 'fix').can.ok, false, 'not security-checked while skipped, so Update waits for a new check');
  await u.check();
  assert.equal(item(u, 'fix').can.ok, true);
});

test('update refuses when his copy changed after the check', async () => {
  const u = make();
  w(path.join(FIX, 'LICENSE'), 'MIT changed\n');
  await assert.rejects(u.apply('fix', c2), /changed since the check/);
  w(path.join(FIX, 'LICENSE'), 'MIT\n');
});

test('update saves his version, then writes only what the new version changes', async () => {
  const u = make(), before = snapshot(FIX);
  const r = await u.apply('fix', c2);
  const backup = r.backup;
  assert.ok(fs.existsSync(backup), 'backup exists where it says');
  assert.equal(snapshot(backup), before, 'backup is his exact previous version');
  assert.equal(read(path.join(FIX, 'notes.md')), 'notes v2\n');
  assert.ok(!fs.existsSync(path.join(FIX, 'extra.md')), 'a file he deleted stays deleted');
  assert.match(read(path.join(FIX, 'SKILL.md')), /Body v2/);
  assert.equal(read(path.join(FIX, 'scripts/b.py')), 'print("b")\n');
  assert.ok(!fs.existsSync(path.join(FIX, 'scripts/a.sh')));
  assert.equal(read(path.join(FIX, 'LICENSE')), 'MIT\n', 'files only he added are kept');
  assert.equal(item(u, 'fix').status, 'up-to-date');
  assert.equal(JSON.parse(read(path.join(T, 'state.json'))).applied.fix.commit, c2);
  await u.check();
  assert.equal(item(u, 'fix').status, 'up-to-date', 'the applied version is the new base');
  assert.deepEqual(item(u, 'fix').localEdits, { edited: [], added: ['LICENSE'], missing: ['extra.md'] });
});

test('a critical finding blocks Update', async () => {
  w(path.join(SRC, 'skills/fix/SKILL.md'), '---\nname: fix\n---\nBody v3\n'); git(SRC, 'commit', '-qam', 'v3');
  w(spector, `#!/bin/sh\necho '{"risk_assessment":{"recommendation":"DANGEROUS"},"issues":[{"category":"exfil","pattern":"curl","severity":"CRITICAL","confidence":0.9,"location":{"file":"SKILL.md","start_line":5},"finding":"curl evil"}]}'\n`, 0o755);
  const u = make(), before = snapshot(FIX);
  await u.check();
  const fix = item(u, 'fix');
  assert.equal(fix.security.level, 'critico');
  assert.equal(fix.can.ok, false);
  await assert.rejects(u.apply('fix', fix.latest.commit, true), /critical/);
  assert.equal(snapshot(FIX), before);
});

test('no-source metadata overrides recorded sources, is shown before checking, and never checks or applies them', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-no-source-'));
  try {
    const skillsDir = path.join(dir, 'skills'), metaPath = path.join(dir, 'meta.json');
    for (const id of ['gift', 'offline']) {
      w(path.join(skillsDir, id, 'SKILL.md'), `---\nname: ${id}\n---\nFixture\n`);
      w(path.join(skillsDir, id, 'ORIGEN.md'), '- Source: https://github.com/example/not-contacted\n- Commit: abcdef1234567\n');
    }
    w(metaPath, JSON.stringify({ gift: { update_source: 'none', from: 'A contributor' }, offline: { update_source: 'none', from: ' ' } }));
    const u = createUpdates({ skillsDir, managedDir: path.join(dir, 'managed'), metaPath,
      statePath: path.join(dir, 'state.json'), backupDir: path.join(dir, 'backups'), cacheDir: path.join(dir, 'cache'), spector: '/usr/bin/false' });
    assert.deepEqual(u.get().items.map(i => [i.id, i.status, i.reason]), [
      ['gift', 'no-source', 'From A contributor, no update source'], ['offline', 'no-source', 'No update source'],
    ]);
    await u.check();
    assert.equal(u.get().error, null);
    assert.deepEqual(JSON.parse(read(path.join(dir, 'cache/results.json'))).items, [], 'no source was fetched or compared');
    assert.equal(item(u, 'gift').status, 'no-source');
    await assert.rejects(u.apply('gift', 'abcdef1234567'), /no update source/);
    // Existing cached updates cannot bypass a later no-source setting.
    w(path.join(dir, 'cache/results.json'), JSON.stringify({ items: [{ id: 'gift', status: 'update' }] }));
    assert.equal(item(u, 'gift').status, 'no-source');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a skill folder that is itself a git clone records its remote and commit as its source', async () => {
  const { findOrigin } = await import('./updates.mjs');
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-upd-clone-')));
  try {
    const skill = path.join(dir, 'clone-skill');
    w(path.join(skill, 'SKILL.md'), '---\nname: clone-skill\n---\nFixture\n');
    git(skill, 'init', '-q'); git(skill, 'add', '.'); git(skill, 'commit', '-qm', 'one');
    assert.equal(findOrigin(skill, 'clone-skill'), null, 'no remote: source unknown');
    git(skill, 'remote', 'add', 'origin', 'https://github.com/example/clone-skill.git');
    const o = findOrigin(skill, 'clone-skill');
    assert.equal(o.url, 'https://github.com/example/clone-skill.git');
    assert.equal(o.commit, git(skill, 'rev-parse', 'HEAD'));
    assert.equal(o.path, '.');
    const sub = path.join(skill, 'nested');
    w(path.join(sub, 'SKILL.md'), '---\nname: nested\n---\n');
    assert.equal(findOrigin(sub, 'nested'), null, 'a folder inside a bigger clone is not taken as the clone');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
