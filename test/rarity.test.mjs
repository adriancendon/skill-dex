// Rarity from GitHub (rarity.mjs) with a fake `gh`: tiers, the search it runs, exact-name filtering, errors, the
// 7-day cache and the background batches. No network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tierOf, lookup, rarityOf, staleNames, readCache, createRarity, TTL } from '../rarity.mjs';

const T = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-rarity-'));
const GH = path.join(T, 'gh'), CALLS = path.join(T, 'calls.log'), ANSWERS = path.join(T, 'answers.json');
fs.writeFileSync(GH, `#!/usr/bin/env node
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(CALLS)}, JSON.stringify(args) + '\\n');
const q = (args.find(a => a.startsWith('q=')) || '').slice(2), name = (q.match(/"name: ([^"]+)"/) || [])[1];
const a = JSON.parse(fs.readFileSync(${JSON.stringify(ANSWERS)}, 'utf8'))[name];
if (a && a.fail) { process.stderr.write(a.fail); process.exit(1); }
process.stdout.write(JSON.stringify(a || { total_count: 0, items: [] }));
`, { mode: 0o755 });
const item = (repo, fragment) => ({ repository: { full_name: repo }, ...(fragment == null ? {} : { text_matches: [{ fragment }] }) });
const answers = a => { fs.writeFileSync(ANSWERS, JSON.stringify(a)); fs.rmSync(CALLS, { force: true }); };
const calls = () => { try { return fs.readFileSync(CALLS, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { return []; } };
test.after(() => fs.rmSync(T, { recursive: true, force: true }));

test('tiers: 1 Legendary, 2-9 Epic, 10-49 Rare, 50+ Common; none, unknown or over 100 files Common', () => {
  assert.deepEqual([1, 2, 9, 10, 49, 50, 500].map(n => tierOf(n)), ['Legendary', 'Epic', 'Epic', 'Rare', 'Rare', 'Common', 'Common']);
  assert.deepEqual([0, null, undefined, NaN].map(n => tierOf(n)), ['Common', 'Common', 'Common', 'Common']);
  assert.equal(tierOf(3, 150), 'Common');
});

test('lookup searches public SKILL.md files declaring the name and counts repositories with that exact name', async () => {
  answers({ 'pocket-tool': { total_count: 5, items: [
    item('a/one', '---\nname: pocket-tool\ndescription: x'), item('a/one', 'name: "pocket-tool"'), item('b/two', "  name: 'pocket-tool'  "),
    item('c/three', 'name: pocket-tool-extra'), item('d/four', null),
  ] } });
  assert.deepEqual(await lookup('pocket-tool', GH), { repos: 3, files: 5 }); // a/one, b/two, and d/four (no matched text to check)
  const [args] = calls();
  assert.deepEqual(args.slice(0, 4), ['api', '-X', 'GET', 'search/code']);
  assert.ok(args.includes('q=filename:SKILL.md "name: pocket-tool"'));
  assert.ok(args.includes('Accept: application/vnd.github.text-match+json'));
});

test('lookup errors: no gh, no login, rate limit, and names that cannot be searched', async () => {
  answers({ nologin: { fail: 'HTTP 401: Bad credentials (gh auth login)' }, limited: { fail: 'HTTP 403: API rate limit exceeded' }, broken: { fail: 'HTTP 500' } });
  await assert.rejects(lookup('nologin', GH), { kind: 'auth' });
  await assert.rejects(lookup('limited', GH), { kind: 'rate' });
  await assert.rejects(lookup('broken', GH), { kind: 'other' });
  await assert.rejects(lookup('x', path.join(T, 'no-such-gh')), { kind: 'missing' });
  await assert.rejects(lookup('bad name"', GH), { kind: 'other' });
  assert.equal(calls().length, 3, 'an unsafe name never reaches gh');
});

test('cache: results are kept 7 days; older or missing ones are Common with an unknown count', () => {
  const now = Date.parse('2026-11-28T12:00:00Z');
  const cache = {
    fresh: { repos: 1, files: 1, checked_at: new Date(now - 3600e3).toISOString() },
    old: { repos: 1, files: 1, checked_at: new Date(now - TTL - 1).toISOString() },
    failed: { repos: null, files: 0, error: true, checked_at: new Date(now - 3600e3).toISOString() },
  };
  assert.deepEqual(rarityOf('Fresh', cache, now), { tier: 'Legendary', repos: 1, files: 1, checked_at: cache.fresh.checked_at });
  assert.deepEqual(rarityOf('old', cache, now), { tier: 'Common', repos: null });
  assert.deepEqual(rarityOf('missing', cache, now), { tier: 'Common', repos: null });
  assert.equal(rarityOf('failed', cache, now).tier, 'Common');
  assert.equal(rarityOf('failed', cache, now).repos, null);
  assert.deepEqual(staleNames(['fresh', 'old', 'missing', 'missing', 'failed', 'bad name'], cache, now), ['old', 'missing']);
});

test('background lookups: small batches, one refresh at the end, nothing asked again while fresh', async () => {
  const file = path.join(T, 'rarity.json');
  answers({ alpha: { total_count: 1, items: [item('x/alpha', 'name: alpha')] }, beta: { total_count: 0, items: [] }, gamma: { total_count: 12, items: Array.from({ length: 12 }, (_, i) => item(`r/${i}`, 'name: gamma')) } });
  let refreshed = 0;
  const r = createRarity({ names: () => ['alpha', 'beta', 'gamma'], gh: GH, file, batch: 2, spacing: 1, pause: 1, onChange: () => { refreshed++; } });
  await r.fill();
  const c = readCache(file);
  assert.deepEqual(['alpha', 'beta', 'gamma'].map(n => [c[n].repos, rarityOf(n, c).tier]), [[1, 'Legendary'], [0, 'Common'], [12, 'Rare']]);
  assert.equal(refreshed, 1);
  assert.equal(calls().length, 3);
  answers({});
  await createRarity({ names: () => ['alpha', 'beta', 'gamma'], gh: GH, file, spacing: 1, pause: 1 }).fill();
  assert.equal(calls().length, 0, 'fresh results are not searched again');
});

test('background lookups stop for this run without a GitHub login, and store nothing', async () => {
  const file = path.join(T, 'rarity-nologin.json');
  answers({ alpha: { fail: 'HTTP 401: gh auth login' } });
  let refreshed = 0;
  await createRarity({ names: () => ['alpha', 'beta'], gh: GH, file, spacing: 1, pause: 1, onChange: () => { refreshed++; } }).fill();
  assert.equal(calls().length, 1);
  assert.deepEqual(readCache(file), {});
  assert.equal(refreshed, 0);
});
