// Where Skill Dex keeps the user's data (REQ-DAT-001). SKILLDEX_DATA chooses the data folder; the default is a
// "Seguimiento" folder next to this repository's folder. Generated files (web/data.js, cache/) stay next to the code.
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DATA = path.resolve(process.env.SKILLDEX_DATA || path.join(HERE, '..', 'Seguimiento'));
export const dataFile = (...parts) => path.join(DATA, ...parts);
// SKILLDEX_WATCHLIST points every watchlist read and write at another file (tests on a temporary copy).
export const WATCHLIST = path.resolve(process.env.SKILLDEX_WATCHLIST || dataFile('watchlist.json'));
export const ANALYSIS_DIR = dataFile('analisis');

// A path as shown to the user, with the home folder written as ~.
export function shownPath(p) {
  const home = os.homedir();
  return p === home || p.startsWith(home + path.sep) ? '~' + p.slice(home.length) : p;
}
