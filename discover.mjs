// Discover (REQ-DIS-001..010): finds agent skills on GitHub with the GitHub CLI login already on this Mac.
// Never installs anything (REQ-DIS-004); its only write besides the cache is "Add to watchlist" (REQ-DIS-007).
// No key is stored: authenticated calls go through `gh api`, which keeps the token in the macOS keychain (REQ-DIS-008).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { WATCHLIST } from './paths.mjs';
import { loadMeta } from './categories.mjs';
import { readWatchlist, writeWatchlist } from './watchlist.mjs';
import { ORIGIN_FILES, originName } from './names.mjs';

const TTL_SEARCH = 6 * 3600e3, TTL_POPULAR = 24 * 3600e3, TTL_PARTIAL = 10 * 60e3, CACHE_KEEP = 7 * 24 * 3600e3; // results left incomplete by limits are kept 10 minutes
const POPULAR_SIZE = 30; // the popular pick comes from this many of the most-starred skill repositories
// The cache file never grows without bound: at most this many entries and this many bytes; the oldest go first.
export const CACHE_MAX_ENTRIES = 200, CACHE_MAX_BYTES = 2e6;

// Drops entries older than `keep`, then the oldest ones until both caps hold. Returns the same object.
export function trimCache(c, now = Date.now(), { keep = CACHE_KEEP, maxEntries = CACHE_MAX_ENTRIES, maxBytes = CACHE_MAX_BYTES } = {}) {
  for (const k of Object.keys(c)) if (now - (c[k]?.at || 0) > keep) delete c[k];
  const oldestFirst = Object.keys(c).sort((a, b) => (c[a]?.at || 0) - (c[b]?.at || 0));
  let size = Buffer.byteLength(JSON.stringify(c));
  while (oldestFirst.length && (oldestFirst.length > maxEntries || size > maxBytes)) {
    const k = oldestFirst.shift();
    size -= Buffer.byteLength(JSON.stringify(k)) + Buffer.byteLength(JSON.stringify(c[k])) + 2; // "key":value,
    delete c[k];
  }
  return c;
}
const SUGGEST_PER_GROUP = 3; // suggestions shown for each of the three most-used skills
const TOPICS = ['agent-skills', 'claude-skills']; // GitHub topics that repositories use to say they hold agent skills
// Self-imposed per-minute budgets, under GitHub's limits (search: 30 signed in, 10 anonymous; code search: 10, signed in only).
const BUDGET = { search: 26, searchAnon: 8, code: 8 };
const SAFE_NAME = /^[A-Za-z0-9_.-]{1,100}$/, SAFE_PATH = /^[\w.\-@+ /]{1,300}$/;
// Words of a skill (id first, then description) → the GitHub search term used for "Suggested for you". Order matters.
const TERMS = [
  [/accessib|a11y|wcag/i, 'accessibility'], [/\bseo\b|seo-|search engine/i, 'seo'], [/ui-ux|\bui\b|\bux\b|interface design/i, 'ui design'],
  [/frontend|front-end/i, 'frontend'], [/design/i, 'design'], [/perform|core.web.vitals|page speed/i, 'web performance'],
  [/copywrit|copy-edit/i, 'copywriting'], [/\bads?\b|advertis|ppc/i, 'ads'], [/marketing|\bcro\b|conversion/i, 'marketing'],
  [/analytics|tracking/i, 'analytics'], [/secur|vulnerab/i, 'security'], [/brain|knowledge base|notes|memory/i, 'second brain'],
  [/skill.creator|create[^.]*skills?/i, 'skill creator'], [/voice|speech/i, 'voice'], [/orchestrat|agency|website/i, 'web design'],
  [/\btest|\bqa\b/i, 'testing'],
];

const norm = u => String(u || '').trim().toLowerCase().replace(/\.git$/, '').replace(/\/+$/, '');
const slugify = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };
const readJSON = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const clip = (t, n = 220) => {
  const s = String(t || '').replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n), stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return stop > n * 0.45 ? cut.slice(0, stop + 1) : cut.replace(/\s+\S*$/, '') + '…';
};
const latin = t => { const s = String(t || ''); if (!s) return false; const ok = [...s].filter(c => c.charCodeAt(0) < 0x250 || /[\u2010-\u2027]/.test(c)).length; return ok / [...s].length > 0.95; };

// name and description from a SKILL.md frontmatter, including folded (>) and literal (|) blocks
function frontmatter(txt) {
  const m = String(txt || '').match(/^\uFEFF?\s*---\r?\n([\s\S]*?)\r?\n---/);
  const out = { name: '', description: '' };
  if (!m) return out;
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^(name|description):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (!v || /^[>|][-+]?$/.test(v)) {
      const parts = [];
      while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || !lines[i + 1].trim())) parts.push(lines[++i].trim());
      v = parts.join(' ').trim();
    }
    out[kv[1]] = v.replace(/^["']|["']$/g, '');
  }
  return out;
}

class GhError extends Error {
  constructor(msg, kind) { super(msg); this.kind = kind; } // kind: rate | auth | missing | other
}

export function createDiscover({ here, rescan }) {
  // The watchlist file comes from paths.mjs (SKILLDEX_WATCHLIST points it at a temporary copy for tests).
  const WL = WATCHLIST;
  const DATA = path.join(here, 'web', 'data.js');
  const CACHE = path.join(here, 'cache', 'discover-cache.json'); // git-ignored
  const ERRORS = path.join(here, 'cache', 'discover-errors.log'); // what GitHub answered when a call failed, for troubleshooting
  const GH = process.env.GH_BIN || [path.join(os.homedir(), '.local/bin/gh'), '/opt/homebrew/bin/gh', '/usr/local/bin/gh'].find(p => fs.existsSync(p)) || 'gh';

  // ---------- GitHub access ----------
  const runGh = args => new Promise(res => execFile(GH, args, { timeout: 45000, maxBuffer: 30e6, env: { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1', GH_NO_UPDATE_NOTIFIER: '1' } },
    (e, out, err) => res({ code: e ? (e.code === 'ENOENT' ? 'ENOENT' : e.code ?? 1) : 0, out: String(out || ''), err: String(err || e?.message || '') })));
  const failure = (err, code, what = '') => {
    try {
      fs.mkdirSync(path.dirname(ERRORS), { recursive: true });
      const line = `${new Date().toISOString()} ${code} ${what} ${String(err).replace(/\s+/g, ' ').slice(0, 300)}\n`;
      if ((fs.statSync(ERRORS, { throwIfNoEntry: false })?.size || 0) > 2e5) fs.writeFileSync(ERRORS, line); else fs.appendFileSync(ERRORS, line);
    } catch {}
    if (code === 'ENOENT') return new GhError('The GitHub command line (gh) is not installed.', 'missing');
    if (/rate limit|HTTP 429|abuse/i.test(err)) return new GhError("GitHub's search limit was reached. Try again in a minute.", 'rate');
    if (/HTTP 401|auth login|not logged/i.test(err)) return new GhError('The GitHub login on this Mac did not work.', 'auth');
    return new GhError('GitHub did not answer as expected. Try again later.', 'other');
  };
  async function ghJSON(args) {
    const r = await runGh(args);
    if (r.code !== 0) throw failure(r.err + r.out, r.code);
    try { return JSON.parse(r.out); } catch { throw new GhError('GitHub sent an answer Skill Dex could not read.', 'other'); }
  }
  let auth = { at: 0, ok: null };
  async function signedIn() {
    if (auth.ok !== null && Date.now() - auth.at < 600e3) return auth.ok;
    const r = await runGh(['auth', 'status', '--hostname', 'github.com']);
    auth = { at: Date.now(), ok: r.code === 0 };
    return auth.ok;
  }
  const calls = { search: [], code: [] };
  function spend(bucket, limit) {
    const now = Date.now(), list = calls[bucket] = calls[bucket].filter(t => now - t < 60e3);
    if (list.length >= limit) return false;
    list.push(now); return true;
  }

  const repoItem = r => ({ kind: 'repo', repo: r.full_name, name: r.name, url: r.html_url, description: r.description || '', stars: r.stargazers_count, pushedAt: r.pushed_at, archived: !!r.archived });
  async function searchRepos(q, signed, per, ctx) {
    if (!spend('search', signed ? BUDGET.search : BUDGET.searchAnon)) { ctx.skipped = true; return []; }
    const params = { q, sort: 'stars', order: 'desc', per_page: String(per) };
    let out;
    if (signed) out = await ghJSON(['api', '-X', 'GET', 'search/repositories', ...Object.entries(params).flatMap(([k, v]) => ['-f', `${k}=${v}`])]);
    else {
      let r;
      try { r = await fetch('https://api.github.com/search/repositories?' + new URLSearchParams(params), { headers: { accept: 'application/vnd.github+json', 'user-agent': 'skill-dex' }, signal: AbortSignal.timeout(20000) }); }
      catch { throw new GhError('Could not reach GitHub. Check the internet connection.', 'other'); }
      if (r.status === 403 || r.status === 429) throw new GhError("GitHub's public search limit was reached. Try again in a minute.", 'rate');
      if (!r.ok) throw new GhError('GitHub did not answer as expected. Try again later.', 'other');
      out = await r.json();
    }
    return (out.items || []).filter(r => SAFE_NAME.test(r.owner?.login || '') && SAFE_NAME.test(r.name || '')).map(repoItem);
  }
  async function searchFiles(words, per, inPath, ctx) { // signed in only: GitHub's code search needs a login
    if (!spend('code', BUDGET.code)) { ctx.skipped = true; return []; }
    const out = await ghJSON(['api', '-X', 'GET', 'search/code', '-f', `q=${words}${inPath ? ' in:path' : ''} filename:SKILL.md`, '-f', `per_page=${per}`]);
    return (out.items || []).filter(it => path.posix.basename(it.path || '') === 'SKILL.md' && SAFE_PATH.test(it.path) && SAFE_NAME.test(it.repository?.owner?.login || '') && SAFE_NAME.test(it.repository?.name || '') && !/(^|\/)(node_modules|templates?|examples?)\//i.test(it.path))
      .map(it => {
        const dir = path.posix.dirname(it.path);
        return { kind: 'skill', repo: it.repository.full_name, path: it.path, name: dir === '.' ? it.repository.name : path.posix.basename(dir), url: `https://github.com/${it.repository.full_name}${dir === '.' ? '' : `/tree/HEAD/${dir}`}`, description: '', stars: null };
      });
  }

  // One GraphQL call per batch adds what search does not give: stars of skill files, each SKILL.md description, and how many skills a repository holds.
  // Skills are looked for where they usually live: a root SKILL.md, or folders under skills/, .claude/skills/ or .agents/skills/.
  // "light" only checks that those folders exist, for repositories too large to list (the count is then left unknown).
  const TREE = 'entries { name object { ... on Tree { entries { name } } } }', LIGHT_TREE = 'entries { type }';
  function fragment(i, it, light) {
    const [owner, name] = it.repo.split('/');
    if (!SAFE_NAME.test(owner) || !SAFE_NAME.test(name)) return '';
    const base = `repository(owner:${JSON.stringify(owner)},name:${JSON.stringify(name)}){ stargazerCount description url isArchived pushedAt defaultBranchRef{name}`;
    if (it.kind === 'skill') return `i${i}: ${base} f: object(expression:${JSON.stringify('HEAD:' + it.path)}){ ... on Blob { text } } }`;
    const t = light ? LIGHT_TREE : TREE;
    return `i${i}: ${base} rf: object(expression:"HEAD:SKILL.md"){ ... on Blob { text } }`
      + ` sk: object(expression:"HEAD:skills"){ ... on Tree { ${t} } } cl: object(expression:"HEAD:.claude/skills"){ ... on Tree { ${t} } } ag: object(expression:"HEAD:.agents/skills"){ ... on Tree { ${t} } } }`;
  }
  const countSkills = r => {
    const subs = t => (t?.entries || []).filter(e => (e.object?.entries || []).some(x => x.name === 'SKILL.md')).length;
    return (r.rf?.text != null ? 1 : 0) + subs(r.sk) + subs(r.cl) + subs(r.ag);
  };
  const hasSkillFolders = r => r.rf?.text != null || [r.sk, r.cl, r.ag].some(t => (t?.entries || []).some(e => e.type === 'tree'));
  async function enrichBatch(batch, ctx, light = false) {
    const parts = batch.map((it, i) => fragment(i, it, light));
    if (!parts.some(Boolean)) return [];
    const r = await runGh(['api', 'graphql', '-f', `query=query{ ${parts.filter(Boolean).join(' ')} }`]);
    let data = null; try { data = JSON.parse(r.out).data; } catch {}
    if (!data) { // partial answers (a repository gone) still carry data; a failed batch is split down to single repositories, then checked lightly, then kept unchecked
      const f = failure(r.err + r.out, r.code, batch.map(x => x.repo).join(','));
      if (f.kind !== 'other') throw f;
      if (batch.length === 1) {
        if (!light && batch[0].kind === 'repo') return enrichBatch(batch, ctx, true);
        ctx.partial = true; return batch;
      }
      const h = Math.ceil(batch.length / 2);
      return [...await enrichBatch(batch.slice(0, h), ctx), ...await enrichBatch(batch.slice(h), ctx)];
    }
    const out = [];
    batch.forEach((it, i) => {
      const g = data[`i${i}`];
      if (!g || g.isArchived) return;
      const branch = g.defaultBranchRef?.name || 'HEAD';
      const x = { ...it, stars: g.stargazerCount, pushedAt: g.pushedAt, verified: true };
      if (it.kind === 'skill') {
        const fm = frontmatter(g.f?.text);
        if (!fm.name && !fm.description) return; // not a real skill: a SKILL.md without its name/description header
        const dir = path.posix.dirname(it.path);
        x.name = (fm.name && fm.name.length <= 64 ? fm.name : '') || it.name;
        x.description = fm.description || (dir === '.' ? g.description : '') || '';
        x.url = dir === '.' ? g.url : `${g.url}/tree/${encodeURIComponent(branch)}/${dir.split('/').map(encodeURIComponent).join('/')}`;
      } else {
        const fm = frontmatter(g.rf?.text);
        x.skills = light ? null : countSkills(g);
        x.hasSkills = light ? hasSkillFolders(g) : x.skills > 0;
        x.description = g.description || fm.description || '';
        x.url = g.url;
      }
      out.push(x);
    });
    return out;
  }
  async function enrich(items, ctx) { // small batches, three at a time: large queries make GitHub time out (HTTP 502)
    const batches = [], out = [];
    for (let s = 0; s < items.length; s += 4) batches.push(items.slice(s, s + 4));
    for (let s = 0; s < batches.length; s += 3) out.push(...(await Promise.all(batches.slice(s, s + 3).map(b => enrichBatch(b, ctx)))).flat());
    return out;
  }

  // Merge repositories and single SKILL.md files; a repository already listed covers its root SKILL.md.
  function merge(lists) {
    const seen = new Map();
    for (const it of lists.flat()) {
      const key = it.kind === 'repo' ? it.repo.toLowerCase() : `${it.repo}/${it.path}`.toLowerCase();
      if (!seen.has(key)) seen.set(key, it);
    }
    const repos = new Set([...seen.values()].filter(x => x.kind === 'repo').map(x => x.repo.toLowerCase()));
    return [...seen.values()].filter(x => !(x.kind === 'skill' && x.path === 'SKILL.md' && repos.has(x.repo.toLowerCase())));
  }
  const byStars = (a, b) => (b.stars ?? -1) - (a.stars ?? -1);
  const tidy = it => ({ kind: it.kind, repo: it.repo, path: it.path, name: it.name, url: it.url, description: clip(it.description), stars: Number.isFinite(it.stars) ? it.stars : null, pushedAt: it.pushedAt || null, skills: it.skills ?? null, verified: !!it.verified });

  async function find(words, { repoTopics, perRepo, perCode, limit, inPath, latinOnly }, signed, ctx) {
    const lists = await Promise.all([
      ...repoTopics.map(t => searchRepos(`${words} topic:${t}`, signed, perRepo, ctx)),
      signed ? searchFiles(words, perCode, inPath, ctx) : Promise.resolve([]),
    ]);
    let items = merge(lists).filter(x => !x.archived);
    if (signed) items = (await enrich(items, ctx)).filter(x => x.kind === 'skill' || !x.verified || x.hasSkills);
    if (latinOnly) items = items.filter(x => latin(x.description));
    if (inPath) items = items.filter(x => x.kind === 'repo' || words.toLowerCase().split(' ').some(w => path.posix.dirname(x.path).toLowerCase().includes(w)));
    return items.sort(byStars).slice(0, limit).map(tidy);
  }

  // ---------- Cache (Tecnico/cache/discover-cache.json) ----------
  function cacheRead() { return readJSON(CACHE, {}); }
  function cachePut(key, data) {
    const c = cacheRead(), now = Date.now();
    c[key] = { at: now, data };
    trimCache(c, now);
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    fs.writeFileSync(CACHE, JSON.stringify(c));
  }
  async function cached(key, ttl, fn) {
    const hit = cacheRead()[key];
    if (hit && Date.now() - hit.at < (hit.data.skipped ? TTL_PARTIAL : ttl)) return { data: hit.data, at: hit.at };
    try { const data = await fn(); cachePut(key, data); return { data, at: Date.now() }; }
    catch (e) {
      if (hit) return { data: hit.data, at: hit.at, stale: e.message };
      throw e;
    }
  }

  // ---------- What the user already knows: installed skills and the watchlist (REQ-DIS-010) ----------
  function knowledge() {
    let skills = [];
    try { const t = fs.readFileSync(DATA, 'utf8'); skills = JSON.parse(t.slice(t.indexOf('=') + 1).trim().replace(/;\s*$/, '')).skills || []; } catch {}
    // Third-party copies list their source repository and folder in an ORIGIN.md (older: ORIGEN.md) table next to them.
    const origins = new Map();
    for (const dir of new Set(skills.map(s => s.path && path.dirname(s.path)).filter(Boolean))) {
      let txt = '';
      for (const f of ORIGIN_FILES) { try { txt = fs.readFileSync(path.join(dir, f), 'utf8'); break; } catch {} }
      if (!txt) continue;
      for (const line of txt.split('\n')) {
        const c = line.split('|').map(x => x.trim());
        if (c.length > 4 && /^[\w.-]+\/[\w.-]+$/.test(c[2]) && /^[\w.@/-]+/.test(c[3])) origins.set(`${dir}\u0000${c[1]}`, { repo: c[2].toLowerCase(), dir: c[3].split(/\s/)[0].replace(/\/+$/, '').toLowerCase() });
      }
    }
    const installed = skills.map(s => ({ id: s.id, name: s.name, origin: originName(s.origin), src: s.path ? origins.get(`${path.dirname(s.path)}\u0000${s.id}`) || null : null }));
    let wl = []; try { wl = readWatchlist(WL); } catch {}
    return { installed, wl: Array.isArray(wl) ? wl : [] };
  }
  function labelFor(it, K) {
    const repo = it.repo.toLowerCase(), repoUrl = `https://github.com/${repo}`, url = norm(it.url), nm = String(it.name || '').toLowerCase();
    const dir = it.kind === 'skill' ? path.posix.dirname(it.path || '').toLowerCase() : '';
    const inst = K.installed.filter(s => s.src ? s.src.repo === repo && (it.kind === 'repo' || s.src.dir === dir)
      : s.origin === 'third-party' && [s.id, s.name].some(v => String(v).toLowerCase() === nm));
    if (inst.length) return { label: 'installed', info: { ids: inst.map(s => s.id) } };
    const w = K.wl.find(x => {
      const s = norm(x.source);
      if (s) return s === url || s === repoUrl;
      return [x.id, x.name].some(v => String(v || '').toLowerCase() === nm);
    });
    if (!w) return { label: null, info: null };
    return { label: w.status === 'discarded' ? 'discarded' : 'watchlist', info: { id: w.id, name: w.name, source: w.source || '', status: w.status || 'awaiting-analysis', reason: w.discard_reason || (w.status === 'discarded' ? w.verdict || '' : ''), date: w.discarded_at || w.analyzed_at || '' } };
  }
  const labelled = (items, K) => items.map(it => ({ ...it, ...labelFor(it, K) }));

  // ---------- Suggestions from usage (REQ-DIS-005) ----------
  function usageBasis() {
    let skills = [];
    try { const t = fs.readFileSync(DATA, 'utf8'); skills = JSON.parse(t.slice(t.indexOf('=') + 1).trim().replace(/;\s*$/, '')).skills || []; } catch {}
    const used = skills.filter(s => (s.usage?.total || 0) > 0).sort((a, b) => b.usage.total - a.usage.total);
    const groups = [];
    for (const s of used) {
      const pick = src => TERMS.filter(([r]) => r.test(src)).map(([, t]) => t);
      const term = [...pick(`${s.id} ${s.name}`), ...pick(s.description || '')].find(t => !groups.some(g => g.term === t));
      if (!term) continue;
      groups.push({ term, skill: s.name, id: s.id, uses: s.usage.total, category: s.category });
      if (groups.length === 3) break;
    }
    return groups;
  }

  const notSignedIn = () => 'You are not signed in to GitHub on this Mac, so Discover uses GitHub\'s public search: repositories only, not checked for SKILL.md, and a lower limit. To search with your account, run "gh auth login" in Terminal.';
  const reply = (r, signed, extra = {}) => ({ ...extra, signedIn: signed, fetchedAt: new Date(r.at).toISOString(), notice: [!signed && notSignedIn(), r.stale && `${r.stale} Showing results saved ${new Date(r.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}.`, r.data.skipped && 'Some results could not be fetched or checked this time, to stay within GitHub\'s limits; try again in a minute for the full list.'].filter(Boolean).join(' ') });

  async function search(q) {
    const words = q.replace(/[\u0000-\u001f"]/g, ' ').replace(/\s+/g, ' ').trim();
    if (words.length < 2 || words.length > 80) throw Object.assign(new Error('Type between 2 and 80 characters.'), { status: 400 });
    const signed = await signedIn();
    const r = await cached(`search:${signed ? 'gh' : 'anon'}:${words.toLowerCase()}`, TTL_SEARCH, async () => {
      const ctx = {}; const items = await find(words, { repoTopics: TOPICS, perRepo: 15, perCode: 25, limit: 30 }, signed, ctx);
      return { items, skipped: !!(ctx.skipped || ctx.partial) };
    });
    return reply(r, signed, { query: words, items: labelled(r.data.items, knowledge()) });
  }
  async function suggest() {
    const signed = await signedIn(), basis = usageBasis();
    if (!basis.length) return { signedIn: signed, groups: [], notice: 'No recorded uses yet, so there is nothing to base suggestions on. Use your skills for a while, or search above.' };
    const K = knowledge(), notes = new Set();
    let at = Date.now();
    const groups = await Promise.all(basis.map(async b => {
      const r = await cached(`suggest:${signed ? 'gh' : 'anon'}:${b.term}`, TTL_SEARCH, async () => {
        const ctx = {}; const items = await find(b.term, { repoTopics: [TOPICS[0]], perRepo: 10, perCode: 15, limit: 12, inPath: true, latinOnly: true }, signed, ctx);
        return { items, skipped: !!(ctx.skipped || ctx.partial) };
      }).catch(e => ({ error: e.message }));
      if (r.error) { notes.add(r.error); return { ...b, items: [], error: r.error }; }
      at = Math.min(at, r.at);
      const n = reply(r, signed).notice; if (n) notes.add(n);
      // Skills the user does not have yet come first; known ones stay visible with their label.
      return { ...b, items: labelled(r.data.items, K).sort((x, y) => Number(!!x.label) - Number(!!y.label)) };
    }));
    const shown = new Set(); // a skill already suggested in an earlier group is not repeated
    for (const g of groups) {
      const keep = [];
      for (const it of g.items) {
        const k = `${it.repo}/${it.path || ''}`.toLowerCase();
        if (keep.length < SUGGEST_PER_GROUP && !shown.has(k)) { keep.push(it); shown.add(k); }
      }
      g.items = keep;
    }
    return { signedIn: signed, fetchedAt: new Date(at).toISOString(), groups, notice: [...notes].join(' ') };
  }
  async function popular() {
    const signed = await signedIn();
    const r = await cached(`popular:${signed ? 'gh' : 'anon'}`, TTL_POPULAR, async () => {
      const ctx = {};
      const lists = await Promise.all(TOPICS.map(t => searchRepos(`topic:${t}`, signed, 40, ctx)));
      let items = merge(lists).filter(x => !x.archived && latin(x.description)).sort(byStars).slice(0, POPULAR_SIZE + 15);
      if (signed) items = (await enrich(items, ctx)).filter(x => x.hasSkills && latin(x.description));
      return { items: items.sort(byStars).slice(0, POPULAR_SIZE).map(tidy), skipped: !!(ctx.skipped || ctx.partial) };
    });
    const measure = signed
      ? `Picked at random from the ${r.data.items.length} most-starred GitHub repositories tagged ${TOPICS.join(' or ')} that hold at least one SKILL.md. Stars come from GitHub.`
      : `Picked at random from the ${r.data.items.length} most-starred GitHub repositories tagged ${TOPICS.join(' or ')}. Stars come from GitHub.`;
    return reply(r, signed, { measure, items: labelled(r.data.items, knowledge()) });
  }

  // ---------- Add to the watchlist without analysing (REQ-DIS-007) ----------
  async function addToWatchlist(b) {
    const url = String(b.url || '').trim().replace(/\/+$/, '');
    const m = url.match(/^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:\/tree\/[^\s?#]+?\/(.+))?$/);
    if (!m || url.length > 300) return [400, { error: 'Only GitHub links can be added from Discover.' }];
    const repo = `${m[1]}/${m[2]}`, dirPath = m[3] ? decodeURIComponent(m[3]) : '';
    const name = String(b.name || '').replace(/\s+/g, ' ').trim().slice(0, 120) || (dirPath ? path.posix.basename(dirPath) : m[2]);
    const item = { kind: dirPath ? 'skill' : 'repo', repo, path: dirPath ? `${dirPath}/SKILL.md` : undefined, name, url };
    const K = knowledge(), known = labelFor(item, K);
    if (known.label === 'installed') return [409, { error: `${name} is already installed. Nothing was added.` }];
    if (known.label) return [200, { existing: { ...known.info, status: known.label } }];
    let list = null; try { list = readWatchlist(WL); } catch {}
    if (!Array.isArray(list)) return [500, { error: 'The watchlist file could not be read, so nothing was added.' }];
    const base = slugify(name) || slugify(m[2]) || 'skill';
    let id = base;
    if (list.some(w => w.id === id)) id = `${base}-${slugify(m[1])}`.slice(0, 80);
    for (let n = 2; list.some(w => w.id === id); n++) id = `${base}-${n}`;
    list.push({
      id, name, source: url, category: loadMeta().valid(b.category), status: 'awaiting-analysis',
      note: clip(String(b.description || ''), 400), added_at: new Date().toISOString().slice(0, 10), added_from: 'discover',
    });
    writeWatchlist(WL, list);
    try { await rescan(); } catch {}
    return [201, { ok: true, id }];
  }

  // ---------- Routes (GET under /api/discover/, POST /api/discover/watch) ----------
  async function get(url, res) {
    try {
      if (url.pathname === '/api/discover/search') return send(res, 200, await search(String(url.searchParams.get('q') || '')));
      if (url.pathname === '/api/discover/suggest') return send(res, 200, await suggest());
      if (url.pathname === '/api/discover/popular') return send(res, 200, await popular());
      return send(res, 404, { error: 'not found' });
    } catch (e) { return send(res, e.status || 502, { error: String(e.message || 'GitHub search failed.').slice(0, 300) }); }
  }
  async function post(url, b, res) {
    if (url.pathname !== '/api/discover/watch') return send(res, 404, { error: 'not found' });
    try { const [code, obj] = await addToWatchlist(b); return send(res, code, obj); }
    catch (e) { return send(res, 500, { error: `Nothing was added: ${String(e.message).slice(0, 200)}` }); }
  }
  return { get, post };
}
