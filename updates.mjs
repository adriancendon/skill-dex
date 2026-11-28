// Skill updates (REQ-UPD-001 to 012). Looks for updates only when the user presses "Check for updates" and changes a
// skill only after a confirmed "Update". A skill's source is what it records itself: an ORIGIN.md inside its folder
// ("Source:", "Commit:", optional "Path:") or a table in the ORIGIN.md of the folder that holds it
// (Skill | Repository | Path | Commit). The older file name ORIGEN.md and its Spanish labels are read too.
// Skills that record nothing are reported as "Source unknown".
// The check reads the source with a blobless git clone in a temp folder; the installed copy is never touched by it.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BIN, compact, triage, loadTriage } from './lib-security.mjs';
import { dataFile, shownPath } from './paths.mjs';
import { ORIGIN_FILES, THIRD_PARTY_DIR, normalizeTriage } from './names.mjs';
import { loadMeta } from './categories.mjs';
import { listSkillDirs } from './skill-sources.mjs';
import { removeSymlinks } from './tree-safety.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

// Owner's setting: true = a critical security finding in the new version blocks "Update";
// false = it only asks for the same extra confirmation as a finding to review.
export const BLOCK_CRITICAL = true;

const IGNORED = new Set(['.DS_Store', '.git', '__pycache__']);
const SHA = /^[0-9a-f]{7,40}$/i;
const sh = (file, args, opt = {}) => new Promise((res, rej) => execFile(file, args,
  { maxBuffer: 64e6, timeout: opt.timeout || 180000, cwd: opt.cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: 'echo' } },
  (e, out, err) => e ? rej(new Error(String(err || e.message).trim().split('\n').pop())) : res(out)));
const blobSha = buf => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const readJSON = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const writeJSON = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true }); const t = `${p}.${process.pid}.tmp`; fs.writeFileSync(t, JSON.stringify(v, null, 2) + '\n'); fs.renameSync(t, p); };
const inside = (base, p) => { const r = path.relative(base, p); return r && !r.startsWith('..') && !path.isAbsolute(r); };

// ---------- Where a skill comes from ----------
export function repoUrl(cell) {
  const v = String(cell || '').trim().replace(/^<|>$/g, '');
  if (/^https:\/\/[^\s]+$/.test(v) || /^file:\/\/\/\S+$/.test(v)) return v;
  if (path.isAbsolute(v) && !/\s/.test(v)) return v; // local repository (fixtures)
  if (/^[\w.-]+\/[\w.-]+$/.test(v)) return `https://github.com/${v.replace(/\.git$/, '')}.git`;
  return null;
}
export function githubSlug(url) { const m = String(url || '').match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/); return m ? `${m[1]}/${m[2]}` : null; }

// The Spanish labels (Fuente, Repositorio, Ruta, Cambios locales) are those of older ORIGEN.md files.
function parseInner(txt) { // "- Source: URL" / "- Commit: sha" / "- Path: path"
  const get = re => (txt.match(re) || [])[1]?.trim();
  const url = repoUrl(get(/^\s*[-*]?\s*(?:Fuente|Source|Repositorio|Repository)\s*:\s*(\S+)/im));
  const commit = get(/^\s*[-*]?\s*Commit\s*:\s*`?([0-9a-f]{7,40})`?/im);
  const sub = get(/^\s*[-*]?\s*(?:Ruta(?: en el repositorio)?|Path)\s*:\s*`?([^`\s]+)`?/im);
  return url && commit ? { url, commit, path: sub ? sub.replace(/^\/+|\/+$/g, '') : null } : null;
}
function parseTable(txt, id) { // | Skill | Repository | Path | Commit | Local changes | ...
  const rows = txt.split('\n').filter(l => /^\s*\|/.test(l)).map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
  const head = rows.find(r => r.some(c => /^skill$/i.test(c)) && r.some(c => /^commit$/i.test(c)));
  if (!head) return null;
  const col = re => head.findIndex(c => re.test(c));
  const iS = col(/^skill$/i), iR = col(/^(repositorio|repository|repo|fuente|source)$/i), iP = col(/^(ruta|path)/i), iC = col(/^commit$/i), iL = col(/^(cambios locales|local changes)$/i);
  const row = rows.find(r => r !== head && r[iS] === id);
  if (!row || iR < 0) return null;
  const url = repoUrl(row[iR]), commit = String(row[iC] || '').replace(/`/g, '').trim();
  if (!url || !SHA.test(commit)) return null;
  const rawPath = iP >= 0 ? String(row[iP] || '').replace(/`/g, '') : '';
  const sub = rawPath.split(/\s+\+\s+/)[0].trim().replace(/^\/+|\/+$/g, '');
  return { url, commit, path: sub || null, extraFiles: /\s\+\s/.test(rawPath), recordedChanges: iL >= 0 ? row[iL] || '' : '' };
}
// A skill folder that is itself a git clone with a remote: its remote and its checked-out commit, read with git.
function gitOrigin(real) {
  if (!fs.existsSync(path.join(real, '.git'))) return null;
  const run = args => execFileSync('git', ['-C', real, '-c', 'core.hooksPath=/dev/null', ...args], { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }).trim();
  try {
    if (run(['rev-parse', '--show-toplevel']) !== fs.realpathSync(real)) return null; // only a clone whose top folder is the skill
    const url = run(['remote', 'get-url', 'origin']), commit = run(['rev-parse', 'HEAD']);
    return /^https:\/\//.test(url) && SHA.test(commit) ? { url, commit, path: '.', extraFiles: false, recordedChanges: '', manifest: path.join(real, '.git'), gitClone: true } : null;
  } catch { return null; }
}
// name: the skill's folder name, looked up in a table of the parent folder's ORIGIN.md (or older ORIGEN.md).
export function findOrigin(real, name) {
  const tries = [
    ...ORIGIN_FILES.map(f => [path.join(real, f), t => parseInner(t)]),
    ...ORIGIN_FILES.map(f => [path.join(path.dirname(real), f), t => parseTable(t, name)]),
  ];
  for (const [file, parse] of tries) {
    let txt; try { txt = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const o = parse(txt);
    if (o) return { ...o, manifest: file };
  }
  return gitOrigin(real);
}

// The installed skills: every agent's global folders (skill-sources.mjs), or the two folders a test passes.
// [{ id, name (folder), link (where an agent finds it), real, selfLearned }]
function installedSkills(cfg) {
  if (cfg.listSkills) return cfg.listSkills().map(s => ({ id: s.id, name: s.skill || s.name, link: s.locations[0].path, real: s.dir, selfLearned: s.origin === 'self-learned' }));
  const list = d => { try { return fs.readdirSync(d).filter(n => !n.startsWith('.')).sort(); } catch { return []; } };
  const out = [];
  for (const [dir, selfLearned] of [[cfg.skillsDir, false], [cfg.managedDir, true]]) {
    for (const id of list(dir)) {
      const link = path.join(dir, id);
      let real; try { real = fs.realpathSync(link); } catch { continue; }
      if (fs.existsSync(path.join(real, 'SKILL.md'))) out.push({ id, name: id, link, real, selfLearned });
    }
  }
  return out;
}

// Every installed skill sorted into: external (has a recorded source: ORIGIN.md, or its folder is a git clone),
// own (symlinked from one of the user's own folders), unknown (a plain folder that records no source).
// Self-learned skills are counted, never checked (REQ-UPD-007).
export function inventory(cfg) {
  const out = { external: [], own: [], unknown: [], noSource: [], selfLearned: 0 };
  const meta = loadMeta(cfg.metaPath);
  for (const { id, name, link, real, selfLearned } of installedSkills(cfg)) {
    if (selfLearned) { out.selfLearned++; continue; }
    const entry = meta.entry(id);
    if (entry.update_source === 'none') {
      const from = String(entry.from || '').trim();
      out.noSource.push({ id, status: 'no-source', reason: from ? `From ${from}, no update source` : 'No update source' });
      continue;
    }
    const origin = findOrigin(real, name);
    if (origin) out.external.push({ id, real, origin });
    else if (fs.lstatSync(link).isSymbolicLink() && !THIRD_PARTY_DIR.test(real)) out.own.push({ id, real });
    else out.unknown.push({ id, real, reason: THIRD_PARTY_DIR.test(real) ? 'Its folder of third-party skills has no line for it in ORIGIN.md.' : 'No source recorded: there is no ORIGIN.md with its repository and version, and its folder is not a git clone.' });
  }
  return out;
}

function frontVersion(txt) {
  const m = String(txt || '').match(/^---\n([\s\S]*?)\n---/);
  if (!m) return '';
  const v = m[1].match(/^version:\s*["']?([^"'\n]+)/m) || m[1].match(/^metadata:\s*\n(?:[ \t]+.*\n)*?[ \t]+version:\s*["']?([^"'\n]+)/m);
  return v ? v[1].trim() : '';
}
function localFiles(dir) {
  const map = new Map();
  (function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (IGNORED.has(e.name)) continue;
      const p = path.join(d, e.name), r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(p, r); else if (e.isFile()) map.set(r, blobSha(fs.readFileSync(p)));
    }
  })(dir, '');
  return map;
}
const snapshot = map => crypto.createHash('sha1').update([...map].sort().map(([k, v]) => `${k}\0${v}`).join('\n')).digest('hex');
function describeFiles(files) {
  const names = files.map(f => f.path);
  if (!names.length) return 'No file changes';
  const verb = files.every(f => f.change === 'added') ? 'Adds' : files.every(f => f.change === 'removed') ? 'Removes' : 'Changes';
  if (names.length === 1) return `${verb} ${names[0]}`;
  if (names.length === 2) return `${verb} ${names[0]} and ${names[1]}`;
  const main = names.includes('SKILL.md') ? 'SKILL.md' : names[0];
  return `${verb} ${main} and ${names.length - 1} other files`;
}

export function createUpdates(opts = {}) {
  const env = process.env, home = os.homedir();
  const legacy = opts.skillsDir || env.SKILLDEX_UPD_SKILLS; // tests: two given folders instead of every agent's folders
  const cfg = {
    skillsDir: opts.skillsDir || env.SKILLDEX_UPD_SKILLS || path.join(home, '.omp/agent/skills'),
    managedDir: opts.managedDir || env.SKILLDEX_UPD_MANAGED || path.join(home, '.omp/agent/managed-skills'),
    listSkills: legacy ? null : (opts.listSkills || (() => listSkillDirs({ projects: false }))),
    metaPath: opts.metaPath || dataFile('skills-meta.json'),
    statePath: opts.statePath || env.SKILLDEX_UPD_STATE || dataFile('updates-state.json'),
    backupDir: opts.backupDir || env.SKILLDEX_UPD_BACKUPS || dataFile('backups'),
    cacheDir: opts.cacheDir || env.SKILLDEX_UPD_CACHE || path.join(here, 'cache/updates'),
    spector: opts.spector || env.SKILLSPECTOR_BIN || BIN,
    loadTriage: opts.loadTriage || loadTriage,
    onChange: opts.onChange || (async () => {}),
  };
  const RESULTS = path.join(cfg.cacheDir, 'results.json'), STAGED = path.join(cfg.cacheDir, 'staged');
  const readState = () => ({ last_checked: null, skipped: {}, applied: {}, ...readJSON(cfg.statePath, {}) });
  const readResults = () => { // a check saved by an older version may hold the older security names
    const r = readJSON(RESULTS, { checked_at: null, items: [], own: 0, selfLearned: 0 });
    for (const i of r.items || []) if (i.security) normalizeTriage(i.security);
    return r;
  };
  const shown = shownPath;
  let job = null; // { kind, step, done, total } — one check or update at a time
  let lastError = null; // why the last check stopped, if it failed as a whole

  const git = (gitDir, args, timeout) => sh('git', ['--git-dir', gitDir, '-c', 'core.hooksPath=/dev/null', ...args], { timeout });
  async function lsTree(gitDir, rev, sub) { // rel path (inside the skill folder) → { mode, type, sha }
    const out = await git(gitDir, ['ls-tree', '-r', '-z', '--full-tree', rev, ...(sub ? ['--', sub] : [])]);
    const map = new Map();
    for (const rec of out.split('\0').filter(Boolean)) {
      const m = rec.match(/^(\d+) (\w+) ([0-9a-f]+)\t([\s\S]*)$/);
      if (m) map.set(sub ? m[4].slice(sub.length + 1) : m[4], { mode: m[1], type: m[2], sha: m[3] });
    }
    return map;
  }
  async function locate(gitDir, base, real) { // the folder of the repository that is this skill, when ORIGIN.md does not say
    const all = (await git(gitDir, ['ls-tree', '-r', '-z', '--full-tree', base])).split('\0').filter(l => /\t(?:.*\/)?SKILL\.md$/.test(l));
    const entries = all.map(l => { const m = l.match(/ ([0-9a-f]+)\t([\s\S]*)$/); return { sha: m[1], dir: path.posix.dirname(m[2]) }; });
    const mine = blobSha(fs.readFileSync(path.join(real, 'SKILL.md')));
    const hit = entries.find(e => e.sha === mine) || entries.find(e => path.posix.basename(e.dir) === path.basename(real)) || entries.find(e => e.dir === '.') || (entries.length === 1 ? entries[0] : null);
    return hit ? hit.dir : null;
  }
  async function scan(dir, id, links = []) { // Findings from the symlink gate survive even when SkillSpector is unavailable.
    const linkTriage = triage(compact({ issues: links }), [], dir);
    if (!cfg.spector || !fs.existsSync(cfg.spector)) return { status: 'unavailable', ...linkTriage, symlinks: links };
    const r = await new Promise(res => execFile(cfg.spector, ['scan', dir, '--no-llm', '--format', 'json'], { maxBuffer: 64e6, timeout: 900000 },
      (err, out) => { try { res(JSON.parse(out)); } catch { res(null); } }));
    if (!r) return { status: 'failed', ...linkTriage, symlinks: links };
    r.issues = [...(r.issues || []), ...links];
    const c = compact(r), t = triage(c, cfg.loadTriage(id), dir);
    return { status: 'done', level: t.level, counts: t.counts, review: t.review, stale: t.stale, info: t.info, coverage: c.coverage, raw: c.recommendation };
  }

  async function compare(gitDir, skill, state) {
    const { id, real, origin } = skill;
    const item = { id, repo: githubSlug(origin.url) || origin.url, github: githubSlug(origin.url), manifest: shown(origin.manifest), extraFiles: !!origin.extraFiles };
    const resolve = async rev => (await git(gitDir, ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`])).trim();
    let base;
    try { base = await resolve(origin.commit); } catch { return { ...item, status: 'error', reason: `The recorded version (${origin.commit.slice(0, 7)}) was not found in the source.` }; }
    const applied = state.applied[id];
    if (applied && applied.url === origin.url && SHA.test(applied.commit || '')) { // a newer base recorded by an earlier Update
      try { const a = await resolve(applied.commit); await git(gitDir, ['merge-base', '--is-ancestor', base, a]); base = a; } catch {}
    }
    const sub = origin.path || (applied?.url === origin.url && applied.path) || await locate(gitDir, base, real);
    if (!sub) return { ...item, status: 'error', reason: 'Could not tell which folder of the source repository is this skill.' };
    const pathArg = sub === '.' ? '' : sub;
    item.path = pathArg;
    const treeOf = async rev => { try { return (await git(gitDir, ['rev-parse', '--verify', '--quiet', `${rev}:${pathArg}`])).trim(); } catch { return null; } };
    const baseTree = await treeOf(base);
    if (!baseTree) return { ...item, status: 'error', reason: `The folder ${sub} is not in the recorded version of the source.` };
    const latestLine = (await git(gitDir, ['log', '-1', '--format=%H%x09%cs%x09%s', 'HEAD', ...(pathArg ? ['--', pathArg] : [])])).trim();
    const headTree = await treeOf('HEAD');
    if (!headTree || !latestLine) return { ...item, status: 'error', reason: 'The skill is no longer in its source repository.' };
    const [latest, latestDate] = latestLine.split('\t');
    const baseDate = (await git(gitDir, ['log', '-1', '--format=%cs', base])).trim();
    const showVersion = async rev => { try { return frontVersion(await git(gitDir, ['show', `${rev}:${pathArg ? pathArg + '/' : ''}SKILL.md`])); } catch { return ''; } };
    const baseEntries = await lsTree(gitDir, base, pathArg);
    const local = localFiles(real);
    const edited = [], added = [], missing = [];
    for (const [rel, h] of local) { const b = baseEntries.get(rel); if (!b) added.push(rel); else if (b.sha !== h) edited.push(rel); }
    for (const rel of baseEntries.keys()) if (!local.has(rel)) missing.push(rel);
    item.base = { commit: base, short: base.slice(0, 7), date: baseDate, version: await showVersion(base) };
    item.localEdits = { edited, added, missing };
    if (headTree === baseTree) return { ...item, status: 'up-to-date' };

    const newEntries = await lsTree(gitDir, latest, pathArg);
    const files = [];
    for (const [rel, n] of newEntries) { const b = baseEntries.get(rel); if (!b) files.push({ path: rel, change: 'added' }); else if (b.sha !== n.sha || b.mode !== n.mode) files.push({ path: rel, change: 'modified' }); }
    for (const rel of baseEntries.keys()) if (!newEntries.has(rel)) files.push({ path: rel, change: 'removed' });
    files.sort((a, b) => (a.path === 'SKILL.md' ? -1 : b.path === 'SKILL.md' ? 1 : a.path.localeCompare(b.path)));
    // Files this update replaces although he changed them by hand (REQ-UPD-008).
    for (const f of files) {
      const b = baseEntries.get(f.path), l = local.get(f.path);
      f.yours = b ? (l == null ? 'deleted' : l !== b.sha ? 'edited' : null) : (l != null && l !== newEntries.get(f.path)?.sha ? 'added' : null);
      if (f.yours === 'deleted' && f.change === 'removed') f.yours = null;
    }
    const range = `${base}..${latest}`, logArgs = pathArg ? [range, '--', pathArg] : [range];
    const commits = (await git(gitDir, ['log', '--max-count=12', '--format=%h%x09%cs%x09%s', ...logArgs])).split('\n').filter(Boolean).map(l => { const [short, date, subject = ''] = l.split('\t'); return { short, date, subject: subject.slice(0, 160) }; });
    const commitCount = Number((await git(gitDir, ['rev-list', '--count', ...logArgs])).trim()) || commits.length;
    const unsupported = [...newEntries].filter(([, n]) => n.type !== 'blob' || n.mode === '120000').map(([rel]) => rel);
    Object.assign(item, {
      status: 'update', latest: { commit: latest, short: latest.slice(0, 7), date: latestDate, version: await showVersion(latest) },
      files, commits, commitCount, unsupported,
      summary: `${describeFiles(files)}${commits[0] ? ` · Latest note: “${commits[0].subject.slice(0, 90)}”` : ''}`,
      // Files he deleted stay deleted, even when the new version changes them.
      writes: files.filter(f => f.change !== 'removed' && f.yours !== 'deleted').map(f => ({ path: f.path, mode: newEntries.get(f.path).mode, sha: newEntries.get(f.path).sha })),
      removes: files.filter(f => f.change === 'removed').map(f => f.path),
      localSnapshot: snapshot(local),
      security: { status: 'pending' },
    });
    if ((state.skipped[id] || []).some(s => s.commit === latest)) item.status = 'skipped';
    else if (![...newEntries.values()].some(n => n.type !== 'blob')) { // Symlinks are stripped and reported; installation remains blocked for these versions.
      const dest = path.join(STAGED, id, latest.slice(0, 12)), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-upd-x-')), tar = path.join(tmp, 'v.tar');
      try {
        await git(gitDir, ['archive', '--format=tar', '-o', tar, latest, ...(pathArg ? [pathArg] : [])]);
        fs.mkdirSync(path.join(tmp, 'x')); await sh('tar', ['-xf', tar, '-C', path.join(tmp, 'x')]);
        item.symlinks = removeSymlinks(path.join(tmp, 'x', pathArg));
        fs.rmSync(dest, { recursive: true, force: true }); fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.cpSync(path.join(tmp, 'x', pathArg), dest, { recursive: true }); item.staged = dest;
      } catch (e) { item.security = { status: 'failed', error: 'Could not download the new version.' }; }
      finally { fs.rmSync(tmp, { recursive: true, force: true }); }
    }
    return item;
  }

  async function runCheck() {
    const state = readState(), inv = inventory(cfg), items = [];
    fs.rmSync(STAGED, { recursive: true, force: true });
    const groups = new Map();
    for (const s of inv.external) { if (!groups.has(s.origin.url)) groups.set(s.origin.url, []); groups.get(s.origin.url).push(s); }
    job.total = groups.size; job.done = 0;
    for (const [url, skills] of groups) {
      job.step = `Reading ${githubSlug(url) || 'a source'}`;
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-upd-')), gitDir = path.join(tmp, 'repo.git');
      try {
        await sh('git', ['-c', 'core.hooksPath=/dev/null', 'clone', '--bare', '--filter=blob:none', '--no-tags', '-q', url, gitDir], { timeout: 240000 });
        for (const s of skills) {
          try { items.push(await compare(gitDir, s, state)); }
          catch (e) { items.push({ id: s.id, repo: githubSlug(url) || url, status: 'error', reason: `The check failed: ${String(e.message).slice(0, 160)}` }); }
        }
      } catch (e) {
        for (const s of skills) items.push({ id: s.id, repo: githubSlug(url) || url, status: 'error', reason: 'Could not reach the source repository (offline, moved or private).' });
      } finally { fs.rmSync(tmp, { recursive: true, force: true }); job.done++; }
    }
    const toScan = items.filter(i => i.staged && i.status === 'update');
    job.total += toScan.length;
    const running = new Set();
    await Promise.all(Array.from({ length: 3 }, async () => { // up to 3 scans at once, like security.mjs
      for (let i; (i = toScan.shift());) {
        running.add(i.id); job.step = `Security check of ${[...running].join(', ')}`;
        i.security = await scan(i.staged, i.id, i.symlinks || []);
        running.delete(i.id); job.done++; job.step = running.size ? `Security check of ${[...running].join(', ')}` : 'Saving';
      }
    }));
    for (const u of inv.unknown) items.push({ id: u.id, status: 'unknown', reason: u.reason });
    const now = new Date().toISOString();
    writeJSON(RESULTS, { checked_at: now, items, own: inv.own.length, selfLearned: inv.selfLearned });
    const st = readState(); st.last_checked = now; writeJSON(cfg.statePath, st);
  }

  const applicable = i => {
    if (i.status !== 'update') return { ok: false, why: 'Not an available update.' };
    if (i.unsupported?.length) return { ok: false, why: 'This version contains links or sub-repositories, which Skill Dex does not install. Update it by hand.' };
    if (i.security?.status === 'unavailable') return { ok: false, why: 'The security scanner is not installed, so the new version could not be checked.' };
    if (i.security?.status === 'pending') return { ok: false, why: 'Its security check has not run yet. Press Check for updates.' };
    if (i.security?.status !== 'done') return { ok: false, why: i.security?.error || 'The security check could not run on the new version. Try Check for updates again.' };
    if (BLOCK_CRITICAL && i.security.level === 'critical') return { ok: false, why: 'The security check found a critical problem in the new version. It cannot be applied from here.' };
    return { ok: true, needsAck: ['review', 'critical'].includes(i.security.level) };
  };

  function publicState() {
    const st = readState(), r = readResults();
    const noSource = inventory(cfg).noSource, excluded = new Set(noSource.map(i => i.id));
    const items = [...r.items.filter(i => !excluded.has(i.id)), ...noSource].map(({ writes, removes, localSnapshot, staged, ...rest }) => ({ ...rest, ...(rest.status === 'update' ? { can: applicable(rest) } : {}) }));
    return { busy: job && { ...job }, error: lastError, last_checked: st.last_checked, checked_at: r.checked_at, items, own: r.own, selfLearned: r.selfLearned, skipped: st.skipped, blockCritical: BLOCK_CRITICAL, scanner: !!cfg.spector && fs.existsSync(cfg.spector), backupDir: shown(cfg.backupDir) };
  }

  function setItem(id, patch) { const r = readResults(); const i = r.items.find(x => x.id === id); if (i) Object.assign(i, patch); writeJSON(RESULTS, r); return i; }

  async function apply(id, commit, ack) {
    if (inventory(cfg).noSource.some(i => i.id === id)) throw Object.assign(new Error('This skill has no update source.'), { code: 409 });
    const r = readResults(), i = r.items.find(x => x.id === id);
    if (!i || i.status !== 'update' || i.latest?.commit !== commit) throw Object.assign(new Error('That update is no longer listed. Check for updates again.'), { code: 409 });
    const can = applicable(i);
    if (!can.ok) throw Object.assign(new Error(can.why), { code: 409 });
    if (can.needsAck && ack !== true) throw Object.assign(new Error('Confirm that you read the security findings first.'), { code: 400 });
    const skill = inventory(cfg).external.find(x => x.id === id);
    if (!skill) throw Object.assign(new Error('This skill is no longer installed with a recorded source. Check for updates again.'), { code: 409 });
    const real = skill.real;
    if (snapshot(localFiles(real)) !== i.localSnapshot) throw Object.assign(new Error('Your copy of this skill changed since the check. Check for updates again before updating.'), { code: 409 });
    for (const w of i.writes) { // what was security-checked is exactly what gets installed
      const p = path.join(i.staged, w.path);
      if (!inside(i.staged, p) || !fs.existsSync(p) || blobSha(fs.readFileSync(p)) !== w.sha) throw Object.assign(new Error('The downloaded new version is incomplete. Check for updates again.'), { code: 409 });
    }
    // 1. His current version is saved first (REQ-UPD-009).
    const stamp = new Date().toISOString().replace(/\..*$/, '').replace(/:/g, '-');
    const backup = path.join(cfg.backupDir, id, stamp);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.cpSync(real, backup, { recursive: true, dereference: true, errorOnExist: true, force: false });
    if (localFiles(backup).size !== localFiles(real).size) throw new Error('The copy of your version could not be verified. Nothing was changed.');
    // 2. Only the files this version changes are written or removed; everything else stays as he has it.
    for (const w of i.writes) {
      const dest = path.join(real, w.path);
      if (!inside(real, dest)) throw new Error(`Unsafe path in the update: ${w.path}`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.rmSync(dest, { force: true });
      fs.copyFileSync(path.join(i.staged, w.path), dest);
      fs.chmodSync(dest, w.mode === '100755' ? 0o755 : 0o644);
    }
    for (const rel of i.removes) {
      const dest = path.join(real, rel);
      if (!inside(real, dest)) continue;
      fs.rmSync(dest, { force: true });
      for (let d = path.dirname(dest); inside(real, d) && fs.readdirSync(d).length === 0; d = path.dirname(d)) fs.rmdirSync(d);
    }
    const st = readState();
    st.applied[id] = { url: skill.origin.url || null, path: i.path || '.', commit: i.latest.commit, version: i.latest.version || '', from: i.base.commit, applied_at: new Date().toISOString(), backup: shown(backup) };
    if (st.skipped[id]) { delete st.skipped[id]; }
    writeJSON(cfg.statePath, st);
    setItem(id, { status: 'up-to-date', updated_now: true, base: i.latest, backup: shown(backup), files: i.files, writes: [], removes: [] });
    fs.rmSync(path.join(STAGED, id), { recursive: true, force: true });
    try { await cfg.onChange(); } catch {}
    return { backup: shown(backup), files: i.files.length };
  }

  return {
    cfg,
    busy: () => !!job,
    get: publicState,
    async check() {
      if (job) throw Object.assign(new Error('A check or an update is already running.'), { code: 409 });
      job = { kind: 'check', step: 'Reading your skills', done: 0, total: 0 };
      lastError = null;
      const p = runCheck().catch(e => { lastError = `The check stopped: ${String(e.message).slice(0, 200)}`; }).finally(() => { job = null; });
      return p;
    },
    async apply(id, commit, ack) {
      if (job) throw Object.assign(new Error('A check or an update is already running.'), { code: 409 });
      job = { kind: 'update', step: `Updating ${id}`, done: 0, total: 1 };
      try { return await apply(id, commit, ack); } finally { job = null; }
    },
    skip(id, commit) {
      const r = readResults(), i = r.items.find(x => x.id === id);
      if (!i || !['update', 'skipped'].includes(i.status) || i.latest?.commit !== commit) throw Object.assign(new Error('That update is no longer listed.'), { code: 404 });
      const st = readState(), list = st.skipped[id] = (st.skipped[id] || []).filter(s => s.commit !== commit);
      list.push({ commit, short: commit.slice(0, 7), version: i.latest.version || '', date: i.latest.date, skipped_at: new Date().toISOString() });
      writeJSON(cfg.statePath, st); setItem(id, { status: 'skipped' });
    },
    unskip(id, commit) {
      const st = readState();
      if (!(st.skipped[id] || []).some(s => s.commit === commit)) throw Object.assign(new Error('That version is not skipped.'), { code: 404 });
      st.skipped[id] = st.skipped[id].filter(s => s.commit !== commit);
      if (!st.skipped[id].length) delete st.skipped[id];
      writeJSON(cfg.statePath, st);
      const r = readResults(), i = r.items.find(x => x.id === id);
      if (i?.status === 'skipped' && i.latest?.commit === commit) setItem(id, { status: 'update' });
    },
  };
}

// HTTP hook for server.mjs: GET /api/updates and POST /api/updates/{check,apply,skip,unskip}. Returns true when handled.
export function updatesRoute(u, method, pathname, b, send) {
  if (method === 'GET' && pathname === '/api/updates') { send(200, u.get()); return true; }
  if (method !== 'POST' || !pathname.startsWith('/api/updates/')) return false;
  const action = pathname.slice('/api/updates/'.length);
  const id = String(b.id || ''), commit = String(b.commit || '');
  const fail = e => send(e.code || 500, { error: String(e.message).slice(0, 300) });
  if (action !== 'check' && (!/^\w[\w.-]*(@[\w.-]+)?$/.test(id) || !/^[0-9a-f]{40}$/.test(commit))) { send(400, { error: 'Invalid skill or version' }); return true; } // "<folder>@<agent>" ids too
  try {
    if (action === 'check') { if (u.busy()) send(409, { error: 'A check or an update is already running.' }); else { u.check(); send(202, { ok: true }); } }
    else if (action === 'apply') u.apply(id, commit, b.ack === true).then(r => send(200, { ok: true, ...r }), fail);
    else if (action === 'skip') { u.skip(id, commit); send(200, { ok: true }); }
    else if (action === 'unskip') { u.unskip(id, commit); send(200, { ok: true }); }
    else send(404, { error: 'not found' });
  } catch (e) { fail(e); }
  return true;
}
