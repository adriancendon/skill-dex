// Watchlist changes made by the app: discard, recover and analyse again (REQ-ANA-012, REQ-ANA-019, REQ-ANA-024).
// Entries are never deleted here; an earlier discard reason and date move to discard_history instead of being lost (D-044).
import fs from 'node:fs';
import path from 'node:path';
import { normalizeEntry, watchStatus } from './names.mjs';

// A missing file is an empty watchlist (a new data folder); a file that exists but cannot be read is an error, never overwritten.
// Older status names are read as their English names (names.mjs), so the next write stores the English ones.
export function readWatchlist(file) {
  let list;
  try { list = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  if (Array.isArray(list)) list.forEach(normalizeEntry);
  return list;
}
export function writeWatchlist(file, list) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(list, null, 2) + '\n');
}
const today = () => new Date().toISOString().slice(0, 10);

// Moves the current discard into discard_history: { reason, reason_from?, discarded_at, ended, ended_at }.
// `ended` says what closed it: "recovered", "reanalysed" or "replaced" (discarded again with a new reason).
// A discard without a written reason keeps the report verdict as its reason (REQ-ANA-025), marked reason_from: "verdict".
export function archiveDiscard(w, ended, date = today()) {
  if (w.status !== 'discarded' && !w.discard_reason && !w.discarded_at) return false;
  const written = String(w.discard_reason || '').trim();
  (w.discard_history ??= []).push({
    reason: written || w.verdict || null, ...(written ? {} : { reason_from: 'verdict' }),
    discarded_at: w.discarded_at || null, ended, ended_at: date,
  });
  delete w.discard_reason; delete w.discarded_at;
  return true;
}

// The /api/watch change. Returns { ok: true } or { code, error } without touching the list on error.
export function setWatchStatus(list, id, status, reason, date = today()) {
  const w = list.find(x => x.id === id);
  if (!w) return { code: 404, error: 'Not on the watchlist' };
  status = watchStatus(status);
  if (status === 'discarded') {
    const why = String(reason || '').trim();
    if (!why) return { code: 400, error: 'A reason is required to discard' };
    if (w.status === 'discarded') archiveDiscard(w, 'replaced', date);
    w.status = 'discarded'; w.discard_reason = why.slice(0, 500); w.discarded_at = date;
    return { ok: true };
  }
  if (!['awaiting-analysis', 'recommended'].includes(status)) return { code: 400, error: 'Invalid status' };
  archiveDiscard(w, 'recovered', date);
  w.status = status;
  return { ok: true };
}

// An existing entry goes back to "analysing" (REQ-ANA-012); a discard it had is kept as history.
export function startReanalysis(w, now = new Date()) {
  archiveDiscard(w, 'reanalysed', now.toISOString().slice(0, 10));
  w.status = 'analysing'; w.started_at = now.toISOString(); delete w.error;
  return w;
}
