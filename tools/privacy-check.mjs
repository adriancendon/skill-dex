#!/usr/bin/env node
// Scans files for personal data before the repository goes public. Exits 1 if anything is found.
// Usage: node tools/privacy-check.mjs [--dir PATH] [--exclude PREFIX]... [--quiet]
//   default: tracked and untracked, non-ignored files in this repository.
//   --dir PATH: scan every file under PATH instead (e.g. spec-public).
//   --exclude PREFIX: skip tracked files whose path starts with PREFIX (repeatable; e.g. spec/, the private package).
// Local names/project terms come from optional, git-ignored privacy.local.txt (one per line).
// Installed skill ids and watchlist names are read at run time, never stored in the repository.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DATA } from '../paths.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');

// Personal skill ids/names. Only hyphenated ids are used: single words ("seo", "performance") would match ordinary prose.
export function personalSkillTerms() {
  const terms = new Set();
  const add = s => { if (typeof s === 'string' && /^[\w]+(?:-[\w]+)+$/.test(s)) terms.add(s); };
  for (const sub of ['skills', 'managed-skills']) {
    const dir = path.join(os.homedir(), '.omp/agent', sub);
    try { for (const e of fs.readdirSync(dir)) add(e); } catch {}
  }
  try { for (const w of JSON.parse(fs.readFileSync(path.join(DATA, 'watchlist.json'), 'utf8'))) { add(w.id); add(w.name); } } catch {}
  return [...terms];
}

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const OK_USERS = new Set(['Shared', 'you', 'name', 'user', 'username', 'yourname', 'me', 'Guest']);

export function localPrivacyTerms(file = path.join(repo, 'privacy.local.txt')) {
  try { return [...new Set(fs.readFileSync(file, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#')))]; }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

export function privateTermPattern(terms) {
  return terms.length ? new RegExp('(?<![\\p{L}\\p{N}_-])(?:' + terms.map(esc).join('|') + ')(?![\\p{L}\\p{N}_-])', 'giu') : null;
}

// Returns [{ line, kind, match }] for one text.
export function findPersonal(text, skillTerms = personalSkillTerms(), localTerms = localPrivacyTerms()) {
  const rules = [
    ['home-path', /\/(?:Users|home)\/([A-Za-z0-9._-]+)/g, m => !OK_USERS.has(m[1]) && !/^[<\[{$~]/.test(m[1])],
    ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/g, m => !/@(example|users\.noreply\.github)\./.test(m[0])],
    ['token', /\b(?:ghp_|gho_|github_pat_|sk-[A-Za-z0-9]|AKIA[0-9A-Z]{8}|xox[bp]-|AIza)[A-Za-z0-9_-]{8,}|(?:api[_-]?key|secret|token|password)["']?\s*[:=]\s*["'][^"'\s]{12,}["']/gi],
    ['session-path', /\.omp\/agent\/sessions\/[^\s"'`]+|\/sessions\/[^\s"'`]*\.jsonl/g], // a session file, not the sessions folder itself
    ['session-id', /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g],
  ];
  if (skillTerms.length) rules.push(['skill-id', new RegExp('(?<![\\w-])(?:' + skillTerms.map(esc).join('|') + ')(?![\\w-])', 'gi')]);
  const privateTerms = privateTermPattern(localTerms);
  if (privateTerms) rules.push(['local-term', privateTerms]);
  const out = [];
  text.split('\n').forEach((ln, i) => {
    for (const [kind, re, ok] of rules) {
      re.lastIndex = 0;
      for (const m of ln.matchAll(re)) if (!ok || ok(m)) out.push({ line: i + 1, kind, match: m[0] });
    }
  });
  return out;
}

function listFiles(dir, base = dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(p, base, acc); else acc.push(path.relative(base, p));
  }
  return acc;
}

function main() {
  const args = process.argv.slice(2);
  let dir = null, quiet = false; const excludes = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir') dir = path.resolve(args[++i]);
    else if (args[i] === '--exclude') excludes.push(args[++i]);
    else if (args[i] === '--quiet') quiet = true;
  }
  const base = dir || repo;
  const files = (dir ? listFiles(dir) : execFileSync('git', ['-C', repo, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))
    .filter(f => !excludes.some(x => f.startsWith(x)));
  const terms = personalSkillTerms(), localTerms = localPrivacyTerms();
  let total = 0;
  for (const f of files) {
    let buf; try { buf = fs.readFileSync(path.join(base, f)); } catch { continue; }
    if (buf.includes(0)) continue; // binary
    const text = buf.toString('utf8');
    // The MIT holder's public account handle is intentional attribution, not private identity; so is this repository's
    // own public address (the clone command in the README).
    const scanText = (f === 'LICENSE' ? text.replace(/^Copyright \(c\) \d{4} [A-Za-z0-9_-]+$/m, '') : text)
      .replace(/https:\/\/github\.com\/[A-Za-z0-9_-]+\/skill-dex(?:\.git)?(?![\w.-])/g, 'https://github.com/OWNER/skill-dex');
    const hits = findPersonal(scanText, terms, localTerms);
    total += hits.length;
    if (!quiet) for (const h of hits) console.log(`${f}:${h.line}  [${h.kind}]  ${h.match}`);
  }
  console.log(`${files.length} files scanned, ${total} finding(s).`);
  process.exit(total ? 1 : 0);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
