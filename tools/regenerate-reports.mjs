#!/usr/bin/env node
// Asks the running Skill Dex server to write a new analysis report for some watchlist entries, for example the reports
// written before reports were in English. The server analyses them one at a time with the normal analysis job (OpenAI
// model, limited permissions, 20 minutes and $1.50 at most each). An entry keeps its status and its discard; a run that
// fails keeps the old report. It uses quota: nothing starts unless ids are given.
// Usage: node tools/regenerate-reports.mjs <watchlist id>... [--port N]
//        node tools/regenerate-reports.mjs --status [--port N]
import fs from 'node:fs';
import { TOKEN_FILE } from '../paths.mjs';

const args = process.argv.slice(2);
const portAt = args.indexOf('--port');
const port = Number(portAt >= 0 ? args[portAt + 1] : process.env.PORT || 4173);
const ids = args.filter((a, i) => !a.startsWith('--') && (portAt < 0 || i !== portAt + 1));
const base = `http://127.0.0.1:${port}`;
// The running server's secret for this launch (REQ-SEC-013); only the user who started it can read the file.
let token = '';
try { token = fs.readFileSync(TOKEN_FILE, 'utf8').trim(); } catch {}
const auth = { 'x-skilldex-token': token };

async function main() {
  if (args.includes('--status')) {
    const res = await fetch(`${base}/api/regenerate`, { headers: auth }), r = await res.json();
    if (!res.ok) { console.error(r.error || `HTTP ${res.status}`); process.exitCode = 1; return; }
    console.log(`Running: ${r.running || 'none'} · waiting: ${r.waiting.join(', ') || 'none'}`);
    for (const d of r.done) console.log(`${d.ok ? 'done' : 'failed'}: ${d.id}${d.error ? ` (${d.error})` : ''}`);
    return;
  }
  if (!ids.length) { console.error('Usage: node tools/regenerate-reports.mjs <watchlist id>... [--port N] | --status'); process.exitCode = 2; return; }
  const res = await fetch(`${base}/api/regenerate`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json', origin: `http://localhost:${port}` }, body: JSON.stringify({ ids }) });
  const r = await res.json();
  if (!res.ok) { console.error(r.error || `HTTP ${res.status}`); process.exitCode = 1; return; }
  console.log(`Queued: ${r.queued.join(', ') || 'none'}`);
  if (r.unknown.length) console.log(`Not on the watchlist: ${r.unknown.join(', ')}`);
  console.log(`Running now: ${r.running || 'none'}. The server stays up until the queue is empty; --status shows progress.`);
}
main().catch(e => { console.error(`Skill Dex is not running on port ${port} (${e.cause?.code || e.message}). Open it first.`); process.exitCode = 1; });
