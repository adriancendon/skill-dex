#!/usr/bin/env node
// Writes a clean copy of the private requirements package (spec/) into spec-public/.
// The full package stays private. Removed or replaced: quotes of the owner, session/home paths, e-mails,
// the owner's name, and the ids/names of his installed skills and watchlist (read at run time).
// Usage: node tools/export-public-spec.mjs [OUT_DIR]   (default spec-public)
// Afterwards it runs the privacy check on the result and exits non-zero if anything personal is left.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findPersonal, personalSkillTerms, localPrivacyTerms, privateTermPattern } from './privacy-check.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(repo, 'spec');
const OUT = path.resolve(process.argv[2] || path.join(repo, 'spec-public'));
const terms = personalSkillTerms(), localTerms = localPrivacyTerms();
const privateTerms = privateTermPattern(localTerms);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const termRe = terms.length ? new RegExp('(?<![\\w-])(?:' + terms.map(esc).join('|') + ')(?![\\w-])', 'gi') : null;

function clean(text) {
  return text.split('\n').map(line => {
    if (/^- (quote|context):/.test(line)) return line.replace(/^(- \w+:).*/, '$1 (omitted from the public copy)');
    line = line
      .replace(/\/(?:Users|home)\/[A-Za-z0-9._-]+(?:\/[^\s`"')]*)?/g, '<path>')
      .replace(/(?:~\/)?\.omp\/agent\/sessions[^\s`"')]*/g, '<session path>')
      .replace(/[^\s`"']*\/sessions\/[^\s`"']*\.jsonl/g, '<session path>')
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/g, '<email>')
      .replace(/«[^»]*»/g, '[quote omitted]')
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g, '<id>');
    if (termRe) line = line.replace(termRe, '<skill>');
    if (privateTerms) line = line.replace(privateTerms, '<private>');
    return line;
  }).join('\n');
}

function walk(dir, rel = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '__pycache__' || e.name === '.DS_Store') continue;
    const s = path.join(dir, e.name), r = path.join(rel, e.name), d = path.join(OUT, r);
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); walk(s, r); continue; }
    const buf = fs.readFileSync(s);
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.writeFileSync(d, buf.includes(0) ? buf : clean(buf.toString('utf8')));
  }
}
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
walk(SRC);
let left = 0;
(function check(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { check(p); continue; }
    for (const h of findPersonal(fs.readFileSync(p, 'utf8'), terms, localTerms)) { left++; console.log(`${path.relative(OUT, p)}:${h.line} [${h.kind}] ${h.match}`); }
  }
})(OUT);
console.log(`Clean copy written to ${OUT}; ${left} personal finding(s) left.`);
process.exit(left ? 1 : 0);
