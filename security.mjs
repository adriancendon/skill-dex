// Scans every installed skill and every project skill (skill-sources.mjs) with SkillSpector (static, --no-llm).
// Only skills that changed are scanned again. Every finding is saved in cache/security.json; triage is applied in
// scan.mjs, so it can be adjusted without scanning again.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { BIN, SCHEMA, run, compact } from './lib-security.mjs';
import { listSkillDirs } from './skill-sources.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'cache/security.json');
if (!fs.existsSync(BIN)) { console.error('SkillSpector is not installed in .venv-skillspector next to this script.'); process.exit(0); }
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

function hashDir(d) {
  const h = crypto.createHash('sha1');
  (function walk(p) { for (const e of fs.readdirSync(p, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const f = path.join(p, e.name);
    if (fs.statSync(f).isDirectory()) walk(f); else { h.update(e.name); h.update(fs.readFileSync(f)); } } })(d);
  return h.digest('hex');
}
// Keyed like the catalogue: the folder name for omp skills, "<folder>@<project>" for project skills.
const jobs = listSkillDirs().map(({ id, dir }) => ({ id, real: dir, hash: hashDir(dir) }));
const todo = jobs.filter(j => cache[j.id]?.hash !== j.hash || cache[j.id]?.v !== SCHEMA);
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < todo.length) {
    const j = todo[i++], r = await run(j.real);
    if (!r) { console.error('failed:', j.id); continue; }
    cache[j.id] = { hash: j.hash, ...compact(r) };
    console.log(`${j.id}: ${cache[j.id].recommendation} issues=${cache[j.id].issues.length}`);
  }
}));
const ids = new Set(jobs.map(j => j.id)); for (const k of Object.keys(cache)) if (!ids.has(k)) delete cache[k];
fs.writeFileSync(OUT, JSON.stringify(cache, null, 1));
console.log(`security: ${todo.length} scanned, ${jobs.length - todo.length} from cache`);
