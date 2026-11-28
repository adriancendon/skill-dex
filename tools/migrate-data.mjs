#!/usr/bin/env node
// Converts a Skill Dex data folder, once, to the English names this version writes (names.mjs). The app already reads
// the older names, so running this is optional; afterwards the files only hold the new names.
//   watchlist.json     statuses recomendada/en-analisis/analizando/descartada → recommended/awaiting-analysis/
//                      analysing/discarded (status and regen_from); analysis_file "analisis/…" → "reports/…";
//                      category keys renamed as in skills-meta.json (below)
//   config.json        "inicio" → "season_start"
//   skills-meta.json   each own category whose key differs from its shown English name gets that name as its key;
//                      the skill entries that use it follow
//   analisis/          reports move to reports/ (a report already in reports/ with other content is left in place
//                      and listed; reports/ is the one the app reads)
// Before changing anything it copies every file it will change or move into <data>/backups/migration-<timestamp>/.
// Running it again changes nothing. Nothing outside the data folder is touched.
// Usage: node tools/migrate-data.mjs [--data DIR] [--dry-run]
//   --data DIR  the data folder (default: SKILLDEX_DATA, else the default data folder of paths.mjs)
//   --dry-run   only print what would change
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPORTS_DIR, LEGACY_REPORTS_DIR, normalizeEntry } from '../names.mjs';

const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const exists = f => fs.existsSync(f);

// What would change in `dir`, without changing it: { changes: [{ file, lines: [] }], files: { rel: newContent },
// moves: [[from, to]], removes: [rel], conflicts: [rel] }. Throws when a JSON file cannot be read.
export function plan(dir) {
  const out = { changes: [], files: {}, moves: [], removes: [], conflicts: [] };
  const note = (file, line) => { let c = out.changes.find(x => x.file === file); if (!c) out.changes.push(c = { file, lines: [] }); c.lines.push(line); };
  const count = (map, k) => map.set(k, (map.get(k) || 0) + 1);
  const listed = map => [...map].map(([k, n]) => `${n} ${k}`).join(', ');

  // skills-meta.json: category keys → their shown names
  const rename = {};
  const metaFile = path.join(dir, 'skills-meta.json');
  if (exists(metaFile)) {
    const meta = readJSON(metaFile), cats = meta && typeof meta._categories === 'object' && !Array.isArray(meta._categories) ? meta._categories : null;
    if (cats) {
      const keys = Object.keys(cats);
      for (const k of keys) {
        const name = String(cats[k]?.name || '').trim();
        if (name && name !== k && !keys.includes(name) && !Object.values(rename).includes(name)) rename[k] = name;
      }
    }
    if (Object.keys(rename).length) {
      const next = {}, used = new Map();
      for (const [k, v] of Object.entries(meta)) {
        if (k === '_categories') { next._categories = Object.fromEntries(Object.entries(v).map(([ck, cv]) => [rename[ck] || ck, cv])); continue; }
        if (v && typeof v === 'object' && rename[v.category]) { count(used, v.category); next[k] = { ...v, category: rename[v.category] }; }
        else next[k] = v;
      }
      out.files['skills-meta.json'] = JSON.stringify(next, null, 2) + '\n';
      note('skills-meta.json', `${Object.keys(rename).length} category keys renamed to their shown names: ${Object.entries(rename).map(([a, b]) => `"${a}" → "${b}"`).join(', ')}`);
      if (used.size) note('skills-meta.json', `${[...used.values()].reduce((a, n) => a + n, 0)} skill entries follow`);
    }
  }

  // watchlist.json
  const wlFile = path.join(dir, 'watchlist.json');
  if (exists(wlFile)) {
    const list = readJSON(wlFile);
    if (Array.isArray(list)) {
      const statuses = new Map(), cats = new Map();
      let files = 0, changed = false;
      for (const w of list) {
        if (!w || typeof w !== 'object') continue;
        const before = { status: w.status, regen_from: w.regen_from, analysis_file: w.analysis_file };
        if (normalizeEntry(w)) {
          changed = true;
          for (const k of ['status', 'regen_from']) if (before[k] !== w[k]) count(statuses, `${before[k]} → ${w[k]}`);
          if (before.analysis_file !== w.analysis_file) files++;
        }
        if (rename[w.category]) { count(cats, `"${w.category}" → "${rename[w.category]}"`); w.category = rename[w.category]; changed = true; }
      }
      if (changed) {
        out.files['watchlist.json'] = JSON.stringify(list, null, 2) + '\n';
        if (statuses.size) note('watchlist.json', `statuses: ${listed(statuses)}`);
        if (files) note('watchlist.json', `${files} report paths ${LEGACY_REPORTS_DIR}/ → ${REPORTS_DIR}/`);
        if (cats.size) note('watchlist.json', `categories: ${listed(cats)}`);
      }
    }
  }

  // config.json
  const cfgFile = path.join(dir, 'config.json');
  if (exists(cfgFile)) {
    const cfg = readJSON(cfgFile);
    if (cfg && typeof cfg === 'object' && !Array.isArray(cfg) && Object.hasOwn(cfg, 'inicio')) {
      const next = {};
      for (const [k, v] of Object.entries(cfg)) {
        if (k === 'inicio') { if (!Object.hasOwn(cfg, 'season_start')) next.season_start = v; }
        else next[k] = v;
      }
      out.files['config.json'] = JSON.stringify(next, null, 2) + '\n';
      note('config.json', Object.hasOwn(cfg, 'season_start') ? '"inicio" removed ("season_start" is already set)' : '"inicio" → "season_start"');
    }
  }

  // analisis/ → reports/
  const oldDir = path.join(dir, LEGACY_REPORTS_DIR), newDir = path.join(dir, REPORTS_DIR);
  if (exists(oldDir) && fs.statSync(oldDir).isDirectory()) {
    let same = 0;
    for (const f of fs.readdirSync(oldDir).sort()) {
      const from = path.join(oldDir, f), to = path.join(newDir, f);
      if (!fs.statSync(from).isFile()) { out.conflicts.push(path.join(LEGACY_REPORTS_DIR, f)); continue; }
      if (!exists(to)) out.moves.push([path.join(LEGACY_REPORTS_DIR, f), path.join(REPORTS_DIR, f)]);
      else if (fs.readFileSync(from).equals(fs.readFileSync(to))) { out.removes.push(path.join(LEGACY_REPORTS_DIR, f)); same++; }
      else out.conflicts.push(path.join(LEGACY_REPORTS_DIR, f));
    }
    if (out.moves.length) note(`${LEGACY_REPORTS_DIR}/`, `${out.moves.length} reports moved to ${REPORTS_DIR}/`);
    if (same) note(`${LEGACY_REPORTS_DIR}/`, `${same} reports already in ${REPORTS_DIR}/ with the same content: the old copy is removed`);
    if (out.conflicts.length) note(`${LEGACY_REPORTS_DIR}/`, `${out.conflicts.length} left in place (another file with that name is already in ${REPORTS_DIR}/, or not a file): ${out.conflicts.join(', ')}`);
  }
  return out;
}

const writeAtomic = (file, text) => { const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, text); fs.renameSync(tmp, file); };

// Applies plan(dir). Returns { ...plan, backup } (backup: the folder with the copies, or null when nothing changed).
export function migrate(dir, { dryRun = false, now = new Date() } = {}) {
  const p = plan(dir);
  const touched = [...Object.keys(p.files), ...p.moves.map(([from]) => from), ...p.removes];
  if (dryRun || !touched.length) return { ...p, backup: null };
  const backup = path.join(dir, 'backups', `migration-${now.toISOString().replace(/[:.]/g, '-')}`);
  if (exists(backup)) throw new Error(`${backup} already exists`);
  for (const rel of touched) { // every file first, before anything changes
    const dest = path.join(backup, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(dir, rel), dest);
  }
  for (const [rel, text] of Object.entries(p.files)) writeAtomic(path.join(dir, rel), text);
  if (p.moves.length) fs.mkdirSync(path.join(dir, REPORTS_DIR), { recursive: true });
  for (const [from, to] of p.moves) fs.renameSync(path.join(dir, from), path.join(dir, to));
  for (const rel of p.removes) fs.rmSync(path.join(dir, rel));
  const oldDir = path.join(dir, LEGACY_REPORTS_DIR);
  if (exists(oldDir) && !fs.readdirSync(oldDir).length) fs.rmdirSync(oldDir);
  return { ...p, backup };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), at = args.indexOf('--data');
  const bad = args.filter((a, i) => !['--dry-run', '--data'].includes(a) && !(at >= 0 && i === at + 1));
  if (bad.length || (at >= 0 && !args[at + 1])) { console.error('Usage: node tools/migrate-data.mjs [--data DIR] [--dry-run]'); process.exit(2); }
  const dir = path.resolve(at >= 0 ? args[at + 1] : (await import('../paths.mjs')).DATA);
  const dryRun = args.includes('--dry-run');
  if (!exists(dir) || !fs.statSync(dir).isDirectory()) { console.error(`No data folder at ${dir}`); process.exit(1); }
  let r;
  try { r = migrate(dir, { dryRun }); } catch (e) { console.error(`Nothing was changed: ${e.message}`); process.exit(1); }
  console.log(`Data folder: ${dir}${dryRun ? ' (dry run: nothing is changed)' : ''}`);
  if (!r.changes.length) console.log('Nothing to change: the folder already uses the new names.');
  for (const c of r.changes) for (const l of c.lines) console.log(`${c.file}: ${l}`);
  if (r.backup) console.log(`Backup of every changed file: ${r.backup}`);
  else if (dryRun && r.changes.length) console.log(`A real run first copies every file it changes into ${path.join(dir, 'backups', 'migration-<timestamp>')}.`);
}
