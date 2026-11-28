// REQ-CAT-001 and REQ-CAT-015: skills of every agent are found in a fixture home, the same skill reachable from several
// agents is one entry, and the same skill in two projects stays two entries; each use goes to the right one.
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, before, after } from 'node:test';
import { usageResolver, sessionCwd, listSkillDirs, sources } from '../skill-sources.mjs';

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

describe('skills of every agent', () => {
  let H, list;
  const mk = (dir, body) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\nname: ${path.basename(dir)}\ndescription: ${body}\n---\n`); return dir; };
  const link = (target, at) => { fs.mkdirSync(path.dirname(at), { recursive: true }); fs.symlinkSync(target, at); };
  const byId = id => list.find(s => s.id === id);
  before(() => {
    H = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-home-test-')));
    const alpha = mk(path.join(H, '.omp/agent/skills/alpha'), 'Alpha');
    link(alpha, path.join(H, '.claude/skills/alpha')); // the very same folder for omp and Claude Code
    mk(path.join(H, '.codex/skills/beta'), 'Beta'); mk(path.join(H, '.agents/skills/beta'), 'Beta'); // identical copies
    mk(path.join(H, '.claude/skills/gamma'), 'Gamma one'); mk(path.join(H, '.agents/skills/gamma'), 'Gamma two'); // same name, other text
    mk(path.join(H, '.omp/agent/skills/delta'), 'Delta omp'); mk(path.join(H, '.claude/skills/delta'), 'Delta claude');
    mk(path.join(H, '.codex/skills/.system/builtin'), 'A Codex built-in');
    mk(path.join(H, 'extra/eps'), 'Eps'); mk(path.join(H, 'more/zeta'), 'Zeta');
    const kb = mk(path.join(H, 'Developer/proj/.omp/skills/kb'), 'Kb');
    link(kb, path.join(H, 'Developer/proj/.claude/skills/kb'));
    mk(path.join(H, 'Developer/proj/.agents/skills/kb2'), 'Kb two');
    mk(path.join(H, 'Developer/other/.claude/skills/kb'), 'Kb'); // same text as proj's kb, still its own entry
    fs.mkdirSync(path.join(H, 'data'));
    fs.writeFileSync(path.join(H, 'data/config.json'), JSON.stringify({ skill_dirs: ['~/more'] }));
    const src = sources({ home: H, env: { SKILLDEX_SKILL_DIRS: `${path.join(H, 'extra')}:${path.join(H, 'nope')}` }, config: path.join(H, 'data/config.json'), tmpProjects: true });
    list = listSkillDirs({ src });
  });
  after(() => fs.rmSync(H, { recursive: true, force: true }));

  it('one entry per skill, with every agent that has it', () => {
    assert.deepStrictEqual(byId('alpha').agents, ['omp', 'Claude Code']);
    assert.strictEqual(byId('alpha').locations.length, 2);
    assert.deepStrictEqual(byId('beta').agents, ['Codex', 'Shared'], 'identical SKILL.md text is the same skill');
  });
  it('same name with other text stays separate as <name>@<agent>; omp keeps the plain id', () => {
    assert.deepStrictEqual(byId('gamma').agents, ['Claude Code']);
    assert.deepStrictEqual(byId('gamma@shared').agents, ['Shared']);
    assert.strictEqual(byId('gamma@shared').skill, 'gamma');
    assert.deepStrictEqual(byId('delta').agents, ['omp']);
    assert.deepStrictEqual(byId('delta@claude').agents, ['Claude Code']);
  });
  it('adds folders from SKILLDEX_SKILL_DIRS and config.json skill_dirs, skipping missing and hidden folders', () => {
    assert.deepStrictEqual(byId('eps').agents, ['Custom']);
    assert.deepStrictEqual(byId('zeta').agents, ['Custom']);
    assert.ok(!list.some(s => s.name === 'builtin' || s.name === '.system'));
  });
  it('project skills keep <folder>@<project> ids, merge by folder only, and are not merged across projects', () => {
    assert.deepStrictEqual(byId('kb@proj').agents, ['omp', 'Claude Code']);
    assert.deepStrictEqual(byId('kb2@proj').agents, ['Shared']);
    assert.deepStrictEqual(byId('kb@other').agents, ['Claude Code']);
    assert.strictEqual(list.length, 11);
  });
  it('a brand-new home with no skill folders gives an empty list', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-empty-home-'));
    try { assert.deepStrictEqual(listSkillDirs({ home: empty, env: {}, config: path.join(empty, 'none.json') }), []); }
    finally { fs.rmSync(empty, { recursive: true, force: true }); }
  });
  it('a name goes to the entry of the agent that used it', () => {
    const r = usageResolver(list.map(s => ({ ...s, path: s.dir })));
    assert.strictEqual(r.byName('delta', '', 'claude'), 'delta@claude');
    assert.strictEqual(r.byName('delta', '', 'omp'), 'delta');
    assert.strictEqual(r.byName('gamma', '', 'codex'), 'gamma', 'an agent without its own copy gets the plain id');
    assert.strictEqual(r(path.join(H, '.agents/skills/gamma/SKILL.md'), '', 'codex'), 'gamma@shared');
  });
});
