#!/usr/bin/env node
// Writes a clean copy of the private requirements package (spec/) into spec-public/.
// The full package stays private. Removed or replaced:
// - quotes of the owner and their context (`quote:` and `context:` fields, «…» quotes, Spanish text in quotes);
//   approvals such as a quoted "yes" become "(owner approval)";
// - field values and lines written in Spanish (the owner's questions and answers kept in their own language);
// - the development process: session references ("session A", "sessions A and B"), line numbers ("line 12",
//   "lines 3 to 5", "the JSONL line") and the list of session files;
// - who shared a skill: mentions of a friend and his name;
// - session/home paths, e-mails, ids, the owner's name, private terms of privacy.local.txt and the ids/names of his
//   installed skills and watchlist (read at run time).
// The result is deterministic: the same package and terms always give the same files.
// Usage: node tools/export-public-spec.mjs [OUT_DIR] [--src SPEC_DIR]   (defaults: spec-public, spec)
// Afterwards it runs the privacy check on the result and exits non-zero if anything personal is left.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findPersonal, personalSkillTerms, localPrivacyTerms, privateTermPattern } from './privacy-check.mjs';

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const OMITTED = '(omitted from the public copy)', SPANISH = '(written in Spanish; omitted from the public copy)';
export const APPROVAL = '(owner approval)', QUOTE = '[quote omitted]';

// Spanish text: enough Spanish function words, or Spanish letters with a Spanish word or without any English one.
const ES = new Set(('que de del la el los las para por con un una sin sí es son está están esto esta este estos hay ya muy ' +
  'también pero como cuando donde porque todo todos toda todas hacer hace quiero quieres puedes puede tengo tienes ' +
  'mis tus sus nos les qué cómo cuándo dónde ahora antes después sobre entre hasta desde solo sólo cada otra otro ' +
  'otras otros lo al se le su tu mi te o y').split(' '));
const EN = new Set('the a an of to and is are in it for on with be this that by from as or at not'.split(' '));
export function isSpanish(text) {
  const words = String(text).toLowerCase().match(/[a-záéíóúñü]+/g) || [];
  if (!words.length) return false;
  const es = words.filter(w => ES.has(w)).length, marks = (String(text).match(/[¿¡ñáéíóú]/gi) || []).length;
  return /[¿¡]/.test(text) || (es >= 2 && es / words.length >= 0.2) || (marks > 0 && es > 0) || (marks > 0 && !words.some(w => EN.has(w)));
}
const mostlySpanish = text => {
  const words = String(text).toLowerCase().match(/[a-záéíóúñü]+/g) || [];
  return words.filter(w => ES.has(w)).length >= 4 && isSpanish(text) && words.filter(w => ES.has(w)).length / words.length >= 0.25;
};
// A short approval: "sí", "OK final", "adelante", "vale"…
const isApproval = q => q.length <= 30 && /^[^\p{L}]*(?:s[ií]|ok|okay|vale|adelante|de acuerdo|perfecto|hazlo|dale|publ[ií]ca(?:lo)?|aprobad[oa]|correcto|yes)(?!\p{L})/iu.test(q);
const quoted = q => isApproval(q) ? APPROVAL : QUOTE;

// Applies `fn` to the parts of a line outside `code` spans.
const outsideCode = (line, fn) => line.split(/(`[^`]*`)/).map(part => part.startsWith('`') && part.endsWith('`') && part.length > 1 ? part : fn(part)).join('');

export const NO_QUOTES = 'Quotes of the owner and their context are omitted from this public copy.';
const PROCESS = [
  // the list of session files at the top of the decisions
  [/^-\s+(?:session [A-Z]|global instructions):.*$/i, null],
  // "(session A, assistant message at line 57)", "session B, form at line 253, answer at line 255", "in sessions A and B"
  [/\s*\((?:in |see )?sessions? [A-Z](?: and [A-Z])?(?:,[^()]*?)?\)/g, ''],
  [/,?\s*\b(?:in |from |of )?(?:the )?sessions? [A-Z](?: and [A-Z])?\b(?:(?:,\s*|\s+)(?:the )?[^.;(),]*?\blines? \d+(?:\s*(?:to|and|-|–)\s*\d+)?(?:\s*\(\d{4}-[^)]*\))?(?:,\s*[^.;(),]*?\blines? \d+(?:\s*(?:to|and|-|–)\s*\d+)?(?:\s*\(\d{4}-[^)]*\))?)*)?/gi, ''],
  // line numbers: "line 61", "lines 10 to 13", "on line 639", "(line 7 …)", "line 1 to 5"
  [/\blines? \d+(?:\s*(?:to|and|-|–)\s*\d+)?(?:,\s*\d+)* of\b ?/gi, ''],
  [/\s*\((?:at |on |see )?lines? \d+(?:\s*(?:to|and|-|–)\s*\d+)?(?:,\s*\d+)*\)/gi, ''],
  [/,?\s*(?:\b(?:on|at|in|from|up to)\s+)?\blines? \d+(?:\s*(?:to|and|-|–)\s*\d+)?(?:,\s*\d+)*(?:\s*\(\d{4}-\d\d-\d\dT[\d:]+Z\))?/gi, ''],
];
const FRIEND = [
  [/\bmentions of a (?:friend|amigo)\b|\b(?:friend|amigo) mentions\b/g, 'mentions of who shared a skill'],
  [/\(a (?:friend|amigo), /g, '(who shared a skill, '],
  [/\bcomes from (?:his|her|a|my|the owner's) (?:friend|amigo)(?: (?:<private>|[A-Z][\w-]*))?/g, 'comes from a third party'],
  [/,?\s*\bfrom (?:his|her|a|my|the owner's) (?:friend|amigo)(?: (?:<private>|[A-Z][\w-]*))?/g, ''],
  [/\b(?:his|her|a|my|the owner's) (?:friend|amigo)(?: (?:<private>|[A-Z][\w-]*))?/g, 'a third party'],
  [/\b[Tt]he (?:friend|amigo)'s name\b/g, 'The name'],
  [/,\s*from <private>(?=\))/g, ''],
  [/\b(?:friend|amigo)s?\b/gi, 'contributor'],
];
// "([quote omitted])" says nothing: dropped; "([quote omitted]: yes)" keeps the answer.
const TIDY = [
  [/\s*\((?:\s*(?:\[quote omitted\]|\(owner approval\))\s*(?:,|\/|and|or)?)+\)/g, ''],
  [/\(\s*\[quote omitted\]\s*:\s*/g, '(owner answer: '],
  [/\(\s*\(owner approval\)\s*:\s*/g, '(owner answer: '],
  [/\b(?:his|her|the owner's) \(owner approval\)/g, "the owner's approval"],
  [/(^|[:.]\s+)\(owner approval\)(?= [a-z])/g, "$1The owner's approval"],
  [/ \(owner approval\)\)/g, ', owner approval)'],
  [/ {2,}/g, ' '], [/ +([,.;:)])/g, '$1'], [/\( +/g, '('], [/,\s*,/g, ','], [/\(\s*\)/g, ''],
];

// One line of the package, cleaned; null drops the line. ctx: { termRe, privateTerms, prose }. Private data is replaced
// in every file; quotes, Spanish text, process details and friends only in prose (Markdown), never in code.
export function cleanLine(line, ctx = {}) {
  const prose = ctx.prose !== false;
  const field = line.match(/^(\s*- [\w ]+?:)(\s*)(.*)$/);
  if (prose && field && /^\s*- (quote|context):$/.test(field[1])) return `${field[1]} ${OMITTED}`;
  if (prose && PROCESS[0][0].test(line)) return null;
  line = line
    .replace(/\/(?:Users|home)\/[A-Za-z0-9._-]+(?:\/[^\s`"')]*)?/g, '<path>')
    .replace(/(?:~\/)?\.omp\/agent\/sessions[^\s`"')]*/g, '<session path>')
    .replace(/[^\s`"']*\/sessions\/[^\s`"']*\.jsonl/g, '<session path>')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/g, '<email>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g, '<id>');
  if (ctx.termRe) line = line.replace(ctx.termRe, '<skill>');
  if (ctx.privateTerms) line = line.replace(ctx.privateTerms, '<private>');
  if (!prose) return line;
  // a paragraph about where the quotes come from (the session log files)
  if (!field && /\bJSONL\b/.test(line)) return NO_QUOTES;
  // a value or a whole line in Spanish (its quotes and code are judged apart)
  const value = field ? field[3] : line.replace(/^(\s*(?:[-*]|\d+\.|#+|\|)\s*)/, '');
  if (mostlySpanish(value.replace(/`[^`]*`|«[^»]*»|"[^"\n]*"|“[^”\n]*”/g, ' '))) return field ? `${field[1]} ${SPANISH}` : line.slice(0, line.length - value.length) + SPANISH;
  // «…» quotes, innermost first (they may hold other quotes or code)
  while (/«[^«»]*»/.test(line)) line = line.replace(/«([^«»]*)»/g, (_, q) => quoted(q));
  const indent = line.match(/^\s*/)[0];
  return indent + outsideCode(line.slice(indent.length), part => {
    let next = part.replace(/"([^"\n]{1,400})"/g, (m, q) => isSpanish(q) ? quoted(q) : m)
      .replace(/“([^”\n]{1,400})”/g, (m, q) => isSpanish(q) ? quoted(q) : m);
    for (const [re, to] of [...PROCESS.slice(1), ...FRIEND]) next = next.replace(re, to);
    // tidy only where something was taken out, so untouched text keeps its exact spacing
    if (next !== part || next.includes(QUOTE) || next.includes(APPROVAL)) for (const [re, to] of TIDY) next = next.replace(re, to);
    return next;
  });
}
// Lines inside ``` fences are code: only private data is replaced there. A dropped line takes one blank line with it
// when it leaves two in a row.
export function cleanText(text, ctx = {}) {
  let fence = false, dropped = false;
  const out = [];
  for (const l of text.split('\n')) {
    const isFence = /^\s*```/.test(l), inCode = fence || isFence;
    if (isFence) fence = !fence;
    const c = cleanLine(l, { ...ctx, prose: ctx.prose !== false && !inCode });
    if (c === null) { dropped = true; continue; }
    if (dropped && c === '' && out.at(-1) === '') continue;
    dropped = false;
    out.push(c);
  }
  return out.join('\n');
}

// Copies `src` into `out` (emptied first), cleaning every text file. Returns the personal findings left in `out`.
export function exportSpec(src, out, { terms = personalSkillTerms(), localTerms = localPrivacyTerms() } = {}) {
  const ctx = {
    termRe: terms.length ? new RegExp('(?<![\\w-])(?:' + terms.map(esc).join('|') + ')(?![\\w-])', 'gi') : null,
    privateTerms: privateTermPattern(localTerms),
  };
  const walk = (dir, rel = '') => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      // spec/ is its own private git repository: its .git holds the full private history and must never be copied.
      if (e.name === '__pycache__' || e.name === '.DS_Store' || e.name === '.git') continue;
      const s = path.join(dir, e.name), r = path.join(rel, e.name), d = path.join(out, r);
      if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); walk(s, r); continue; }
      const buf = fs.readFileSync(s);
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.writeFileSync(d, buf.includes(0) ? buf : cleanText(buf.toString('utf8'), { ...ctx, prose: e.name.endsWith('.md') }));
    }
  };
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  walk(src);
  const left = [];
  (function check(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { check(p); continue; }
      for (const h of findPersonal(fs.readFileSync(p, 'utf8'), terms, localTerms)) left.push({ file: path.relative(out, p), ...h });
    }
  })(out);
  return left;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const args = process.argv.slice(2), at = args.indexOf('--src');
  const src = path.resolve(at >= 0 ? args[at + 1] || '' : path.join(repo, 'spec'));
  const out = path.resolve(args.find((a, i) => !a.startsWith('--') && !(at >= 0 && i === at + 1)) || path.join(repo, 'spec-public'));
  if (!fs.existsSync(src)) { console.error(`No requirements package at ${src}`); process.exit(2); }
  const left = exportSpec(src, out);
  for (const h of left) console.log(`${h.file}:${h.line} [${h.kind}] ${h.match}`);
  console.log(`Clean copy written to ${out}; ${left.length} personal finding(s) left.`);
  process.exit(left.length ? 1 : 0);
}
