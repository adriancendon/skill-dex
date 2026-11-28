# LAU: Launch and local server

Drafted from `Skill Dex.app` (its script runs `Tecnico/launch.sh`), `Tecnico/launch.sh`, `Tecnico/server.mjs`, `Tecnico/web/catalog.js` and `Seguimiento/README.md`. The app and the server were not started for this adoption. <private> accepted the local server (D-053) and asked for an app anyone can install (D-055). Priority 2 is a placeholder: he gave no order.

### REQ-LAU-001 No Terminal window
- pattern: event
- statement: When <private> opens `Skill Dex.app`, Skill Dex shall open in the browser without opening a Terminal window.
- rationale: D-014. The app's script runs `Tecnico/launch.sh` in the background with its output discarded; reports that Terminal did not open in the agent's test.
- acceptance_criteria:
  - AC1 [judgement] GIVEN Skill Dex closed WHEN <private> double-clicks `Skill Dex.app` THEN the browser opens Skill Dex and no Terminal window appears
  - AC2 [judgement] GIVEN he has finished WHEN he closes the browser tab THEN there is nothing else left to close
- scope: Starting and leaving the app.
- conditions: none
- exceptions: none
- source: D-014, D-053
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-053 v1
- accepted_by: D-130 v1

### REQ-LAU-002 One double click starts everything
- pattern: event
- statement: When <private> double-clicks `Skill Dex.app`, Skill Dex shall start what it needs and open its page at `http://localhost:4173`.
- rationale: D-035: easy to launch with one app icon; D-053 accepts the local server it starts. `Tecnico/launch.sh` finds Node, starts the scan and the server if port 4173 is free, and opens the page. Today `Skill Dex.app` sits in the project root, outside the git repository, and holds an absolute path to `launch.sh`; REQ-LAU-011 removes that dependency (D-055).
- acceptance_criteria:
  - AC1 [judgement] GIVEN the Mac just started WHEN <private> double-clicks `Skill Dex.app` THEN the page opens with the current data and the buttons that need the server work
  - AC2 [judgement] GIVEN Skill Dex already open in another tab WHEN he double-clicks the app again THEN a new tab opens on the same server without starting a second one
- scope: Starting the app.
- conditions: Node.js is installed.
- exceptions: none
- source: D-035, D-053
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-053 v1
- accepted_by: D-130 v1

### REQ-LAU-003 Fresh data at start
- pattern: event
- statement: When `Skill Dex.app` starts the local server, Skill Dex shall rescan the skills and the session logs before the page opens.
- rationale: `Tecnico/launch.sh` runs `scan.mjs` before `server.mjs`. Keeps the list dynamic (D-003).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill used in omp since Skill Dex was last open WHEN <private> opens `Skill Dex.app` THEN that use is already counted
- scope: Starting the app.
- conditions: The server was not already running.
- exceptions: If the server is already running, no rescan happens at launch.
- source: D-053
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-053 v1
- accepted_by: D-130 v1

### REQ-LAU-004 The server is reachable only from this Mac
- pattern: ubiquitous
- statement: Skill Dex shall accept connections only on `127.0.0.1`, port 4173 unless `PORT` says otherwise.
- rationale: `Tecnico/server.mjs`. D-053: a server that only works inside the Mac is fine, despite "No servers" in the global instructions (D-035).
- acceptance_criteria:
  - AC1 [mechanical: `cd Tecnico && grep -n "listen(PORT, '127.0.0.1'" server.mjs`] GIVEN the server code WHEN it is searched THEN the server listens on `127.0.0.1` only
  - AC2 [judgement] GIVEN Skill Dex running WHEN another device on the same network opens the Mac's address on port 4173 THEN it gets no answer
- scope: The local server.
- conditions: none
- exceptions: none
- source: D-053
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-053 v1
- accepted_by: D-130 v1

### REQ-LAU-005 Changes come only from Skill Dex's own page
- pattern: unwanted
- statement: If a request to change data does not come from a Skill Dex page on `localhost` or `127.0.0.1` with a JSON body, then Skill Dex shall reject it.
- rationale: `Tecnico/server.mjs` check `Origin` and `Content-Type` on every POST. Protects `watchlist.json` and the analysis launcher from other web pages.
- acceptance_criteria:
  - AC1 [judgement] GIVEN Skill Dex running WHEN another web page tries to send a discard or an analysis request THEN the server answers 403 and nothing changes
- scope: The local server.
- conditions: none
- exceptions: none
- source: D-053
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-053 v1
- accepted_by: D-130 v1

### REQ-LAU-006 The server stops when the tab closes
- pattern: event
- statement: When the last Skill Dex tab is closed, Skill Dex shall stop its local server.
- rationale: D-014: only the tab should need closing. `Tecnico/server.mjs`: about 6 seconds after the page says goodbye, or 3 minutes without a ping from a page (README: [quote omitted]).
- acceptance_criteria:
  - AC1 [judgement] GIVEN one open Skill Dex tab and no analysis running WHEN <private> closes it THEN within about 10 seconds nothing answers on port 4173
- scope: The local server.
- conditions: No analysis is running (REQ-LAU-007).
- exceptions: none
- source: D-014, D-053
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-053 v1
- accepted_by: D-130 v1

### REQ-LAU-007 An analysis keeps running after the tab closes
- pattern: complex
- statement: While an **analysis** runs, when the last Skill Dex tab is closed, Skill Dex shall keep its server running until the **analysis** ends.
- rationale: `Tecnico/server.mjs` skips the shutdown while a job exists; README: [quote omitted].
- acceptance_criteria:
  - AC1 [judgement] GIVEN an analysis running WHEN <private> closes the tab and opens Skill Dex again ten minutes later THEN the analysis has finished and its result is in the watchlist
- scope: The local server.
- conditions: none
- exceptions: none
- source: D-053
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-053 v1
- accepted_by: D-130 v1

### REQ-LAU-008 Missing Node.js is reported
- pattern: unwanted
- statement: If Node.js cannot be found when `Skill Dex.app` starts, then Skill Dex shall show a dialog saying that it needs Node.js.
- rationale: `Tecnico/launch.sh`.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a Mac without Node.js in the known places WHEN <private> opens `Skill Dex.app` THEN a dialog says "No encuentro Node.js. Skill Dex lo necesita."
- scope: Starting the app.
- conditions: none
- exceptions: none
- source: D-053
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-053 v1
- accepted_by: D-130 v1

### REQ-LAU-009 Refresh on demand
- pattern: event
- statement: When the user presses "Refrescar datos", Skill Dex shall rescan the skills and session logs and reload the page.
- rationale: <private> asked how the data updates. `Tecnico/web/catalog.js`, `refresh`; `Tecnico/server.mjs`, `/api/refresh`. In the applied redesign the button sits in "Actividad y salud".
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill used in omp after the page was opened WHEN <private> presses "Refrescar datos" THEN the page reloads with that use counted
- scope: The main page.
- conditions: The local server is running.
- exceptions: none
- source: D-053
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-053 v1
- accepted_by: D-130 v1

### REQ-LAU-010 Without the server, the page says what to do
- pattern: complex
- statement: While the page is open without the local server, when the user starts an action that needs the server, Skill Dex shall tell the user to open `Skill Dex.app`.
- rationale: `Tecnico/web/catalog.js`, `post` and `server-note`.
- acceptance_criteria:
  - AC1 [judgement] GIVEN `Tecnico/web/index.html` opened as a file WHEN <private> presses "Descartar con motivo" THEN a message tells him to open [quote omitted] and nothing is changed
- scope: The main page.
- conditions: none
- exceptions: none
- source: D-053
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-053 v1
- accepted_by: D-130 v1

### REQ-LAU-011 A fresh copy starts on any Mac
- pattern: ubiquitous
- statement: Skill Dex shall start from a fresh copy of its repository on another Mac without relying on any path of <private>'s Mac.
- rationale: D-055: anyone must be able to install it. Today `Skill Dex.app` is outside the repository and its `main.scpt` holds `<path>`; `Tecnico/launch.sh` itself finds its folder relative to where it is.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a fresh clone of the repository on a Mac with another user name and Node.js installed WHEN the person follows the install instructions and opens the app THEN Skill Dex opens and lists that person's skills
  - AC2 [judgement] GIVEN the repository WHEN it is searched for `<private>` THEN no file that the app runs contains it
- scope: The launcher, the scripts and every file in the repository.
- conditions: Node.js is installed.
- exceptions: none
- source: D-055
- status: ready
- version: 1
- priority: 2
- ratified_by: D-055 v1
- builder_choice: how the app icon is produced from the repository (built by a script or committed), and where each user's data folder lives, as long as it is outside the repository
- note: Built in 749b7e7, confirmed by D-094, but kept ready: a fresh copy of the repository was not tested on a second Mac.

### REQ-LAU-012 Install instructions for anyone
- pattern: ubiquitous
- statement: Skill Dex shall come with instructions that let a person who is not <private> install it, open it and know what it needs.
- rationale: D-055. Today the only note is `Seguimiento/README.md`, written for <private> and outside the repository. The language of the instructions is OP-026.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the repository page WHEN someone who has never seen Skill Dex follows the instructions THEN they can install and open it without asking <private>
- scope: The repository.
- conditions: none
- exceptions: none
- source: D-055
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-055 v1
- accepted_by: D-130 v1
- note: The language is English (REQ-LAU-013). Built in 749b7e7, confirmed by D-094. The MIT licence, holder <private>, is added for publication (D-105).

### REQ-LAU-013 The public instructions are in English
- pattern: ubiquitous
- statement: Skill Dex shall write the install instructions of its public repository in English only.
- rationale: D-066, an active choice over the preselected [quote omitted].
- acceptance_criteria:
  - AC1 [judgement] GIVEN the public repository WHEN its install instructions are read THEN they are in English and there is no Spanish copy
- scope: The repository's install instructions.
- conditions: none
- exceptions: none
- source: D-066
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-066 v1
- accepted_by: D-130 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-LAU-014 The README is for any SKILL.md agent
- pattern: ubiquitous
- statement: Skill Dex shall describe itself in its README as a tool for the skills of any agent that uses `SKILL.md`, and not only for omp.
- rationale: D-116 and D-117; D-118 pushes it directly.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the public README WHEN someone using Claude Code or Codex reads it THEN it says Skill Dex works for them
- scope: The public repository README.
- conditions: none
- exceptions: none
- source: D-117
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-117 v1
- accepted_by: D-130 v1
- note: built on branch multi-agente, merged and pushed 2026-11-28

### REQ-LAU-015 The launcher works best-effort on Linux
- pattern: ubiquitous
- statement: Skill Dex shall start on Linux on a best-effort basis, while macOS is the tested platform and Windows is not supported.
- rationale: D-123 (the review pointed at macOS only).
- acceptance_criteria:
  - AC1 [judgement] GIVEN the README WHEN a Linux user reads it THEN it says macOS is tested, Linux is best-effort and Windows is unsupported
- scope: The launcher and the README.
- conditions: none
- exceptions: none
- source: D-123
- status: active
- version: 1
- priority: 2
- ratified_by: D-119 v1
- note: built on branch multi-agente, merged and pushed 2026-11-28 (Linux not tested). D-130 accepted the area without the untested Linux part.

### REQ-LAU-016 Each server port has its own session token file
- pattern: ubiquitous
- statement: Skill Dex shall keep one session token file per port, named `cache/session-token-<port>`, and remove the old shared file at start.
- rationale: A second test server on another port overwrote the shared `cache/session-token`, and the app icon then opened the blocked page.
- acceptance_criteria:
  - AC1 [judgement] GIVEN two servers on different ports from the same folder WHEN both run THEN each accepts its own page and the app icon still opens
- scope: Skill Dex as published.
- conditions: none
- exceptions: none
- source: OP-045, D-133
- status: active
- version: 1
- priority: 2
- ratified_by: D-133 v1
- note: Built: the server writes `cache/session-token-<port>`; `launch.sh` and the tools read the file of their port; verified with two servers at once and the test suite. Approved by D-133; not yet accepted.
