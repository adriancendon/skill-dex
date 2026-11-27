/* Favourites saved to marks.json in the data folder through the local server (REQ-DAT-001).
   Loaded after catalog.js, which keeps the marks in `st` and calls Marks.sync() from save().
   The first time this browser meets the server, its old localStorage favourites (skilldex.v1) are merged into the file;
   merging only adds favourites, never removes any, and old flags other than favourites are ignored. Without the server,
   localStorage is the only store (offline fallback) and it always keeps a copy of the file's favourites. */
(() => {
  'use strict';
  const MIGRATED = 'skilldex.marks-in-file';
  const favs = state => Object.keys(state).filter(id => state[id]?.f).sort();
  let synced = null; // favourites known to be in the file; null until the file has been read
  let file = 'marks.json';
  let queue = Promise.resolve(), warned = false;

  const keepCopy = () => { try { localStorage.setItem(K, stored()); } catch {} };
  function apply(data) {
    for (const id of Object.keys(st)) delete st[id]; // only favourites are kept; old flags (such as "m") are dropped
    data.favourites.forEach(id => { g(id).f = true; });
    if (data.file) file = data.file;
    synced = favs(st);
    keepCopy();
  }
  const rerender = () => { if (view === 'library') renderLibrary(); };

  async function call(payload) {
    const r = await fetch('/api/marks', payload ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) } : undefined);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'HTTP ' + r.status);
    return data;
  }

  async function load() {
    try {
      let data = await call();
      let migrated = false; try { migrated = !!localStorage.getItem(MIGRATED); } catch {}
      if (!migrated) {
        const mine = favs(st);
        if (mine.length) data = await call({ merge: { favourites: mine } });
        try { localStorage.setItem(MIGRATED, new Date().toISOString()); } catch {}
      }
      apply(data);
      rerender();
    } catch (e) {
      toast(`Your favourites could not be read from the file (${e.message}). Showing the copy kept in this browser.`);
    }
  }

  // Sends each changed favourite to the server, one request at a time, in the order they happened.
  function sync() {
    if (!SRV || !synced) return;
    const now = favs(st), ops = [];
    now.filter(id => !synced.includes(id)).forEach(id => ops.push({ id, on: true }));
    synced.filter(id => !now.includes(id)).forEach(id => ops.push({ id, on: false }));
    if (!ops.length) return;
    synced = now;
    queue = queue.then(async () => {
      for (const [i, op] of ops.entries()) {
        try { await call(op); } catch (e) {
          // Not saved: forget these as synced so the next change sends them again.
          for (const o of ops.slice(i)) synced = o.on ? synced.filter(id => id !== o.id) : [...synced, o.id];
          if (!warned) { warned = true; toast(`A favourite could not be saved to the file (${e.message}). It will be sent again with your next change.`); }
          return;
        }
      }
    });
  }

  window.Marks = { sync, where: () => SRV ? `Saved in your data folder (${file}).` : 'Saved in this browser only, because Skill Dex was opened without its local server.' };
  if (SRV) load();
})();
