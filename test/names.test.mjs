// English names with the older ones still read (names.mjs, paths.mjs): config, reports folder, security results,
// origins and the default data folder. Temporary folders only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { seasonStart, normalizeTriage, originName, watchStatus, THIRD_PARTY_DIR } from '../names.mjs';
import { reportFile, defaultDataDir } from '../paths.mjs';

test('season start: "season_start", else the older "inicio", else the beginning of time', () => {
  assert.equal(seasonStart({ season_start: '2026-11-24' }), '2026-11-24');
  assert.equal(seasonStart({ inicio: '2026-11-01' }), '2026-11-01');
  assert.equal(seasonStart({ season_start: '2026-11-24', inicio: '2026-11-01' }), '2026-11-24');
  assert.equal(seasonStart({}), '1970-01-01');
  assert.equal(seasonStart(null), '1970-01-01');
});

test('reports are read from reports/ first, then from the older analisis/', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-names-'));
  try {
    fs.mkdirSync(path.join(dir, 'analisis')); fs.mkdirSync(path.join(dir, 'reports'));
    fs.writeFileSync(path.join(dir, 'analisis', 'old.md'), 'old');
    fs.writeFileSync(path.join(dir, 'analisis', 'both.md'), 'old');
    fs.writeFileSync(path.join(dir, 'reports', 'both.md'), 'new');
    assert.equal(reportFile('old', dir), path.join(dir, 'analisis', 'old.md'));
    assert.equal(reportFile('both', dir), path.join(dir, 'reports', 'both.md'));
    assert.equal(reportFile('none', dir), path.join(dir, 'reports', 'none.md'), 'a missing report is looked for, and written, in reports/');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a security result saved with the older names reads with the English ones', () => {
  const t = normalizeTriage({ level: 'critico', counts: { revisar: 1, info: 2, ruido: 3, revisada: 4, caducada: 5 }, revisar: [{ id: 1 }], caducada: [], info: [] });
  assert.equal(t.level, 'critical');
  assert.deepEqual(t.counts, { info: 2, review: 1, noise: 3, reviewed: 4, stale: 5 });
  assert.deepEqual(t.review, [{ id: 1 }]);
  assert.deepEqual(t.stale, []);
  assert.equal(t.revisar, undefined);
  for (const [old, now] of [['limpia', 'clean'], ['revisar', 'review'], ['info', 'info']]) assert.equal(normalizeTriage({ level: old }).level, now);
});

test('origins and statuses: older names map to English, English names stay', () => {
  assert.deepEqual(['tercero', 'usuario', 'auto-aprendida', 'proyecto', 'user'].map(originName), ['third-party', 'user', 'self-learned', 'project', 'user']);
  assert.deepEqual(['recomendada', 'en-analisis', 'analizando', 'descartada', 'error', 'recommended'].map(watchStatus), ['recommended', 'awaiting-analysis', 'analysing', 'discarded', 'error', 'recommended']);
  assert.ok(THIRD_PARTY_DIR.test('/x/skills-terceros/one') && THIRD_PARTY_DIR.test('/x/third-party-skills/one'));
  assert.ok(!THIRD_PARTY_DIR.test('/x/my-skills/one'));
});

test('default data folder: a legacy folder next to the code when present, else the platform folder', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-datadir-'));
  try {
    const code = path.join(root, 'code'), home = path.join(root, 'home');
    fs.mkdirSync(code);
    assert.equal(defaultDataDir({}, code, 'darwin', home), path.join(home, 'Library', 'Application Support', 'Skill Dex'));
    assert.equal(defaultDataDir({}, code, 'linux', home), path.join(home, '.local', 'share', 'Skill Dex'));
    assert.equal(defaultDataDir({ XDG_DATA_HOME: path.join(root, 'xdg') }, code, 'linux', home), path.join(root, 'xdg', 'Skill Dex'));
    fs.mkdirSync(path.join(root, 'Seguimiento'));
    assert.equal(defaultDataDir({}, code, 'darwin', home), path.join(code, '..', 'Seguimiento'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
