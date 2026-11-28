// Where Skill Dex finds skills (REQ-CAT-001, REQ-CAT-015): the known skill folders of each agent that uses SKILL.md
// skills (omp, Claude Code, Codex and the shared ~/.agents/skills), extra folders chosen by the user, and the skill
// folders inside each project. Read-only: nothing here writes to any skill or project folder.
//
// The same skill reachable from several agents (the same real folder, or a global copy with identical SKILL.md text)
// is one entry with the list of agents that have it. Ids stay as they were before agents other than omp were listed:
// omp skills keep their folder name, project skills "<folder>@<project>". A skill that only another agent has gets
// its folder name too, unless an earlier entry already uses it: then "<folder>@<agent>" (for example seo@codex).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { dataFile } from './paths.mjs';

// Shown names of the agents, and the short form used in ids.
export const AGENTS = { omp: 'omp', claude: 'Claude Code', codex: 'Codex', shared: 'Shared', custom: 'Custom' };
// Skill folders looked for inside each project, in this order. The first one is the one omp loads.
export const PROJECT_SKILL_DIRS = [
  { sub: '.omp/skills', agent: 'omp' },
  { sub: '.claude/skills', agent: 'claude' },
  { sub: '.agents/skills', agent: 'shared' },
  { sub: '.codex/skills', agent: 'codex' },
];
const WALK_DEPTH = 4;
const SKIP_DIRS = new Set(['node_modules', 'Library', 'vendor', 'dist', 'build', 'venv', 'target', '__pycache__']);

const real = p => { try { return fs.realpathSync(p); } catch { return null; } };
const inside = (p, base) => p === base || p.startsWith(base + path.sep);
const expand = (p, home) => p === '~' ? home : p.startsWith('~/') ? path.join(home, p.slice(2)) : p;

// Every place to look, for a given home folder (tests pass a fixture home).
// opts: { home, env, config: path of config.json, projectRoots, tmpProjects (tests: projects under the temp folder count) }
export function sources(opts = {}) {
  const home = opts.home || os.homedir(), env = opts.env || process.env;
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(opts.config || dataFile('config.json'), 'utf8')) || {}; } catch {}
  const extra = [
    ...String(env.SKILLDEX_SKILL_DIRS || '').split(':'),
    ...(Array.isArray(cfg.skill_dirs) ? cfg.skill_dirs : []),
  ].map(d => String(d || '').trim()).filter(Boolean).map(d => path.resolve(expand(d, home)));
  return {
    home,
    // In the order ids are given: omp first, so his existing ids never change.
    global: [
      { dir: path.join(home, '.omp/agent/skills'), agent: 'omp', origin: 'usuario' },
      { dir: path.join(home, '.omp/agent/managed-skills'), agent: 'omp', origin: 'auto-aprendida' },
      { dir: path.join(home, '.claude/skills'), agent: 'claude', origin: 'usuario' },
      { dir: path.join(home, '.codex/skills'), agent: 'codex', origin: 'usuario' },
      { dir: path.join(home, '.agents/skills'), agent: 'shared', origin: 'usuario' },
      ...[...new Set(extra)].map(dir => ({ dir, agent: 'custom', origin: 'usuario' })),
    ],
    projectRoots: opts.projectRoots || [path.join(home, 'Developer')],
    sessions: {
      omp: path.join(home, '.omp/agent/sessions'),
      claude: path.join(home, '.claude/projects'),
      codex: [path.join(home, '.codex/sessions'), path.join(home, '.codex/archived_sessions')],
    },
    // Sessions that ran in these folders are not projects (agents' own folders, temporary folders).
    ignored: [path.join(home, '.omp'), path.join(home, '.claude'), path.join(home, '.codex'), path.join(home, '.agents'),
      ...(opts.tmpProjects ? [] : [os.tmpdir(), '/tmp', '/private/tmp', '/var/folders', '/private/var/folders'])].map(p => real(p) || p),
  };
}

// The folder a session ran in, from its first 8 KB: omp ({"type":"session",...,"cwd"}), Codex
// ({"type":"session_meta","payload":{...,"cwd"}}) and Claude Code (every message line carries "cwd").
export function sessionCwd(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(8192), n = fs.readSync(fd, buf, 0, buf.length, 0);
    for (const line of buf.toString('utf8', 0, n).split('\n')) {
      if (!line.includes('"cwd":')) continue;
      if (!/"type":"(session|session_meta|user|assistant)"/.test(line)) continue;
      const m = line.match(/"cwd":("(?:[^"\\]|\\.)*")/);
      if (m) return JSON.parse(m[1]);
    }
  } catch {} finally { if (fd !== undefined) fs.closeSync(fd); }
  return '';
}

// Every .jsonl file under a folder (recursively), skipping folders that cannot be read.
export function jsonlFiles(dir, out = []) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) jsonlFiles(p, out); else if (e.name.endsWith('.jsonl')) out.push(p);
  }
  return out;
}

function sessionFolders(src) {
  const out = new Set();
  const files = [...jsonlFiles(src.sessions.omp), ...jsonlFiles(src.sessions.claude), ...src.sessions.codex.flatMap(d => jsonlFiles(d))];
  for (const f of files) { const cwd = sessionCwd(f); if (cwd) out.add(cwd); }
  return out;
}

const hasSkillDir = dir => PROJECT_SKILL_DIRS.some(({ sub }) => fs.existsSync(path.join(dir, sub)));
function walk(dir, depth, out) {
  if (hasSkillDir(dir)) out.add(dir);
  if (!depth) return;
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) if (e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), depth - 1, out);
}

// Project folders that hold skills, deduplicated by real path, each with a unique label (folder name, or parent/folder on a clash).
export function findProjects(opts = {}) {
  const src = opts.src || sources(opts), home = real(src.home) || src.home;
  const found = new Set();
  for (const r of src.projectRoots) walk(r, WALK_DEPTH, found);
  for (const cwd of sessionFolders(src)) found.add(cwd);
  const byReal = new Map();
  for (const p of found) {
    const rp = real(p);
    if (!rp || rp === home || src.ignored.some(b => inside(rp, b)) || byReal.has(rp)) continue;
    if (hasSkillDir(rp)) byReal.set(rp, p);
  }
  const list = [...byReal.keys()].sort().map(rp => ({ path: rp, label: path.basename(rp) }));
  for (const p of list) {
    if (list.filter(x => x.label === path.basename(p.path)).length > 1) p.label = path.join(path.basename(path.dirname(p.path)), path.basename(p.path));
  }
  return list;
}

const skillFolders = dir => {
  let names = [];
  try { names = fs.readdirSync(dir).filter(n => !n.startsWith('.')).sort(); } catch { return []; }
  return names.map(name => ({ name, link: path.join(dir, name), real: real(path.join(dir, name)) })).filter(x => x.real && fs.existsSync(path.join(x.real, 'SKILL.md')));
};
const contentHash = dir => { try { return crypto.createHash('sha1').update(fs.readFileSync(path.join(dir, 'SKILL.md'))).digest('hex'); } catch { return null; } };

// Every skill folder with a SKILL.md: { id, name (folder), dir (real path), origin, agents: [shown names],
// locations: [{ agent, path }], skill (folder name, when the id is not just the folder name), project?, projectPath? }.
// opts.projects = false skips the project walk (only the global folders).
export function listSkillDirs(opts = {}) {
  const src = opts.src || sources(opts);
  const out = [], byReal = new Map(), byHash = new Map(), ids = new Set();
  const addLocation = (e, agent, p) => {
    if (!e.agents.includes(AGENTS[agent])) e.agents.push(AGENTS[agent]);
    if (!e.locations.some(l => l.path === p)) e.locations.push({ agent: AGENTS[agent], path: p });
  };
  const addGlobal = ({ dir, agent, origin }) => {
    for (const f of skillFolders(dir)) {
      const same = byReal.get(f.real) || byHash.get(contentHash(f.real));
      if (same) { addLocation(same, agent, f.link); byReal.set(f.real, same); continue; }
      // omp ids are the folder name, as always (two omp folders with the same name keep sharing it, as before).
      const id = agent === 'omp' || !ids.has(f.name) ? f.name : `${f.name}@${agent}`;
      const e = { id, name: f.name, dir: f.real, origin, agents: [], locations: [] };
      if (id !== f.name) e.skill = f.name;
      addLocation(e, agent, f.link);
      out.push(e); ids.add(id); byReal.set(f.real, e);
      const h = contentHash(f.real); if (h && !byHash.has(h)) byHash.set(h, e);
    }
  };
  const addProject = (p, { sub, agent }) => {
    for (const f of skillFolders(path.join(p.path, sub))) {
      const same = byReal.get(f.real); // copies in other projects stay separate entries (REQ-CAT-015)
      if (same) { addLocation(same, agent, f.link); continue; }
      const base = `${f.name}@${p.label}`, id = ids.has(base) ? `${base}@${agent}` : base;
      const e = { id, name: f.name, dir: f.real, origin: 'proyecto', agents: [], locations: [], skill: f.name, project: p.label, projectPath: p.path };
      addLocation(e, agent, f.link);
      out.push(e); ids.add(id); byReal.set(f.real, e);
    }
  };
  // Order decides ids: omp's own folders, then omp's project folders (the only sources listed before), then the rest.
  const [ompUser, ompManaged, ...otherGlobal] = src.global;
  addGlobal(ompUser); addGlobal(ompManaged);
  const projects = opts.projects === false ? [] : findProjects({ src });
  for (const p of projects) addProject(p, PROJECT_SKILL_DIRS[0]);
  otherGlobal.forEach(addGlobal);
  for (const p of projects) for (const d of PROJECT_SKILL_DIRS.slice(1)) addProject(p, d);
  return out;
}

// Which catalogue entry a use belongs to. resolve(readPath, cwd, agent) takes a skill:// address or a file path;
// resolve.byName(name, cwd, agent) takes a bare skill name (Claude Code's Skill tool). A file path decides by folder;
// a name goes to the project skill when the session ran inside that project, else to the global skill of that name
// that this agent has, else to the global skill whose id is that name.
export function usageResolver(skills) {
  const byDir = new Map(), globals = new Map(), projects = [], memo = new Map();
  const realOnce = p => { if (!memo.has(p)) memo.set(p, real(p)); return memo.get(p); };
  const folder = s => s.skill || s.id;
  for (const s of skills) {
    byDir.set(s.path, s.id);
    if (s.origin === 'proyecto') projects.push(s);
    else { const f = folder(s); if (!globals.has(f)) globals.set(f, []); globals.get(f).push(s); }
  }
  const byName = (name, cwd, agent = 'omp') => {
    const rc = cwd ? (realOnce(cwd) || cwd) : '';
    const local = rc && projects.filter(s => folder(s) === name && inside(rc, s.projectPath)).sort((a, b) => b.projectPath.length - a.projectPath.length)[0];
    if (local) return local.id;
    const list = globals.get(name) || [], shown = AGENTS[agent] || agent;
    const mine = list.find(s => (s.agents || ['omp']).includes(shown)) || list.find(s => s.id === name);
    return mine ? mine.id : null;
  };
  const resolve = (readPath, cwd, agent = 'omp') => {
    const uri = readPath.match(/^skill:\/\/([^/:]+)/);
    if (uri) return byName(uri[1], cwd, agent);
    const file = readPath.match(/^(.*\/skills\/([^/]+))\/SKILL\.md/);
    if (!file) return null;
    const dirReal = realOnce(file[1]);
    if (dirReal && byDir.has(dirReal)) return byDir.get(dirReal);
    return byName(file[2], '', agent);
  };
  resolve.byName = byName;
  return resolve;
}
