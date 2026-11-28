// Rarity (REQ-USE-013): how uncommon a skill is on GitHub, not how big it is. Measured with the GitHub CLI login
// already on this computer (`gh`): a code search for public SKILL.md files that declare the skill's name
// (filename:SKILL.md "name: <name>"), keeping only files whose matched text has that exact `name:` line, counted by
// repository. Tiers: found in 1 repository Legendary, 2-9 Epic, 10-49 Rare, 50 or more Common. More than 100 matching
// files also counts as Common (only the first 100 are read). Not found, not known yet, no gh, no login or an error:
// Common. Results are cached in cache/rarity.json (git-ignored) for 7 days and looked up in small, spaced batches by the
// server in the background, so the page never waits for GitHub. Only the names of global skills are searched; project
// skills are never looked up, so their names stay on this computer.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { HERE } from './paths.mjs';

export const CACHE_FILE = path.join(HERE, 'cache', 'rarity.json');
export const TTL = 7 * 24 * 3600e3;
export const PAGE = 100; // results read per search; a name with more matching files than this is Common
const SAFE = /^[A-Za-z0-9][\w.-]{0,99}$/;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function tierOf(repos, files = 0) {
  if (files > PAGE) return 'Common';
  if (!Number.isInteger(repos) || repos < 1) return 'Common';
  if (repos === 1) return 'Legendary';
  if (repos <= 9) return 'Epic';
  if (repos <= 49) return 'Rare';
  return 'Common';
}

export const cacheKey = name => String(name || '').trim().toLowerCase();
export function readCache(file = CACHE_FILE) {
  try { const c = JSON.parse(fs.readFileSync(file, 'utf8')); return c && typeof c === 'object' && !Array.isArray(c) ? c : {}; } catch { return {}; }
}
function writeCache(file, cache) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 1) + '\n');
  fs.renameSync(tmp, file);
}
const fresh = (e, now) => e && Number.isFinite(Date.parse(e.checked_at)) && now - Date.parse(e.checked_at) < TTL;

// What the page shows for one skill: { tier, repos (null when unknown), files, checked_at }.
export function rarityOf(name, cache, now = Date.now()) {
  const e = cache[cacheKey(name)];
  if (!fresh(e, now)) return { tier: 'Common', repos: null };
  return { tier: tierOf(e.repos, e.files), repos: e.repos, files: e.files, checked_at: e.checked_at };
}
// Names with no fresh result, in the order given.
export const staleNames = (names, cache, now = Date.now()) =>
  [...new Set(names.map(cacheKey))].filter(n => SAFE.test(n) && !fresh(cache[n], now));

const ghBin = env => env.GH_BIN || [path.join(os.homedir(), '.local/bin/gh'), '/opt/homebrew/bin/gh', '/usr/local/bin/gh'].find(p => fs.existsSync(p)) || 'gh';
const runGh = (gh, args) => new Promise(res => execFile(gh, args, { timeout: 45000, maxBuffer: 30e6, env: { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1', GH_NO_UPDATE_NOTIFIER: '1' } },
  (e, out, err) => res({ code: e ? (e.code === 'ENOENT' ? 'ENOENT' : e.code ?? 1) : 0, out: String(out || ''), err: String(err || e?.message || '') })));

// One search. Returns { repos, files } or throws an Error with kind: missing | auth | rate | other.
export async function lookup(name, gh = ghBin(process.env)) {
  const fail = (msg, kind) => Object.assign(new Error(msg), { kind });
  if (!SAFE.test(name)) throw fail('Name cannot be searched', 'other');
  const r = await runGh(gh, ['api', '-X', 'GET', 'search/code', '-H', 'Accept: application/vnd.github.text-match+json',
    '-f', `q=filename:SKILL.md "name: ${name}"`, '-f', `per_page=${PAGE}`]);
  if (r.code === 'ENOENT') throw fail('gh is not installed', 'missing');
  if (r.code !== 0) {
    const t = r.err + r.out;
    if (/rate limit|HTTP 429|HTTP 403|abuse/i.test(t)) throw fail('GitHub search limit reached', 'rate');
    if (/HTTP 401|auth login|not logged/i.test(t)) throw fail('No GitHub login', 'auth');
    throw fail('GitHub search failed', 'other');
  }
  let d; try { d = JSON.parse(r.out); } catch { throw fail('Unreadable answer', 'other'); }
  const exact = new RegExp(`^\\s*name:\\s*["']?${esc(name)}["']?\\s*$`, 'im');
  const repos = new Set();
  for (const it of Array.isArray(d.items) ? d.items : []) {
    const frags = (it.text_matches || []).map(t => String(t.fragment || ''));
    if ((!frags.length || frags.some(f => exact.test(f))) && it.repository?.full_name) repos.add(it.repository.full_name.toLowerCase());
  }
  return { repos: repos.size, files: Number(d.total_count) || 0 };
}

// Background lookups: `batch` names at a time, `spacing` ms apart (GitHub allows 10 code searches a minute; Discover
// uses up to 8), then a pause of `pause` ms before the next batch. A rate limit waits `backoff` ms; no gh or no login
// stops lookups for this server run. onChange() runs once `refreshEvery` results are stored and when lookups end.
export function createRarity({ names, onChange = () => {}, gh = ghBin(process.env), file = CACHE_FILE, batch = 3, spacing = 20e3, pause = 60e3, backoff = 300e3, refreshEvery = 12, busy = () => false } = {}) {
  let timer = null, running = false, off = false;
  const wait = ms => new Promise(r => { timer = setTimeout(r, ms); });
  const store = (n, v) => { const c = readCache(file); c[n] = v; writeCache(file, c); };
  async function fill() {
    if (running || off) return;
    running = true;
    let unseen = 0; // results stored since the last onChange()
    try {
      while (!off) {
        if (busy()) { await wait(pause); continue; }
        const todo = staleNames(names(), readCache(file)).slice(0, batch);
        if (!todo.length) break;
        let stop = 0;
        for (const [i, n] of todo.entries()) {
          if (i) await wait(spacing);
          try {
            store(n, { ...await lookup(n, gh), checked_at: new Date().toISOString() }); unseen++;
          } catch (e) {
            if (e.kind === 'missing' || e.kind === 'auth') { off = true; break; }
            if (e.kind === 'rate') { stop = backoff; break; }
            // any other error: unknown (Common) for a day, then tried again
            store(n, { repos: null, files: 0, error: true, checked_at: new Date(Date.now() - TTL + 24 * 3600e3).toISOString() });
          }
        }
        if (unseen >= refreshEvery) { unseen = 0; await onChange(); }
        if (off) break;
        await wait(stop || pause);
      }
      if (unseen) await onChange();
    } finally { running = false; timer = null; }
  }
  return { fill, stop() { off = true; clearTimeout(timer); }, running: () => running };
}
