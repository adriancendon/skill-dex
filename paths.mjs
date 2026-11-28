// Where Skill Dex keeps the user's data (REQ-DAT-001). SKILLDEX_DATA chooses the data folder. Without it: a
// "Seguimiento" folder next to this repository's folder when one exists (the data folder name earlier versions used),
// otherwise ~/Library/Application Support/Skill Dex on macOS or ${XDG_DATA_HOME:-~/.local/share}/Skill Dex elsewhere.
// launch.sh applies the same rule. Generated files (web/data.js, cache/) stay next to the code.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPORTS_DIR, LEGACY_REPORTS_DIR } from './names.mjs';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export function defaultDataDir(env = process.env, here = HERE, platform = process.platform, home = os.homedir()) {
  const legacy = path.join(here, '..', 'Seguimiento');
  if (fs.existsSync(legacy)) return legacy;
  if (platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'Skill Dex');
  return path.join(env.XDG_DATA_HOME || path.join(home, '.local', 'share'), 'Skill Dex');
}
export const DATA = path.resolve(process.env.SKILLDEX_DATA || defaultDataDir());
export const dataFile = (...parts) => path.join(DATA, ...parts);
// SKILLDEX_WATCHLIST points every watchlist read and write at another file (tests on a temporary copy).
export const WATCHLIST = path.resolve(process.env.SKILLDEX_WATCHLIST || dataFile('watchlist.json'));
// Analysis reports: new ones are written to reports/; reports/ is read first, then the older analisis/ folder.
export const REPORTS = dataFile(REPORTS_DIR);
export function reportFile(id, data = DATA) {
  const now = path.join(data, REPORTS_DIR, id + '.md'), old = path.join(data, LEGACY_REPORTS_DIR, id + '.md');
  return !fs.existsSync(now) && fs.existsSync(old) ? old : now;
}
// The server's secret for this launch (REQ-SEC-013), readable only by the user; launch.sh and local tools read it.
export const TOKEN_FILE = path.join(HERE, 'cache', 'session-token');

// A path as shown to the user, with the home folder written as ~.
export function shownPath(p) {
  const home = os.homedir();
  return p === home || p.startsWith(home + path.sep) ? '~' + p.slice(home.length) : p;
}
