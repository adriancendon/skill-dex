// REQ-CAT-015: the same skill in two projects stays two entries, and each use goes to the right one.
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, before, after } from 'node:test';
import { usageResolver, sessionCwd } from '../skill-sources.mjs';

describe('project skill uses', () => {
  let tmp, skills;
  before(() => {
    tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-src-test-')));
    const mk = p => { fs.mkdirSync(p, { recursive: true }); fs.writeFileSync(path.join(p, 'SKILL.md'), '---\nname: x\n---\n'); return p; };
    const g = mk(path.join(tmp, 'global/skills/seo')), a = mk(path.join(tmp, 'A/.omp/skills/kb')), b = mk(path.join(tmp, 'B/.omp/skills/kb'));
    skills = [
      { id: 'seo', origin: 'usuario', path: g },
      { id: 'kb@A', skill: 'kb', origin: 'proyecto', project: 'A', projectPath: path.join(tmp, 'A'), path: a },
      { id: 'kb@B', skill: 'kb', origin: 'proyecto', project: 'B', projectPath: path.join(tmp, 'B'), path: b },
    ];
  });
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it('skill:// goes to the project the session ran in, else to the omp skill', () => {
    const r = usageResolver(skills);
    assert.strictEqual(r('skill://kb', path.join(tmp, 'A')), 'kb@A');
    assert.strictEqual(r('skill://kb', path.join(tmp, 'B', 'sub')), 'kb@B');
    assert.strictEqual(r('skill://kb', path.join(tmp, 'C')), null);
    assert.strictEqual(r('skill://kb', ''), null);
    assert.strictEqual(r('skill://seo', path.join(tmp, 'A')), 'seo');
  });
  it('a file path goes to the folder it names', () => {
    const r = usageResolver(skills);
    assert.strictEqual(r(path.join(tmp, 'B/.omp/skills/kb/SKILL.md'), ''), 'kb@B');
    assert.strictEqual(r(path.join(tmp, 'global/skills/seo/SKILL.md'), ''), 'seo');
    assert.strictEqual(r('/elsewhere/skills/seo/SKILL.md', ''), 'seo');
    assert.strictEqual(r('/elsewhere/skills/kb/SKILL.md', ''), null);
  });
  it('reads the folder from a session header', () => {
    const f = path.join(tmp, 's.jsonl');
    fs.writeFileSync(f, '{"type":"title","title":"t"}\n{"type":"session","version":3,"cwd":"/Users/me/Developer/My \\"Project\\""}\n');
    assert.strictEqual(sessionCwd(f), '/Users/me/Developer/My "Project"');
  });
});
