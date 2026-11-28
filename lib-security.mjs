// SkillSpector (static mode) + false-positive triage. Shared by security.mjs, skillcheck.mjs and updates.mjs.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dataFile } from './paths.mjs';
import { sources, listSkillDirs } from './skill-sources.mjs';
import { symlinkFindings, copyWithoutSymlinks, safeTreePath } from './tree-safety.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const TRIAGE_PATH = dataFile('security-triage.json');
export const BIN = path.join(here, '.venv-skillspector/bin/skillspector');
export const SCHEMA = 4; // 4: issues carry `excl`, the exclusion found in the full finding text and explanation

// The scanner sees a link-free copy for local skills; installed files are never changed.
export async function run(real, { signal, tempRoot = os.tmpdir() } = {}) {
  const links = symlinkFindings(real);
  const tmp = fs.mkdtempSync(path.join(tempRoot, 'skilldex-scan-'));
  try {
    const dir = path.join(tmp, 'skill');
    copyWithoutSymlinks(real, dir);
    const result = await new Promise(res => execFile(process.env.SKILLSPECTOR_BIN || BIN, ['scan', dir, '--no-llm', '--format', 'json'], { signal, maxBuffer: 64e6, timeout: 900000 },
      (err, out) => { try { res(JSON.parse(out)); } catch { res(null); } }));
    if (result) result.issues = [...(result.issues || []), ...links];
    return result;
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

export const compact = r => ({
  v: SCHEMA, scanned: new Date().toISOString(),
  score: r.risk_assessment?.score ?? null, recommendation: r.risk_assessment?.recommendation ?? null,
  coverage: r.analysis_completeness?.coverage_percent ?? null, complete: r.analysis_completeness?.is_complete ?? null,
  issues: (r.issues || []).map(x => {
    const cat = x.category || '', pattern = x.pattern || '', finding = String(x.finding || '').replace(/\s+/g, ' '), explanation = String(x.explanation || '');
    return {
      cat, pattern, sev: String(x.severity || '').toUpperCase(), conf: x.confidence ?? null,
      file: x.location?.file || '', line: x.location?.start_line ?? null,
      snippet: cat === 'symlink' ? finding : finding.slice(0, 140), why: explanation.slice(0, 220),
      // The exclusions are tested on the whole text, before it is cut for display (REQ-SEC-014).
      excl: textExclusion(`${cat} ${pattern} ${finding} ${explanation}`),
    };
  }),
});

// ---- Triage: the false-positive criterion approved by the owner (D-056, REQ-SEC-004/005) ----
// A finding is closed as a false positive without showing it only when it meets one of these six
// conditions and none of the exclusions. When in doubt it stays for review. Each closure records
// its condition number. Code applies conditions 1, 2 and 6; conditions 3, 4 and 5 need someone who
// reads the code, so they arrive only through reviewed entries in security-triage.json (data folder).
export const CONDITIONS = {
  1: 'It is in text the skill does not run: guides, examples or templates.',
  2: 'It is an ordinary word read as a command (for example, the Spanish word "su", which means "his" or "her").',
  3: 'The code does exactly the opposite of what the finding fears (for example, a list that blocks dangerous websites).',
  4: 'It is advice written for people, not an order for the agent.',
  5: 'It reads data only on this Mac and does not send it out.',
  6: 'The scanner itself says it is unsure (confidence under 60%).',
};
// Never closed without showing it: sends data to the internet unexplained, deletes files outside its
// folder, asks for passwords or keys, installs programs by itself, or is critical. Code cannot tell
// "unexplained" or "outside its folder", so any sign of these keeps the finding for review.
export const EXCLUSIONS = {
  critical: 'Critical findings are never closed without showing them to you.',
  internet: 'It may send data to the internet, so it is never closed automatically.',
  delete: 'It may delete files, so it is never closed automatically.',
  credentials: 'It involves passwords, keys or tokens, so it is never closed automatically.',
  install: 'It may install or bring in programs, so it is never closed automatically.',
};
// D-056 counts guides as condition 1 even when the finding is about instructions to the agent
// (prompt injection, anti-refusal, memory). Set to false to keep those findings in guides for review.
export const CLOSE_INSTRUCTION_FINDINGS_IN_GUIDES = true;
// Older reviewed entries carry no condition number (closed before D-056). They only stay closed
// once an entry names a condition 1-6, or was decided by the owner (by: "owner").
export const REQUIRE_CONDITION = true;
// Scanner coverage gaps ("analysis-evasion": part of a file was not analysed) meet no condition, so they
// are never closed. true shows the high ones as minor notices instead of findings waiting for a decision.
export const COVERAGE_GAPS_AS_NOTICES = true;

// SHA-256 of a file, or of a folder's contents (relative names and file hashes, sorted), so that a
// reviewed finding about a folder comes back when anything inside it changes.
export function fileHash(rootDir, file) {
  if (!rootDir || !file) return null;
  const p = safeTreePath(rootDir, file);
  if (!p) return null;
  try {
    if (!fs.statSync(p).isDirectory()) return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    const parts = [];
    const walk = (dir, rel) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const full = path.join(dir, e.name), name = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) walk(full, name);
        else if (e.isFile()) parts.push(`${name}\0${crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex')}`);
      }
    };
    walk(p, '');
    return crypto.createHash('sha256').update(parts.join('\n')).digest('hex');
  } catch { return null; }
}
function fileLines(rootDir, file) {
  if (!rootDir || !file) return null;
  const p = safeTreePath(rootDir, file);
  if (!p) return null;
  try { return fs.readFileSync(p, 'utf8').split('\n'); } catch { return null; }
}

const CODE = /\.(py|sh|bash|zsh|fish|js|mjs|cjs|jsx|ts|tsx|rb|pl|php|go|rs|swift|ps1|bat|cmd|command|pyc|pyo|exe|bin|so|dylib)$/i;
const SKILL_MD = /(^|\/)SKILL\.md$/i;
const TEXT_DOC = /\.(md|mdx|markdown|txt|rst)$/i;
const TEMPLATE_DIR = /(^|\/)(templates?|examples?|samples?)\//i;
const TEMPLATE_FILE = /(^|\/)[^/]*(template|example|sample)[^/]*\.html?$/i;
// Text and data types a templates/examples/samples folder may hold as inert material. HTML is here because the
// criterion already counts template pages as guides; SVG and every unknown or missing extension are not.
const INERT = /\.(md|mdx|markdown|txt|rst|html?|json|ya?ml|csv)$/i;
const INSTRUCTION_CATS = /prompt injection|anti-refusal|memory poisoning|hidden instruction|rogue agent/i;
const SEVN = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const date = v => (v ? String(v).slice(0, 10) : null);

// The exclusion a finding falls under, or null. `excl` comes from the full text (compact); findings saved before it
// existed are tested on the shortened snippet and explanation they kept.
export function exclusion(x) {
  if (x.sev === 'CRITICAL') return 'critical';
  if (x.excl !== undefined) return x.excl;
  return textExclusion(`${x.cat} ${x.pattern} ${x.snippet} ${x.why || ''}`);
}
function textExclusion(t) {
  if (/exfiltrat|server-side request|ssrf|upload|webhook|beacon|send\w*\s+(data|to|it)|network|https?:\/\//i.test(t)) return 'internet';
  if (/\brm\s+-|\brm\s+[~/]|rmtree|unlink|os\.remove|remove-item|\brmdir\b|\bshred\b|delete\w*\s+(\w+\s+)?files?/i.test(t)) return 'delete';
  if (/credential|passw|secret|token|api.?key|private.?key|keychain|\.env\b|ssh.?key/i.test(t)) return 'credentials';
  if (/supply chain|install|\b(pip3?|npm|npx|pnpm|yarn|brew|apt(-get)?|gem|cargo)\s+(install|add|i)\b|curl[^|\n]*\|\s*(ba|z)?sh/i.test(t)) return 'install';
  return null;
}

// Condition 1: guides, examples or templates. SKILL.md is the main instruction the agent follows,
// code runs, and data lists are not in the approved text (D-056 leaves them out), so none count.
// Any other file in a templates/examples/samples folder counts only when its type is text or data and it is not
// marked executable (REQ-SEC-015): a file without extension or of another type may run, so it stays for review.
function isGuide(file, rootDir) {
  if (!file || SKILL_MD.test(file) || CODE.test(file)) return false;
  return TEXT_DOC.test(file) || TEMPLATE_FILE.test(file) || (TEMPLATE_DIR.test(file) && INERT.test(file) && !executable(rootDir, file));
}
function executable(rootDir, file) {
  if (!rootDir) return false;
  try { return (fs.statSync(path.isAbsolute(file) ? file : path.join(rootDir, file)).mode & 0o111) !== 0; } catch { return false; }
}

// Condition 2: the Spanish possessive "su" flagged as the shell command su. It counts only in
// text (not code) when the next word is an ordinary word, never a flag or an account name.
const SHELL_ACCOUNTS = new Set(['root', 'admin', 'administrator', 'postgres', 'nobody', 'daemon', 'www', 'sudo', 'exec', 'bash', 'sh', 'zsh']);
function ordinaryWord(x, rootDir) {
  if (CODE.test(x.file) || !/(^|[;&|])\s*su\s*$/i.test(x.snippet.trim())) return false;
  const L = fileLines(rootDir, x.file);
  if (!L || !x.line) return false;
  const text = `${L[x.line - 1] ?? ''}\n${L[x.line] ?? ''}`;
  const m = text.match(/(?:^|[;&|])\s*su\s+([A-Za-zÁÉÍÓÚÑÜáéíóúñü]+)(?=[\s.,;:)]|$)/m);
  return !!m && !SHELL_ACCOUNTS.has(m[1].toLowerCase());
}

// The condition the code can confirm for a finding, or null (stays). Exclusions win over conditions.
export function autoCondition(x, rootDir = null) {
  if (exclusion(x)) return null;
  if (isGuide(x.file, rootDir) && (CLOSE_INSTRUCTION_FINDINGS_IN_GUIDES || !INSTRUCTION_CATS.test(x.cat))) return 1;
  if (ordinaryWord(x, rootDir)) return 2;
  if (x.conf != null && x.conf < 0.6) return 6;
  return null;
}

const validCondition = n => Number.isInteger(n) && n >= 1 && n <= 6;

export function classify(x, reviewed = [], rootDir = null, scanned = null) {
  if (x.cat === 'symlink') return { kind: x.sev === 'HIGH' || x.sev === 'CRITICAL' ? 'review' : 'info', why: 'Symlinks are not followed; this repository-safety finding is never automatically dismissed.' };
  const candidates = reviewed.filter(r =>
    r.file === x.file &&
    (r.line == null || r.line === x.line) &&
    (r.severity == null || r.severity === x.sev) &&
    (r.category == null || r.category === x.cat) &&
    (r.pattern == null || r.pattern === x.pattern) &&
    (r.snippet == null || x.snippet.includes(r.snippet))
  );
  const auto = () => { const cond = autoCondition(x, rootDir); return cond && { kind: 'noise', why: CONDITIONS[cond], by: 'auto', closed: date(scanned), cond }; };
  if (candidates.length) {
    // An entry that no longer holds sends the finding back to review, unless the code criterion closes it on its own.
    const full = candidates.find(r => r.file && r.line != null && r.severity && r.category && r.file_sha256);
    const hash = full && fileHash(rootDir, x.file);
    if (!full || !hash || hash !== full.file_sha256)
      return auto() || { kind: 'stale', why: 'The earlier review no longer applies: the file changed or the review has no file fingerprint. Check it again.' };
    const cond = validCondition(full.condition) ? full.condition : null;
    if (full.by === 'owner') return { kind: 'reviewed', why: full.reason, by: 'owner', closed: date(full.reviewed_at), cond };
    if (REQUIRE_CONDITION && !cond) return auto() || { kind: 'stale', why: 'Closed before the false-positive criterion existed and names no condition. Check it again.' };
    if (x.sev === 'CRITICAL') return { kind: 'stale', why: EXCLUSIONS.critical };
    return { kind: 'reviewed', why: full.reason, by: 'agent', closed: date(full.reviewed_at), cond };
  }
  const closed = auto();
  if (closed) return closed;
  const ex = exclusion(x), gap = x.cat === 'analysis-evasion';
  const gapWhy = 'The scanner could not fully analyse this part, and no condition of the false-positive criterion covers that.';
  if (x.sev === 'LOW' || x.sev === 'MEDIUM' || (gap && COVERAGE_GAPS_AS_NOTICES))
    return { kind: 'info', why: gap ? gapWhy : `Medium or low severity: shown as a minor notice.${ex ? ' ' + EXCLUSIONS[ex] : ''}` };
  return { kind: 'review', why: ex ? EXCLUSIONS[ex] : gap ? gapWhy : 'No condition of the false-positive criterion applies, so it waits for your decision.' };
}

// Groups: review (waits for a decision), info (minor notice), noise (closed by the code criterion), reviewed (closed by a
// recorded review), stale (a recorded review that no longer applies). Level: clean, info, review or critical.
export function triage(c, reviewed = [], rootDir = null) {
  const out = { review: [], info: [], noise: [], reviewed: [], stale: [] };
  for (const x of c.issues) {
    const { kind, why, ...k } = classify(x, reviewed, rootDir, c.scanned);
    out[kind].push({ ...x, why2: why, ...k, ...(k.cond ? { condText: CONDITIONS[k.cond] } : {}) });
  }
  const pending = out.review.concat(out.stale);
  const maxSev = pending.reduce((m, x) => Math.max(m, SEVN[x.sev] || 0), 0);
  const level = pending.length ? (maxSev >= 4 ? 'critical' : 'review') : out.info.length ? 'info' : 'clean';
  // Every list is complete: pending findings must all be shown (REQ-SEC-006), closures all recorded (REQ-SEC-005).
  return { level, counts: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])), ...out };
}

// ---- Hand-reviewed triage ----
// Returns the skill id only when it can be told without doubt (known local skill folders of any agent).
// A URL cannot tell which skill it is, so nothing is closed for it.
export function skillIdFromSrc(src, isUrl = false) {
  if (isUrl) return null;
  try {
    // path.resolve, not realpath, keeps the installed path: ~/.omp/agent/skills/X may be a symlink to the real
    // repository, and the skill's identity comes from the installed path.
    const normalized = path.resolve(src);
    const home = os.homedir();
    const under = base => { const rel = path.relative(base, normalized); return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel.split(path.sep)[0] : null; };
    for (const base of [path.join(home, '.omp', 'agent', 'skills'), path.join(home, '.omp', 'agent', 'managed-skills')]) {
      const name = under(base);
      if (name) return name;
    }
    // Other agents' folders: the catalogue entry that has this very folder (its id may be "<folder>@<agent>").
    const where = sources(), hit = where.global.map(g => [g.dir, under(g.dir)]).find(([, name]) => name);
    if (hit) {
      const folder = path.join(hit[0], hit[1]);
      return listSkillDirs({ src: where, projects: false }).find(s => s.locations.some(l => l.path === folder))?.id || null;
    }
  } catch {}
  return null;
}

export function loadTriage(skillId) {
  if (!skillId) return [];
  try { return JSON.parse(fs.readFileSync(TRIAGE_PATH, 'utf8')).filter(r => r.skill === skillId); } catch { return []; }
}
