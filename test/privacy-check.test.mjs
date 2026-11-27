import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { findPersonal, localPrivacyTerms } from '../tools/privacy-check.mjs';

test('optional local terms are loaded without hardcoded identities and match whole terms', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-privacy-'));
  try {
    const file = path.join(dir, 'privacy.local.txt');
    assert.deepEqual(localPrivacyTerms(file), []);
    fs.writeFileSync(file, '# Private terms\nExample Client\nRénée\nExample Client\n\n');
    const terms = localPrivacyTerms(file);
    assert.deepEqual(terms, ['Example Client', 'Rénée']);
    const hits = findPersonal('EXAMPLE CLIENT\nRénée\nRénéeville\nExample Clients', [], terms);
    assert.deepEqual(hits.map(h => [h.line, h.kind]), [[1, 'local-term'], [2, 'local-term']]);
    assert.deepEqual(findPersonal('Ordinary public prose', [], []), []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('built-in rules catch private paths and session ids while allowing generic examples', () => {
  assert.deepEqual(findPersonal('/Users/you/Developer/demo\nname@example.com', [], []), []);
  const home = '/Users/' + 'private-person' + '/notes';
  const session = ['12345678', '1234', '1234', '1234', '123456789abc'].join('-');
  assert.deepEqual(findPersonal(`${home}\n${session}`, [], []).map(h => h.kind), ['home-path', 'session-id']);
});
