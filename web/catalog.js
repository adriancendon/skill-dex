/* Skill Dex catalogue (design D). Filters and views never change installs, reports or usage history.
   Favourites are saved to marks.json in the data folder by marks.js, with a copy in localStorage (skilldex.v1); the chosen view in skilldex.view. */
const D = window.SKILLS_DATA, K = 'skilldex.v1', VIEW_KEY = 'skilldex.view', THEME_KEY = 'skilldex.theme';
let st;
try { st = JSON.parse(localStorage.getItem(K) || '{}'); } catch { st = {}; }
const stored = () => JSON.stringify(Object.fromEntries(Object.keys(st).filter(id => st[id]?.f).map(id => [id, { f: true }]))); // favourites only
const save = () => { try { localStorage.setItem(K, stored()); } catch {} window.Marks?.sync(); };
const g = id => st[id] || (st[id] = {});
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SRV = location.protocol.startsWith('http');
// The agent CLI that runs analyses and background descriptions (runner.mjs); off when none is installed.
const RUNNER = D.runner || { available: true, kind: 'omp', label: 'omp' };
const limitText = () => RUNNER.kind === 'codex' ? 'stops after 20 minutes (Codex offers no cost limit)' : 'stops at $1.50 or 20 minutes';

// ---------- Icons (proposal A's badges): the skill's own icon in skills-meta.json, else from words of the description, else from the category ----------
const P = {
  person: '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5h14M12 8.5v5.5m0 0-3.5 6.5M12 14l3.5 6.5"/>',
  pencilSpark: '<path d="M4 20l1-4L15 6l3 3L8 19z"/><path d="M13 8l3 3"/><path d="M19 2.5v4M17 4.5h4"/>',
  megaphone: '<path d="M3 10.5v3l2 .5 1.5 5h2.5l-1-4.4L15 17V7L5 10z"/><path d="M18 9.5c1 .7 1.5 1.5 1.5 2.5s-.5 1.8-1.5 2.5"/>',
  bars: '<path d="M3 21h18M6 17v-5M11 17V6M16 17v-8M21 17v-3"/>',
  shieldCheck: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M12 8.5v4M12 15.5v.5"/>',
  brain: '<path d="M9.5 4A3 3 0 0 0 6.5 7a3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 5.5 1.5V5.5A2.4 2.4 0 0 0 9.5 4z"/><path d="M14.5 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-5.5 1.5"/><path d="M12 10h-2M12 14h2.5"/>',
  crosshair: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  editLines: '<path d="M3 6h11M3 10h8M3 14h5"/><path d="M12 20l.8-3.2L19 10.6l2.4 2.4-6.2 6.2z"/>',
  feather: '<path d="M20 4C11 4 6.5 9.5 5.5 20"/><path d="M20 4c0 7.5-4.5 11.5-12 11.5"/><path d="M14 10l-5 5"/>',
  gauge: '<path d="M3.5 17a8.5 8.5 0 1 1 17 0"/><path d="m12 17 4.5-6"/><path d="M6.5 13.5h1M12 8.5v1M17 13.5h-.5"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3.5 17.5l3 3 6-6a4 4 0 0 0 5.2-5.2L15 12l-3-3z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
  network: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="12" cy="12" r="1.5"/><path d="M12 7v3.5M11 13l-4.6 4.6M13 13l4.6 4.6"/>',
  bolt: '<path d="M13 2 4.5 14H11l-1 8 8.5-12H12z"/>',
  braces: '<path d="M8 4c-2 0-3 1-3 3v2c0 1.2-.8 2.4-2 3 1.2.6 2 1.8 2 3v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1.2.8 2.4 2 3-1.2.6-2 1.8-2 3v2c0 2-1 3-3 3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4.9-4.9"/>',
  searchCheck: '<circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4.9-4.9M8.3 11l2 2 3.2-3.6"/>',
  sparkles: '<path d="M11 3l1.8 4.7 4.7 1.8-4.7 1.8L11 16l-1.8-4.7L4.5 9.5l4.7-1.8z"/><path d="M18.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  map: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  code: '<path d="m8 7.5-4.5 4.5L8 16.5M16 7.5l4.5 4.5-4.5 4.5M13.5 5l-3 14"/>',
  sitemap: '<rect x="9" y="3" width="6" height="4.5" rx="1"/><rect x="2.5" y="16.5" width="6" height="4.5" rx="1"/><rect x="15.5" y="16.5" width="6" height="4.5" rx="1"/><path d="M12 7.5V12M5.5 16.5V12h13v4.5"/>',
  plusSquare: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/>',
  diverge: '<path d="M12 21v-8M12 13 5.5 6.5M12 13l6.5-6.5"/><path d="M5 10.5V6h4.5M19 10.5V6h-4.5"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-.9 2-1.9 0-1.2-1-1.6-1-2.6s.9-1.5 2-1.5h2.2A3.8 3.8 0 0 0 21 11.2C21 6.7 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7" r="1.1"/><circle cx="15" cy="7.3" r="1.1"/>',
  checklist: '<rect x="4.5" y="3" width="15" height="18" rx="2"/><path d="m8 8.5 1.5 1.5 2.5-3M8 15l1.5 1.5 2.5-3M14.5 9h2M14.5 15.5h2"/>',
  medal: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-2.8 5 2.8-1.5-7"/><path d="m12 6.5.8 1.7 1.8.2-1.3 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.2 1.8-.2z"/>',
  flask: '<path d="M9 3h6M10 3v6.2L4.6 18.4A1.8 1.8 0 0 0 6.2 21h11.6a1.8 1.8 0 0 0 1.6-2.6L14 9.2V3"/><path d="M7.2 15h9.6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12.5 15H17"/>',
  scales: '<path d="M12 3v18M7 21h10M5 7h14"/><path d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
  broom: '<path d="M14 3l-3.5 8"/><path d="M6.5 11h8l2 10h-12z"/><path d="M9 15.5v5.5M12.5 15.5v5.5"/>',
  shieldSearch: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><circle cx="11.5" cy="11.5" r="2.8"/><path d="m13.6 13.6 2.2 2.2"/>',
  coins: '<ellipse cx="9" cy="7" rx="5.5" ry="2.5"/><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5M3.5 11v4c0 1.4 2.5 2.5 5.5 2.5"/><ellipse cx="15.5" cy="13.5" rx="5" ry="2.3"/><path d="M10.5 13.5v4c0 1.3 2.2 2.3 5 2.3s5-1 5-2.3v-4"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H16a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h7.5"/>',
  compress: '<path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5"/>',
  record: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>',
  radar: '<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7.5a4.5 4.5 0 1 0 4.5 4.5"/><path d="M12 12l7-7"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
  cloud: '<path d="M7 18h10.5a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18z"/>',
  motion: '<path d="M3 17c4 0 5-10 9-10s5 10 9 10"/><path d="M3 21h18"/><circle cx="12" cy="7" r="1.6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  sync: '<path d="M20 8a8 8 0 0 0-14.5-2M4 4v4h4"/><path d="M4 16a8 8 0 0 0 14.5 2M20 20v-4h-4"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
  moon: '<path d="M20.3 14.4A8.7 8.7 0 0 1 9.6 3.7 8.7 8.7 0 1 0 20.3 14.4z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  pulse: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
  book: '<path d="M4 4h5a4 4 0 0 1 3 1.5A4 4 0 0 1 15 4h5v15h-5a4 4 0 0 0-3 1.5A4 4 0 0 0 9 19H4zM12 5.5v15"/>',
  archive: '<rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v13h14V8M9 12h6"/>',
  folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>'
};
// English and Spanish words, so that descriptions written in either language get a fitting icon.
const BY_WORD = [[/seguridad|security|vulnerab|malic|secret/i, 'shieldSearch'], [/email|correo/i, 'mail'], [/voz|voice/i, 'mic'], [/seo|search|búsqueda/i, 'search'], [/rendimiento|performance|speed|velocidad/i, 'bolt'], [/animat|motion|scroll/i, 'motion'], [/diseñ|design|\bui\b|\bux\b/i, 'palette'], [/copy|texto|escrib|writ/i, 'feather'], [/\bads\b|anuncio|campañ/i, 'megaphone'], [/analytics|métric|medi/i, 'bars'], [/test|prueba/i, 'scales'], [/\bcli\b|terminal|comando|command/i, 'terminal'], [/mapa|local|maps/i, 'pin'], [/github|repo/i, 'upload'], [/cloud|server|worker/i, 'cloud']];
// Categories come from the scan (skills-meta.json in the data folder, or the built-in list): name, colours and icon.
const CATEGORIES = D.categories || {};
const ORIGINS = { 'third-party': 'Third-party', user: 'Your own', 'self-learned': 'Self-learned', project: 'Project' };
const svg = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${P[k] || P.box}</svg>`;
const iconKey = s => (P[s.icon] && s.icon) || BY_WORD.find(([r]) => r.test(s.description || s.note || ''))?.[1] || CATEGORIES[s.category]?.icon || 'box';
const catName = c => CATEGORIES[c]?.name || c || 'Other';
const hue = c => CATEGORIES[c]?.[document.documentElement.dataset.theme === 'dark' ? 'dark' : 'color'] || '#76879c';
const total = s => s.usage?.total || 0, season = s => s.usage?.since || 0, before = s => Math.max(0, total(s) - season(s));
const pending = s => (s.security?.counts?.review || 0) + (s.security?.counts?.stale || 0);
const untried = s => !!s.usage && total(s) === 0;
const tile = s => `<span class="icon-tile${untried(s) ? ' empty' : ''}" style="--hue:${hue(s.category)}" aria-hidden="true">${svg(iconKey(s))}</span>`;
const shortLine = s => s.short || s.description || s.note || 'No description supplied.';
const needsReview = s => pending(s) > 0 || total(s) === 0 || season(s) === 0;
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const dateText = d => d ? new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never';
const longDate = d => d ? new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not recorded';
const safeSource = u => { try { return ['https:', 'http:'].includes(new URL(u).protocol); } catch { return false; } };
const isGitHub = u => { try { return new URL(u).hostname === 'github.com'; } catch { return false; } };
// The 30-day window ends on the scan date, not on a guessed live date.
const end = new Date(D.generated.slice(0, 10) + 'T12:00:00Z');
const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(end); d.setUTCDate(d.getUTCDate() - 29 + i); return d.toISOString().slice(0, 10); });
const xp = D.skills.reduce((a, s) => a + season(s) * 10, 0); // REQ-USE-021: 10 XP per season use, nothing else

// ---------- Game: level titles, each skill's own level and rarity (REQ-USE-008, REQ-USE-009, REQ-USE-013). No achievements. ----------
const LEVEL_TITLES = ['Newcomer', 'Explorer', 'Builder', 'Craftsman', 'Strategist', 'Expert', 'Master', 'Legend']; // a new title every 2 levels
const levelTitle = level => LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((Math.max(1, level) - 1) / 2))];
const skillLevel = s => Math.floor(Math.sqrt(season(s))); // 1 use is level 1, 4 uses level 2, 9 uses level 3
// Rarity: how uncommon the skill is on GitHub, from the scan (rarity.mjs): public repositories with a SKILL.md of that
// name. 1 Legendary, 2-9 Epic, 10-49 Rare, 50 or more Common; not found or not known: Common.
const rarity = s => ['Legendary', 'Epic', 'Rare'].includes(s.rarity?.tier) ? s.rarity.tier : 'Common';
const rarityBasis = s => {
  const r = s.rarity || {};
  if (r.local) return 'not looked up, project skills stay on this computer';
  if (!Number.isInteger(r.repos)) return 'unknown';
  const repos = plural(r.repos, 'public GitHub repository', 'public GitHub repositories');
  if (r.files > 100) return `found in at least ${repos} (more than 100 matching SKILL.md files)`;
  return r.repos ? `found in ${repos}` : 'not found in any public GitHub repository';
};
const rarityDot = s => `<span class="rarity-dot ${rarity(s).toLowerCase()}" role="img" aria-label="${rarity(s)} rarity" title="${rarity(s)} rarity: ${rarityBasis(s)}"></span>`;

// ---------- State ----------
let view = 'library', filter = 'all', period = 'season';
let libraryMode = (() => { try { return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'list'; } catch { return 'list'; } })();
const collapsed = new Set();

// ---------- Level: step L→L+1 costs 100 + 50 × (L − 1) (REQ-USE-022) ----------
function levelState() {
  let level = 1, remaining = xp;
  while (remaining >= 100 + 50 * (level - 1)) { remaining -= 100 + 50 * (level - 1); level++; }
  return { level, remaining, cost: 100 + 50 * (level - 1) };
}
function renderLevel() {
  const { level, remaining, cost } = levelState(), pct = Math.round(remaining / cost * 100);
  $('level-number').textContent = level;
  $('level-title').innerHTML = `Level ${level}<span class="sr-only"> · </span><span class="level-name">${levelTitle(level)}</span>`;
  $('xp-progress').style.width = pct + '%';
  $('xp-bar').setAttribute('aria-valuenow', pct);
  $('xp-bar').setAttribute('aria-valuetext', `${remaining} of ${cost} XP towards level ${level + 1}`);
  $('xp-value').textContent = `${xp} season XP`;
  $('xp-next').textContent = `${cost - remaining} to go`;
  $('mobile-level').innerHTML = `${svg('medal')} Level ${level} · ${levelTitle(level)} · ${xp} XP`;
}

// ---------- Overview ----------
function chartHTML(values) {
  const max = Math.max(1, ...values);
  return values.map((n, i) => `<span class="bar-slot${days[i] >= D.seasonStart ? ' season' : ''}" data-tip="${dateText(days[i])}: ${plural(n, 'use')}"><i style="height:${Math.max(2, n / max * 100)}%"></i></span>`).join('');
}
function renderChart() {
  const values = days.map(d => D.skills.reduce((n, s) => n + (s.usage?.days?.[d] || 0), 0)), sum = values.reduce((a, b) => a + b, 0);
  $('main-chart').innerHTML = chartHTML(values);
  $('main-chart').setAttribute('aria-label', `Daily skill uses over the 30 days ending ${dateText(days[29])}: ${sum} uses. The season began ${dateText(D.seasonStart)}; its days are underlined. ${days.map((d, i) => dateText(d) + ': ' + values[i]).join('; ')}`);
  $('activity-total').textContent = plural(sum, 'use');
  $('activity-caption').textContent = `across ${plural(values.filter(Boolean).length, 'active day')}`;
  $('main-axis').innerHTML = `<span>${dateText(days[0])}</span><span>${dateText(days[14])}</span><span>${dateText(days[29])}</span>`;
}
function renderRank() {
  const value = period === 'season' ? season : total;
  const ranked = D.skills.filter(s => value(s) > 0).sort((a, b) => value(b) - value(a) || a.name.localeCompare(b.name)).slice(0, 3);
  $('rank').innerHTML = ranked.map((s, i) => `<button type="button" class="rank-row" data-open="s:${esc(s.id)}" aria-label="${i + 1}. ${esc(s.name)}, ${plural(value(s), 'use')} ${period === 'season' ? 'this season' : 'in total'}. Open details">${tile(s)}<span class="rank-name">${esc(s.name)}</span><span class="rank-number">${value(s)}</span></button>`).join('') || '<p class="muted">Your next use starts the season.</p>';
  $('rank-note').textContent = period === 'season' ? `This season began ${dateText(D.seasonStart)}. Keep putting these to work.` : 'Your most trusted tools, over the whole collection history.';
  document.querySelectorAll('[data-period]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.period === period)));
}
function renderNudge() {
  const never = D.skills.filter(s => total(s) === 0).length, quiet = D.skills.filter(s => total(s) > 0 && season(s) === 0).length, sec = D.skills.filter(s => pending(s) > 0).length;
  const parts = [never && `${plural(never, 'skill is', 'skills are')} still untried`, quiet && `${quiet} ${quiet === 1 ? 'is' : 'are'} quiet this season`, sec && `${sec} ${sec === 1 ? 'has' : 'have'} security findings to check`].filter(Boolean);
  $('nudge').hidden = !parts.length;
  $('nudge').innerHTML = `${svg('brain')}<div><strong>A little room to reflect.</strong> ${esc(parts.join('; '))}. Reviewing never deletes them.</div><button type="button" class="text-button" data-filter="review">Take a look</button>`;
}

// ---------- Navigation ----------
const VIEWS = {
  library: ['book', 'Library', 'Your skill library', 'A clear view of what helps you do your best work.'],
  discover: ['sparkles', 'Discover', 'Discover', 'Find something that fits the way you actually work.'],
  watchlist: ['flask', 'Watchlist', 'Before you bring it in', 'A place to investigate, not another installed collection.'],
  updates: ['record', 'Updates', 'Updates, at your pace', 'See what changed before deciding what comes in.'],
  health: ['pulse', 'Health', 'Catalogue health', 'Weight and overlap, to help you decide what stays.'],
  discarded: ['archive', 'Discarded', 'Decisions worth keeping', 'What you explored, and why you decided to pass.']
};
function navCount(v) {
  if (v === 'library') return D.skills.length;
  if (v === 'watchlist') return D.watchlist.filter(w => w.status !== 'discarded').length;
  if (v === 'discarded') return D.watchlist.filter(w => w.status === 'discarded').length;
  if (v === 'updates') return window.updatesCount ? window.updatesCount() : ''; // pending updates (updates.js)
  return ''; // Discover and Health show no count
}
function renderNav() {
  document.querySelectorAll('.nav [data-view]').forEach(b => {
    const v = b.dataset.view, [icon, label] = VIEWS[v], c = navCount(v);
    b.innerHTML = `${svg(icon)}<span class="nav-label">${label}</span>${c !== '' ? `<span class="count"><span class="sr-only">, </span>${c}</span>` : ''}`;
    if (v === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}
function setView(next, focus) {
  view = next; renderNav();
  const lib = view === 'library';
  $('library-view').hidden = !lib; $('overview').hidden = !lib; $('other-view').hidden = lib;
  $('page-title').textContent = VIEWS[view][2]; $('page-subtitle').textContent = VIEWS[view][3];
  document.title = lib ? 'Skill Dex' : `${VIEWS[view][1]} · Skill Dex`;
  if (lib) renderLibrary(); else renderOther();
  if (focus) { $('main').focus({ preventScroll: true }); scrollTo(0, 0); }
}
function setFilter(next) { filter = next; if (view !== 'library') setView('library'); renderLibrary(); if (next === 'review') $('library-title').scrollIntoView({ block: 'start' }); }

// ---------- Library ----------
function spark(s) {
  const values = days.map(d => s.usage?.days?.[d] || 0), max = Math.max(1, ...values);
  return `<svg class="spark" viewBox="0 0 80 30" aria-hidden="true">${values.map((n, i) => `<rect x="${(i * 2.65).toFixed(2)}" y="${(28 - Math.max(2, n / max * 25)).toFixed(1)}" width="1.8" height="${Math.max(2, n / max * 25).toFixed(1)}" rx=".8"/>`).join('')}</svg>`;
}
// Security state after triage, visible on every row and card (REQ-SEC-003).
function secTag(s) {
  const x = s.security, n = pending(s);
  if (!x) return '<span class="sec-tag" title="No security scan yet. Not having a scan does not mean it is safe.">Not scanned</span>';
  if (n) return `<span class="attention${x.level === 'critical' ? ' bad' : ''}" title="Security findings still waiting for your decision after triage">${n} to check</span>`;
  if (x.level === 'critical' || x.level === 'review') return '<span class="attention bad">Check security</span>';
  if (x.level === 'info') return `<span class="sec-tag" title="Minor security notices only, after triage. A scan is not a guarantee of safety.">${svg('shield')}Minor notes</span>`;
  return `<span class="sec-tag" title="No security alerts after triage. A scan is not a guarantee of safety.">${svg('shieldCheck')}<span class="sr-only">No security alerts</span></span>`;
}
// Skills that live inside a project carry its name (REQ-CAT-015); the same skill in two projects shows two labels.
const projectTag = s => s.project ? `<span class="project-tag" title="Lives in the ${esc(s.project)} project. Agents load it only in sessions opened there.">${svg('folder')}<span class="sr-only">Project: </span>${esc(s.project)}</span>` : '';
// Which agents have the skill in their skill folders: omp, Claude Code, Codex, Shared (~/.agents/skills), Custom, or several.
const agentList = s => s.agents?.length ? s.agents : ['omp'];
const agentTag = s => `<span class="project-tag agent-tag" title="In the skill folders of ${esc(agentList(s).join(', '))}">${svg('terminal')}<span class="sr-only">Agents: </span>${esc(agentList(s).join(' · '))}</span>`;
const flags = s => `${agentTag(s)}${projectTag(s)}${secTag(s)}${untried(s) ? '<span class="attention">Untried</span>' : ''}`;
const usedSort = () => ['total', 'season'].includes($('sort').value);
function rankOf(s, rank) { return usedSort() && rank < 10 && ($('sort').value === 'season' ? season(s) : total(s)) > 0 ? rank + 1 : ''; }
function favButton(s) {
  const on = !!g(s.id).f;
  return `<button type="button" class="favourite" data-favourite="${esc(s.id)}" aria-pressed="${on}" aria-label="${on ? 'Remove' : 'Add'} ${esc(s.name)} ${on ? 'from' : 'to'} favourites">${svg('star')}</button>`;
}
function row(s, rank) {
  const n = rankOf(s, rank);
  return `<article class="skill-row" data-card="s:${esc(s.id)}" style="--hue:${hue(s.category)}"><span class="skill-rank${n ? ' top' : ''}"${n ? ` aria-label="Rank ${n}"` : ' aria-hidden="true"'}>${n}</span>${tile(s)}<button type="button" class="skill-main" data-open="s:${esc(s.id)}"><span class="skill-name">${esc(s.name)}${rarityDot(s)}<span class="category-tag">${esc(catName(s.category))}</span>${flags(s)}</span><span class="skill-purpose">${esc(shortLine(s))}</span></button>${spark(s)}<div class="usage-cell">${season(s)}<small>this season</small><span class="usage-history">${before(s)} before · ${total(s)} total</span><span class="mobile-last">Last used: ${dateText(s.usage?.last)}</span></div><div class="last-cell"><span class="sr-only">Last used </span>${dateText(s.usage?.last)}</div>${favButton(s)}</article>`;
}
function card(s, rank) {
  const n = rankOf(s, rank);
  return `<article class="skill-card" data-card="s:${esc(s.id)}" style="--hue:${hue(s.category)}"><div class="card-head">${tile(s)}${n ? `<span class="skill-rank top" aria-label="Rank ${n}">#${n}</span>` : ''}<span class="skill-mark" title="Skill level from season uses; rarity from how uncommon the skill is on GitHub">${rarityDot(s)}Lv ${skillLevel(s)} · ${rarity(s)}</span>${favButton(s)}</div><button type="button" class="card-main" data-open="s:${esc(s.id)}"><span class="skill-name">${esc(s.name)}</span><span class="skill-purpose">${esc(shortLine(s))}</span></button><div class="card-meta"><span class="category-tag">${esc(catName(s.category))}</span>${flags(s)}</div><div class="card-foot"><div class="usage-cell">${season(s)}<small>this season / ${total(s)} total</small><span class="usage-history">${before(s)} before season · no XP · last ${dateText(s.usage?.last)}</span></div>${spark(s)}</div></article>`;
}
function compareFor(sort) {
  return (a, b) => sort === 'name' ? a.name.localeCompare(b.name)
    : sort === 'last' ? (b.usage?.last || '').localeCompare(a.usage?.last || '') || a.name.localeCompare(b.name)
    : (sort === 'total' ? total(b) - total(a) : season(b) - season(a)) || total(b) - total(a) || a.name.localeCompare(b.name);
}
function renderLibrary() {
  const q = $('search').value.trim().toLowerCase(), category = $('category').value, origin = $('origin').value, agent = $('agent').value, sort = $('sort').value, grouped = $('group-category').checked;
  const global = [...D.skills].sort(compareFor(sort)), ranks = new Map(global.map((s, i) => [s.id, i]));
  const selected = global.filter(s => (!q || [s.name, s.description, s.short, s.category, catName(s.category), s.project, ...agentList(s)].join(' ').toLowerCase().includes(q))
    && (!category || s.category === category) && (!origin || s.origin === origin) && (!agent || agentList(s).includes(agent))
    && (filter !== 'favourites' || g(s.id).f) && (filter !== 'review' || needsReview(s)));
  const render = s => (libraryMode === 'cards' ? card : row)(s, ranks.get(s.id));
  $('library-view').classList.toggle('cards-view', libraryMode === 'cards');
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === libraryMode)));
  document.querySelectorAll('.list-tabs [data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
  $('library-count').textContent = plural(D.skills.length, 'skill');
  $('all-count').textContent = D.skills.length;
  $('fav-count').textContent = D.skills.filter(s => g(s.id).f).length || '';
  $('review-count').textContent = D.skills.filter(needsReview).length;
  const order = usedSort() ? `Numbers mark the global top 10 by ${sort === 'season' ? 'season use' : 'all-time use'}.` : `Ordered by ${sort === 'last' ? 'most recent use' : 'name'}.`;
  const lead = filter === 'review' ? 'To review: skills with security findings pending, never used, or not used this season. Reviewing never deletes anything. ' : '';
  $('ranking-caption').textContent = `${lead}${grouped ? 'Grouped by category, in the chosen order. ' : 'One global ranking. '}${order} Earlier uses earn no XP. ${plural(selected.length, 'skill')} shown.`;
  let html;
  if (grouped) {
    const cats = [...new Set(selected.map(s => s.category))];
    html = cats.map(c => {
      const list = selected.filter(s => s.category === c);
      return `<details class="category"${collapsed.has(c) ? '' : ' open'} data-group="${esc(c)}"><summary style="--hue:${hue(c)}"><span class="dot"></span>${esc(catName(c))}<span class="group-count">${list.length}</span></summary><div class="${libraryMode === 'cards' ? 'card-grid' : ''}">${list.map(render).join('')}</div></details>`;
    }).join('');
  } else html = `<div class="flat-list">${selected.map(render).join('')}</div>`;
  $('skill-list').innerHTML = !D.skills.length ? emptyLibrary() : selected.length ? html : '<p class="empty">No skills match this view. Try another search or filter.</p>';
  document.querySelectorAll('[data-group]').forEach(d => d.addEventListener('toggle', () => { d.open ? collapsed.delete(d.dataset.group) : collapsed.add(d.dataset.group); }));
}
// A brand-new user with no skills anywhere: where Skill Dex looked, and how to add another folder.
function emptyLibrary() {
  const S = D.sources || { global: [], projectDirs: [], projectRoots: [] }, code = t => `<code>${esc(t)}</code>`;
  return `<div class="empty-state"><h3>No skills found yet</h3><p>Skill Dex lists the SKILL.md skills of your AI agents: omp, Claude Code, Codex and any agent that uses the shared <code>~/.agents/skills</code> folder. It looked here and found none:</p>
    <ul>${S.global.map(x => `<li>${code(x.dir)} <span class="muted">${esc(x.agent)}${x.found ? '' : ', folder not there'}</span></li>`).join('')}</ul>
    <p>It also looks in the ${S.projectDirs.map(code).join(', ')} folders of projects under ${S.projectRoots.map(code).join(', ') || 'your projects folder'}.</p>
    <p><strong>Keep your skills somewhere else?</strong> Add the folder to ${code('config.json')} in ${code(D.dataDir || 'the data folder')}, for example ${code('{"skill_dirs": ["~/my-skills"]}')}, or set ${code('SKILLDEX_SKILL_DIRS')} (folders separated by colons). Then press Refresh.</p></div>`;
}
function toggleFavourite(id) { g(id).f = !g(id).f; save(); renderLibrary(); }

// ---------- Watchlist and Discarded ----------
const statusName = s => s.status === 'analysing' ? 'Analysing…' : s.status === 'recommended' ? 'Recommended, not installed' : s.status === 'discarded' ? 'Discarded, record kept' : s.status === 'error' ? 'Analysis failed' : s.report ? 'Analysed · decision pending' : 'Awaiting analysis';
const statusClass = s => ({ analysing: 'analysing', recommended: 'recommended', error: 'failed' }[s.status] || '');
const fmtElapsed = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
function wlActs(s, inDetail) {
  const id = esc(s.id), open = inDetail ? '' : `<button type="button" class="outline" data-open="w:${id}">View analysis</button>`;
  const src = !inDetail && safeSource(s.source) ? `<a class="text-button" href="${esc(s.source)}" target="_blank" rel="noopener noreferrer">${isGitHub(s.source) ? 'Open on GitHub' : 'Open source page'}<span class="sr-only"> (opens in a new tab)</span></a>` : '';
  if (s.status === 'analysing') return `<span class="running" role="status">Analysing… <b class="el" data-id="${id}">running</b></span><button type="button" class="outline" data-cancel="${id}">Cancel</button>`;
  if (s.status === 'error') return `${RUNNER.available ? `<button type="button" class="outline" data-retry="${id}">Retry</button>` : ''}<button type="button" class="text-button" data-remove="${id}">Remove attempt</button>${src}`;
  if (s.status === 'discarded') return `${open}<button type="button" class="text-button" data-recover="${id}">Recover to watchlist</button>${src}`;
  const analyse = RUNNER.available && s.status === 'awaiting-analysis' && !s.report ? `<button type="button" class="outline" data-analyse-entry="${id}">Analyse</button>` : ''; // "Awaiting analysis"
  return `${analyse}${open}<button type="button" class="text-button" data-discard="${id}">Discard with a reason</button>${src}`;
}
function watchRow(s) {
  const discarded = s.status === 'discarded';
  const why = discarded ? `<p class="watch-verdict"><strong>Why discarded${s.discarded_at ? ` (${esc(longDate(s.discarded_at))})` : ''}:</strong> ${esc(s.discard_reason || s.verdict || 'No reason recorded.')}</p>` : s.verdict ? `<p class="watch-verdict">${esc(s.verdict)}</p>` : '';
  return `<article class="watch-row" data-card="w:${esc(s.id)}" style="--hue:${hue(s.category)}">${tile(s)}<div class="watch-copy"><button type="button" class="watch-name" data-open="w:${esc(s.id)}">${esc(s.name)}</button><p>${esc(shortLine(s))}</p><span class="status ${statusClass(s)}">${esc(statusName(s))}${s.score != null && s.status !== 'analysing' ? ` · ${esc(s.score)}/10` : ''}</span>${why}${s.status === 'error' ? `<div class="notice error">${esc(s.error || 'The analysis could not be completed.')}</div>` : ''}<div class="watch-actions">${wlActs(s)}</div></div></article>`;
}
let watchQuery = '', watchSort = 'status';
function renderOther() {
  if (view === 'health') { renderHealthView($('other-view')); return; }
  if (view === 'discover') { renderDiscover($('other-view')); return; }
  if (view === 'updates') { $('other-view').innerHTML = ''; window.renderUpdates?.(); return; } // updates.js
  const discarded = view === 'discarded';
  $('other-view').innerHTML = `<p class="view-description">${discarded ? 'Nothing is deleted here. The reason stays with the skill, so you do not have to investigate it twice. Recovering an entry never installs it.' : 'Analysis never installs. Recommendations stay here until you explicitly choose what to do.'}</p>
    <div class="watch-tools"><label class="search"><span>${svg('search')}</span><span class="sr-only">Search ${discarded ? 'discarded entries' : 'the watchlist'}</span><input id="watch-search" type="search" placeholder="Find an entry, a note or a reason…" autocomplete="off" value="${esc(watchQuery)}"></label>
    <label class="sr-only" for="watch-sort">Sort entries</label><select id="watch-sort"><option value="status">Analysing first</option><option value="name">Name</option></select></div><div id="watch-list"></div>`;
  $('watch-sort').value = watchSort;
  $('watch-search').addEventListener('input', e => { watchQuery = e.target.value; renderWatchList(); });
  $('watch-sort').addEventListener('change', e => { watchSort = e.target.value; renderWatchList(); });
  renderWatchList();
}
function renderWatchList() {
  const discarded = view === 'discarded', q = watchQuery.trim().toLowerCase();
  const entries = D.watchlist.filter(s => (s.status === 'discarded') === discarded)
    .filter(s => !q || [s.name, s.description, s.short, s.category, catName(s.category), s.note, s.verdict, s.discard_reason].filter(Boolean).join(' ').toLowerCase().includes(q));
  if (watchSort === 'name') entries.sort((a, b) => a.name.localeCompare(b.name));
  else entries.sort((a, b) => Number(b.status === 'analysing') - Number(a.status === 'analysing'));
  $('watch-list').innerHTML = entries.length ? entries.map(watchRow).join('') : `<p class="empty">${q ? 'No entries match this search.' : discarded ? 'No discarded entries yet. When you discard one, its report and your reason stay here.' : 'Nothing here yet. Use Analyse a skill to investigate one. Nothing will be installed.'}</p>`;
}

// ---------- Server actions (the local server writes the watchlist; analysing never installs) ----------
async function post(path, payload) {
  if (!SRV) { alert('This action needs the local server. Open Skill Dex.app.'); return null; }
  try {
    const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
  } catch { alert('Could not reach Skill Dex. Check that the app is still open.'); return null; }
}
async function api(path, payload) {
  const r = await post(path, payload);
  if (!r) return false;
  if (!r.ok) { alert('Error: ' + (r.data.error || r.status)); return false; }
  return true;
}
function reloadTo(v) { try { sessionStorage.setItem('skilldex.next-view', v); } catch {} location.reload(); }
async function setWatch(id, status, reason) { if (await api('/api/watch', { id, status, reason })) reloadTo(view === 'library' ? 'watchlist' : view); }
function discard(id) {
  const w = D.watchlist.find(x => x.id === id);
  const r = prompt(`Why are you passing on "${w.name}"? The entry, its report and your reason are kept.`, w.verdict || '');
  if (r?.trim()) setWatch(id, 'discarded', r.trim());
}
async function cancelJob(id) {
  if (!confirm('Cancel the running analysis?')) return;
  const r = await post('/api/cancel', { id });
  if (r && !r.ok) alert(r.data.error); else if (r) setTimeout(() => reloadTo('watchlist'), 2500);
}
async function removeAttempt(id) { const r = await post('/api/remove', { id }); if (r?.ok) reloadTo('watchlist'); else if (r) alert(r.data.error); }
function retryJob(id) { const w = D.watchlist.find(x => x.id === id); runAnalyse(true, w.source || w.name); }
let refreshing = false;
async function refresh(security) {
  if (refreshing) return;
  refreshing = true;
  const buttons = document.querySelectorAll('[data-refresh]');
  buttons.forEach(b => { b.disabled = true; });
  toast(security ? 'Scanning security… this can take a few minutes.' : 'Refreshing data…', true);
  if (await api('/api/refresh', { security })) reloadTo(view);
  else { refreshing = false; buttons.forEach(b => { b.disabled = false; }); $('toast').hidden = true; }
}

// ---------- Analyse a skill ----------
const dlg = $('analyse-dialog');
function openAnalyse() {
  $('analyse-body').innerHTML = `<form id="analyse-form" novalidate><h2 id="analyse-title">Analyse a skill</h2><p>Paste a GitHub URL or type a name. It is investigated <b>without installing anything</b>, and the result appears in your watchlist. If it was investigated before, you will see what you decided.</p><p>${esc(RUNNER.label || 'The agent')} runs it with limited permissions: reading, web search and a temporary clone. One analysis runs at a time. It usually takes 3–5 minutes, uses your plan's quota and ${limitText()}.</p><label for="analyse-url">Skill name or GitHub URL</label><input id="analyse-url" placeholder="https://github.com/owner/repo" autocomplete="off" aria-describedby="analyse-message"><div id="analyse-message" class="analyse-message" role="status" aria-live="polite"></div><div class="dialog-buttons"><button type="button" class="outline" data-close-analyse>Cancel</button><button type="submit" class="primary" id="analyse-submit">Analyse without installing</button></div></form>`;
  $('analyse-form').addEventListener('submit', e => { e.preventDefault(); runAnalyse(); });
  if (!dlg.open) dlg.showModal();
  $('analyse-url').focus();
}
let analysePending = false;
async function runAnalyse(force, q) {
  if (analysePending) return;
  q = q || $('analyse-url')?.value.trim();
  const m = $('analyse-message');
  if (!q) { if (m) m.textContent = 'Enter a URL or a name.'; $('analyse-url')?.setAttribute('aria-invalid', 'true'); $('analyse-url')?.focus(); return; }
  $('analyse-url')?.removeAttribute('aria-invalid');
  analysePending = true;
  const submit = $('analyse-submit');
  if (submit) { submit.disabled = true; submit.textContent = 'Starting analysis…'; }
  const r = await post('/api/analyze', { query: q, force: !!force });
  analysePending = false;
  if (submit) { submit.disabled = false; submit.textContent = 'Analyse without installing'; }
  if (!r) return;
  if (r.status === 202) { reloadTo('watchlist'); return; }
  if (r.status === 200 && r.data.existing) {
    const x = r.data.existing;
    const why = x.status === 'discarded' ? `You discarded it${x.discarded_at ? ' on ' + esc(longDate(x.discarded_at)) : ''} because: <b>${esc(x.discard_reason || x.verdict || 'no reason recorded')}</b>` : `Status: ${esc(statusName(x))}${x.analyzed_at ? ' · analysed on ' + esc(longDate(x.analyzed_at)) : ''}. ${esc(x.verdict || '')}`;
    const last = (x.discard_history || []).at(-1); // an earlier discard stays visible after recovering (REQ-ANA-024)
    const before = last ? `</p><p>Discarded before${last.discarded_at ? ' on ' + esc(longDate(last.discarded_at)) : ''}: ${esc(last.reason || 'no reason recorded')}${x.discard_history.length > 1 ? ` (and ${x.discard_history.length - 1} earlier)` : ''}.` : '';
    $('analyse-body').innerHTML = `<h2 id="analyse-title">Already investigated: ${esc(x.name)}</h2><p>${why}${before}</p><div class="dialog-buttons"><button type="button" class="outline" data-close-analyse>Close</button><button type="button" class="outline" data-open="w:${esc(x.id)}">View report</button>${RUNNER.available ? `<button type="button" class="primary" data-reanalyse="${esc(q)}">Analyse again (uses quota)</button>` : ''}</div>`;
    if (!dlg.open) dlg.showModal();
    (dlg.querySelector('[data-reanalyse]') || dlg.querySelector('[data-close-analyse]')).focus();
    return;
  }
  const msg = r.data.error || 'The analysis could not be started.';
  if (m) m.textContent = msg; else alert(msg);
}
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

// ---------- Theme ----------
function renderTheme() {
  const dark = document.documentElement.dataset.theme === 'dark', label = dark ? 'Light mode' : 'Dark mode';
  $('theme-button').innerHTML = svg(dark ? 'sun' : 'moon') + label;
  $('theme-button').setAttribute('aria-label', `Switch to ${label.toLowerCase()}`);
  $('mobile-theme').innerHTML = svg(dark ? 'sun' : 'moon');
  $('mobile-theme').setAttribute('aria-label', `Switch to ${label.toLowerCase()}`);
}
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch {}
  renderTheme(); renderRank(); if (view === 'library') renderLibrary(); else renderOther();
}

let toastTimer;
function toast(message, sticky) {
  $('toast').textContent = message; $('toast').hidden = false;
  clearTimeout(toastTimer); if (!sticky) toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
}

// ---------- Events ----------
document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) {
    // A click anywhere on a row or card opens its detail (REQ-CAT-008), unless it was a link or text selection.
    const c = e.target.closest('[data-card]');
    if (c && !e.target.closest('a,summary,input,select,label') && !getSelection()?.toString()) { const [k, id] = c.dataset.card.split(/:(.*)/); openDetail(k, id); }
    return;
  }
  const d = b.dataset;
  if (d.view) setView(d.view, true);
  else if (d.period) { period = d.period; renderRank(); }
  else if (d.filter) setFilter(d.filter);
  else if (d.mode) { libraryMode = d.mode; try { localStorage.setItem(VIEW_KEY, libraryMode); } catch {} renderLibrary(); }
  else if (d.open) { const [k, id] = d.open.split(/:(.*)/); if (dlg.open) dlg.close(); openDetail(k, id); }
  else if (d.favourite) toggleFavourite(d.favourite);
  else if (d.discard) discard(d.discard);
  else if (d.recover) setWatch(d.recover, 'awaiting-analysis');
  else if (d.cancel) cancelJob(d.cancel);
  else if (d.retry) retryJob(d.retry);
  else if (d.analyseEntry) { const w = D.watchlist.find(x => x.id === d.analyseEntry); if (w && confirm(`Analyse ${w.name} now? It uses your plan's quota and ${limitText()}. Nothing is installed.`)) retryJob(w.id); }
  else if (d.remove) removeAttempt(d.remove);
  else if (d.reanalyse) runAnalyse(true, d.reanalyse);
  else if ('closeAnalyse' in d) dlg.close();
  else if ('themeToggle' in d) toggleTheme();
  else if (d.refresh) refresh(d.refresh === 'security');
  else if (b.id === 'analyse-button') openAnalyse();
});
document.addEventListener('keydown', e => {
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { e.preventDefault(); if (view !== 'library') setView('library'); $('search').focus(); }
});
['search', 'category', 'origin', 'agent', 'sort', 'group-category'].forEach(id => $(id).addEventListener(id === 'search' ? 'input' : 'change', renderLibrary));

// Ping keeps the server alive while the tab is open and shows the elapsed time of a running analysis.
if (SRV) {
  let wasRunning = D.watchlist.some(w => w.status === 'analysing');
  const ping = async () => {
    try {
      const run = (await (await fetch('/api/ping')).json()).running;
      document.querySelectorAll('.el').forEach(x => { if (run && x.dataset.id === run.id) x.textContent = fmtElapsed(run.elapsed); });
      if (wasRunning && !run) reloadTo(view);
      wasRunning = !!run;
    } catch {}
  };
  ping(); setInterval(ping, 5000);
  addEventListener('pagehide', () => navigator.sendBeacon('/api/bye', new Blob(['{}'], { type: 'application/json' })));
}

// ---------- Start ----------
$('category').innerHTML = '<option value="">All categories</option>' + [...new Set(D.skills.map(s => s.category).filter(Boolean))].sort((a, b) => catName(a).localeCompare(catName(b))).map(c => `<option value="${esc(c)}">${esc(catName(c))}</option>`).join('');
const AGENT_ORDER = ['omp', 'Claude Code', 'Codex', 'Shared', 'Custom'];
$('agent').innerHTML = '<option value="">All agents</option>' + [...new Set(D.skills.flatMap(agentList))].sort((a, b) => (AGENT_ORDER.indexOf(a) + 1 || 99) - (AGENT_ORDER.indexOf(b) + 1 || 99)).map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join('');
if (!RUNNER.available) { // no agent CLI: analyses and background descriptions are off, everything else works
  $('analyse-button').disabled = true;
  $('analyse-button').setAttribute('aria-describedby', 'runner-notice');
  $('runner-notice').textContent = RUNNER.notice;
  $('runner-notice').hidden = false;
}
$('search-icon').innerHTML = svg('search');
$('analyse-icon').innerHTML = svg('plusSquare');
$('refresh-button').innerHTML = svg('refresh') + 'Refresh';
$('mobile-refresh').innerHTML = svg('refresh');
let startView = 'library';
try { const v = sessionStorage.getItem('skilldex.next-view'); if (v && VIEWS[v]) startView = v; sessionStorage.removeItem('skilldex.next-view'); } catch {}
renderTheme(); renderLevel(); renderChart(); renderRank(); renderNudge(); setView(startView);
