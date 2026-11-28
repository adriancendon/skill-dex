// How often each skill is used, from each agent's own local logs (REQ-USE). Read-only. Only what can be told
// reliably is counted, and each invocation once (by the id the agent gives each tool call):
// - omp (the .jsonl files under ~/.omp/agent/sessions): a `read` tool call of skill://<name> or of a .../skills/<name>/SKILL.md file.
// - Claude Code (~/.claude/projects/**/*.jsonl): a `Skill` tool call ({"name":"Skill","input":{"skill":"<name>"}}),
//   or a skill typed as a slash command (<command-name>/<name></command-name>) when <name> is a skill in the catalogue.
//   Plugin skills ("plugin:name") are not in any skill folder and are not counted. Reading a SKILL.md with the Read
//   tool is not counted: Claude Code loads skills through the Skill tool, so a Read is usually someone inspecting it.
// - Codex (the .jsonl files under ~/.codex/sessions and ~/.codex/archived_sessions): a shell command or tool call that reads a
//   .../skills/<name>/SKILL.md file (cat, sed, head, tail, less, more, bat, nl, awk, Get-Content, type). Codex loads a
//   skill by reading its SKILL.md; listings and searches (ls, find, rg) are not counted.
// A path is matched by its real folder first, then by the skill's folder name.
import fs from 'node:fs';
import path from 'node:path';
import { jsonlFiles, AGENTS } from './skill-sources.mjs';

const lines = f => { try { return fs.readFileSync(f, 'utf8').split('\n'); } catch { return []; } };

// usage[id] = { total, days: {YYYY-MM-DD: n}, last, agents: {"omp": n, "Claude Code": n, ...} }
export function createTally() {
  const usage = {}, seen = new Set();
  const add = (id, ts, agent, key) => {
    if (!id || !ts || (key && seen.has(key))) return false;
    if (key) seen.add(key);
    const u = (usage[id] ??= { total: 0, days: {}, last: '', agents: {} });
    const day = String(ts).slice(0, 10), shown = AGENTS[agent] || agent;
    u.total++; u.days[day] = (u.days[day] || 0) + 1; if (ts > u.last) u.last = ts;
    u.agents[shown] = (u.agents[shown] || 0) + 1;
    return true;
  };
  return { usage, add };
}

export function parseOmp(file, resolve, tally) {
  let cwd = ''; // the session header names the folder it ran in; it decides which project's skill a skill:// read means
  for (const line of lines(file)) {
    if (!cwd && line.includes('"type":"session"')) { try { cwd = JSON.parse(line).cwd || ''; } catch {} }
    if (!line.includes('"toolCall"') || !line.includes('"read"')) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const c = o.message?.role === 'assistant' && o.message.content;
    if (!Array.isArray(c)) continue;
    for (const t of c) {
      if (t.type !== 'toolCall' || t.name !== 'read') continue;
      tally.add(resolve(t.arguments?.path || '', cwd, 'omp'), o.timestamp, 'omp', `omp:${t.id}`);
    }
  }
}

const SLASH = /<command-name>\/?([\w.-]+)<\/command-name>/;
export function parseClaude(file, resolve, tally) {
  for (const line of lines(file)) {
    const skillCall = line.includes('"name":"Skill"'), slash = line.includes('<command-name>');
    if (!skillCall && !slash) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const c = o.message?.content, cwd = o.cwd || '';
    if (skillCall && o.type === 'assistant' && Array.isArray(c)) {
      for (const t of c) {
        if (t.type !== 'tool_use' || t.name !== 'Skill') continue;
        const name = String(t.input?.skill || '').replace(/^\//, '');
        if (!name || name.includes(':')) continue;
        tally.add(resolve.byName(name, cwd, 'claude'), o.timestamp, 'claude', `claude:${t.id}`);
      }
    }
    if (slash && o.type === 'user') {
      const text = typeof c === 'string' ? c : Array.isArray(c) ? c.filter(t => t.type === 'text').map(t => t.text).join('\n') : '';
      const m = text.match(SLASH);
      if (m) tally.add(resolve.byName(m[1], cwd, 'claude'), o.timestamp, 'claude', `claude:${o.uuid || o.timestamp}`);
    }
  }
}

const READER = /(?:^|[\s;|&(`"'])(?:cat|sed|head|tail|less|more|bat|nl|awk|Get-Content|type)\s/;
const SKILL_PATH = /((?:~|\.{1,2}|\/)[^\s"'`;|&<>()]*\/skills\/([\w.-]+))\/SKILL\.md/g;
export function parseCodex(file, resolve, tally, home) {
  let cwd = '';
  for (const line of lines(file)) {
    if (!cwd && line.includes('"session_meta"')) { try { cwd = JSON.parse(line).payload?.cwd || ''; } catch {} }
    if (!line.includes('SKILL.md') || !line.includes('"response_item"')) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const p = o.payload;
    if (o.type !== 'response_item' || !['function_call', 'custom_tool_call', 'local_shell_call'].includes(p?.type)) continue;
    const text = typeof p.arguments === 'string' ? p.arguments : typeof p.input === 'string' ? p.input : JSON.stringify(p.action || p.arguments || p.input || '');
    // One command can read several files: each one is checked on its own line or statement.
    const ids = new Set();
    for (const part of text.replace(/\\n/g, '\n').split(/\n|&&|;|\|\|/)) {
      if (!READER.test(part)) continue;
      for (const m of part.matchAll(SKILL_PATH)) {
        let dir = m[1];
        if (dir.startsWith('~')) dir = path.join(home, dir.slice(1));
        else if (dir.startsWith('.')) dir = path.resolve(cwd || '/', dir);
        const id = resolve(`${dir}/SKILL.md`, cwd, 'codex');
        if (id) ids.add(id);
      }
    }
    const key = p.call_id || p.id;
    for (const id of ids) tally.add(id, o.timestamp, 'codex', key ? `codex:${key}:${id}` : null);
  }
}

// All agents' uses for a list of catalogue skills. src: sources() of skill-sources.mjs.
export function scanUsage(src, resolve) {
  const tally = createTally();
  for (const f of jsonlFiles(src.sessions.omp)) parseOmp(f, resolve, tally);
  for (const f of jsonlFiles(src.sessions.claude)) parseClaude(f, resolve, tally);
  for (const d of src.sessions.codex) for (const f of jsonlFiles(d)) parseCodex(f, resolve, tally, src.home);
  return tally.usage;
}
