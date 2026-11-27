/* Level-up card (REQ-USE-019, REQ-USE-020, D-057): a centred card, shown once per new level, silent, without the user's name.
   Loaded after catalog.js (uses levelState, levelTitle, xp, D, season, total, plural, esc, $). The last level seen is kept in
   localStorage (skilldex.level-seen) with the season uses at that moment, so the card can say what made the collection rise. */
(() => {
  'use strict';
  // Titles (LEVEL_TITLES in catalog.js): a new one every 2 levels, from Newcomer to Legend.
  const SEEN = 'skilldex.level-seen';
  const used = () => D.skills.filter(s => season(s) > 0);
  const seasonUses = () => D.skills.reduce((a, s) => a + season(s), 0);
  const heading = level => `Level ${level} · ${levelTitle(level)}`;
  const names = list => { const n = list.map(s => s.name); return n.length <= 1 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`; };
  const snapshot = level => ({ level, inicio: D.inicio, uses: seasonUses(), used: used().map(s => s.id) });
  const readSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN) || 'null'); } catch { return null; } };
  const writeSeen = s => { try { localStorage.setItem(SEEN, JSON.stringify(s)); } catch {} };

  // What made the collection rise since the last level seen.
  function reason(level, seen) {
    const newUses = Math.max(0, seasonUses() - seen.uses), first = used().filter(s => !seen.used.includes(s.id));
    const climbed = level - seen.level > 1 ? `You climbed ${level - seen.level} levels. ` : '';
    const top = [...used()].sort((a, b) => season(b) - season(a))[0];
    if (first.length) return `${climbed}${plural(newUses, 'season use')} since your last level, and ${plural(first.length, 'skill')} put to work for the first time this season: ${first.length > 3 ? `${first.slice(0, 3).map(s => s.name).join(', ')} and ${first.length - 3} more` : names(first)}.`;
    return `${climbed}${plural(newUses, 'season use')} since your last level${top ? `. ${top.name} led the way with ${plural(season(top), 'use')} this season` : ''}.`;
  }
  // A next goal that builds a habit, not a bigger collection.
  function nextGoal(level) {
    const { remaining, cost } = levelState(), toGo = cost - remaining, uses = Math.ceil(toGo / 10);
    const untried = D.skills.filter(s => total(s) === 0).sort((a, b) => a.name.localeCompare(b.name));
    const quiet = D.skills.filter(s => total(s) > 0 && season(s) === 0).sort((a, b) => total(b) - total(a));
    const xpLine = `Level ${level + 1} is ${toGo} XP away, about ${plural(uses, 'season use')}.`;
    if (untried.length) return `${xpLine} Try one you have never used, such as ${untried[0].name}.`;
    if (quiet.length) return `${xpLine} Bring back one you have not used this season, such as ${quiet[0].name}.`;
    return `${xpLine} Put one different skill to work on your next project.`;
  }

  let dlg = null;
  function card() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'level-dialog'; dlg.id = 'level-up';
    dlg.setAttribute('aria-labelledby', 'level-up-title'); dlg.setAttribute('aria-describedby', 'level-up-reason');
    dlg.innerHTML = `<p class="sample-label" id="level-up-label"></p><div class="level-badge" id="level-up-badge" aria-hidden="true"></div><h2 id="level-up-title"></h2><p id="level-up-reason"></p><div class="next-goal"><b>Your next goal</b><p id="level-up-goal"></p></div><button type="button" class="primary" id="level-up-close" autofocus>Nice!</button>`;
    document.body.append(dlg);
    dlg.querySelector('#level-up-close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    return dlg;
  }
  function show({ level, label, why, opener }) {
    const d = card();
    d.querySelector('#level-up-label').textContent = label;
    d.querySelector('#level-up-label').hidden = !label;
    d.querySelector('#level-up-badge').textContent = level;
    d.querySelector('#level-up-title').textContent = label ? heading(level) : `You reached ${heading(level)}`;
    d.querySelector('#level-up-reason').textContent = why;
    d.querySelector('#level-up-goal').textContent = nextGoal(levelState().level);
    d.onclose = () => { if (opener?.isConnected) opener.focus(); };
    if (!d.open) d.showModal();
    d.querySelector('#level-up-close').focus();
  }

  // Shown once per new level. A first visit, or a new season start, only records the level without a card.
  function check() {
    const { level } = levelState(), seen = readSeen();
    if (!seen || seen.inicio !== D.inicio || !Array.isArray(seen.used) || !(level >= seen.level)) { writeSeen(snapshot(level)); return; }
    if (level === seen.level) return;
    show({ level, label: '', why: reason(level, seen) });
    writeSeen(snapshot(level)); // once: closing it, or reloading, never shows it again for this level
  }

  // "Preview level-up" in the sidebar: replays the card for the next level; it changes nothing that is saved.
  function preview(opener) {
    const { level } = levelState(), n = used().length;
    show({ level: level + 1, label: 'Level-up preview', opener, why: `This is how a new level looks. So far: ${plural(seasonUses(), 'season use')} across ${plural(n, 'different skill')}, worth ${xp} XP. Only season uses count.` });
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-level-preview]'); if (b) preview(b); });
  if (!document.querySelector('dialog[open]')) check();
})();
