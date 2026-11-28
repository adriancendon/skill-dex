// REQ-ANA-024: recovering or analysing again keeps the earlier discard reason and date as history.
// Runs on a temporary copy of the data folder's watchlist.json when it exists (else on a small sample); the real file is
// never written.
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { describe, it, before, after } from 'node:test';
import { readWatchlist, writeWatchlist, setWatchStatus, startReanalysis, archiveDiscard } from '../watchlist.mjs';
import { dataFile } from '../paths.mjs';

const REAL = dataFile('watchlist.json');
const SAMPLE = [
  { id: 'kept-verdict', name: 'Kept verdict', status: 'discarded', verdict: 'Do not install: overlaps with your tools.' },
  { id: 'open-entry', name: 'Open entry', status: 'awaiting-analysis', verdict: 'Install with changes: test first.' },
];
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

describe('discard history (REQ-ANA-024)', () => {
  let tmp, file, realHash;
  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-wl-test-'));
    file = path.join(tmp, 'watchlist.json');
    if (fs.existsSync(REAL)) { realHash = sha(REAL); fs.copyFileSync(REAL, file); } else writeWatchlist(file, SAMPLE);
    const l = readWatchlist(file);
    if (!l.some(w => w.status === 'discarded')) { l.push(SAMPLE[0]); writeWatchlist(file, l); }
    if (!l.some(w => w.status !== 'discarded' && w.status !== 'analysing')) { l.push(SAMPLE[1]); writeWatchlist(file, l); }
  });
  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
    if (realHash) assert.strictEqual(sha(REAL), realHash, 'the real watchlist must stay untouched');
  });

  it('discard, recover, discard again and re-analyse keep every earlier reason and date', () => {
    let list = readWatchlist(file);
    const target = list.find(w => w.status !== 'discarded' && w.status !== 'analysing'), id = target.id, count = list.length;

    assert.deepStrictEqual(setWatchStatus(list, id, 'discarded', '  ', '2026-11-20'), { code: 400, error: 'A reason is required to discard' });
    assert.ok(setWatchStatus(list, id, 'discarded', 'Too heavy for daily use', '2026-11-20').ok);
    writeWatchlist(file, list);

    list = readWatchlist(file);
    assert.ok(setWatchStatus(list, id, 'awaiting-analysis', undefined, '2026-11-22').ok);
    writeWatchlist(file, list);
    list = readWatchlist(file);
    let w = list.find(x => x.id === id);
    assert.strictEqual(w.status, 'awaiting-analysis');
    assert.strictEqual(w.discard_reason, undefined);
    assert.deepStrictEqual(w.discard_history.at(-1), { reason: 'Too heavy for daily use', discarded_at: '2026-11-20', ended: 'recovered', ended_at: '2026-11-22' });

    assert.ok(setWatchStatus(list, id, 'discarded', 'Still overlaps with another skill', '2026-11-24').ok);
    startReanalysis(list.find(x => x.id === id), new Date('2026-11-26T10:00:00Z'));
    writeWatchlist(file, list);

    list = readWatchlist(file);
    w = list.find(x => x.id === id);
    assert.strictEqual(list.length, count, 'no entry is added or removed');
    assert.strictEqual(w.status, 'analysing');
    assert.strictEqual(w.discarded_at, undefined);
    assert.deepStrictEqual(w.discard_history.slice(-2).map(h => [h.reason, h.discarded_at, h.ended, h.ended_at]), [
      ['Too heavy for daily use', '2026-11-20', 'recovered', '2026-11-22'],
      ['Still overlaps with another skill', '2026-11-24', 'reanalysed', '2026-11-26'],
    ]);
  });

  it('a discard without a written reason keeps the report verdict as its reason', () => {
    const list = readWatchlist(file), w = list.find(x => x.status === 'discarded' && !x.discard_reason);
    if (!w) return; // every discard in this copy has a written reason
    const verdict = w.verdict, at = w.discarded_at ?? null;
    assert.ok(setWatchStatus(list, w.id, 'recommended', undefined, '2026-11-27').ok);
    assert.strictEqual(w.status, 'recommended');
    assert.deepStrictEqual(w.discard_history.at(-1), { reason: verdict || null, reason_from: 'verdict', discarded_at: at, ended: 'recovered', ended_at: '2026-11-27' });
  });

  it('discarding a discarded entry again keeps the replaced reason', () => {
    const w = { id: 'x', status: 'discarded', discard_reason: 'First reason', discarded_at: '2026-11-01' };
    assert.ok(setWatchStatus([w], 'x', 'discarded', 'Second reason', '2026-11-02').ok);
    assert.strictEqual(w.discard_reason, 'Second reason');
    assert.deepStrictEqual(w.discard_history, [{ reason: 'First reason', discarded_at: '2026-11-01', ended: 'replaced', ended_at: '2026-11-02' }]);
  });

  it('entries that were never discarded get no history, and bad input changes nothing', () => {
    const w = { id: 'y', status: 'awaiting-analysis' };
    assert.strictEqual(archiveDiscard(w, 'recovered'), false);
    startReanalysis(w);
    assert.strictEqual(w.discard_history, undefined);
    assert.deepStrictEqual(setWatchStatus([w], 'nope', 'awaiting-analysis'), { code: 404, error: 'Not on the watchlist' });
    assert.deepStrictEqual(setWatchStatus([w], 'y', 'installed'), { code: 400, error: 'Invalid status' });
  });
});

describe('older status names', () => {
  it('are read as the English names, and the next write stores the English ones', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-wl-old-'));
    try {
      const file = path.join(tmp, 'watchlist.json');
      fs.writeFileSync(file, JSON.stringify([
        { id: 'a', status: 'recomendada', analysis_file: 'analisis/a.md' }, { id: 'b', status: 'en-analisis' },
        { id: 'c', status: 'analizando', regen_from: 'descartada' }, { id: 'd', status: 'descartada', discard_reason: 'Old' }, { id: 'e', status: 'error' },
      ]));
      const list = readWatchlist(file);
      assert.deepStrictEqual(list.map(w => w.status), ['recommended', 'awaiting-analysis', 'analysing', 'discarded', 'error']);
      assert.strictEqual(list[0].analysis_file, 'reports/a.md');
      assert.strictEqual(list[2].regen_from, 'discarded');
      assert.ok(setWatchStatus(list, 'b', 'descartada', 'Asked with the older name', '2026-11-28').ok);
      assert.strictEqual(list[1].status, 'discarded');
      writeWatchlist(file, list);
      assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /recomendada|en-analisis|analizando|descartada|analisis\//);
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });
});
