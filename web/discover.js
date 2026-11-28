/* Discover (REQ-DIS-001..010): skills found on GitHub, suggestions from your usage, a random popular pick and a typed search.
   Loaded before catalog.js, which calls renderDiscover(el) for the Discover view; the helpers it uses (svg, esc, tile, hue, longDate,
   post, toast, openAnalyse, runAnalyse, renderNav, D, SRV, $) come from catalog.js at call time. Discovering never installs anything. */
const DISC = {
  query: (() => { try { return sessionStorage.getItem('skilldex.discover.q') || ''; } catch { return ''; } })(),
  search: null, searching: false, searchError: '', showAll: false,
  suggest: null, suggestError: '', popular: null, popularError: '', pick: null, started: false,
  items: new Map(), // key → item, for the action buttons
};
// The category suggested for a found skill: the first category (skills-meta.json or built-in) whose keywords match, else the fallback.
const discCat = it => {
  const text = `${it.name} ${it.description}`, cats = Object.entries(CATEGORIES);
  const hit = cats.find(([, c]) => { try { return c.keywords && new RegExp(c.keywords, 'i').test(text); } catch { return false; } });
  return (hit || cats.find(([, c]) => c.fallback) || cats.at(-1) || ['Other'])[0];
};
const discKey = it => `${it.kind}:${it.repo}:${it.path || ''}`;
const discLabels = { installed: 'Installed', watchlist: 'In watchlist', discarded: 'Discarded' };

async function discGet(path) {
  try {
    const r = await fetch(path);
    const data = await r.json().catch(() => ({}));
    return r.ok ? data : { error: data.error || `GitHub search failed (${r.status}).` };
  } catch { return { error: 'Could not reach Skill Dex. Check that the app is still open.' }; }
}

function discLabel(it) {
  if (!it.label) return '';
  const i = it.info || {};
  const title = it.label === 'installed' ? 'You already have this installed'
    : it.label === 'discarded' ? `You discarded it${i.date ? ` on ${longDate(i.date)}` : ''}${i.reason ? `: ${i.reason}` : ''}`
    : 'Already in your watchlist';
  return `<span class="disc-label ${it.label}" title="${esc(title)}">${discLabels[it.label]}</span>`;
}
function discItem(it, big) {
  DISC.items.set(discKey(it), it);
  const k = esc(discKey(it)), cat = discCat(it);
  const where = it.kind === 'repo' ? `Repository${it.skills ? ` · ${plural(it.skills, 'skill')}` : ''}` : `Skill in ${esc(it.repo)}`;
  const stars = it.stars != null ? `<span class="disc-stars" title="Stars on GitHub">${svg('star')}${it.stars.toLocaleString('en-US')}<span class="sr-only"> stars on GitHub</span></span>` : '';
  const repoLine = it.kind === 'repo' ? `<span class="disc-repo">${esc(it.repo)}</span>` : '';
  return `<article class="disc-item${big ? ' big' : ''}" style="--hue:${hue(cat)}">${tile({ id: String(it.name).toLowerCase(), name: it.name, description: it.description, category: cat })}
    <div class="disc-copy"><h3 class="disc-name"><span>${esc(it.name)}</span>${discLabel(it)}</h3>
    <p class="disc-where">${where}${repoLine ? ' · ' + repoLine : ''}${stars}</p>
    <p class="disc-desc">${esc(it.description || 'No description on GitHub.')}</p>
    <div class="watch-actions"><button type="button" class="outline" data-disc-analyse="${k}" aria-label="Analyse ${esc(it.name)} without installing">Analyse</button><button type="button" class="outline" data-disc-add="${k}" aria-label="Add ${esc(it.name)} to the watchlist without analysing">Add to watchlist</button><a class="text-button" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">Open on GitHub<span class="sr-only"> (${esc(it.name)}, opens in a new tab)</span></a></div></div></article>`;
}
const discWhen = iso => iso ? ` Checked on GitHub ${new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.` : '';
const discLoading = text => `<p class="disc-loading" role="status">${text}</p>`;
const discError = (msg, what) => `<div class="notice error" role="alert">${esc(msg)} <button type="button" class="text-button" data-disc-retry="${what}">Try again</button></div>`;

function discFillNotice() {
  const el = $('disc-notice');
  if (!el) return;
  const notes = [...new Set([DISC.search?.notice, DISC.suggest?.notice, DISC.popular?.notice].filter(Boolean).flatMap(n => n.split(/(?<=\.)\s+(?=[A-Z])/)))];
  el.hidden = !notes.length;
  el.textContent = notes.join(' ');
}
function discFillResults() {
  const el = $('disc-results');
  if (!el) return;
  if (!DISC.searching && !DISC.search && !DISC.searchError) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  const head = `<div class="section-top"><h2 id="disc-results-title">Results for “${esc(DISC.search?.query || DISC.query)}”</h2><button type="button" class="text-button" data-disc-clear>Clear search</button></div>`;
  if (DISC.searching) { el.innerHTML = head + discLoading('Searching GitHub…'); return; }
  if (DISC.searchError) { el.innerHTML = head + discError(DISC.searchError, 'search'); return; }
  const items = DISC.search.items || [], shown = DISC.showAll ? items : items.slice(0, 12);
  el.innerHTML = head + `<p class="disc-caption" role="status">${items.length ? `${plural(items.length, 'skill')} found on GitHub, most-starred first.` : 'Nothing found on GitHub for these words. Try fewer or more general words.'}${discWhen(DISC.search.fetchedAt)}</p>
    <div class="disc-list">${shown.map(it => discItem(it)).join('')}</div>${items.length > shown.length ? `<button type="button" class="outline disc-more" data-disc-more>Show ${items.length - shown.length} more</button>` : ''}`;
  discFillNotice();
}
function discFillSuggest() {
  const el = $('disc-suggest');
  if (!el) return;
  if (DISC.suggestError) { el.innerHTML = discError(DISC.suggestError, 'suggest'); return; }
  if (!DISC.suggest) { el.innerHTML = discLoading('Looking on GitHub for skills that fit how you work…'); return; }
  const groups = DISC.suggest.groups || [];
  el.innerHTML = groups.length ? `<p class="disc-caption">Based on your three most-used skills. Skills you do not have yet come first; ones you already know keep their label.${discWhen(DISC.suggest.fetchedAt)}</p>` + groups.map(g => `<div class="disc-group"><h3 class="disc-because">Because you use <b>${esc(g.skill)}</b> <span>${plural(g.uses, 'use')} · searched “${esc(g.term)}”</span></h3>${g.error ? `<p class="disc-caption">${esc(g.error)}</p>` : g.items.length ? `<div class="disc-list">${g.items.map(it => discItem(it)).join('')}</div>` : '<p class="disc-caption">Nothing found on GitHub for this one right now.</p>'}</div>`).join('')
    : `<p class="disc-caption">${esc(DISC.suggest.notice || 'No suggestions yet.')}</p>`;
  discFillNotice();
}
function discFillPopular() {
  const el = $('disc-popular');
  if (!el) return;
  const btn = $('disc-shuffle');
  if (btn) btn.hidden = !(DISC.popular?.items?.length > 1);
  if (DISC.popularError) { el.innerHTML = discError(DISC.popularError, 'popular'); return; }
  if (!DISC.popular) { el.innerHTML = discLoading('Picking a popular skill from GitHub…'); return; }
  const pool = DISC.popular.items || [];
  if (!pool.length) { el.innerHTML = '<p class="disc-caption">GitHub returned no popular skills right now.</p>'; return; }
  if (!DISC.pick || !pool.some(p => discKey(p) === discKey(DISC.pick))) DISC.pick = pool[Math.floor(Math.random() * pool.length)];
  else DISC.pick = pool.find(p => discKey(p) === discKey(DISC.pick)); // keep the pick, with fresh labels
  el.innerHTML = `<p class="disc-caption">${esc(DISC.popular.measure)}${discWhen(DISC.popular.fetchedAt)}</p><div class="disc-list" aria-live="polite">${discItem(DISC.pick, true)}</div>`;
  discFillNotice();
}
function discShuffle() {
  const pool = DISC.popular?.items || [], others = pool.filter(p => discKey(p) !== discKey(DISC.pick || {}));
  if (!others.length) return;
  DISC.pick = others[Math.floor(Math.random() * others.length)];
  discFillPopular();
}

async function discLoadSuggest() {
  DISC.suggestError = ''; DISC.suggest = null; discFillSuggest();
  const r = await discGet('/api/discover/suggest');
  if (r.error) DISC.suggestError = r.error; else DISC.suggest = r;
  discFillSuggest();
}
async function discLoadPopular() {
  DISC.popularError = ''; DISC.popular = null; discFillPopular();
  const r = await discGet('/api/discover/popular');
  if (r.error) DISC.popularError = r.error; else DISC.popular = r;
  discFillPopular();
}
async function discSearch(q) {
  q = String(q || '').trim();
  if (q.length < 2) { const m = $('disc-search-message'); if (m) m.textContent = 'Type at least 2 characters.'; $('disc-q')?.setAttribute('aria-invalid', 'true'); return; }
  $('disc-q')?.removeAttribute('aria-invalid');
  if ($('disc-search-message')) $('disc-search-message').textContent = '';
  DISC.query = q; DISC.searching = true; DISC.searchError = ''; DISC.search = null; DISC.showAll = false;
  try { sessionStorage.setItem('skilldex.discover.q', q); } catch {}
  discFillResults();
  const r = await discGet('/api/discover/search?q=' + encodeURIComponent(q));
  if (DISC.query !== q) return; // a newer search started meanwhile
  DISC.searching = false;
  if (r.error) DISC.searchError = r.error; else DISC.search = r;
  discFillResults();
}
function discClear() {
  DISC.query = ''; DISC.search = null; DISC.searchError = ''; DISC.searching = false;
  try { sessionStorage.removeItem('skilldex.discover.q'); } catch {}
  if ($('disc-q')) { $('disc-q').value = ''; $('disc-q').focus(); }
  discFillResults(); discFillNotice();
}

// Analyse reuses "Analyse a skill": known entries are answered with what was decided (REQ-DIS-003 AC2), new ones open the dialog to confirm.
function discAnalyse(it) {
  const i = it.info || {};
  if ((it.label === 'watchlist' || it.label === 'discarded') && !['error', 'analysing'].includes(i.status)) { runAnalyse(false, i.source || i.name || it.url); return; }
  openAnalyse();
  $('analyse-url').value = (it.label && i.source) || it.url;
}
// The Watchlist tab and its count read the freshly rescanned data, without leaving Discover.
async function discReloadData() {
  try {
    const t = await (await fetch('data.js', { cache: 'no-store' })).text();
    const fresh = JSON.parse(t.slice(t.indexOf('=') + 1).trim().replace(/;\s*$/, ''));
    D.watchlist.splice(0, D.watchlist.length, ...fresh.watchlist);
    renderNav();
  } catch {}
}
async function discAdd(it, btn) {
  btn.disabled = true;
  const r = await post('/api/discover/watch', { url: it.url, name: it.name, description: it.description, category: discCat(it) });
  btn.disabled = false;
  if (!r) return;
  if (r.status === 201) {
    const info = { id: r.data.id, name: it.name, source: it.url, status: 'awaiting-analysis' }; // the same skill can be in results, suggestions and the pick
    [DISC.search?.items, DISC.popular?.items, ...(DISC.suggest?.groups || []).map(g => g.items)].forEach(list => (list || []).forEach(x => { if (discKey(x) === discKey(it)) Object.assign(x, { label: 'watchlist', info }); }));
    discFillResults(); discFillSuggest(); discFillPopular();
    document.querySelector(`[data-disc-add="${CSS.escape(discKey(it))}"]`)?.focus();
    toast(`${it.name} is in your watchlist, not analysed. Nothing was installed.`);
    discReloadData();
    return;
  }
  const x = r.data.existing;
  if (x) toast(x.status === 'discarded' ? `You discarded ${x.name}${x.date ? ' on ' + longDate(x.date) : ''}${x.reason ? ': ' + x.reason : ''}. It stays in Discarded.` : `${x.name} is already in your watchlist.`);
  else toast(r.data.error || 'It could not be added.');
}

function renderDiscover(el) {
  DISC.items.clear();
  if (!SRV) { el.innerHTML = `<p class="view-description">Discover searches GitHub through the local server. Open Skill Dex.app to use it.</p>`; return; }
  el.innerHTML = `<p class="view-description">Skills found on GitHub. Discovering never installs anything: analyse one, add it to your watchlist, or open it on GitHub.</p>
    <p class="notice disc-notice" id="disc-notice" role="status" hidden></p>
    <form class="disc-search" id="disc-form" role="search" novalidate><label class="search"><span>${svg('search')}</span><span class="sr-only">Search GitHub for skills</span><input id="disc-q" type="search" maxlength="80" placeholder="Search GitHub for skills, for example seo or animation" autocomplete="off" value="${esc(DISC.query)}" aria-describedby="disc-search-message"></label><button type="submit" class="primary">Search GitHub</button></form>
    <p class="analyse-message" id="disc-search-message" role="status"></p>
    <section class="disc-block" id="disc-results" aria-labelledby="disc-results-title" hidden></section>
    <section class="disc-block" aria-labelledby="disc-suggest-title"><h2 id="disc-suggest-title">Suggested for you</h2><div id="disc-suggest"></div></section>
    <section class="disc-block" aria-labelledby="disc-popular-title"><div class="section-top"><h2 id="disc-popular-title">Popular on GitHub</h2><button type="button" class="outline" id="disc-shuffle" data-disc-shuffle hidden>Show another</button></div><div id="disc-popular"></div></section>`;
  if (!DISC.started) {
    DISC.started = true;
    discLoadSuggest(); discLoadPopular();
    if (DISC.query) discSearch(DISC.query);
  }
  discFillResults(); discFillSuggest(); discFillPopular(); discFillNotice();
}

document.addEventListener('submit', e => { if (e.target.id === 'disc-form') { e.preventDefault(); discSearch($('disc-q').value); } });
document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.discAnalyse) { const it = DISC.items.get(d.discAnalyse); if (it) discAnalyse(it); }
  else if (d.discAdd) { const it = DISC.items.get(d.discAdd); if (it) discAdd(it, b); }
  else if ('discShuffle' in d) discShuffle();
  else if ('discClear' in d) discClear();
  else if ('discMore' in d) { DISC.showAll = true; discFillResults(); document.querySelector('#disc-results .disc-item:nth-child(13) [data-disc-analyse]')?.focus(); }
  else if (d.discRetry === 'search') discSearch(DISC.query);
  else if (d.discRetry === 'suggest') discLoadSuggest();
  else if (d.discRetry === 'popular') discLoadPopular();
});
