// Categories and icons of the skills (REQ-CAT-011, REQ-CAT-012), from the user-editable skills-meta.json in the data folder:
// {
//   "_categories": { "<key>": { "name": "Shown name", "color": "#hex", "dark": "#hex", "icon": "<icon>", "keywords": "<regex>", "fallback": true } },
//   "<skill id or folder name>": { "category": "<key>", "icon": "<icon>" }
// }
// Without "_categories" the built-in list below is used. A skill without its own entry gets the first category whose
// keywords match its name, then its description; otherwise the fallback category. Icon names are listed in web/catalog.js.
import fs from 'node:fs';
import { dataFile } from './paths.mjs';

export const DEFAULT_CATEGORIES = {
  SEO: { name: 'SEO', color: '#2B7A57', dark: '#3A9A70', icon: 'search', keywords: '\\bseo\\b|search engine|structured data|schema\\.org|sitemap' },
  Marketing: { name: 'Marketing & ads', color: '#BF6A10', dark: '#D27F25', icon: 'megaphone', keywords: '\\bads?\\b|advertis|marketing|copywrit|copy-edit|conversion|\\bcro\\b|analytics|campaign' },
  Quality: { name: 'Performance & quality', color: '#246BA3', dark: '#3486C4', icon: 'gauge', keywords: 'performance|page speed|core.web.vitals|accessib|lighthouse|best.practices' },
  Design: { name: 'Design & UI', color: '#7547BD', dark: '#8C62D6', icon: 'palette', keywords: 'design|\\bui\\b|\\bux\\b|ui-ux|frontend|front-end|typography' },
  Development: { name: 'Development', color: '#3A4DB0', dark: '#5367CC', icon: 'code', keywords: '\\bgit\\b|github|\\bcli\\b|terminal|testing|debug|deploy|code review' },
  Other: { name: 'Other', color: '#5A6873', dark: '#6F7F8B', icon: 'box', fallback: true },
};

const regex = s => { try { return s ? new RegExp(s, 'i') : null; } catch { return null; } };

// Reads skills-meta.json (missing or unreadable → built-in categories, no per-skill entries).
export function loadMeta(file = dataFile('skills-meta.json')) {
  let raw = {};
  try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = {};
  const own = raw._categories && typeof raw._categories === 'object' && Object.keys(raw._categories).length ? raw._categories : null;
  const categories = {};
  for (const [key, c] of Object.entries(own || DEFAULT_CATEGORIES)) {
    if (!c || typeof c !== 'object') continue;
    categories[key] = { name: String(c.name || key), color: String(c.color || '#5A6873'), dark: String(c.dark || c.color || '#6F7F8B'), icon: String(c.icon || 'box'), keywords: regex(c.keywords), fallback: !!c.fallback };
  }
  const keys = Object.keys(categories);
  const fallback = keys.find(k => categories[k].fallback) || keys.at(-1) || 'Other';
  const skills = Object.fromEntries(Object.entries(raw).filter(([k, v]) => k !== '_categories' && v && typeof v === 'object'));
  const infer = (name, description) => {
    for (const text of [name, description]) {
      const hit = keys.find(k => categories[k].keywords?.test(String(text || '')));
      if (hit) return hit;
    }
    return fallback;
  };
  return {
    keys, fallback, infer,
    entry: (...ids) => ids.map(id => skills[id]).find(Boolean) || {},
    valid: key => keys.includes(key) ? key : fallback,
    // What the page needs: name, colours, icon, keywords and fallback of each category, in order.
    forPage: () => Object.fromEntries(keys.map(k => { const c = categories[k]; return [k, { name: c.name, color: c.color, dark: c.dark, icon: c.icon, keywords: c.keywords?.source || '', fallback: k === fallback }]; })),
  };
}
