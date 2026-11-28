// node --test test/server.test.mjs — the local server's access rules (REQ-SEC-013) and malformed requests (REQ-SEC-012).
// Runs a copy of the app in the system temp folder with an empty data folder; omp and the GitHub CLI are disabled.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFile, execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { describe, it, before, after } from 'node:test';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MSG = 'Open Skill Dex from its app icon.';
let root, app, data, port, server, token, log = '';

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
  port = 4192; // 4190 is a Fetch-blocked service port; the local client also needs to be exercised.
  const fake = path.join(root, 'fake-runner'), scanner = path.join(root, 'fake-scanner');
  const answer = fs.readFileSync(path.join(repo, 'test/fixtures/analysis-output.txt'), 'utf8');
  fs.writeFileSync(fake, `#!${process.execPath}\nconst fs = require('node:fs'); const p = require('node:path'); fs.writeFileSync(${JSON.stringify(path.join(root, 'capture.json'))}, JSON.stringify({args: process.argv.slice(2), env: process.env, cwd: process.cwd(), mode: fs.statSync(p.dirname(process.cwd())).mode & 511, links: fs.readdirSync(process.cwd()).filter(f => fs.lstatSync(p.join(process.cwd(), f)).isSymbolicLink())})); if (fs.existsSync('WAIT')) setInterval(() => {}, 1000); else if (fs.existsSync('FAIL')) process.exit(4); else console.log(${JSON.stringify(answer)});\n`, { mode: 0o700 });
  fs.writeFileSync(scanner, `#!${process.execPath}\nconsole.log(JSON.stringify({issues: [], risk_assessment: {recommendation: 'PASS', score: 0}}));\n`, { mode: 0o700 });
  const env = { PATH: process.env.PATH, HOME: path.join(root, 'home'), TMPDIR: root, SKILLDEX_DATA: data, PORT: String(port), SKILLDEX_RUNNER: 'omp', OMP_BIN: fake, CLAUDE_BIN: '/usr/bin/false', CODEX_BIN: '/usr/bin/false', GH_BIN: '/usr/bin/false', SKILLSPECTOR_BIN: scanner, GITHUB_TOKEN: 'dummy', GH_TOKEN: 'dummy', AWS_SECRET_ACCESS_KEY: 'dummy', NPM_TOKEN: 'dummy', OPENAI_API_KEY: 'dummy', SSH_AUTH_SOCK: 'dummy' };
  server = spawn(process.execPath, ['server.mjs'], { cwd: app, env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', d => { log += d; }); server.stderr.on('data', d => { log += d; });
  for (let i = 0; i < 100 && !log.includes('Skill Dex at'); i++) {
    if (server.exitCode !== null) throw new Error(`server exited:\n${log}`);
    await new Promise(r => setTimeout(r, 100));
  }
  assert.ok(log.includes('Skill Dex at'), log);
  token = fs.readFileSync(path.join(app, `cache/session-token-${port}`), 'utf8').trim();
});
after(async () => {
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await once(server, 'exit'); }
  fs.rmSync(root, { recursive: true, force: true });
});

describe('REQ-SEC-013: a secret for each launch', () => {
  it('writes a 256-bit token readable only by the user, in a file of its own port', () => {
    assert.match(token, /^[0-9a-f]{64}$/);
    assert.equal(fs.statSync(path.join(app, `cache/session-token-${port}`)).mode & 0o777, 0o600);
    // REQ-LAU-016: no shared file that a server on another port could overwrite
    assert.equal(fs.existsSync(path.join(app, 'cache/session-token')), false);
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

const waitFor = async predicate => {
  for (let n = 0; n < 200; n++) {
    const result = predicate(); if (result) return result;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.fail('Timed out waiting for the fixture job');
};
const fixtureRepo = marker => {
  const dir = path.join(root, `source-${marker || 'success'}`); fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'SKILL.md'), '# Fictional fixture skill\n');
  fs.writeFileSync(path.join(root, 'outside-fixture'), 'outside fixture content must not be read');
  fs.symlinkSync(path.join(root, 'outside-fixture'), path.join(dir, 'escape'));
  fs.symlinkSync('SKILL.md', path.join(dir, 'inside'));
  if (marker) fs.writeFileSync(path.join(dir, marker), 'fixture');
  const git = (...args) => execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args], { cwd: dir, stdio: 'pipe' });
  git('init', '-q'); git('add', '.'); git('commit', '-qm', 'Fixture');
  return dir;
};
const analyze = query => request('/api/analyze', { method: 'POST', headers: json(auth()), body: JSON.stringify({ query: path.relative(app, query) }) });
const finished = id => waitFor(() => {
  const entry = JSON.parse(fs.readFileSync(path.join(data, 'watchlist.json'), 'utf8')).find(w => w.id === id);
  return entry && entry.status !== 'analysing' && entry;
});

describe('server-owned analysis acquisition with a fake runner', () => {
  it('POST with token saves the report, records stripped links, limits tools/environment and deletes the private folder', async () => {
    const response = await analyze(fixtureRepo());
    assert.equal(response.status, 202, response.text);
    const { id } = JSON.parse(response.text), entry = await finished(id);
    assert.equal(entry.status, 'recommended', entry.error);
    const report = fs.readFileSync(path.join(data, 'reports', id + '.md'), 'utf8');
    assert.match(report, /\[HIGH\] symlink removed: escape ->/);
    assert.match(report, /\[MEDIUM\] symlink removed: inside -> SKILL.md/);
    assert.doesNotMatch(report, /outside fixture content/);
    const captured = JSON.parse(fs.readFileSync(path.join(root, 'capture.json'), 'utf8'));
    assert.equal(captured.args[captured.args.indexOf('--tools') + 1], 'read,grep,glob,web_search');
    assert.ok(captured.args.includes('--no-tools'));
    assert.doesNotMatch(captured.args.slice(0, -1).join(','), /bash/i);
    assert.ok(captured.args.at(-1).includes(JSON.stringify(captured.cwd)));
    assert.deepEqual(captured.links, []);
    assert.equal(captured.mode, 0o700);
    for (const key of ['GITHUB_TOKEN', 'GH_TOKEN', 'AWS_SECRET_ACCESS_KEY', 'NPM_TOKEN', 'OPENAI_API_KEY', 'SSH_AUTH_SOCK', 'SKILLDEX_DATA']) assert.ok(!(key in captured.env), key);
    assert.equal(fs.existsSync(path.dirname(captured.cwd)), false);
  });
  it('cleans up after a failed runner', async () => {
    const response = await analyze(fixtureRepo('FAIL'));
    assert.equal(response.status, 202);
    const entry = await finished(JSON.parse(response.text).id);
    assert.equal(entry.status, 'error');
    const captured = JSON.parse(fs.readFileSync(path.join(root, 'capture.json'), 'utf8'));
    assert.equal(fs.existsSync(path.dirname(captured.cwd)), false);
  });
  it('cancels a running job and deletes its clone', async () => {
    const response = await analyze(fixtureRepo('WAIT'));
    assert.equal(response.status, 202);
    const { id } = JSON.parse(response.text);
    const captured = await waitFor(() => {
      const c = JSON.parse(fs.readFileSync(path.join(root, 'capture.json'), 'utf8'));
      return c.cwd.includes('skilldex-job-') && fs.existsSync(path.join(c.cwd, 'WAIT')) && c;
    });
    const cancel = await request('/api/cancel', { method: 'POST', headers: json(auth()), body: JSON.stringify({ id }) });
    assert.equal(cancel.status, 200);
    assert.match((await finished(id)).error, /Cancelled by you/);
    assert.equal(fs.existsSync(path.dirname(captured.cwd)), false);
    assert.ok(!fs.readdirSync(root).some(n => /^skilldex-(job|scan)-/.test(n)));
  });
});
