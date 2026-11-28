# Skill Dex

A local command center for the agent skills on your computer: the `SKILL.md` skills of any AI coding agent that uses
them, such as [omp](https://github.com/can1357/oh-my-pi), Claude Code and Codex, and of any other agent through the
shared `~/.agents/skills` folder or folders you add. It lists every skill once, says which agents have it, shows how
much each one is used, flags security findings, keeps a watchlist of skills you are evaluating, and can run an analysis
of a skill before you install it. Your catalog and usage stay on your machine; optional analysis and discovery
integrations are described under Privacy.

![Skill Dex library with fictional demo skills and usage](docs/screenshot-light.png)

The screenshot uses made-up skills and simulated activity, not a real user's catalog.

## Requirements

- macOS (tested) or Linux (best effort: `launch.sh` uses `xdg-open` and prints messages to the terminal; the double-click app is macOS-only). Windows is not supported.
- [Node.js](https://nodejs.org) 24 or newer; verified locally with **24.21.0**.
- A browser.
- Skills in any of the folders listed under [Where Skill Dex looks](#where-skill-dex-looks). No agent needs to be installed to browse the catalog, usage, Health, Updates and Discover.
- Optional, for "Analyse a skill", short descriptions and advice on similar skills: one agent command-line tool, [omp](https://github.com/can1357/oh-my-pi), [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`claude`) or [Codex](https://github.com/openai/codex) (`codex`), signed in to its own account. See [Runners](#runners). Without one, those three features are turned off with a notice and everything else works.
- Optional: [GitHub CLI (`gh`)](https://cli.github.com) and `gh auth login` for authenticated Discover searches and for each skill's rarity (see [Rarity](#rarity)). Without a login, Discover uses public repository search with lower limits and every skill counts as Common. Updates uses `git`, not a GitHub login; `git` must be installed to check source repositories.
- Optional: Python 3.12–3.15 and SkillSpector for security scans and applying skill updates (setup below).

## Install

```sh
git clone https://github.com/adriancendon/skill-dex.git skill-dex
cd skill-dex
```

No dependencies to install.

### Optional security scanner

Install [SkillSpector](https://github.com/NVIDIA/skillspector) into the local virtual environment expected by the app:

```sh
python3 -m venv .venv-skillspector
.venv-skillspector/bin/python -m pip install skillspector
```

Security checks use static mode (`--no-llm`). The catalog still works without the scanner, but applying updates is blocked until their security check can run. A first install downloads the scanner and its dependencies; dependency checks may contact `api.osv.dev`.

### Option A: double-click app (macOS)

```sh
macos/build-app.sh            # writes ~/Applications/Skill Dex.app
macos/build-app.sh ~/Desktop  # or choose another folder
```

The app remembers where this repository is (`Skill Dex.app/Contents/Resources/repo-path.txt`). If you move the repository,
rebuild the app or edit that file. On first launch macOS may ask you to confirm opening an app that is not from the App Store.

### Option B: from a terminal

```sh
./launch.sh                   # scans, starts the server in the background, opens the browser
# or, in the foreground:
node scan.mjs && node server.mjs   # then open http://localhost:4173/?k=$(cat cache/session-token)
```

The server only listens on `127.0.0.1` and stops by itself when you close the browser tab. Opening the app again while it is running just opens a new tab.

Each time the server starts it writes a new random secret to `cache/session-token` (readable only by your user, git-ignored). `launch.sh` opens `http://localhost:<port>/?k=<secret>`; the server swaps it for an `HttpOnly`, `SameSite=Strict` cookie and redirects to `/`. Every other request, pages and API alike, needs that cookie (local scripts can send the secret in an `X-Skilldex-Token` header instead) and a `Host` of `localhost` or `127.0.0.1` with the server's port; anything else gets a 403 page asking you to open Skill Dex from its app icon. Other user accounts on the same Mac, programs that cannot read your files, and websites therefore cannot use the local API.

## Where Skill Dex looks

Everything below is read only; folders that do not exist are skipped.

| Agent label | Skill folders |
| --- | --- |
| omp | `~/.omp/agent/skills`, `~/.omp/agent/managed-skills` (self-learned) |
| Claude Code | `~/.claude/skills` |
| Codex | `~/.codex/skills` (Codex's own built-in skills in `.system` are not listed) |
| Shared | `~/.agents/skills`, the shared folder several agents read |
| Custom | every folder in `SKILLDEX_SKILL_DIRS` (separated by colons) and in `"skill_dirs"` of `config.json`, for example `{"skill_dirs": ["~/my-skills"]}` |
| Project | the `.omp/skills`, `.claude/skills`, `.agents/skills` and `.codex/skills` folders of each project under `~/Developer` or named by an agent session |

**One entry per skill.** The same skill reachable from several agents (a symlink to the same folder, or a copy with identical `SKILL.md` text) is listed once, with a badge naming every agent that has it; the library has an Agent filter. Two different skills with the same folder name stay separate: the first one keeps the folder name as its id (omp's skills always do), the other becomes `<name>@<agent>` (for example `review@claude`). Project skills are `<name>@<project>`, and the same skill copied into two projects stays two entries.

**Usage** comes from each agent's own local logs. Only what can be told reliably is counted, each invocation once, and every agent's uses add up for the season and XP:

| Agent | Log | What counts as a use | Limits |
| --- | --- | --- | --- |
| omp | the `.jsonl` files under `~/.omp/agent/sessions` | a `read` of `skill://<name>` or of a `…/skills/<name>/SKILL.md` | none known |
| Claude Code | `~/.claude/projects/**/*.jsonl` (subagents included) | a `Skill` tool call, or the skill typed as a slash command (`/<name>`) | plugin skills (`plugin:name`) are not counted; a plain `Read` of a SKILL.md is not counted, because Claude Code loads skills through the Skill tool |
| Codex | the `.jsonl` files under `~/.codex/sessions` and `~/.codex/archived_sessions` | a shell command that reads a `…/skills/<name>/SKILL.md` (`cat`, `sed`, `head`, `less`…) | listings and searches (`ls`, `find`, `rg`) are not counted; a path written through a shell variable is matched by skill name only; skills Codex loads without reading the file leave no trace |

A path is matched by its real folder first, then by the skill's folder name (preferring the copy that agent has). Skill Dex's own analysis runs are not saved as sessions, so they are never counted.

## Rarity

Each skill's rarity says how uncommon it is on GitHub, not how big it is. Skill Dex asks GitHub's code search, through your `gh` login, for public `SKILL.md` files that declare the skill's name (`filename:SKILL.md "name: <name>"`), keeps only the files whose `name:` line is exactly that name, and counts the repositories they are in:

| Public repositories | Rarity |
| --- | --- |
| 1 | Legendary |
| 2 to 9 | Epic |
| 10 to 49 | Rare |
| 50 or more, or more than 100 matching files | Common |
| none, not known yet, no `gh`, no login or an error | Common |

The skill's detail shows the basis ("found in 3 public GitHub repositories", or "unknown"). The server looks names up in the background, three at a time and well under GitHub's limit of 10 code searches a minute, so the page never waits; results are kept for 7 days in `cache/rarity.json` (git-ignored). Only the names of global skills are searched; project skills are never looked up.

## Runners

"Analyse a skill", the short descriptions written for skills that lack one and the advice on similar skills need an agent command-line tool, the **runner**. Choose it with `"runner"` in `config.json` or `SKILLDEX_RUNNER`: `auto` (default: the first installed of omp, claude, codex), `omp`, `claude`, `codex` or `none`. A runner chosen by name that is not installed is not replaced by another. Binaries are found through `OMP_BIN`, `CLAUDE_BIN`, `CODEX_BIN`, then `~/.local/bin`, Homebrew, `/usr/local/bin` and `PATH`. Each runs in an empty temporary folder, with the tightest limits its CLI documents:

| Runner | Tools | Limits |
| --- | --- | --- |
| omp | `read, bash, web_search, grep, glob` for analyses (`--tools`); none for background text | `--max-time 20m` and `--max-cost 1.5` per analysis (3–4 minutes and $0.30–0.40 for background text); no saved session |
| Claude Code | `claude -p` with `--tools Read,Grep,Glob,WebSearch,WebFetch,Bash,Skill`, Bash allowed only for `mktemp -d`, `git clone --depth 1`, `curl` to `api.github.com` and the bundled security check (`--allowedTools`), edits denied (`--disallowedTools`), `--permission-mode dontAsk` so anything else is refused; no tools for background text | `--max-budget-usd 1.5` per analysis; the CLI has no time limit, so Skill Dex stops it after 20 minutes; `--no-session-persistence` |
| Codex | `codex exec --sandbox read-only` (its shell can read but not write, and has no network in that sandbox, so analyses rely on Codex's own web search if your Codex configuration enables it) | the CLI has no cost or time limit: Skill Dex stops it after 20 minutes (3–4 for background text); `--ephemeral` |

Every run is also stopped by Skill Dex a little after its time limit. The guide skill (`analysis_skill`) is passed only to runners that can load skills (omp and Claude Code); Codex follows the built-in steps. With `none` or no runner installed, the Analyse buttons are disabled with a notice, background jobs do not run, and everything else works.

**Models.** Each runner uses the model in `"models"` of `config.json` (`{"omp": "…", "claude": "…", "codex": "…"}`) or `SKILLDEX_MODEL_OMP`, `SKILLDEX_MODEL_CLAUDE`, `SKILLDEX_MODEL_CODEX` (the variable wins). Without one, omp uses `openai-codex/gpt-6.1-sol` (its built-in default here) and Claude Code and Codex use their own default model (no `--model` is passed).

## Configuration

Everything Skill Dex writes goes in a **data folder**:

| Setting | Meaning | Default |
| --- | --- | --- |
| `SKILLDEX_DATA` | data folder | `~/Library/Application Support/Skill Dex` on macOS, `${XDG_DATA_HOME:-~/.local/share}/Skill Dex` on Linux. A folder named `Seguimiento` next to the repository folder, the name earlier versions used, is still found and used when it exists |
| `PORT` | local port | `4173` |
| `SKILLDEX_SKILL_DIRS` | extra skill folders, separated by colons (same as `skill_dirs` in `config.json`) | none |
| `SKILLDEX_RUNNER` | `auto`, `omp`, `claude`, `codex` or `none` (same as `runner` in `config.json`) | `auto` |
| `SKILLDEX_MODEL_OMP`, `SKILLDEX_MODEL_CLAUDE`, `SKILLDEX_MODEL_CODEX` | model of each runner (same as `models` in `config.json`) | see [Runners](#runners) |
| `OMP_BIN`, `CLAUDE_BIN`, `CODEX_BIN` | path of each runner's binary | looked up in `~/.local/bin`, Homebrew, `/usr/local/bin`, then `PATH` |
| `SKILLDEX_ANALYSIS_SKILL` | an installed skill whose analysis steps "Analyse a skill" follows (same as `analysis_skill` in `config.json`) | none: built-in steps |
| `SKILLDEX_HOME` | repository folder used by the app (overrides `repo-path.txt`) | the built-in path |

Set them as environment variables, or put `KEY=value` lines in a `skilldex.conf` file next to `launch.sh` (git-ignored). Generated files (`web/data.js`, `cache/`) are also git-ignored. With an empty data folder the app opens with an empty watchlist and lists only your installed skills.

For example, create a private `skilldex.conf` (do not commit it):

```sh
SKILLDEX_DATA="$HOME/Library/Application Support/Skill Dex"
PORT=4173
```

`launch.sh` reads this file. When starting `node` directly, export the same environment variables yourself. `GH_BIN` can override the GitHub CLI binary; `SKILLSPECTOR_BIN` overrides the scanner used for Updates.

Files in the data folder, all plain JSON or Markdown you can edit by hand (each is created when first needed):

| File | What it holds |
| --- | --- |
| `watchlist.json` | skills you are evaluating or discarded, with the reasons; `status` is `awaiting-analysis`, `analysing`, `recommended`, `discarded` or `error` |
| `reports/<id>.md` | analysis reports |
| `config.json` | `{"season_start": "YYYY-MM-DD"}`: start of the current season (only uses since then earn XP); optional `"analysis_skill": "<skill name>"`, `"runner"`, `"models"` and `"skill_dirs"` (see above) |
| `marks.json` | your favourites: `{"favourites": [ids]}` |
| `skills-meta.json` | categories and icons, see below |
| `short-descriptions.json` | one short English line per skill id |
| `pair-advice.json` | advice for similar skill pairs |
| `security-triage.json` | security findings reviewed by hand |
| `updates-state.json`, `backups/` | skipped update versions, and copies saved before each update or data migration |

Data folders written by earlier versions used Spanish names: an `analisis/` folder, `"inicio"` in `config.json` and the watchlist statuses `en-analisis`, `analizando`, `recomendada` and `descartada`. They are still read as they are, and every change Skill Dex writes uses the new names. To convert such a folder at once, run `node tools/migrate-data.mjs --dry-run` to see what would change, then `node tools/migrate-data.mjs`; it also gives each of your own categories in `skills-meta.json` its shown name as its key (the watchlist and skill entries follow), and it copies every file it changes into `backups/migration-<timestamp>/` first.

### Categories and icons: `skills-meta.json`

```json
{
  "_categories": {
    "Writing": { "name": "Writing", "color": "#BF6A10", "dark": "#D27F25", "icon": "feather", "keywords": "copy|writ|blog" },
    "Other":   { "name": "Other", "color": "#5A6873", "dark": "#6F7F8B", "icon": "box", "fallback": true }
  },
  "my-skill": { "category": "Writing", "icon": "editLines" },
  "shared-notes": { "category": "Other", "icon": "box", "update_source": "none", "from": "A contributor" }
}
```

- `_categories` (optional) replaces the built-in list (SEO, Marketing & ads, Performance & quality, Design & UI, Development, Other). The key is what is stored in the watchlist and in analysis results; `name` is shown; `color`/`dark` are the light and dark mode colours; `keywords` is a regular expression; the `fallback` category takes whatever matches nothing.
- An entry per skill (by id, or folder name for project skills) sets its category and icon. A skill without an entry gets the first category whose keywords match its name, then its description, otherwise the fallback.
- A skill without an icon gets one from words of its description, else its category's icon. Icon names are the keys of `P` in `web/catalog.js`.
- `update_source: "none"` declares that a skill has no update source, even if its folder records an old source. Updates never checks it and displays `From <from>, no update source`; with no `from` (or an empty value), it displays `No update source`. `from` is optional attribution kept only in your local data. Other skills use the repository and commit recorded in an `ORIGIN.md` next to them (inside the skill folder, or a table in the folder that holds it; the older name `ORIGEN.md` is read too), when present; a skill folder that is itself a git clone with an `https` remote is checked against that remote from its checked-out commit. Updates covers the global skills of every agent; anything else is listed as Source unknown.

## Privacy

- Scanning the catalog and usage is local and sends no telemetry. The server binds to `127.0.0.1`, answers only requests that carry the secret of the current launch (see above) and rejects changes from other origins.
- Your skills list, usage counts, watchlist, reports and favourites stay on your computer, outside the repository, in the data folder (favourites also keep a copy in the browser's local storage).
- Discover (GitHub search) and Updates (reading a skill's source) go online only when you use them. With a `gh` login, the server also sends the names of your global skills to GitHub's code search to work out their rarity (see [Rarity](#rarity)); without `gh` or a login nothing is sent.
- "Analyse a skill" and the background descriptions launch your local runner (omp, Claude Code or Codex); the skill text it analyses is sent by that tool to its model, under your own account with that tool.
- Before publishing a fork, run `node tools/privacy-check.mjs --exclude spec/`: it scans tracked and non-ignored new files, including `spec-public/`, for home paths, e-mails, tokens, session paths and installed skill ids. Add private names, project names and client names to git-ignored `privacy.local.txt`, one per line; the checker and specification exporter load these optional terms at runtime. Keep that file private. The MIT copyright's public account handle is intentional attribution.

## Tools

- `node tools/privacy-check.mjs [--dir PATH] [--exclude PREFIX]`: personal-data scan described above.
- `node tools/export-public-spec.mjs [OUT_DIR] [--src SPEC_DIR]`: writes a cleaned copy of the private `spec/` requirements package to versioned `spec-public/`, omitting owner quotes, Spanish text, session and line references and who shared a skill, and replacing local private terms, paths and installed skill ids. The output is the same on every run. Run it while the private package is available, then run the privacy check.
- `node tools/migrate-data.mjs [--data DIR] [--dry-run]`: converts a data folder written by an earlier version to the new names, with a backup (see above).
- `node tools/regenerate-reports.mjs <watchlist id>...`: asks the running app to write new reports for those entries, one analysis at a time (each uses quota; an entry keeps its status). `--status` shows the queue.
- `node --test test/*.test.mjs updates.test.mjs`: the automated tests (no network, no analysis, only temporary folders).
- `node tools/demo/make-demo.mjs`: rebuilds the two README screenshots using an isolated temporary home, fictional skills of omp, Claude Code and Codex, and 30 days of simulated usage from each one's logs. Requires Google Chrome (override its path with `CHROME_BIN`); the demo listens only on `127.0.0.1:4182`, disables agent/GitHub CLI execution, stops its processes and removes its temporary files on exit. The normal catalog and local data are untouched.

## Specification

[`spec-public/`](spec-public/) contains the sanitized requirements snapshot. The full working specification is private and is not needed to run or test the app.

## Contributing

Keep changes focused, use fictional fixtures in temporary directories, and run the tests and privacy check before proposing a change. Never include skills, session logs, watchlists, reports, local settings or credentials from your own machine.

## License

[MIT](LICENSE).
