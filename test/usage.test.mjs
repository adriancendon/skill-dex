// REQ-USE: uses from each agent's local logs, with made-up lines in the formats omp, Claude Code and Codex write.
// Each invocation counts once; listings, plugin skills and other agents' noise do not count.
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, before, after } from 'node:test';
import { listSkillDirs, sources, usageResolver } from '../skill-sources.mjs';
import { scanUsage } from '../usage.mjs';

describe('usage from every agent', () => {
  let H, usage;
  const put = (file, lines) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, lines.map(l => JSON.stringify(l)).join('\n') + '\n'); };
  const mk = (dir, body) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\nname: ${path.basename(dir)}\ndescription: ${body}\n---\n`); };
  before(() => {
    H = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-usage-test-')));
    mk(path.join(H, '.omp/agent/skills/alpha'), 'Alpha');
    fs.mkdirSync(path.join(H, '.claude/skills'), { recursive: true });
    fs.symlinkSync(path.join(H, '.omp/agent/skills/alpha'), path.join(H, '.claude/skills/alpha'));
    mk(path.join(H, '.agents/skills/beta'), 'Beta');
    mk(path.join(H, '.claude/skills/gamma'), 'Gamma');
    const work = path.join(H, 'work');
    put(path.join(H, '.omp/agent/sessions', 'w', 's1.jsonl'), [
      { type: 'session', version: 3, cwd: work },
      { type: 'message', timestamp: '2026-03-02T10:00:00.000Z', message: { role: 'assistant', content: [{ type: 'toolCall', id: 'call-1', name: 'read', arguments: { path: 'skill://alpha' } }] } },
      { type: 'message', timestamp: '2026-03-02T10:00:00.000Z', message: { role: 'assistant', content: [{ type: 'toolCall', id: 'call-1', name: 'read', arguments: { path: 'skill://alpha' } }] } },
      { type: 'message', timestamp: '2026-03-03T09:00:00.000Z', message: { role: 'assistant', content: [{ type: 'toolCall', id: 'call-2', name: 'read', arguments: { path: path.join(H, '.agents/skills/beta/SKILL.md') } }] } },
    ]);
    put(path.join(H, '.claude/projects/-work/0000-session.jsonl'), [
      { type: 'user', uuid: 'u-1', timestamp: '2026-03-04T08:00:00.000Z', cwd: work, message: { role: 'user', content: '<command-name>/gamma</command-name>\n<command-message>gamma</command-message>' } },
      { type: 'user', uuid: 'u-2', timestamp: '2026-03-04T08:01:00.000Z', cwd: work, message: { role: 'user', content: '<command-name>/model</command-name>' } },
      { type: 'assistant', timestamp: '2026-03-04T08:02:00.000Z', cwd: work, message: { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_1', name: 'Skill', input: { skill: 'alpha' } }] } },
      { type: 'assistant', timestamp: '2026-03-04T08:02:00.000Z', cwd: work, message: { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_1', name: 'Skill', input: { skill: 'alpha' } }] } },
      { type: 'assistant', timestamp: '2026-03-04T08:03:00.000Z', cwd: work, message: { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_2', name: 'Skill', input: { skill: 'some-plugin:alpha' } }] } },
      { type: 'assistant', timestamp: '2026-03-04T08:04:00.000Z', cwd: work, message: { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_3', name: 'Read', input: { file_path: path.join(H, '.claude/skills/gamma/SKILL.md') } }] } },
    ]);
    put(path.join(H, '.claude/projects/-work/0000-session/subagents/agent-1.jsonl'), [
      { type: 'assistant', isSidechain: true, timestamp: '2026-03-05T08:00:00.000Z', cwd: work, message: { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_9', name: 'Skill', input: { skill: 'gamma' } }] } },
    ]);
    put(path.join(H, '.codex/sessions', '2026', '03', '06', 'rollout-1.jsonl'), [
      { timestamp: '2026-03-06T07:00:00.000Z', type: 'session_meta', payload: { id: 's', cwd: work, base_instructions: { text: 'Skills live in ~/.agents/skills/<name>/SKILL.md' } } },
      { timestamp: '2026-03-06T07:00:01.000Z', type: 'world_state', payload: { state: { skills: 'beta: ~/.agents/skills/beta/SKILL.md' } } },
      { timestamp: '2026-03-06T07:01:00.000Z', type: 'response_item', payload: { type: 'custom_tool_call', call_id: 'c-1', name: 'exec', input: 'text(await tools.exec_command({cmd:"cat ~/.agents/skills/beta/SKILL.md"}))\n' } },
      { timestamp: '2026-03-06T07:02:00.000Z', type: 'response_item', payload: { type: 'function_call', call_id: 'c-2', name: 'exec_command', arguments: JSON.stringify({ cmd: `sed -n 1,80p ${path.join(H, '.claude/skills/gamma/SKILL.md')}` }) } },
      { timestamp: '2026-03-06T07:03:00.000Z', type: 'response_item', payload: { type: 'function_call', call_id: 'c-3', name: 'exec_command', arguments: JSON.stringify({ cmd: 'rg --files ~/.agents/skills | rg beta/SKILL.md' }) } },
      { timestamp: '2026-03-06T07:04:00.000Z', type: 'response_item', payload: { type: 'function_call', call_id: 'c-2', name: 'exec_command', arguments: JSON.stringify({ cmd: `sed -n 1,80p ${path.join(H, '.claude/skills/gamma/SKILL.md')}` }) } },
    ]);
    const src = sources({ home: H, env: {}, config: path.join(H, 'none.json') });
    const skills = listSkillDirs({ src }).map(s => ({ ...s, path: s.dir }));
    usage = scanUsage(src, usageResolver(skills));
  });
  after(() => fs.rmSync(H, { recursive: true, force: true }));

  it('omp: skill:// and SKILL.md reads, each tool call once', () => {
    assert.strictEqual(usage.alpha.agents.omp, 1);
    assert.strictEqual(usage.beta.agents.omp, 1);
    assert.strictEqual(usage.alpha.days['2026-03-02'], 1);
  });
  it('Claude Code: Skill tool calls and slash commands; not plugins, built-in commands or Read', () => {
    assert.strictEqual(usage.alpha.agents['Claude Code'], 1);
    assert.strictEqual(usage.gamma.agents['Claude Code'], 2, 'the slash command and the subagent call');
  });
  it('Codex: commands that read a SKILL.md; not listings, searches or the instructions', () => {
    assert.strictEqual(usage.beta.agents.Codex, 1);
    assert.strictEqual(usage.gamma.agents.Codex, 1);
  });
  it('totals add every agent, with the last use', () => {
    assert.deepStrictEqual([usage.alpha.total, usage.beta.total, usage.gamma.total], [2, 2, 3]);
    assert.strictEqual(usage.gamma.last, '2026-03-06T07:02:00.000Z');
  });
});
