#!/usr/bin/env node
// Rebuild README screenshots with original fictional fixtures, never the user's home or generated catalog.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const chromeBin = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const root = fs.mkdtempSync('/tmp/skilldex-demo-');
const home = path.join(root, 'home'), app = path.join(root, 'app'), data = path.join(root, 'data');
const env = { ...process.env, HOME: home, SKILLDEX_DATA: data, PORT: '4182', OMP_BIN: '/usr/bin/false', CLAUDE_BIN: '/usr/bin/false', CODEX_BIN: '/usr/bin/false', GH_BIN: '/usr/bin/false', GH_CONFIG_DIR: path.join(home, '.config/gh') };
for (const k of ['SKILLDEX_RUNNER', 'SKILLDEX_SKILL_DIRS', 'SKILLDEX_MODEL_OMP', 'SKILLDEX_MODEL_CLAUDE', 'SKILLDEX_MODEL_CODEX']) delete env[k];
delete env.SKILLDEX_WATCHLIST;
delete env.SKILLDEX_UPD_SKILLS;
delete env.SKILLDEX_UPD_MANAGED;
delete env.SKILLDEX_UPD_STATE;
delete env.SKILLDEX_UPD_BACKUPS;
delete env.SKILLDEX_UPD_CACHE;
delete env.SKILLSPECTOR_BIN;
const put = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
const json = (file, value) => put(file, JSON.stringify(value, null, 2) + '\n');
const children = [];
let socket;
const start = (bin, args, options = {}) => {
  const child = spawn(bin, args, { cwd: app, env, stdio: ['ignore', 'pipe', 'pipe'], ...options });
  child.log = ''; child.failure = null;
  child.stdout.on('data', d => { child.log += d; });
  child.stderr.on('data', d => { child.log += d; });
  child.on('error', error => { child.failure = error; });
  children.push(child);
  return child;
};
async function until(fn, label, child) {
  for (let n = 0; n < 200; n++) {
    if (child?.failure) throw child.failure;
    if (child && child.exitCode !== null) throw new Error(`${label}: process exited (${child.exitCode})\n${child.log}`);
    const result = await fn();
    if (result) return result;
    await delay(100);
  }
  throw new Error(`Timed out: ${label}`);
}

// Names, descriptions and bodies below were written just for this demo; no third-party skill text is copied.
const fixtures = [
  ['draft-outline', 'Turn scattered ideas into a clear outline', 'Marketing', 'editLines'],
  ['layout-lab', 'Explore balanced layouts for everyday interfaces', 'Design', 'palette'],
  ['query-compass', 'Find useful search terms for a topic', 'SEO', 'search'],
  ['test-trail', 'Plan small tests for important code paths', 'Development', 'code'],
  ['release-notes', 'Summarize changes in a readable release note', 'Development', 'box'],
  ['speed-sketch', 'Spot expensive work in a page layout', 'Quality', 'gauge'],
  ['color-studio', 'Build a small consistent color palette', 'Design', 'palette'],
  ['clear-caption', 'Write concise captions for product images', 'Marketing', 'feather'],
  ['link-garden', 'Organize related pages into helpful groups', 'SEO', 'search'],
  ['focus-map', 'Break a large task into practical steps', 'Other', 'box'],
  ['form-workshop', 'Review form labels and completion messages', 'Quality', 'checklist'],
  ['note-weaver', 'Connect research notes into a short summary', 'Other', 'feather'],
];

try {
  fs.mkdirSync(app, { recursive: true });
  for (const file of fs.readdirSync(repo)) if (file.endsWith('.mjs') && !file.endsWith('.test.mjs')) fs.copyFileSync(path.join(repo, file), path.join(app, file));
  fs.cpSync(path.join(repo, 'web'), path.join(app, 'web'), { recursive: true, filter: file => path.basename(file) !== 'data.js' });
  const meta = {}, shorts = {};
  for (const [id, description, category, icon] of fixtures) {
    put(path.join(home, '.omp/agent/skills', id, 'SKILL.md'), `---\nname: ${id}\ndescription: ${description}\n---\n\n# ${id}\n\nAn original demonstration skill.\n\n1. Understand the example task.\n2. Offer a brief, useful result.\n3. Explain any assumptions.\n`);
    meta[id] = { category, icon };
    shorts[id] = description;
  }
  meta['note-weaver'] = { ...meta['note-weaver'], update_source: 'none', from: 'A contributor' };
  const today = new Date(); today.setUTCHours(12, 0, 0, 0);
  const startDay = new Date(today); startDay.setUTCDate(startDay.getUTCDate() - 29);
  json(path.join(data, 'config.json'), { inicio: startDay.toISOString().slice(0, 10) });
  const lines = [JSON.stringify({ type: 'session', cwd: home })];
  let call = 0;
  for (let day = 0; day < 30; day++) {
    const date = new Date(startDay); date.setUTCDate(date.getUTCDate() + day);
    const count = 4 + (day * 7 % 13) + (day > 22 ? 5 : 0);
    for (let use = 0; use < count; use++) {
      const index = use < 4 ? use : (day + use * 3) % 10;
      const timestamp = new Date(date.getTime() + use * 60000).toISOString();
      lines.push(JSON.stringify({ type: 'message', timestamp, message: { role: 'assistant', content: [{ type: 'toolCall', id: `demo-use-${++call}`, name: 'read', arguments: { path: `skill://${fixtures[index][0]}` } }] } }));
    }
  }
  put(path.join(home, '.omp/agent/sessions', 'demo.jsonl'), lines.join('\n') + '\n');
  // Skills of other agents: two omp skills that Claude Code also has (the same folder), skills only Claude Code has,
  // and a shared skill that Codex links to; their uses come from made-up Claude Code and Codex logs.
  const skillText = (id, description) => `---\nname: ${id}\ndescription: ${description}\n---\n\n# ${id}\n\nAn original demonstration skill.\n`;
  for (const id of ['draft-outline', 'layout-lab']) { fs.mkdirSync(path.join(home, '.claude/skills'), { recursive: true }); fs.symlinkSync(path.join(home, '.omp/agent/skills', id), path.join(home, '.claude/skills', id)); }
  const others = [
    ['.claude/skills', 'commit-coach', 'Write clear commit messages from a diff', 'Development', 'terminal'],
    ['.claude/skills', 'meeting-notes', 'Turn a meeting transcript into decisions and tasks', 'Other', 'checklist'],
    ['.agents/skills', 'api-sketch', 'Sketch a small web API before building it', 'Development', 'braces'],
    ['.codex/skills', 'diff-reader', 'Explain a code change in plain words', 'Development', 'code'],
  ];
  for (const [dir, id, description, category, icon] of others) {
    put(path.join(home, dir, id, 'SKILL.md'), skillText(id, description));
    meta[id] = { category, icon }; shorts[id] = description;
  }
  fs.mkdirSync(path.join(home, '.codex/skills'), { recursive: true });
  fs.symlinkSync(path.join(home, '.agents/skills/api-sketch'), path.join(home, '.codex/skills/api-sketch'));
  const claude = [], codex = [JSON.stringify({ timestamp: startDay.toISOString(), type: 'session_meta', payload: { id: 'demo', cwd: home } })];
  for (let day = 0; day < 30; day++) {
    const date = new Date(startDay); date.setUTCDate(date.getUTCDate() + day);
    const at = n => new Date(date.getTime() + 3600000 + n * 60000).toISOString();
    for (let n = 0; n < 2 + (day % 3); n++) claude.push(JSON.stringify({ type: 'assistant', timestamp: at(n), cwd: home, message: { role: 'assistant', content: [{ type: 'tool_use', id: `demo-claude-${++call}`, name: 'Skill', input: { skill: n % 2 ? 'draft-outline' : 'commit-coach' } }] } }));
    if (day % 4 === 0) claude.push(JSON.stringify({ type: 'user', uuid: `demo-slash-${day}`, timestamp: at(9), cwd: home, message: { role: 'user', content: '<command-name>/meeting-notes</command-name>' } }));
    for (let n = 0; n < 1 + (day % 2); n++) codex.push(JSON.stringify({ timestamp: at(20 + n), type: 'response_item', payload: { type: 'function_call', call_id: `demo-codex-${++call}`, name: 'exec_command', arguments: JSON.stringify({ cmd: n ? 'cat ~/.codex/skills/diff-reader/SKILL.md' : 'cat ~/.agents/skills/api-sketch/SKILL.md' }) } }));
  }
  put(path.join(home, '.claude/projects/-demo/demo.jsonl'), claude.join('\n') + '\n');
  put(path.join(home, '.codex/sessions', 'demo', 'rollout-demo.jsonl'), codex.join('\n') + '\n');
  const watchlist = [
    { id: 'table-scout', name: 'table-scout', note: 'Turn a small dataset into a useful table', category: 'Development', status: 'en-analisis' },
    { id: 'motion-notes', name: 'motion-notes', note: 'Plan gentle motion for interface feedback', category: 'Design', status: 'recomendada' },
    { id: 'brief-builder', name: 'brief-builder', note: 'Shape project notes into a focused brief', category: 'Marketing', status: 'en-analisis' },
    { id: 'archive-helper', name: 'archive-helper', note: 'Sort old notes into a simple archive', category: 'Other', status: 'descartada', discard_reason: 'Overlaps with the existing notes workflow' },
  ];
  for (const entry of watchlist) shorts[entry.id] = entry.note;
  json(path.join(data, 'watchlist.json'), watchlist);
  json(path.join(data, 'skills-meta.json'), meta);
  json(path.join(data, 'short-descriptions.json'), shorts);
  json(path.join(data, 'marks.json'), { favourites: ['draft-outline', 'layout-lab', 'test-trail'] });
  execFileSync(process.execPath, ['scan.mjs'], { cwd: app, env, stdio: 'inherit' });
  const server = start(process.execPath, ['server.mjs']);
  const token = () => { try { return fs.readFileSync(path.join(app, 'cache', 'session-token'), 'utf8').trim(); } catch { return ''; } };
  await until(async () => { try { return (await fetch('http://127.0.0.1:4182/', { headers: { 'x-skilldex-token': token() } })).ok; } catch { return false; } }, 'demo server', server);
  const profile = path.join(root, 'chrome-profile');
  const chrome = start(chromeBin, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--no-proxy-server', '--use-mock-keychain', '--password-store=basic', '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1440,900', 'about:blank']);
  const port = await until(() => {
    try { return Number(fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]); } catch { return false; }
  }, 'headless Chrome', chrome);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data), waiting = pending.get(message.id);
    if (!waiting) return;
    pending.delete(message.id); clearTimeout(waiting.timer);
    if (message.error) waiting.reject(new Error(message.error.message)); else waiting.resolve(message.result);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}\n${chrome.log}\n${server.log}`)); }, 15000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp('Page.navigate', { url: `http://127.0.0.1:4182/?k=${token()}` });
  await until(() => evaluate('document.readyState === "complete" && !!document.querySelector("#theme-button")?.textContent.trim()'), 'library render', server);
  await delay(700);
  fs.mkdirSync(path.join(repo, 'docs'), { recursive: true });
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') {
      await evaluate('document.querySelector("#theme-button").click()');
      await until(() => evaluate('document.documentElement.dataset.theme === "dark"'), 'dark theme', server);
      await delay(300);
    }
    const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const output = path.join(repo, 'docs', `screenshot-${theme}.png`);
    fs.writeFileSync(output, Buffer.from(shot.data, 'base64'));
    console.log(`Screenshot: docs/screenshot-${theme}.png (1440 × 900)`);
  }
  // Also check the new no-source text through the real Updates UI, without contacting a source.
  await evaluate('document.querySelector("[data-view=updates]").click()');
  await until(() => evaluate('document.body.innerText.includes("From A contributor, no update source")'), 'no-source attribution in Updates', server);
  console.log('Updates displays the fictional contributor attribution.');
  try {
    execFileSync('exiftool', ['-overwrite_original', '-all=', path.join(repo, 'docs/screenshot-light.png'), path.join(repo, 'docs/screenshot-dark.png')], { stdio: 'pipe' });
    console.log('Image metadata stripped with exiftool.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; console.log('exiftool not installed; Chrome PNGs contain no EXIF data.'); }
} finally {
  socket?.close();
  for (const child of children.reverse()) {
    if (child.exitCode === null && !child.failure) {
      child.kill('SIGTERM');
      const stopped = await Promise.race([once(child, 'exit').then(() => true), delay(3000).then(() => false)]);
      if (!stopped) { child.kill('SIGKILL'); await once(child, 'exit'); }
    }
  }
  fs.rmSync(root, { recursive: true, force: true });
  console.log('Demo processes stopped and temporary environment removed.');
}
