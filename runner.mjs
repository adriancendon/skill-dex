// Which agent command-line tool runs analyses, short descriptions and pair advice (REQ-ANA, REQ-CAT-023, REQ-USE-017).
// Setting: SKILLDEX_RUNNER, or "runner" in config.json: auto | omp | claude | codex | none. auto = the first one
// installed of omp, claude, codex. Each runner gets the tightest limits its CLI offers:
// - omp: an explicit model, a tools list, --max-time and --max-cost (as before).
// - claude: -p with only the built-in tools it needs (--tools), the allowed Bash commands spelled out (--allowedTools),
//   edits denied (--disallowedTools), --permission-mode dontAsk so anything else is refused, --max-budget-usd,
//   no saved session. Its CLI has no time limit: Skill Dex stops it after the same time as omp.
// - codex: codex exec --sandbox read-only, no saved session (--ephemeral). Its CLI has no cost or time limit:
//   Skill Dex stops it after the same time as omp.
// Every run also gets a wall-clock kill a little after its time limit, whatever the runner.
// Model: "models" in config.json ({"omp": "...", "claude": "...", "codex": "..."}) or SKILLDEX_MODEL_OMP /
// SKILLDEX_MODEL_CLAUDE / SKILLDEX_MODEL_CODEX. Without one, omp uses DEFAULT_MODELS.omp and claude and codex use
// their own CLI's default model (no --model is passed).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { dataFile } from './paths.mjs';

export const RUNNERS = ['omp', 'claude', 'codex'];
export const LABELS = { omp: 'omp', claude: 'Claude Code', codex: 'Codex' };
export const DEFAULT_MODELS = { omp: 'openai-codex/gpt-6.1-sol' }; // the default for omp only; any omp model can be set
const ENV_BIN = { omp: 'OMP_BIN', claude: 'CLAUDE_BIN', codex: 'CODEX_BIN' };
const ENV_MODEL = { omp: 'SKILLDEX_MODEL_OMP', claude: 'SKILLDEX_MODEL_CLAUDE', codex: 'SKILLDEX_MODEL_CODEX' };

const executable = p => { try { fs.accessSync(p, fs.constants.X_OK); return fs.statSync(p).isFile(); } catch { return false; } };

// The binary of a runner: its *_BIN variable, then the usual install folders, then PATH. null when not installed.
export function findBinary(kind, { env = process.env, home = os.homedir() } = {}) {
  const set = env[ENV_BIN[kind]];
  if (set) return executable(set) ? set : null;
  const known = [path.join(home, '.local/bin', kind), '/opt/homebrew/bin/' + kind, '/usr/local/bin/' + kind];
  if (kind === 'claude') known.push(path.join(home, '.claude/local/claude'));
  for (const p of known) if (executable(p)) return p;
  for (const dir of String(env.PATH || '').split(path.delimiter)) if (dir && executable(path.join(dir, kind))) return path.join(dir, kind);
  return null;
}

// { kind, label, bin, model, setting, available, notice }. kind is null when nothing can run; model '' = the CLI's default.
export function chooseRunner({ env = process.env, home = os.homedir(), config = dataFile('config.json') } = {}) {
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(config, 'utf8')) || {}; } catch {}
  const raw = String(env.SKILLDEX_RUNNER || cfg.runner || 'auto').trim().toLowerCase();
  const setting = ['auto', 'none', ...RUNNERS].includes(raw) ? raw : 'auto';
  const off = notice => ({ kind: null, label: null, bin: null, model: '', setting, available: false, notice });
  const modelOf = kind => String(env[ENV_MODEL[kind]] || (cfg.models && typeof cfg.models === 'object' ? cfg.models[kind] : '') || DEFAULT_MODELS[kind] || '').trim();
  if (setting === 'none') return off('Analysis and background descriptions are turned off (runner "none"). Everything else works.');
  for (const kind of setting === 'auto' ? RUNNERS : [setting]) {
    const bin = findBinary(kind, { env, home });
    if (bin) return { kind, label: LABELS[kind], bin, model: modelOf(kind), setting, available: true, notice: '' };
  }
  return off(setting === 'auto'
    ? 'No agent command-line tool found (omp, Claude Code or Codex), so "Analyse a skill" and background descriptions are off. Install one of them to turn them on. Everything else works.'
    : `The chosen runner (${LABELS[setting]}) is not installed, so "Analyse a skill" and background descriptions are off. Everything else works.`);
}

// Runners that can be told to follow an installed skill (the analysis guide skill).
export const supportsSkills = kind => kind === 'omp' || kind === 'claude';

const minutes = m => `${m}m`;
// The command line for one run. task: 'analysis' (read, search, web and the bash commands of the prompt) or 'text'
// (no tools at all). limits: { minutes, cost }. skillcheck: path of skillcheck.mjs (analysis only). model: '' = CLI default.
export function buildArgs(kind, task, prompt, { minutes: mins, cost, skillcheck = '', model = '' } = {}) {
  const analysis = task === 'analysis';
  if (kind === 'omp') {
    const m = ['--model', model || DEFAULT_MODELS.omp];
    return analysis
      ? ['-p', ...m, '--tools', 'read,bash,web_search,grep,glob', '--no-session', '--no-title', '--max-time', minutes(mins), '--max-cost', String(cost), prompt]
      : ['-p', ...m, '--no-tools', '--no-skills', '--no-rules', '--no-context-files', '--no-extensions', '--no-lsp', '--no-session', '--no-title', '--thinking', 'low', '--max-time', minutes(mins), '--max-cost', String(cost), prompt];
  }
  if (kind === 'claude') {
    const common = ['-p', '--output-format', 'text', '--no-session-persistence', '--permission-mode', 'dontAsk', '--max-budget-usd', String(cost), ...(model ? ['--model', model] : [])];
    if (!analysis) return [...common, '--tools', '', '--disable-slash-commands', '--strict-mcp-config', prompt];
    const curl = ['', '-s ', '-sL ', '-fsSL '].map(f => `Bash(curl ${f}https://api.github.com/*)`);
    const bash = ['Bash(mktemp -d)', 'Bash(mktemp -d *)', 'Bash(git clone --depth 1 *)', ...curl, `Bash(node ${skillcheck} *)`];
    return [...common, '--tools', 'Read,Grep,Glob,WebSearch,WebFetch,Bash,Skill', '--allowedTools', ['Read', 'Grep', 'Glob', 'WebSearch', 'WebFetch', 'Skill', ...bash].join(','),
      '--disallowedTools', 'Edit,Write,NotebookEdit', '--strict-mcp-config', prompt];
  }
  if (kind === 'codex') return ['exec', '--sandbox', 'read-only', '--skip-git-repo-check', '--ephemeral', '--color', 'never', ...(model ? ['--model', model] : []), prompt];
  throw new Error(`Unknown runner: ${kind}`);
}

// Starts one run in cwd. Returns the child process; onDone(code, output) is called once, after the process ends or
// is stopped by the wall-clock limit (code -1 when it could not start, 124 when it ran out of time).
export function runAgent(runner, task, prompt, { cwd, minutes: mins, cost, skillcheck, env = process.env }, onDone) {
  const args = buildArgs(runner.kind, task, prompt, { minutes: mins, cost, skillcheck, model: runner.model });
  const child = spawn(runner.bin, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '', done = false, timedOut = false;
  child.stdout.on('data', d => { out += d; }); child.stderr.on('data', d => { out += d; });
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); setTimeout(() => { if (child.exitCode === null) child.kill('SIGKILL'); }, 5000).unref(); }, (mins * 60 + 30) * 1000);
  timer.unref();
  const finish = code => {
    if (done) return; done = true; clearTimeout(timer);
    if (timedOut) out += `\n[Skill Dex] Stopped after ${mins} minutes.\n`;
    onDone(timedOut ? 124 : code, out);
  };
  child.on('error', () => finish(-1));
  child.on('close', finish);
  return child;
}
