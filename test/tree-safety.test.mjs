import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { removeSymlinks, symlinkFindings, safeTreePath } from '../tree-safety.mjs';
import { cloneRepository, repositorySource } from '../repositories.mjs';
import { run, compact, triage, fileHash } from '../lib-security.mjs';

const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args], { cwd, stdio: 'pipe' });

test('removes internal, external, dangling and chained links, never their targets', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-tree-test-'));
  try {
    const root = path.join(tmp, 'skill'); fs.mkdirSync(root);
    fs.writeFileSync(path.join(root, 'SKILL.md'), 'A fixture skill');
    const outside = path.join(tmp, 'outside'); fs.writeFileSync(outside, 'fixture target must not be read');
    fs.symlinkSync('SKILL.md', path.join(root, 'inside'));
    fs.symlinkSync(outside, path.join(root, 'outside'));
    fs.symlinkSync('outside', path.join(root, 'chain'));
    fs.symlinkSync('../missing', path.join(root, 'dangling'));
    const local = symlinkFindings(root);
    assert.equal(local.length, 3);
    assert.ok(local.every(f => f.severity === 'HIGH'));
    assert.equal(safeTreePath(root, 'outside'), null);
    assert.equal(fileHash(root, 'outside'), null);
    const findings = removeSymlinks(root);
    assert.equal(findings.length, 4);
    assert.equal(findings.find(f => f.location.file === 'inside').severity, 'MEDIUM');
    assert.equal(findings.find(f => f.location.file === 'chain').severity, 'HIGH');
    assert.ok(findings.every(f => f.finding.startsWith('symlink removed:')));
    assert.deepEqual(fs.readdirSync(root), ['SKILL.md']);
    assert.equal(fs.readFileSync(outside, 'utf8'), 'fixture target must not be read');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('local scans pass only a link-free copy to SkillSpector and leave installed links intact', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-local-scan-test-')), previous = process.env.SKILLSPECTOR_BIN;
  try {
    const skill = path.join(tmp, 'skill'); fs.mkdirSync(skill);
    fs.writeFileSync(path.join(skill, 'SKILL.md'), 'fixture');
    fs.writeFileSync(path.join(tmp, 'outside'), 'outside fixture text');
    fs.symlinkSync('../outside', path.join(skill, 'escape'));
    fs.symlinkSync('SKILL.md', path.join(skill, 'inside'));
    const fake = path.join(tmp, 'scanner');
    fs.writeFileSync(fake, `#!${process.execPath}\nconst fs = require('node:fs'); const p = require('node:path'); const root = process.argv[3]; if (fs.readdirSync(root).some(f => fs.lstatSync(p.join(root, f)).isSymbolicLink())) process.exit(2); console.log(JSON.stringify({issues: []}));\n`, { mode: 0o700 });
    process.env.SKILLSPECTOR_BIN = fake;
    const result = await run(skill, { tempRoot: tmp });
    assert.ok(result);
    assert.equal(result.issues.length, 1);
    assert.match(result.issues[0].finding, /symlink not followed: escape/);
    assert.equal(triage(compact(result), [], skill).level, 'review');
    assert.ok(fs.lstatSync(path.join(skill, 'escape')).isSymbolicLink());
    assert.ok(fs.lstatSync(path.join(skill, 'inside')).isSymbolicLink());
    assert.ok(!fs.readdirSync(tmp).some(n => n.startsWith('skilldex-scan-')));
  } finally { if (previous === undefined) delete process.env.SKILLSPECTOR_BIN; else process.env.SKILLSPECTOR_BIN = previous; fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('symlink findings in documentation never disappear as guide false positives', () => {
  const c = compact({ issues: [{ category: 'symlink', severity: 'HIGH', finding: 'symlink removed: notes.md -> ../outside', location: { file: 'notes.md' } }] });
  const result = triage(c);
  assert.equal(result.review.length, 1);
  assert.equal(result.noise.length, 0);
});

test('safe clone accepts local repositories, strips links before reading, rejects unsafe transports', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-clone-test-'));
  try {
    const src = path.join(tmp, 'source'); fs.mkdirSync(src);
    git(src, 'init', '-q'); fs.writeFileSync(path.join(src, 'SKILL.md'), 'fixture');
    fs.symlinkSync('../outside', path.join(src, 'escape')); fs.symlinkSync('SKILL.md', path.join(src, 'inside'));
    git(src, 'add', '.'); git(src, 'commit', '-qm', 'Fixture');
    const dest = path.join(tmp, 'candidate'), links = await cloneRepository(src, dest);
    assert.equal(links.length, 2);
    assert.ok(!fs.existsSync(path.join(dest, 'inside')));
    assert.ok(!fs.readdirSync(tmp).some(n => n.startsWith('git-template-')));
    for (const source of ['http://example.invalid/repo', 'ssh://example.invalid/repo', 'git@example.invalid:repo', 'file:///tmp/repo', 'ext::command', '--upload-pack=command', 'https://user:pass@example.invalid/repo']) assert.throws(() => repositorySource(source));
    assert.equal(repositorySource('https://example.invalid/repo'), 'https://example.invalid/repo');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
