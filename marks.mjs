// Favourite marks in a file of the user's data (REQ-DAT-001): marks.json in the data folder.
// Format: { "favourites": [ids], "updated_at": ISO date }. Readable and editable by hand.
import fs from 'node:fs';
import { dataFile, shownPath } from './paths.mjs';

const ID = /^[a-z0-9][\w.@/ -]{0,149}$/i; // project skills are "<folder>@<project label>"
const FILE = dataFile('marks.json');
export const shownFile = shownPath(FILE);

// A file that exists but cannot be read is never overwritten (the error goes back to the page).
function read() {
  try {
    const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return { favourites: (d.favourites || []).filter(x => typeof x === 'string'), exists: true, file: shownFile };
  } catch (e) {
    if (e.code === 'ENOENT') return { favourites: [], exists: false, file: shownFile };
    throw new Error(`${shownFile} could not be read; it was left untouched.`);
  }
}
function write(favourites) {
  const out = { favourites: [...new Set(favourites)].sort(), updated_at: new Date().toISOString() };
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(out, null, 2) + '\n');
  fs.renameSync(tmp, FILE);
  return { favourites: out.favourites, exists: true, file: shownFile };
}
const ids = a => Array.isArray(a) ? a.filter(x => typeof x === 'string' && ID.test(x)) : [];

// GET /api/marks → the marks. POST /api/marks with {merge: {favourites}} adds favourites and never removes any
// (first-load migration of the browser's marks); with {id, on} it sets or clears one favourite.
export function route(method, pathname, b) {
  if (pathname !== '/api/marks') return null;
  try {
    if (method === 'GET') return { code: 200, body: read() };
    if (method !== 'POST') return null;
    const cur = read();
    if (b.merge) {
      const add = ids(b.merge.favourites);
      if (!add.some(x => !cur.favourites.includes(x))) return { code: 200, body: cur };
      return { code: 200, body: write([...cur.favourites, ...add]) };
    }
    if (typeof b.id !== 'string' || !ID.test(b.id) || typeof b.on !== 'boolean') return { code: 400, body: { error: 'Invalid mark' } };
    if (cur.favourites.includes(b.id) === b.on) return { code: 200, body: cur };
    return { code: 200, body: write(b.on ? [...cur.favourites, b.id] : cur.favourites.filter(x => x !== b.id)) };
  } catch (e) { return { code: 500, body: { error: String(e.message).slice(0, 300) } }; }
}
