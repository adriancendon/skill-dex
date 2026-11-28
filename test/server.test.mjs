// node --test test/server.test.mjs — the local server's access rules (REQ-SEC-013) and malformed requests (REQ-SEC-012).
// Runs a copy of the app in the system temp folder with an empty data folder; omp and the GitHub CLI are disabled.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { describe, it, before, after } from 'node:test';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MSG = 'Open Skill Dex from its app icon.';
let root, app, data, port, server, token, log = '';

const freePort = () => new Promise(res => { const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
// Raw requests: fetch would normalise the paths and the Host header these tests need to send as they are.
const request = (p, { method = 'GET', headers = {}, body } = {}) => new Promise((res, rej) => {
  const req = http.request({ host: '127.0.0.1', port, path: p, method, headers: { host: `127.0.0.1:${port}`, ...headers } }, r => {
    let text = ''; r.on('data', c => { text += c; }); r.on('end', () => res({ status: r.statusCode, headers: r.headers, text }));
  });
  req.on('error', rej); req.end(body);
});
const raw = line => new Promise((res, rej) => {
  const s = net.connect(port, '127.0.0.1', () => s.write(`${line}\r\nHost: 127.0.0.1:${port}\r\nX-Skilldex-Token: ${token}\r\nConnection: close\r\n\r\n`));
  let text = ''; s.on('data', c => { text += c; }); s.on('end', () => res(text)); s.on('error', rej);
});
const auth = () => ({ 'x-skilldex-token': token });
const json = (extra = {}) => ({ 'content-type': 'application/json', origin: `http://localhost:${port}`, ...extra });

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-server-test-'));
  app = path.join(root, 'app'); data = path.join(root, 'data');
  fs.mkdirSync(path.join(app, 'tools'), { recursive: true }); fs.mkdirSync(data); fs.mkdirSync(path.join(root, 'home'));
  for (const f of fs.readdirSync(repo)) if (f.endsWith('.mjs') && !f.endsWith('.test.mjs')) fs.copyFileSync(path.join(repo, f), path.join(app, f));
  fs.copyFileSync(path.join(repo, 'tools/regenerate-reports.mjs'), path.join(app, 'tools/regenerate-reports.mjs'));
  fs.cpSync(path.join(repo, 'web'), path.join(app, 'web'), { recursive: true, filter: f => path.basename(f) !== 'data.js' });
  fs.writeFileSync(path.join(app, 'web/data.js'), 'window.SKILLDEX = null;\n');
  port = await freePort();
  const env = { ...process.env, HOME: path.join(root, 'home'), SKILLDEX_DATA: data, PORT: String(port), OMP_BIN: '/usr/bin/false', CLAUDE_BIN: '/usr/bin/false', CODEX_BIN: '/usr/bin/false', GH_BIN: '/usr/bin/false' };
  for (const k of Object.keys(env)) if (k === 'SKILLDEX_WATCHLIST' || k.startsWith('SKILLDEX_UPD_') || k.startsWith('SKILLDEX_MODEL_') || ['SKILLSPECTOR_BIN', 'SKILLDEX_RUNNER', 'SKILLDEX_SKILL_DIRS'].includes(k)) delete env[k];
  server = spawn(process.execPath, ['server.mjs'], { cwd: app, env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', d => { log += d; }); server.stderr.on('data', d => { log += d; });
  for (let i = 0; i < 100 && !log.includes('Skill Dex at'); i++) {
    if (server.exitCode !== null) throw new Error(`server exited:\n${log}`);
    await new Promise(r => setTimeout(r, 100));
  }
  assert.ok(log.includes('Skill Dex at'), log);
  token = fs.readFileSync(path.join(app, 'cache/session-token'), 'utf8').trim();
});
after(async () => {
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await once(server, 'exit'); }
  fs.rmSync(root, { recursive: true, force: true });
});

describe('REQ-SEC-013: a secret for each launch', () => {
  it('writes a 256-bit token readable only by the user', () => {
    assert.match(token, /^[0-9a-f]{64}$/);
    assert.equal(fs.statSync(path.join(app, 'cache/session-token')).mode & 0o777, 0o600);
  });

  it('refuses the page, data.js and the API without the token', async () => {
    for (const p of ['/', '/index.html', '/data.js', '/api/marks', '/api/ping', '/api/updates']) {
      const r = await request(p);
      assert.equal(r.status, 403, p);
      assert.ok(r.text.includes(MSG), p);
    }
    const post = await request('/api/marks', { method: 'POST', headers: json(), body: JSON.stringify({ id: 'demo', on: true }) });
    assert.equal(post.status, 403);
    assert.ok(post.text.includes(MSG));
    assert.equal(fs.existsSync(path.join(data, 'marks.json')), false);
  });

  it('refuses a wrong token in the link, the cookie or the header', async () => {
    const bad = 'f'.repeat(64);
    assert.equal((await request(`/?k=${bad}`)).status, 403);
    assert.equal((await request('/', { headers: { cookie: `skilldex-${port}=${bad}` } })).status, 403);
    assert.equal((await request('/', { headers: { 'x-skilldex-token': bad } })).status, 403);
    assert.equal((await request('/', { headers: { cookie: `skilldex-1=${token}` } })).status, 403, 'a cookie for another port');
  });

  it('the launcher link sets a strict cookie and redirects to /; the cookie then opens everything', async () => {
    const r = await request(`/?k=${token}`, { headers: { host: `localhost:${port}` } });
    assert.equal(r.status, 302);
    assert.equal(r.headers.location, '/');
    const [cookie] = r.headers['set-cookie'];
    assert.ok(cookie.startsWith(`skilldex-${port}=${token};`), cookie);
    for (const attr of ['HttpOnly', 'SameSite=Strict', 'Path=/']) assert.ok(cookie.includes(attr), attr);
    const jar = { cookie: cookie.split(';')[0] };
    const page = await request('/', { headers: { host: `localhost:${port}`, ...jar } });
    assert.equal(page.status, 200);
    assert.match(page.text, /<html/i);
    assert.equal((await request('/data.js', { headers: jar })).status, 200);
    const fav = await request('/api/marks', { method: 'POST', headers: json(jar), body: JSON.stringify({ id: 'demo', on: true }) });
    assert.equal(fav.status, 200);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(data, 'marks.json'), 'utf8')).favourites, ['demo']);
  });

  it('refuses another Host, even with the token (DNS rebinding)', async () => {
    for (const host of [`evil.example:${port}`, 'localhost:1', `127.0.0.1.nip.io:${port}`]) {
      assert.equal((await request('/', { headers: { host, ...auth() } })).status, 403, host);
      assert.equal((await request(`/?k=${token}`, { headers: { host } })).status, 403, host);
    }
  });

  it('keeps the Origin check on changes, even with the token', async () => {
    const body = JSON.stringify({ id: 'other', on: true });
    assert.equal((await request('/api/marks', { method: 'POST', headers: { 'content-type': 'application/json', ...auth() }, body })).status, 403);
    assert.equal((await request('/api/marks', { method: 'POST', headers: json({ origin: 'http://evil.example', ...auth() }), body })).status, 403);
    assert.equal((await request('/api/marks', { method: 'POST', headers: json(auth()), body })).status, 200);
  });

  it('local tools send the token in the X-Skilldex-Token header', async () => {
    assert.equal((await request('/api/regenerate', { headers: auth() })).status, 200);
    const out = await new Promise((res, rej) => execFile(process.execPath, ['tools/regenerate-reports.mjs', '--status', '--port', String(port)], { cwd: app }, (e, so, se) => e ? rej(new Error(se || e.message)) : res(so)));
    assert.match(out, /^Running: none/);
  });
});

describe('REQ-SEC-012: malformed requests do not stop the server', () => {
  it('answers 400 to a broken escape and to GET //, then serves the next request', async () => {
    assert.equal((await request('/%E0%A4%A', { headers: auth() })).status, 400);
    assert.match(await raw('GET // HTTP/1.1'), /^HTTP\/1\.1 400/);
    assert.match(await raw('GET /%E0%A4%A HTTP/1.1'), /^HTTP\/1\.1 400/);
    assert.equal((await request('/api/ping', { headers: auth() })).status, 200);
    assert.equal(server.exitCode, null, log);
  });
});
