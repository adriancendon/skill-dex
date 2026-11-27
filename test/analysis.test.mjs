// REQ-ANA-007 and REQ-ANA-026: the prompt asks for an English report with the decided sections in order,
// and the parser reads the agent's answer. No analysis is launched (it costs quota): a fixture answer is used.
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildPrompt, parseAnalysis, checkReport, entryFields, verdictOf, REPORT_SECTIONS, ANALYSIS_MODEL } from '../analysis.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = fs.readFileSync(path.join(here, 'fixtures/analysis-output.txt'), 'utf8');

describe('analysis prompt', () => {
  const p = buildPrompt('https://github.com/example/lint-helper', '/x/skillcheck.mjs', { categories: ['SEO', 'Quality', 'Other'] });
  it('lists the configured categories and follows a guide skill only when one is configured', () => {
    assert.match(p, /"category":"one of: SEO \| Quality \| Other"/);
    assert.doesNotMatch(p, /skill:\/\//);
    assert.match(buildPrompt('x', '/x/skillcheck.mjs', { guide: 'my-analyst' }), /First read skill:\/\/my-analyst/);
  });
  it('asks for English and never for Spanish', () => {
    assert.match(p, /write the whole report and every field of the result in English/);
    assert.doesNotMatch(p, /en español|in Spanish\)/i);
    assert.match(p, /full report in English/);
  });
  it('lists his four questions in his order, with security and overlaps added (D-007, D-043)', () => {
    const at = REPORT_SECTIONS.map(([h]) => p.indexOf(`"## ${h}"`));
    assert.ok(at.every(i => i > 0), 'every heading is named');
    assert.deepStrictEqual([...at].sort((a, b) => a - b), at, 'headings appear in the decided order');
    assert.deepStrictEqual(REPORT_SECTIONS.map(([h]) => h), ['What it does', 'Reviews and score', 'Security', 'Activation: automatic or manual', 'Overlaps with your skills', 'Honest recommendation']);
  });
  it('names the three English verdicts and says missing reviews are not invented', () => {
    assert.match(p, /Install, Install with changes or Do not install/);
    assert.match(p, /never invent/i);
    assert.match(p, /<<<QUERY https:\/\/github\.com\/example\/lint-helper QUERY>>>/);
    assert.match(p, /node \/x\/skillcheck\.mjs/);
  });
  it('runs on an OpenAI model', () => assert.match(ANALYSIS_MODEL, /^openai-codex\//));
});

describe('analysis parser', () => {
  it('reads the fixture answer and finds the six sections in order', () => {
    const r = parseAnalysis(fixture);
    assert.ok(r);
    assert.strictEqual(r.result.name, 'Example Lint Helper');
    assert.match(r.report, /^# Example Lint Helper/);
    assert.deepStrictEqual(r.format, { ok: true, missing: [], inOrder: true });
  });
  it('fills the watchlist fields; the status follows the verdict', () => {
    const cats = { keys: ['SEO', 'Rendimiento y calidad', 'Otras'], fallback: 'Otras' };
    const r = parseAnalysis(fixture), f = entryFields(r.result, { name: 'lint-helper', source: '' }, '2026-11-27', cats);
    assert.deepStrictEqual(f, {
      name: 'Example Lint Helper', source: 'https://github.com/example/lint-helper', category: 'Rendimiento y calidad',
      status: 'recomendada', score: 7, verdict: r.result.verdict, note: r.result.note, analyzed_at: '2026-11-27',
    });
    assert.strictEqual(entryFields({ verdict: 'Do not install: no omp support.', status: 'recomendada', category: 'Nope' }, { name: 'n' }, 'd', cats).status, 'en-analisis');
    assert.strictEqual(entryFields({ verdict: 'Do not install.' }, { name: 'n' }, 'd', cats).category, 'Otras');
  });
  it('flags a report whose sections are missing or out of order', () => {
    const swapped = fixture.replace('## Security', '## TMP').replace('## Reviews and score', '## Security').replace('## TMP', '## Reviews and score');
    assert.strictEqual(parseAnalysis(swapped).format.inOrder, false);
    assert.deepStrictEqual(checkReport('## What it does\nx\n## 6. Honest recommendation\ny').missing, ['Reviews and score', 'Security', 'Activation: automatic or manual', 'Overlaps with your skills']);
  });
  it('returns null without both blocks or with a broken result', () => {
    assert.strictEqual(parseAnalysis('no blocks here'), null);
    assert.strictEqual(parseAnalysis('<<<RESULT\n{broken\nRESULT>>>\n<<<REPORT\nx\nREPORT>>>'), null);
  });
  it('recognises the English verdicts, and the earlier Spanish ones of old entries', () => {
    assert.strictEqual(verdictOf('Install with changes: copy only one folder.'), 'Install with changes');
    assert.strictEqual(verdictOf('Install via Homebrew.'), 'Install');
    assert.strictEqual(verdictOf('**Do not install** for now.'), 'Do not install');
    assert.strictEqual(verdictOf('Installing it is not needed'), null);
    assert.strictEqual(verdictOf('No instalar: sin soporte omp.'), 'Do not install');
    assert.strictEqual(verdictOf('Instalar con cambios para pruebas.'), 'Install with changes');
    assert.strictEqual(verdictOf('Pendiente de análisis completo.'), null);
  });
});
