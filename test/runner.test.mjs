// Which agent CLI runs analyses and background jobs (runner.mjs), with fake binaries in the temp folder: no real
// agent is ever started.
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, before, after } from 'node:test';
import { chooseRunner, buildArgs, runAgent, supportsSkills, DEFAULT_MODELS, runnerEnvironment } from '../runner.mjs';

describe('runner selection', () => {
  let T, fake, cfg;
  const env = extra => ({ PATH: '', OMP_BIN: path.join(T, 'missing'), CLAUDE_BIN: path.join(T, 'missing'), CODEX_BIN: path.join(T, 'missing'), ...extra });
  const choose = (extra, config = cfg) => chooseRunner({ env: env(extra), home: path.join(T, 'home'), config });
  before(() => {
    T = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-runner-test-'));
    fake = path.join(T, 'fake-agent');
    fs.writeFileSync(fake, '#!/bin/sh\nfor a in "$@"; do echo "[$a]"; done\n', { mode: 0o755 });
    cfg = path.join(T, 'config.json');
    fs.writeFileSync(cfg, '{}');
  });
  after(() => fs.rmSync(T, { recursive: true, force: true }));

  it('auto takes the first installed of omp, claude, codex', () => {
    assert.strictEqual(choose({ CLAUDE_BIN: fake, CODEX_BIN: fake }).kind, 'claude');
    assert.strictEqual(choose({ OMP_BIN: fake, CODEX_BIN: fake }).kind, 'omp');
    assert.strictEqual(choose({ CODEX_BIN: fake }).kind, 'codex');
  });
  it('nothing installed, or "none": off with an English notice', () => {
    const r = choose({});
    assert.strictEqual(r.available, false);
    assert.match(r.notice, /No agent command-line tool found.*Everything else works/);
    const n = choose({ OMP_BIN: fake, SKILLDEX_RUNNER: 'none' });
    assert.strictEqual(n.available, false);
    assert.match(n.notice, /runner "none"/);
  });
  it('a chosen runner that is missing is not replaced by another one', () => {
    const r = choose({ OMP_BIN: fake, SKILLDEX_RUNNER: 'codex' });
    assert.strictEqual(r.available, false);
    assert.match(r.notice, /Codex/);
  });
  it('reads the runner and the models from config.json; env wins', () => {
    fs.writeFileSync(path.join(T, 'c2.json'), JSON.stringify({ runner: 'codex', models: { codex: 'model-from-config' } }));
    const r = choose({ OMP_BIN: fake, CODEX_BIN: fake }, path.join(T, 'c2.json'));
    assert.deepStrictEqual([r.kind, r.model], ['codex', 'model-from-config']);
    assert.strictEqual(choose({ CODEX_BIN: fake, SKILLDEX_MODEL_CODEX: 'model-from-env' }, path.join(T, 'c2.json')).model, 'model-from-env');
    assert.strictEqual(choose({ OMP_BIN: fake }).model, DEFAULT_MODELS.omp, 'omp keeps its default model');
    assert.strictEqual(choose({ CLAUDE_BIN: fake }).model, '', 'claude uses its own default');
  });
  it('only omp and claude are given the guide skill', () => {
    assert.deepStrictEqual(['omp', 'claude', 'codex'].map(supportsSkills), [true, true, false]);
  });
});

describe('runner limits', () => {
  it('omp: explicit model, tools list, time and cost caps', () => {
    const a = buildArgs('omp', 'analysis', 'P', { minutes: 20, cost: 1.5 });
    for (const flag of ['--model', '--tools', '--max-time', '--max-cost', '--no-session']) assert.ok(a.includes(flag), flag);
    assert.equal(a[a.indexOf('--tools') + 1], 'read,grep,glob,web_search');
    for (const flag of ['--no-tools', '--no-skills', '--no-rules', '--no-context-files', '--no-extensions', '--no-lsp']) assert.ok(a.includes(flag));
    assert.strictEqual(a[a.indexOf('--max-time') + 1], '20m');
    assert.ok(buildArgs('omp', 'text', 'P', { minutes: 3, cost: 0.3 }).includes('--no-tools'));
  });
  it('claude: read, search and web only, shell and edits denied, budget cap', () => {
    const a = buildArgs('claude', 'analysis', 'P', { minutes: 20, cost: 1.5, skillcheck: '/app/skillcheck.mjs' });
    assert.strictEqual(a[a.indexOf('--permission-mode') + 1], 'dontAsk');
    assert.strictEqual(a[a.indexOf('--max-budget-usd') + 1], '1.5');
    assert.strictEqual(a[a.indexOf('--disallowedTools') + 1], 'Bash,Edit,Write,NotebookEdit,Skill,Agent,Task');
    const allowed = a[a.indexOf('--allowedTools') + 1];
    assert.equal(allowed, 'Read,Grep,Glob,WebSearch,WebFetch');
    assert.doesNotMatch(allowed, /Bash|Edit|Write|Skill|Agent|Task/);
    assert.ok(a.includes('--safe-mode'));
    assert.ok(!a.includes('--model'));
    assert.ok(a.includes('--no-session-persistence'));
    assert.strictEqual(a.at(-1), 'P');
    const t = buildArgs('claude', 'text', 'P', { minutes: 3, cost: 0.3, model: 'm' });
    assert.strictEqual(t[t.indexOf('--tools') + 1], '');
    assert.strictEqual(t[t.indexOf('--model') + 1], 'm');
  });
  it('codex: read-only sandbox, nothing saved', () => {
    const a = buildArgs('codex', 'analysis', 'P', { minutes: 20, cost: 1.5 });
    assert.deepStrictEqual(a.slice(0, 3), ['exec', '--sandbox', 'read-only']);
    assert.ok(a.includes('--ephemeral'));
    assert.strictEqual(a.at(-1), 'P');
  });
  it('runs a (fake) agent and hands back its output and exit code', async () => {
    const T = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-runner-run-'));
    try {
      const fake = path.join(T, 'claude');
      fs.writeFileSync(fake, '#!/bin/sh\nfor a in "$@"; do echo "[$a]"; done\n', { mode: 0o755 });
      const [code, out] = await new Promise(res => runAgent({ kind: 'claude', bin: fake, model: 'some-model' }, 'text', 'Hello', { cwd: T, minutes: 1, cost: 0.1 }, (c, o) => res([c, o])));
      assert.strictEqual(code, 0);
      assert.match(out, /\[--model\]\n\[some-model\]/);
      assert.match(out, /\[Hello\]/);
      const [bad] = await new Promise(res => runAgent({ kind: 'omp', bin: path.join(T, 'missing'), model: '' }, 'text', 'x', { cwd: T, minutes: 1, cost: 0.1 }, (c, o) => res([c, o])));
      assert.strictEqual(bad, -1);
    } finally { fs.rmSync(T, { recursive: true, force: true }); }
  });
  it('uses an exact environment allowlist for every runner and job type', async () => {
    const T = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-env-test-'));
    try {
      const fake = path.join(T, 'agent');
      fs.writeFileSync(fake, `#!${process.execPath}\nconsole.log(JSON.stringify({args: process.argv.slice(2), env: process.env}));\n`, { mode: 0o700 });
      const env = { PATH: process.env.PATH, HOME: T, LANG: 'C', LC_ALL: 'C', GITHUB_TOKEN: 'dummy', GH_TOKEN: 'dummy', AWS_SECRET_ACCESS_KEY: 'dummy', NPM_TOKEN: 'dummy', OPENAI_API_KEY: 'dummy', SSH_AUTH_SOCK: 'dummy', OMP_PROFILE: 'test', PI_CODING_AGENT_DIR: T, PI_SMOL_MODEL: 'unrelated-model', ANTHROPIC_API_KEY: 'dummy', CLAUDE_CODE_OAUTH_TOKEN: 'dummy', CODEX_HOME: T, CODEX_API_KEY: 'dummy' };
      for (const kind of ['omp', 'claude', 'codex']) for (const task of ['analysis', 'text']) {
        const [code, out] = await new Promise(resolve => runAgent({ kind, bin: fake, model: kind === 'omp' ? DEFAULT_MODELS.omp : '' }, task, T, { cwd: T, minutes: 1, cost: 0.1, env }, (c, o) => resolve([c, o])));
        assert.equal(code, 0);
        const captured = JSON.parse(out);
        // macOS's runtime synthesizes this non-secret locale variable after exec; it is not inherited.
        if (process.platform === 'darwin' && '__CF_USER_TEXT_ENCODING' in captured.env) {
          assert.match(captured.env.__CF_USER_TEXT_ENCODING, /^0x[0-9A-F]+:0x[0-9A-F]+:0x[0-9A-F]+$/i);
          delete captured.env.__CF_USER_TEXT_ENCODING;
        }
        assert.deepEqual(captured.env, runnerEnvironment(kind, env, kind === 'omp' ? DEFAULT_MODELS.omp : ''));
        for (const key of ['GITHUB_TOKEN', 'GH_TOKEN', 'AWS_SECRET_ACCESS_KEY', 'NPM_TOKEN', 'SSH_AUTH_SOCK', 'PI_SMOL_MODEL']) assert.ok(!(key in captured.env), key);
        if (kind !== 'codex') assert.ok(!('OPENAI_API_KEY' in captured.env));
        if (kind !== 'claude') assert.ok(!('ANTHROPIC_API_KEY' in captured.env));
        if (kind === 'omp') assert.doesNotMatch(captured.args.join(','), /bash/i);
        if (kind === 'claude' && task === 'analysis') assert.doesNotMatch(captured.args[captured.args.indexOf('--allowedTools') + 1], /Bash/);
      }
      assert.equal(runnerEnvironment('omp', env, 'openai/gpt-test').OPENAI_API_KEY, 'dummy');
    } finally { fs.rmSync(T, { recursive: true, force: true }); }
  });
  it('terminates a fake runner at the wall-clock deadline', async () => {
    const T = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-timeout-test-'));
    try {
      const fake = path.join(T, 'agent');
      fs.writeFileSync(fake, `#!${process.execPath}\nsetInterval(() => {}, 1000);\n`, { mode: 0o700 });
      const [code] = await new Promise(resolve => runAgent({ kind: 'omp', bin: fake, model: DEFAULT_MODELS.omp }, 'analysis', 'fixture', { cwd: T, minutes: -0.5, cost: 0.1, env: { PATH: process.env.PATH, HOME: T } }, (c, o) => resolve([c, o])));
      assert.equal(code, 124);
    } finally { fs.rmSync(T, { recursive: true, force: true }); }
  });
});
