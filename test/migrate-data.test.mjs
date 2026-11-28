// tools/migrate-data.mjs on a made-up data folder with the older names: dry run, backup, result, second run.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { migrate } from '../tools/migrate-data.mjs';

const TOOL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../tools/migrate-data.mjs');
const json = v => JSON.stringify(v, null, 2) + '\n';
function oldFolder() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-migrate-'));
  const w = (rel, text) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), text); };
  w('watchlist.json', json([
    { id: 'kite', status: 'recomendada', category: 'Diseño', analysis_file: 'analisis/kite.md' },
    { id: 'lamp', status: 'en-analisis', category: 'Otras' },
    { id: 'moss', status: 'descartada', category: 'SEO', discard_reason: 'Overlaps', discard_history: [{ reason: 'x', ended: 'recovered' }] },
    { id: 'nova', status: 'analizando', regen_from: 'descartada', category: 'Otras' },
    { id: 'opal', status: 'error', category: 'Unknown key' },
  ]));
  w('config.json', json({ inicio: '2026-11-24', analysis_skill: 'my-analyst' }));
  w('skills-meta.json', json({
    _categories: { SEO: { name: 'SEO' }, 'Diseño': { name: 'Design' }, Otras: { name: 'Other', fallback: true } },
    'pen-tool': { category: 'Diseño', icon: 'palette' }, 'map-tool': { category: 'SEO' }, 'odd-tool': { category: 'Otras', update_source: 'none' },
  }));
  w('analisis/kite.md', '# Kite\n');
  w('analisis/lamp.md', '# Lamp, older\n');
  w('reports/lamp.md', '# Lamp, newer\n');
  w('analisis/moss.md', '# Moss\n');
  w('reports/moss.md', '# Moss\n');
  w('marks.json', json({ favourites: ['pen-tool'] }));
  return dir;
}
const snapshot = dir => {
  const out = {};
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else out[path.relative(dir, p)] = fs.readFileSync(p, 'utf8'); } })(dir);
  return out;
};

test('dry run lists the changes and writes nothing', () => {
  const dir = oldFolder();
  try {
    const before = snapshot(dir);
    const out = execFileSync(process.execPath, [TOOL, '--data', dir, '--dry-run'], { encoding: 'utf8' });
    assert.deepEqual(snapshot(dir), before);
    assert.match(out, /dry run/);
    assert.match(out, /watchlist\.json: statuses: 1 recomendada → recommended, 1 en-analisis → awaiting-analysis, 2 descartada → discarded, 1 analizando → analysing/);
    assert.match(out, /config\.json: "inicio" → "season_start"/);
    assert.match(out, /skills-meta\.json: 2 category keys renamed/);
    assert.match(out, /analisis\/: 1 reports moved to reports\//);
    assert.match(out, /1 left in place/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a real run backs up every changed file first, converts the folder, and a second run changes nothing', () => {
  const dir = oldFolder();
  try {
    const before = snapshot(dir);
    const r = migrate(dir, { now: new Date('2026-11-28T10:00:00.000Z') });
    assert.equal(r.backup, path.join(dir, 'backups', 'migration-2026-11-28T10-00-00-000Z'));
    // the backup holds the exact old content of every file changed, moved or removed, and nothing else
    const backed = snapshot(r.backup);
    assert.deepEqual(Object.keys(backed).sort(), ['analisis/kite.md', 'analisis/moss.md', 'config.json', 'skills-meta.json', 'watchlist.json']);
    for (const [rel, text] of Object.entries(backed)) assert.equal(text, before[rel]);

    const wl = JSON.parse(fs.readFileSync(path.join(dir, 'watchlist.json'), 'utf8'));
    assert.deepEqual(wl.map(w => [w.id, w.status, w.category]), [['kite', 'recommended', 'Design'], ['lamp', 'awaiting-analysis', 'Other'], ['moss', 'discarded', 'SEO'], ['nova', 'analysing', 'Other'], ['opal', 'error', 'Unknown key']]);
    assert.equal(wl[0].analysis_file, 'reports/kite.md');
    assert.equal(wl[3].regen_from, 'discarded');
    assert.deepEqual(wl[2].discard_history, [{ reason: 'x', ended: 'recovered' }]);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8')), { season_start: '2026-11-24', analysis_skill: 'my-analyst' });
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'skills-meta.json'), 'utf8'));
    assert.deepEqual(Object.keys(meta._categories), ['SEO', 'Design', 'Other']);
    assert.deepEqual([meta['pen-tool'], meta['odd-tool']], [{ category: 'Design', icon: 'palette' }, { category: 'Other', update_source: 'none' }]);
    assert.equal(fs.readFileSync(path.join(dir, 'reports/kite.md'), 'utf8'), '# Kite\n');
    assert.equal(fs.readFileSync(path.join(dir, 'reports/lamp.md'), 'utf8'), '# Lamp, newer\n');
    assert.deepEqual(fs.readdirSync(path.join(dir, 'analisis')), ['lamp.md'], 'a report that differs from the one in reports/ stays');
    assert.equal(fs.readFileSync(path.join(dir, 'marks.json'), 'utf8'), before['marks.json']);

    const after = snapshot(dir);
    const again = migrate(dir, { now: new Date('2026-11-28T11:00:00.000Z') });
    assert.equal(again.backup, null);
    assert.equal(again.changes.filter(c => c.file !== 'analisis/').length, 0);
    assert.deepEqual(snapshot(dir), after);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a folder already in the new names, or empty, has nothing to change', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-migrate-new-'));
  try {
    assert.match(execFileSync(process.execPath, [TOOL, '--data', dir], { encoding: 'utf8' }), /Nothing to change/);
    fs.writeFileSync(path.join(dir, 'watchlist.json'), json([{ id: 'a', status: 'recommended' }]));
    fs.writeFileSync(path.join(dir, 'config.json'), json({ season_start: '2026-11-24' }));
    assert.match(execFileSync(process.execPath, [TOOL, '--data', dir], { encoding: 'utf8' }), /Nothing to change/);
    assert.ok(!fs.existsSync(path.join(dir, 'backups')));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
