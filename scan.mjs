// Scans the installed skills and the watchlist and writes web/data.js (generated, git-ignored).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { triage } from './lib-security.mjs';
import { listSkillDirs, usageResolver } from './skill-sources.mjs';
import { HERE as here, DATA, dataFile, WATCHLIST, ANALYSIS_DIR, shownPath } from './paths.mjs';
import { loadMeta } from './categories.mjs';

const home = os.homedir();
const readJSON = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const meta = loadMeta();
const watch = readJSON(WATCHLIST, []);

function frontmatter(txt) {
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (!m) return out;
  let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kv) { key = kv[1]; out[key] = /^[>|][-+]?$/.test(kv[2]) ? '' : kv[2].replace(/^["']|["']$/g, ''); }
    else if (key && /^\s+\S/.test(line) && !line.includes(':')) out[key] += ' ' + line.trim();
  }
  for (const k of Object.keys(out)) out[k] = String(out[k]).trim();
  return out;
}
const count = d => { let n = 0; try { for (const e of fs.readdirSync(d, { withFileTypes: true })) n += e.isDirectory() ? count(path.join(d, e.name)) : 1; } catch {} return n; };

// omp skills plus each project's skills (skill-sources.mjs). Project skills are read-only, keyed "<folder>@<project>",
// and carry their project label; reports, meta and the watchlist match omp skills by folder name only.
const skills = [];
for (const { id, name, dir: real, origin, project, projectPath } of listSkillDirs()) {
  const txt = fs.readFileSync(path.join(real, 'SKILL.md'), 'utf8');
  const fm = frontmatter(txt);
  const m = meta.entry(id, name);
  const reportFile = path.join(ANALYSIS_DIR, id + '.md');
  skills.push({
    id, name: fm.name || name, description: fm.description || '',
    origin: /skills-terceros/.test(real) ? 'tercero' : origin,
    ...(project ? { skill: name, project, projectPath } : {}),
    author: fm.author || '', version: fm.version || '',
    category: meta.valid(m.category || meta.infer(name, fm.description)), icon: m.icon || '', emoji: m.emoji || '',
    lines: txt.split('\n').length, files: count(real), path: real,
    descTokens: Math.ceil((fm.description || '').length / 4), bodyTokens: Math.ceil(txt.length / 4),
    status: 'instalada',
    analysis: fs.existsSync(reportFile) ? shownPath(reportFile) : null,
    report: (() => { try { return fs.readFileSync(reportFile, 'utf8'); } catch { return null; } })(),
  });
}

// ---- Uso real: cuenta lecturas de skills en las sesiones de omp ----
const SESS = path.join(home, '.omp/agent/sessions');
const seen = new Set(), usage = {}; // usage[id] = {total, days:{YYYY-MM-DD:n}, last}
const resolveUse = usageResolver(skills);
function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.jsonl')) scanFile(p); } }
function scanFile(f) {
  let cwd = ''; // the session header names the folder it ran in; it decides which project's skill a skill:// read means
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!cwd && line.includes('"type":"session"')) { try { cwd = JSON.parse(line).cwd || ''; } catch {} }
    if (!line.includes('"toolCall"') || !line.includes('"read"')) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const ts = o.timestamp, c = o.message?.role === 'assistant' && o.message.content;
    if (!Array.isArray(c)) continue;
    for (const t of c) {
      if (t.type !== 'toolCall' || t.name !== 'read' || seen.has(t.id)) continue;
      const p = t.arguments?.path || '';
      const id = resolveUse(p, cwd);
      if (!id) continue;
      seen.add(t.id);
      const u = (usage[id] ??= { total: 0, days: {}, last: '' });
      const day = ts.slice(0, 10); u.total++; u.days[day] = (u.days[day] || 0) + 1; if (ts > u.last) u.last = ts;
    }
  }
}
if (fs.existsSync(SESS)) walk(SESS);
const inicio = readJSON(dataFile('config.json'), {}).inicio || '1970-01-01';
for (const s of skills) {
  const u = s.usage = usage[s.id] || { total: 0, days: {}, last: '' };
  u.since = Object.entries(u.days).reduce((a, [d, n]) => a + (d >= inicio ? n : 0), 0);
}
// ---- Seguridad (SkillSpector + triaje de falsos positivos) ----
// Reviewed findings (security-triage.json in the data folder): [{skill,file,line,severity,category,pattern?,snippet?,file_sha256,condition (1-6, D-056),reason,reviewed_at}]
const sec = readJSON(path.join(here, 'cache/security.json'), {});
const reviewedAll = readJSON(dataFile('security-triage.json'), []);
for (const s of skills) {
  const c = sec[s.id];
  s.security = c ? { ...triage(c, reviewedAll.filter(r => r.skill === s.id), s.path), raw: c.recommendation, rawIssues: c.issues.length, coverage: c.coverage, scanned: c.scanned } : null;
}

// ---- Salud del catálogo ----
const words = t => new Set(t.toLowerCase().replace(/[^a-záéíóúñ0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w)));
const STOP = new Set(['when', 'this', 'that', 'with', 'from', 'your', 'for', 'and', 'the', 'use', 'used', 'asked', 'skill', 'user', 'not', 'cuando', 'para', 'como', 'usar', 'use']);
const W = skills.map(s => words(s.description));
const duplicates = [];
// The same skill copied into several projects is not a "similar pair", and a pair of skills is listed once.
const folderOf = s => s.skill || s.id, pairSeen = new Set();
for (let i = 0; i < skills.length; i++) for (let j = i + 1; j < skills.length; j++) {
  const key = [folderOf(skills[i]), folderOf(skills[j])].sort().join('|');
  if (folderOf(skills[i]) === folderOf(skills[j]) || pairSeen.has(key)) continue;
  const inter = [...W[i]].filter(w => W[j].has(w)).length, sim = inter / (new Set([...W[i], ...W[j]]).size || 1);
  if (sim >= 0.2) { duplicates.push({ a: skills[i].id, b: skills[j].id, sim: +sim.toFixed(2) }); pairSeen.add(key); }
}
duplicates.sort((x, y) => y.sim - x.sim);
const never = skills.filter(s => s.usage.total === 0).map(s => s.id);
const dormant = skills.filter(s => s.usage.total > 0 && s.usage.since === 0).map(s => s.id);
const warnings = [];
for (const s of skills) {
  if (!s.description) warnings.push({ id: s.id, msg: 'No description: omp cannot tell when to activate it' });
  else if (s.description.length > 600) warnings.push({ id: s.id, msg: `Very long description (${s.descTokens} tokens), loaded in every session` });
  if (s.bodyTokens > 8000) warnings.push({ id: s.id, msg: `Heavy skill (~${s.bodyTokens} tokens when loaded)` });
  if (s.security && ['revisar', 'critico'].includes(s.security.level)) warnings.push({ id: s.id, msg: `Security: ${s.security.counts.revisar + s.security.counts.caducada} finding(s) to review after triage` });
}
const health = {
  totalDescTokens: skills.reduce((a, s) => a + s.descTokens, 0), totalBodyTokens: skills.reduce((a, s) => a + s.bodyTokens, 0),
  duplicates: duplicates.slice(0, 12), never, dormant, warnings,
  heavy: [...skills].sort((a, b) => b.bodyTokens - a.bodyTokens).slice(0, 5).map(s => ({ id: s.id, tokens: s.bodyTokens })),
  securityScanned: skills.filter(s => s.security).length,
};
const installed = new Set(skills.filter(s => s.origin !== 'proyecto').map(s => s.id)); // a skill living only inside a project is not installed in omp
const wl = watch.filter(w => !installed.has(w.id)).map(w => ({ status: w.status || 'en-analisis', description: w.note || '', origin: w.source || '', ...w, category: meta.valid(w.category), icon: meta.entry(w.id).icon || '', name: w.name || w.id, report: (() => { try { return fs.readFileSync(path.join(ANALYSIS_DIR, w.id + '.md'), 'utf8'); } catch { return null; } })() }));

// ---- Short descriptions (short-descriptions.json in the data folder, {id: "short English line"}, editable by hand) ----
// Missing ones get a trimmed first sentence and shortMissing: true; the server asks an agent to write them.
const shorts = readJSON(dataFile('short-descriptions.json'), {});
const firstSentence = t => {
  const first = String(t || '').split(/(?<=[.!?])\s/)[0].trim();
  return first.length > 60 ? first.slice(0, 57).trimEnd() + '…' : first;
};
for (const s of [...skills, ...wl]) {
  const own = typeof shorts[s.id] === 'string' && shorts[s.id].trim();
  s.short = own || firstSentence(s.description || s.note);
  if (!own) s.shortMissing = true;
}
fs.writeFileSync(path.join(here, 'web/data.js'),
  'window.SKILLS_DATA = ' + JSON.stringify({ generated: new Date().toISOString(), inicio, dataDir: shownPath(DATA), categories: meta.forPage(), health, skills, watchlist: wl }, null, 1) + ';\n');
console.log(`OK: ${skills.length} installed, ${wl.length} on the watchlist`);
