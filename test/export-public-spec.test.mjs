// tools/export-public-spec.mjs on a made-up requirements package: quotes, Spanish text, session and line references,
// friends, private terms; code is left alone and the result is the same on every run.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { exportSpec, cleanLine } from '../tools/export-public-spec.mjs';

// Session paths are put together here so that this file itself passes the privacy check.
const SESSIONS = ['~/.omp/agent', 'sessions', 'demo'].join('/'), ID = ['12345678', '1234', '1234', '1234', '123456789abc'].join('-');
const DECISIONS = `# Decisions

Where the quotes come from. Every quote is Pat's own text; \`context\` names the line of the JSONL file that holds it:

- session A: \`${SESSIONS}/2026-01-01T00-00-00-000Z_${ID}.jsonl\` (first build)
- session B: \`${SESSIONS}/second.jsonl\` (redesign)

## Decisions

### D-001 Lists come first
- date: 2026-01-02
- origin: owner
- quote: "Quiero ver primero la lista de todo"
- context: Session A, line 6 (2026-01-01T10:00:00Z), the first message.
- decision: The list comes first (session A, assistant message at line 57).
- note: "Sí a todo" followed a message that listed these.

### D-002 fold-kit comes from his friend Robin
- date: 2026-01-03
- origin: owner
- decision: fold-kit is a third-party skill from his friend Robin, shared directly, with no repository.
- rationale: \`app/server.mjs\` line 61 runs it; see lines 10 to 13 of \`app/scan.mjs\`. Agreed in session B, form at line 253, answer at line 255.
- question: ¿Quieres que la lista se ordene por uso o por nombre? Recomendado: por uso.
- affects: REQ-X-001 (D-003 «sí, adelante»), the README says «Pulsa el botón para empezar».

\`\`\`sh
node tool.mjs check   # aligned comment, line 5 stays
\`\`\`
`;
const STATE = `# State

- Approved with his "OK final, sí a todo" (session B, up to line 900).
- Read in full: Pat's messages in sessions A and B, the form answers in session B (lines 20 to 30), and \`notes.md\`.
- A plain English line about lines of code and sessions in general stays as it is.
`;

function fixture() {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-spec-src-'));
  fs.writeFileSync(path.join(src, 'decisions.md'), DECISIONS);
  fs.writeFileSync(path.join(src, 'state.md'), STATE);
  fs.mkdirSync(path.join(src, 'tools')); fs.writeFileSync(path.join(src, 'tools', 'tool.py'), 'fd = os.open(path, os.O_WRONLY | os.O_CREAT)  # o y de la\n');
  fs.mkdirSync(path.join(src, '.git')); fs.writeFileSync(path.join(src, '.git', 'HEAD'), 'private history\n');
  return src;
}
const opts = { terms: ['fold-kit'], localTerms: ['Pat', 'Robin'] };

test('the public copy drops quotes, Spanish text, process details, friends and private terms', () => {
  const src = fixture(), out = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-spec-out-'));
  try {
    assert.deepEqual(exportSpec(src, out, opts), []);
    const d = fs.readFileSync(path.join(out, 'decisions.md'), 'utf8'), s = fs.readFileSync(path.join(out, 'state.md'), 'utf8');
    const prose = d.replace(/```[\s\S]*?```/g, '');
    for (const text of [prose, s]) {
      assert.doesNotMatch(text, /\bsessions? [AB]\b|\blines? \d|JSONL|friend|amigo|«|»|Robin|\bPat\b|fold-kit|sí a todo|OK final|Quiero|Quieres|adelante|Pulsa/i);
    }
    assert.match(d, /^Quotes of the owner and their context are omitted from this public copy\.\n\n## Decisions/m);
    assert.match(d, /- quote: \(omitted from the public copy\)\n- context: \(omitted from the public copy\)/);
    assert.match(d, /- decision: The list comes first\.\n/);
    assert.match(d, /- note: The owner's approval followed a message that listed these\./);
    assert.match(d, /### D-002 <skill> comes from a third party\n/);
    assert.match(d, /- decision: <skill> is a third-party skill, shared directly, with no repository\./);
    assert.match(d, /- rationale: `app\/server\.mjs` runs it; see `app\/scan\.mjs`\. Agreed\./);
    assert.match(d, /- question: \(written in Spanish; omitted from the public copy\)/);
    assert.match(d, /- affects: REQ-X-001 \(D-003, owner approval\), the README says \[quote omitted\]\./);
    assert.match(d, /node tool\.mjs check {3}# aligned comment, line 5 stays/, 'code blocks are left as they are');
    assert.equal(s, '# State\n\nThis requirements package describes the current public version of Skill Dex.\n');
    assert.doesNotMatch(s, /approv|Read in full|pending|private|\d/);
    assert.equal(fs.readFileSync(path.join(out, 'tools', 'tool.py'), 'utf8'), 'fd = os.open(path, os.O_WRONLY | os.O_CREAT)  # o y de la\n', 'code files only lose private data');
    assert.ok(!fs.existsSync(path.join(out, '.git')), 'the private history is never copied');
  } finally { fs.rmSync(src, { recursive: true, force: true }); fs.rmSync(out, { recursive: true, force: true }); }
});

test('the export is deterministic', () => {
  const src = fixture(), a = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-spec-a-')), b = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-spec-b-'));
  try {
    exportSpec(src, a, opts); exportSpec(src, b, opts);
    for (const f of ['decisions.md', 'state.md', 'tools/tool.py']) assert.equal(fs.readFileSync(path.join(a, f), 'utf8'), fs.readFileSync(path.join(b, f), 'utf8'));
  } finally { for (const d of [src, a, b]) fs.rmSync(d, { recursive: true, force: true }); }
});

test('English quotes and ordinary prose are kept', () => {
  assert.equal(cleanLine('- decision: It shows "Check for updates" and the "Source unknown" label.'), '- decision: It shows "Check for updates" and the "Source unknown" label.');
  assert.equal(cleanLine('  - nested item keeps its indent'), '  - nested item keeps its indent');
  assert.equal(cleanLine('| D-9 | Reports written in Spanish are analysed again | owner |'), '| D-9 | Reports written in Spanish are analysed again | owner |');
});
