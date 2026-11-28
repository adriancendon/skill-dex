#!/usr/bin/env node
// Usage: node skillcheck.mjs <local path | git URL> [subfolder]
// Security step of a skill analysis: SkillSpector static scan (--no-llm) + triage with the false-positive criterion (D-056).
// Installs nothing. Given a URL, it clones into a system temp folder and deletes it when done, also on error (REQ-SEC-008).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { BIN, run, compact, triage, skillIdFromSrc, loadTriage } from './lib-security.mjs';

const [src, sub] = process.argv.slice(2);
if (!src) { console.error('Usage: node skillcheck.mjs <path | git URL> [subfolder]'); process.exit(2); }
if (!fs.existsSync(BIN)) { console.error('SkillSpector is missing from .venv-skillspector next to this script.'); process.exit(2); }
const isUrl = /^(https?:\/\/|git@)/.test(src);
const skillId = skillIdFromSrc(src, isUrl);

// Only the folder this run created is deleted, and only inside the system temporary folder.
let clone = null;
function removeClone() {
  if (!clone) return;
  const tmp = fs.realpathSync(os.tmpdir()), real = fs.existsSync(clone) ? fs.realpathSync(clone) : null;
  if (real && path.dirname(real) === tmp && path.basename(real).startsWith('skillcheck-')) {
    try { fs.rmSync(real, { recursive: true, force: true }); console.log(`Temporary folder deleted: ${clone}`); }
    catch (e) { console.error(`Could not delete ${clone}: ${e.message}`); }
  }
  clone = null;
}
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { removeClone(); process.exit(130); });

function report(dir, c, t) {
  const L = { clean: '🟢 CLEAN', info: '🟡 MINOR NOTICES ONLY', review: '🟠 REVIEW BY HAND', critical: '🔴 CRITICAL — REVIEW BEFORE ANYTHING ELSE' }[t.level];
  const byCond = t.noise.reduce((a, x) => ({ ...a, [x.cond]: (a[x.cond] || 0) + 1 }), {});
  console.log(`\nSkillSpector (static, no AI) on ${dir}`);
  console.log(`Verdict after triage: ${L}`);
  console.log(`Raw scanner result: ${c.recommendation} (score ${c.score}) · coverage ${c.coverage}% · ${c.issues.length} findings`);
  console.log(`Triage: ${t.counts.review} to review · ${t.counts.info} notices · ${t.counts.noise} closed as false positives (criterion D-056${t.counts.noise ? ': ' + Object.entries(byCond).map(([n, k]) => `condition ${n} ×${k}`).join(', ') : ''})`);
  for (const x of t.review) console.log(`  ⚠ [${x.sev}] ${x.cat}: ${x.pattern} — ${x.file}:${x.line ?? '?'}\n     "${x.snippet}"\n     ${x.why}\n     → ${x.why2}`);
  for (const x of t.info) console.log(`  · [${x.sev}] ${x.cat}: ${x.pattern} — ${x.file}:${x.line ?? '?'}`);
  if (t.stale.length) {
    console.log(`\n↻ Reviews that no longer apply (file changed, no fingerprint or no condition): ${t.counts.stale} — review again`);
    for (const x of t.stale) console.log(`  ↻ [${x.sev}] ${x.cat}: ${x.pattern} — ${x.file}:${x.line ?? '?'}\n     ${x.why2}`);
  }
  if (t.reviewed.length) {
    console.log(`\n✓ Already reviewed (false positive): ${t.counts.reviewed}`);
    for (const x of t.reviewed) console.log(`  ✓ [${x.sev}] ${x.cat}: ${x.pattern} — ${x.file}:${x.line ?? '?'}${x.cond ? ` · condition ${x.cond}` : ''}\n     ${x.why2}`);
  }
  if (t.noise.length) {
    console.log(`\n✓ Closed automatically (false positive, criterion D-056): ${t.counts.noise}`);
    for (const x of t.noise) console.log(`  ✓ [${x.sev}] ${x.cat}: ${x.pattern} — ${x.file}:${x.line ?? '?'} · condition ${x.cond}`);
  }
  console.log('\nTo close a finding by hand, its entry in security-triage.json (data folder) needs "condition": 1-6 and file_sha256; never a CRITICAL one, nor one that sends data to the internet, deletes files outside its folder, asks for passwords or keys, or installs programs.');
  console.log('Note: this is heuristic; "clean" is not a certificate. Read SKILL.md and the scripts too.');
}

try {
  let dir = src;
  if (isUrl) {
    clone = fs.mkdtempSync(path.join(os.tmpdir(), 'skillcheck-'));
    console.log(`Cloned into ${clone}`);
    execFileSync('git', ['clone', '--depth', '1', '-q', src, clone], { stdio: 'inherit' });
    dir = clone;
  }
  if (sub) dir = path.join(dir, sub);
  dir = fs.realpathSync(dir);
  const r = await run(dir);
  if (!r) { console.error('SkillSpector returned no result (a path without SKILL.md, or an error?)'); process.exitCode = 1; }
  else { const c = compact(r); report(dir, c, triage(c, loadTriage(skillId), dir)); }
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exitCode = 1;
} finally {
  removeClone();
}
