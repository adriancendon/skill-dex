// Server-owned acquisition: repository text never gets command execution or inherited credentials.
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { removeSymlinks, symlinkFindings, copyWithoutSymlinks } from './tree-safety.mjs';
import { run, compact, triage } from './lib-security.mjs';
import { sources } from './skill-sources.mjs';

const baseEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => ['PATH', 'HOME', 'USER', 'LOGNAME', 'LANG', 'TMPDIR'].includes(k) || /^LC_/.test(k)));
const command = (file, args, options = {}) => new Promise((resolve, reject) => execFile(file, args, { timeout: 120000, maxBuffer: 4e6, ...options }, (err, out) => err ? reject(err) : resolve(out)));
export function repositorySource(value) {
  if (/[\x00-\x1f\x7f]/.test(value)) throw new Error('Invalid repository source.');
  if (/^https:\/\//i.test(value)) {
    const u = new URL(value);
    if (u.username || u.password) throw new Error('Repository URLs must not contain credentials.');
    return u.href;
  }
  if (/^[\w+.-]+:/.test(value) || value.startsWith('-')) throw new Error('Only HTTPS URLs or local repository paths are supported.');
  if (fs.existsSync(value)) return fs.realpathSync(value);
  throw new Error('Repository path not found.');
}
async function github(endpoint, signal) {
  try { return JSON.parse(await command(process.env.GH_BIN || 'gh', ['api', '--method', 'GET', endpoint], { signal, timeout: 15000 })); } catch (err) { if (signal?.aborted) throw err; }
  const response = await fetch(`https://api.github.com/${endpoint}`, { signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(15000)]), headers: { accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  return response.json();
}
async function resolveSource(query, signal) {
  if (/^https:\/\//i.test(query) || fs.existsSync(query) || /^[\w+.-]+:/.test(query) || query.startsWith('-')) return repositorySource(query);
  for (const { dir } of sources().global) {
    const local = path.join(dir, query);
    if (!query.includes('/') && fs.existsSync(local)) return repositorySource(local);
  }
  const result = await github(`search/repositories?q=${encodeURIComponent(query + ' skill')}&per_page=1`, signal);
  if (!result.items?.[0]?.clone_url) throw new Error('No repository found. Try its HTTPS repository URL.');
  return repositorySource(result.items[0].clone_url);
}
export async function cloneRepository(source, dest, { signal } = {}) {
  source = repositorySource(source);
  const local = !source.startsWith('https://');
  // Git treats direct local paths as file transport too. Only validated, realpathed local directories
  // get this exception: clone by local object copying, without hardlinks or submodule recursion.
  if (local && !fs.statSync(source).isDirectory()) throw new Error('Local source must be a repository directory.');
  const template = fs.mkdtempSync(path.join(path.dirname(dest), 'git-template-'));
  try {
    await command('git', ['-c', 'protocol.allow=never', '-c', 'protocol.https.allow=always', '-c', `protocol.file.allow=${local ? 'always' : 'never'}`, '-c', 'protocol.ext.allow=never', '-c', 'core.hooksPath=/dev/null', 'clone', '--depth', '1', '--no-recurse-submodules', ...(local ? ['--local', '--no-hardlinks'] : []), '-q', '--', source, dest], {
      signal, env: { ...baseEnv(), GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_TEMPLATE_DIR: template, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: '/usr/bin/false' },
    });
    return removeSymlinks(dest);
  } finally { fs.rmSync(template, { recursive: true, force: true }); }
}
export async function prepareCandidate(query, root, { signal } = {}) {
  const source = await resolveSource(query, signal), folder = path.join(root, 'candidate');
  let links;
  if (!source.startsWith('https://') && !fs.existsSync(path.join(source, '.git')) && fs.existsSync(path.join(source, 'SKILL.md'))) {
    links = symlinkFindings(source, { all: true }).map(f => ({ ...f, finding: f.finding.replace('symlink not followed:', 'symlink removed:') }));
    copyWithoutSymlinks(source, folder); // Local installed skills are never modified.
  } else links = await cloneRepository(source, folder, { signal });
  let metadata = { status: 'No repository metadata available.' };
  const match = source.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
  if (match) {
    try {
      const slug = `${match[1]}/${match[2]}`, repo = await github(`repos/${slug}`, signal);
      metadata = { source, stars: repo.stargazers_count, forks: repo.forks_count, open_issues: repo.open_issues_count, license: repo.license?.spdx_id || 'No license data' };
      try { const commits = await github(`repos/${slug}/commits?per_page=1`, signal); metadata.last_commit = commits[0]?.commit?.committer?.date || 'No commit data'; } catch { metadata.last_commit = 'No commit data'; }
    } catch { /* Missing public metadata is explicitly reported, never invented. */ }
  }
  const raw = await run(folder, { signal, tempRoot: root });
  const scan = raw ? triage(compact(raw), [], folder) : { status: 'unavailable', message: 'SkillSpector returned no data; security is not verified.' };
  scan.symlinks = links;
  if (links.length && raw) {
    const combined = compact({ ...raw, issues: [...(raw.issues || []), ...links] });
    Object.assign(scan, triage(combined, [], folder));
  }
  return { source, folder: fs.realpathSync(folder), scan, metadata };
}
