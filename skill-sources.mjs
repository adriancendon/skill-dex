// Where Skill Dex finds skills (REQ-CAT-001, REQ-CAT-015): the two omp folders, plus the skills inside each project.
// Read-only: nothing here writes to any skill or project folder.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const home = os.homedir();
export const GLOBAL_SOURCES = [
  { dir: path.join(home, '.omp/agent/skills'), origin: 'usuario' },
  { dir: path.join(home, '.omp/agent/managed-skills'), origin: 'auto-aprendida' },
];
// Skill folders looked for inside each project. omp loads `.omp/skills`; add '.claude/skills' or '.agents/skills' to list those too.
export const PROJECT_SKILL_DIRS = ['.omp/skills'];
// Projects are found by walking these folders (a few levels deep) and from the folders named by the omp sessions.
export const PROJECT_ROOTS = [path.join(home, 'Developer')];
const WALK_DEPTH = 4;
const SKIP_DIRS = new Set(['node_modules', 'Library', 'vendor', 'dist', 'build', 'venv', 'target', '__pycache__']);
const SESSIONS = path.join(home, '.omp/agent/sessions');

const real = p => { try { return fs.realpathSync(p); } catch { return null; } };
const inside = (p, base) => p === base || p.startsWith(base + path.sep);
const IGNORED = [path.join(home, '.omp'), os.tmpdir(), '/tmp', '/private/tmp', '/var/folders', '/private/var/folders'].map(p => real(p) || p);

// Session headers name the folder each omp session ran in ({"type":"session",...,"cwd":"..."}), usually on line 1 or 2.
export function sessionCwd(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(8192), n = fs.readSync(fd, buf, 0, buf.length, 0);
    for (const line of buf.toString('utf8', 0, n).split('\n')) {
      if (!line.includes('"type":"session"')) continue;
      const m = line.match(/"cwd":("(?:[^"\\]|\\.)*")/);
      return m ? JSON.parse(m[1]) : '';
    }
  } catch {} finally { if (fd !== undefined) fs.closeSync(fd); }
  return '';
}

function sessionFolders() {
  const out = new Set();
  let dirs = [];
  try { dirs = fs.readdirSync(SESSIONS, { withFileTypes: true }).filter(e => e.isDirectory()); } catch { return out; }
  for (const d of dirs) {
    let files = [];
    try { files = fs.readdirSync(path.join(SESSIONS, d.name)).filter(f => f.endsWith('.jsonl')); } catch { continue; }
    for (const f of files) { const cwd = sessionCwd(path.join(SESSIONS, d.name, f)); if (cwd) out.add(cwd); }
  }
  return out;
}

function walk(dir, depth, out) {
  if (PROJECT_SKILL_DIRS.some(sub => fs.existsSync(path.join(dir, sub)))) out.add(dir);
  if (!depth) return;
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) if (e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), depth - 1, out);
}

// Project folders that hold skills, deduplicated by real path, each with a unique label (folder name, or parent/folder on a clash).
export function findProjects() {
  const found = new Set();
  for (const r of PROJECT_ROOTS) walk(r, WALK_DEPTH, found);
  for (const cwd of sessionFolders()) found.add(cwd);
  const byReal = new Map();
  for (const p of found) {
    const rp = real(p);
    if (!rp || rp === home || IGNORED.some(b => inside(rp, b)) || byReal.has(rp)) continue;
    if (PROJECT_SKILL_DIRS.some(sub => fs.existsSync(path.join(rp, sub)))) byReal.set(rp, p);
  }
  const list = [...byReal.keys()].sort().map(rp => ({ path: rp, label: path.basename(rp) }));
  for (const p of list) {
    if (list.filter(x => x.label === path.basename(p.path)).length > 1) p.label = path.join(path.basename(path.dirname(p.path)), path.basename(p.path));
  }
  return list;
}

const skillFolders = dir => {
  let names = [];
  try { names = fs.readdirSync(dir).sort(); } catch { return []; }
  return names.map(name => ({ name, real: real(path.join(dir, name)) })).filter(x => x.real && fs.existsSync(path.join(x.real, 'SKILL.md')));
};

// Every skill folder with a SKILL.md: { id, name (folder), dir (real path), origin, project?, projectPath? }.
// Project skills get the id "<folder>@<project label>", so the same skill in two projects stays two entries.
// A project entry that is the very same folder as an omp skill (a symlink) is not listed twice.
export function listSkillDirs() {
  const out = [], seen = new Set();
  for (const { dir, origin } of GLOBAL_SOURCES) {
    for (const { name, real: dirReal } of skillFolders(dir)) { out.push({ id: name, name, dir: dirReal, origin }); seen.add(dirReal); }
  }
  for (const p of findProjects()) {
    for (const sub of PROJECT_SKILL_DIRS) {
      for (const { name, real: dirReal } of skillFolders(path.join(p.path, sub))) {
        if (seen.has(dirReal)) continue;
        seen.add(dirReal);
        out.push({ id: `${name}@${p.label}`, name, dir: dirReal, origin: 'proyecto', project: p.label, projectPath: p.path });
      }
    }
  }
  return out;
}

// Which catalogue entry a `read` of a skill belongs to. A file path decides by folder; `skill://name` goes to the
// project skill when the session ran inside that project, else to the omp skill of that name.
export function usageResolver(skills) {
  const byDir = new Map(), globalIds = new Set(), projects = [], memo = new Map();
  const realOnce = p => { if (!memo.has(p)) memo.set(p, real(p)); return memo.get(p); };
  for (const s of skills) {
    byDir.set(s.path, s.id);
    if (s.origin === 'proyecto') projects.push(s); else globalIds.add(s.id);
  }
  return (readPath, cwd) => {
    const uri = readPath.match(/^skill:\/\/([^/:]+)/);
    if (uri) {
      const name = uri[1], rc = cwd ? (realOnce(cwd) || cwd) : '';
      const local = rc && projects.filter(s => s.skill === name && inside(rc, s.projectPath)).sort((a, b) => b.projectPath.length - a.projectPath.length)[0];
      return local ? local.id : globalIds.has(name) ? name : null;
    }
    const file = readPath.match(/^(.*\/skills\/([^/]+))\/SKILL\.md/);
    if (!file) return null;
    const dirReal = realOnce(file[1]);
    if (dirReal && byDir.has(dirReal)) return byDir.get(dirReal);
    return globalIds.has(file[2]) ? file[2] : null;
  };
}
