// Scans the installed skills and the watchlist and writes web/data.js (generated, git-ignored).
import fs from 'node:fs';
import path from 'node:path';
import { triage } from './lib-security.mjs';
import { sources, listSkillDirs, usageResolver, PROJECT_SKILL_DIRS, AGENTS } from './skill-sources.mjs';
import { scanUsage } from './usage.mjs';
import { chooseRunner } from './runner.mjs';
import { HERE as here, DATA, dataFile, WATCHLIST, reportFile, shownPath } from './paths.mjs';
import { loadMeta } from './categories.mjs';
import { normalizeEntry, seasonStart as seasonOf, THIRD_PARTY_DIR } from './names.mjs';
import { readCache as readRarity, rarityOf } from './rarity.mjs';

const readJSON = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const meta = loadMeta();
const watch = readJSON(WATCHLIST, []);
if (Array.isArray(watch)) watch.forEach(normalizeEntry); // older status names read as English (names.mjs)
const rarityCache = readRarity();

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

// Every agent's skills plus each project's skills (skill-sources.mjs), one entry per skill with the agents that have
// it. Project skills are read-only, keyed "<folder>@<project>", and carry their project label; reports, meta and the
// watchlist match global skills by id, then folder name.
const src = sources();
const skills = [];
for (const { id, name, dir: real, origin, agents, locations, skill, project, projectPath } of listSkillDirs({ src })) {
  const txt = fs.readFileSync(path.join(real, 'SKILL.md'), 'utf8');
  const fm = frontmatter(txt);
  const m = meta.entry(id, name);
  const report = reportFile(id);
  skills.push({
    id, name: fm.name || name, description: fm.description || '',
    origin: THIRD_PARTY_DIR.test(real) ? 'third-party' : origin,
    agents, locations: locations.map(l => ({ agent: l.agent, path: shownPath(l.path) })),
    ...(skill ? { skill } : {}), ...(project ? { project, projectPath } : {}),
    author: fm.author || '', version: fm.version || '',
    category: meta.valid(m.category || meta.infer(name, fm.description)), icon: m.icon || '', emoji: m.emoji || '',
    lines: txt.split('\n').length, files: count(real), path: real,
    descTokens: Math.ceil((fm.description || '').length / 4), bodyTokens: Math.ceil(txt.length / 4),
    status: 'installed',
    // how uncommon it is on GitHub (rarity.mjs); project skills are never looked up
    rarity: project ? { tier: 'Common', repos: null, local: true } : rarityOf(fm.name || name, rarityCache),
    analysis: fs.existsSync(report) ? shownPath(report) : null,
    report: (() => { try { return fs.readFileSync(report, 'utf8'); } catch { return null; } })(),
  });
}

// ---- Real use: each agent's local logs (usage.mjs says what is counted and what is not) ----
const usage = scanUsage(src, usageResolver(skills));
const seasonStart = seasonOf(readJSON(dataFile('config.json'), {}));
for (const s of skills) {
  const u = s.usage = usage[s.id] || { total: 0, days: {}, last: '', agents: {} };
  u.since = Object.entries(u.days).reduce((a, [d, n]) => a + (d >= seasonStart ? n : 0), 0);
}
// ---- Security (SkillSpector + false-positive triage) ----
// Reviewed findings (security-triage.json in the data folder): [{skill,file,line,severity,category,pattern?,snippet?,file_sha256,condition (1-6, D-056),reason,reviewed_at}]
const sec = readJSON(path.join(here, 'cache/security.json'), {});
const reviewedAll = readJSON(dataFile('security-triage.json'), []);
for (const s of skills) {
  const c = sec[s.id];
  s.security = c ? { ...triage(c, reviewedAll.filter(r => r.skill === s.id), s.path), raw: c.recommendation, rawIssues: c.issues.length, coverage: c.coverage, scanned: c.scanned } : null;
}

// ---- Catalogue health ----
// Accented letters and a few Spanish stop words are kept so that descriptions written in Spanish compare well too.
const words = t => new Set(t.toLowerCase().replace(/[^a-záéíóúñ0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w)));
const STOP = new Set(['when', 'this', 'that', 'with', 'from', 'your', 'for', 'and', 'the', 'use', 'used', 'asked', 'skill', 'user', 'not', 'cuando', 'para', 'como', 'usar']);
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
  if (!s.description) warnings.push({ id: s.id, msg: 'No description: the agent cannot tell when to activate it' });
  else if (s.description.length > 600) warnings.push({ id: s.id, msg: `Very long description (${s.descTokens} tokens), loaded in every session` });
  if (s.bodyTokens > 8000) warnings.push({ id: s.id, msg: `Heavy skill (~${s.bodyTokens} tokens when loaded)` });
  if (s.security && ['review', 'critical'].includes(s.security.level)) warnings.push({ id: s.id, msg: `Security: ${s.security.counts.review + s.security.counts.stale} finding(s) to review after triage` });
}
const health = {
  totalDescTokens: skills.reduce((a, s) => a + s.descTokens, 0), totalBodyTokens: skills.reduce((a, s) => a + s.bodyTokens, 0),
  duplicates: duplicates.slice(0, 12), never, dormant, warnings,
  heavy: [...skills].sort((a, b) => b.bodyTokens - a.bodyTokens).slice(0, 5).map(s => ({ id: s.id, tokens: s.bodyTokens })),
  securityScanned: skills.filter(s => s.security).length,
};
const installed = new Set(skills.filter(s => s.origin !== 'project').flatMap(s => [s.id, s.skill].filter(Boolean))); // a skill living only inside a project is not installed globally
const wl = watch.filter(w => !installed.has(w.id)).map(w => ({ status: w.status || 'awaiting-analysis', description: w.note || '', origin: w.source || '', ...w, category: meta.valid(w.category), icon: meta.entry(w.id).icon || '', name: w.name || w.id, report: (() => { try { return fs.readFileSync(reportFile(w.id), 'utf8'); } catch { return null; } })() }));

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
// Where this scan looked, for the empty state and the runner that analyses and background jobs would use.
const looked = {
  global: src.global.map(g => ({ agent: AGENTS[g.agent], dir: shownPath(g.dir), found: fs.existsSync(g.dir) })),
  projectDirs: PROJECT_SKILL_DIRS.map(d => d.sub), projectRoots: src.projectRoots.map(shownPath),
};
const r = chooseRunner();
const runner = { kind: r.kind, label: r.label, setting: r.setting, available: r.available, notice: r.notice };
fs.writeFileSync(path.join(here, 'web/data.js'),
  'window.SKILLS_DATA = ' + JSON.stringify({ generated: new Date().toISOString(), seasonStart, dataDir: shownPath(DATA), categories: meta.forPage(), sources: looked, runner, health, skills, watchlist: wl }, null, 1) + ';\n');
const byAgent = {};
for (const s of skills) for (const a of s.agents) byAgent[a] = (byAgent[a] || 0) + 1;
console.log(`OK: ${skills.length} installed (${Object.entries(byAgent).map(([a, n]) => `${a} ${n}`).join(', ') || 'none'}), ${wl.length} on the watchlist`);
