import test from 'node:test';
import assert from 'node:assert/strict';
import { trimCache } from '../discover.mjs';

const day = 24 * 3600e3, now = 1_000 * day;
const entry = (age, size = 10) => ({ at: now - age, data: { items: 'x'.repeat(size) } });

test('entries older than the keep period are dropped', () => {
  const c = trimCache({ old: entry(8 * day), fresh: entry(1000) }, now, { keep: 7 * day });
  assert.deepEqual(Object.keys(c), ['fresh']);
});

test('the entry cap keeps only the newest entries', () => {
  const c = {};
  for (let i = 0; i < 10; i++) c[`k${i}`] = entry((10 - i) * 1000); // k9 is the newest
  trimCache(c, now, { maxEntries: 3 });
  assert.deepEqual(Object.keys(c).sort(), ['k7', 'k8', 'k9']);
});

test('the byte cap drops the oldest entries until the file fits', () => {
  const c = { a: entry(3000, 500), b: entry(2000, 500), d: entry(1000, 500) };
  trimCache(c, now, { maxBytes: 1200 });
  assert.deepEqual(Object.keys(c).sort(), ['b', 'd']);
  assert.ok(Buffer.byteLength(JSON.stringify(c)) <= 1200);
});
