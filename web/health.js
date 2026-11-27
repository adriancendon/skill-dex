/* Health section (REQ-USE-015, REQ-USE-017, D-083): catalogue health panel, similar pairs with advice and the scan tools.
   Loaded before catalog.js; renderHealthView() runs only after catalog.js has loaded.
   Nothing here installs, removes or changes a skill (REQ-USE-014). */
let pairState = null; // { advice, running, waiting, failed, busy } from /api/pair-advice; null until read
let pairPoll = null;

function renderHealthView(box) {
  const H = D.health;
  box.innerHTML = `<p class="view-description">Context for your decisions, not orders to delete. Nothing here installs, removes or changes a skill.</p>
    <section class="health-block" aria-labelledby="health-panel-title"><div class="section-top"><h2 id="health-panel-title">At a glance</h2><small>${plural(D.skills.length, 'installed skill')}</small></div>
      <div class="health" id="health">${H ? healthCards(H) : '<p>No health data in this scan. Refresh the data to compute it.</p>'}</div></section>
    <section class="health-block" aria-labelledby="pairs-title"><div class="section-top"><h2 id="pairs-title">Similar pairs <span class="count">${H ? H.duplicates.length : 0}</span></h2></div>
      <p class="block-note">Similar descriptions do not mean duplicate functions. Each pair gets one piece of advice: keep one, adapt them, or keep both separate. You decide; the advice changes nothing.</p>
      <p class="block-note" id="pair-status" role="status" aria-live="polite"></p><ul class="pair-list" id="pair-list"></ul></section>
    <section class="health-block" aria-labelledby="data-title"><div class="section-top"><h2 id="data-title">Data</h2></div>
      <div class="health-tools"><p>Last scan: ${esc(new Date(D.generated).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }))}. Season started ${esc(longDate(D.inicio))}.</p><div class="watch-actions"><button type="button" class="outline" data-refresh="data">Refresh data</button><button type="button" class="outline" data-refresh="security">Refresh and scan security</button></div><p class="block-note">${SRV ? `Analyses and background jobs run one at a time, with limited permissions. Your data folder is ${esc(D.dataDir || 'not recorded in this scan')}.` : 'Opened without the local server. Open Skill Dex.app to analyse, refresh or manage the watchlist.'}</p></div></section>`;
  renderPairs();
  if (SRV) loadPairs();
}

// ---------- Catalogue health: description tokens, heaviest, never used, quiet this season, warnings, security ----------
function healthCards(H) {
  const byId = id => D.skills.find(s => s.id === id) || { id, name: id };
  const open = (s, extra) => `<button type="button" class="text-button" data-open="s:${esc(s.id)}">${esc(s.name)}</button>${extra ? `<span>${extra}</span>` : ''}`;
  const li = (items, empty) => items.length ? `<ul>${items.map(x => `<li>${x}</li>`).join('')}</ul>` : `<p>${empty}</p>`;
  const cardH = (title, text, summary, items, empty = 'Nothing here.') => `<div class="health-card"><b>${title}</b><span>${text}</span>${items.length ? `<details><summary>${summary}</summary>${li(items, empty)}</details>` : `<p class="health-empty">${empty}</p>`}</div>`;
  const tokens = n => `~${Number(n || 0).toLocaleString('en-US')} tokens`;
  const longest = [...D.skills].sort((a, b) => b.descTokens - a.descTokens).slice(0, 8);
  const heavy = H.heavy.map(x => ({ s: byId(x.id), t: x.tokens }));
  const scanned = D.skills.filter(s => s.security), flagged = scanned.filter(s => pending(s) > 0);
  const noise = scanned.reduce((a, s) => a + (s.security.counts?.ruido || 0), 0), rawAlert = scanned.filter(s => s.security.raw !== 'SAFE').length;
  return [
    cardH(tokens(H.totalDescTokens), 'of descriptions, loaded in every session: a fixed cost', 'Longest descriptions', longest.map(s => open(s, tokens(s.descTokens)))),
    cardH(heavy[0] ? tokens(heavy[0].t) : 'No sizes', heavy[0] ? `for ${esc(heavy[0].s.name)}, the heaviest when activated. Skills only load when used.` : 'No skill sizes in this scan.', 'Heaviest skills', heavy.map(x => open(x.s, tokens(x.t)))),
    cardH(`${H.never.length} never used`, 'No recorded use in the available history.', 'See them', H.never.map(id => open(byId(id))), 'Every skill has been used at least once.'),
    cardH(`${H.dormant.length} quiet this season`, `Used before ${esc(dateText(D.inicio))}, not since. Not the same as never used.`, 'See them', H.dormant.map(id => { const s = byId(id); return open(s, `last used ${esc(dateText(s.usage?.last))}`); }), 'Every used skill is active this season.'),
    cardH(plural(H.warnings.length, 'load warning'), 'Context for your decisions, not orders to delete.', 'See warnings', H.warnings.map(w => open(byId(w.id), esc(w.msg))), 'No load warnings.'),
    cardH(`${flagged.length} to check`, `Security, of ${scanned.length} scanned: ${rawAlert} flagged before triage, ${noise} notices classed as noise. The remaining alerts stay open until you decide.`, 'Pending findings', flagged.map(s => open(s, `${pending(s)} to check`)), 'No findings waiting for you.')
  ].join('');
}

// ---------- Similar pairs with advice (REQ-USE-016, REQ-USE-017) ----------
const OUTCOME = { 'keep-one': 'Keep one', adapt: 'Adapt', separate: 'Keep separate' };
const pairKey = (a, b) => [a, b].sort().join('|');
function renderPairs() {
  const list = $('pair-list');
  if (!list) return;
  const pairs = D.health?.duplicates || [], byId = id => D.skills.find(s => s.id === id) || { id, name: id };
  const advice = pairState?.advice || {};
  const missing = pairs.filter(p => !advice[pairKey(p.a, p.b)]).length;
  const side = s => `<button type="button" class="pair-skill" data-open="s:${esc(s.id)}" aria-label="${esc(s.name)}, ${plural(season(s), 'use')} this season, ${total(s)} in total. Open details">${tile(s)}<span><b>${esc(s.name)}</b><small>${season(s)} this season · ${total(s)} total</small></span></button>`;
  list.innerHTML = pairs.map(p => {
    const a = byId(p.a), b = byId(p.b), x = advice[pairKey(p.a, p.b)];
    // The badge already names the outcome, so a leading "Adapt:" or "Keep both separate." is not repeated.
    const text = x && OUTCOME[x.outcome] && x.outcome !== 'keep-one' ? x.advice.replace(/^(adapt|keep both separate)\s*[:.,-]\s*/i, '') : x?.advice;
    const body = x ? `<p class="pair-advice">${OUTCOME[x.outcome] ? `<span class="outcome ${esc(x.outcome)}">${OUTCOME[x.outcome]}</span>` : ''}${esc(text)}</p>` : '<p class="pair-advice pending">Advice pending</p>';
    return `<li class="pair"><div class="pair-names">${side(a)}<span class="pair-share" title="Shared significant words in the two descriptions">${Math.round(p.sim * 100)}% shared words</span>${side(b)}</div>${body}</li>`;
  }).join('') || '<li class="empty">No similar pairs in this scan.</li>';
  const ps = pairState;
  $('pair-status').textContent = !pairs.length || !missing ? ''
    : !SRV ? 'Advice is written by the local server. Open Skill Dex.app to get the missing advice.'
    : !ps ? 'Checking for advice…'
    : ps.running.length ? `An agent is writing advice for ${plural(ps.running.length, 'pair')} now, in the background. One job runs at a time.`
    : ps.busy ? 'Missing advice waits until the running analysis or background job finishes.'
    : ps.failed.length && !ps.waiting.length ? 'The missing advice could not be written this time. It is tried again the next time Skill Dex opens.'
    : 'Missing advice is written in the background, one job at a time.';
}
async function loadPairs() {
  clearTimeout(pairPoll);
  try {
    const r = await fetch('/api/pair-advice');
    if (!r.ok) throw new Error();
    pairState = await r.json();
  } catch { pairState = pairState || { advice: {}, running: [], waiting: [], failed: [], busy: false }; }
  if (view !== 'health') return;
  renderPairs();
  if (pairState.running.length || pairState.busy || pairState.waiting.length) pairPoll = setTimeout(loadPairs, 8000);
}
