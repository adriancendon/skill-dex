// English names of stored values, and the older names earlier versions wrote. Data folders made by those versions are
// read as they are (old names are translated when read) and every write uses the English name. tools/migrate-data.mjs
// converts a data folder once, with a backup.

// Watchlist statuses. "error" kept its name.
export const WATCH_STATUS = { recomendada: 'recommended', 'en-analisis': 'awaiting-analysis', analizando: 'analysing', descartada: 'discarded' };
// Where an installed skill comes from (computed by the scan; older generated files and filters used the old names).
export const ORIGIN = { tercero: 'third-party', usuario: 'user', 'auto-aprendida': 'self-learned', proyecto: 'project' };
// Security triage levels and finding groups (lib-security.mjs). Cached update checks may still hold the old names.
export const SECURITY = { limpia: 'clean', revisar: 'review', critico: 'critical', ruido: 'noise', revisada: 'reviewed', caducada: 'stale' };
// Folder of analysis reports in the data folder: the new one first, then the old one.
export const REPORTS_DIR = 'reports', LEGACY_REPORTS_DIR = 'analisis';
// Name of the file next to a third-party skill that records its source: the new name first, then the old one.
export const ORIGIN_FILES = ['ORIGIN.md', 'ORIGEN.md'];
// Folder names that hold third-party skill copies.
export const THIRD_PARTY_DIR = /(?:^|[/\\])(?:third-party-skills|skills-terceros)(?:[/\\]|$)/;

export const watchStatus = s => WATCH_STATUS[s] || s;
export const originName = s => ORIGIN[s] || s;
export const securityName = s => SECURITY[s] || s;

// Start of the current season in config.json: "season_start", or the older "inicio".
export const seasonStart = cfg => (cfg && (cfg.season_start || cfg.inicio)) || '1970-01-01';

// A report path recorded in a watchlist entry ("analisis/<id>.md") with the new folder name.
const reportPath = p => typeof p === 'string' ? p.replace(new RegExp(`^${LEGACY_REPORTS_DIR}/`), `${REPORTS_DIR}/`) : p;

// One watchlist entry with English names. Returns true when something changed (the entry is changed in place).
export function normalizeEntry(w) {
  if (!w || typeof w !== 'object') return false;
  let changed = false;
  for (const k of ['status', 'regen_from']) {
    if (typeof w[k] === 'string' && WATCH_STATUS[w[k]]) { w[k] = WATCH_STATUS[w[k]]; changed = true; }
  }
  const file = reportPath(w.analysis_file);
  if (file !== w.analysis_file) { w.analysis_file = file; changed = true; }
  return changed;
}

// Security triage result (lib-security.mjs triage()) with English names: level, counts and finding groups.
export function normalizeTriage(t) {
  if (!t || typeof t !== 'object') return t;
  if (typeof t.level === 'string') t.level = securityName(t.level);
  for (const [old, now] of Object.entries(SECURITY)) {
    if (t.counts && Object.hasOwn(t.counts, old)) { t.counts[now] ??= t.counts[old]; delete t.counts[old]; }
    if (Object.hasOwn(t, old) && Array.isArray(t[old])) { t[now] ??= t[old]; delete t[old]; }
  }
  return t;
}
