# LAU: Arranque y servidor local

Drafted from `Skill Dex.app` (its script runs `Tecnico/lanzar.sh`), `Tecnico/lanzar.sh`, `Tecnico/server.mjs`, `Tecnico/web/catalog.js` and `Seguimiento/README.md`. The app and the server were not started for this adoption. <private> accepted the local server (D-053) and asked for an app anyone can install (D-055). Priority 2 is a placeholder: he gave no order.

### REQ-LAU-001 No Terminal window
- pattern: event
- statement: When <private> opens `Skill Dex.app`, Skill Dex shall open in the browser without opening a Terminal window.
- rationale: D-014. The app's script runs `Tecnico/lanzar.sh` in the background with its output discarded; the session A message at line 413 reports that Terminal did not open in the agent's test.
- acceptance_criteria:
  - AC1 [judgement] GIVEN Skill Dex closed WHEN <private> double-clicks `Skill Dex.app` THEN the browser opens Skill Dex and no Terminal window appears
  - AC2 [judgement] GIVEN he has finished WHEN he closes the browser tab THEN there is nothing else left to close
- scope: Starting and leaving the app.
- conditions: none
- exceptions: none
- source: D-014, D-053
- status: active
- version: 1
- priority: 2
- ratified_by: D-053 v1

### REQ-LAU-002 One double click starts everything
- pattern: event
- statement: When <private> double-clicks `Skill Dex.app`, Skill Dex shall start what it needs and open its page at `http://localhost:4173`.
- rationale: D-035: easy to launch with one app icon; D-053 accepts the local server it starts. `Tecnico/lanzar.sh` finds Node, starts the scan and the server if port 4173 is free, and opens the page. Today `Skill Dex.app` sits in the project root, outside the git repository, and holds an absolute path to `lanzar.sh`; REQ-LAU-011 removes that dependency (D-055).
- acceptance_criteria:
  - AC1 [judgement] GIVEN the Mac just started WHEN <private> double-clicks `Skill Dex.app` THEN the page opens with the current data and the buttons that need the server work
  - AC2 [judgement] GIVEN Skill Dex already open in another tab WHEN he double-clicks the app again THEN a new tab opens on the same server without starting a second one
- scope: Starting the app.
- conditions: Node.js is installed.
- exceptions: none
- source: D-035, D-053
- status: active
- version: 1
- priority: 2
- ratified_by: D-053 v1

### REQ-LAU-003 Fresh data at start
- pattern: event
- statement: When `Skill Dex.app` starts the local server, Skill Dex shall rescan the skills and the session logs before the page opens.
- rationale: `Tecnico/lanzar.sh` runs `scan.mjs` before `server.mjs`. Keeps the list dynamic (D-003).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill used in omp since Skill Dex was last open WHEN <private> opens `Skill Dex.app` THEN that use is already counted
- scope: Starting the app.
- conditions: The server was not already running.
- exceptions: If the server is already running, no rescan happens at launch.
- source: D-053
- status: active
- version: 1
- priority: 2
- ratified_by: D-053 v1

### REQ-LAU-004 The server is reachable only from this Mac
- pattern: ubiquitous
- statement: Skill Dex shall accept connections only on `127.0.0.1`, port 4173 unless `PORT` says otherwise.
- rationale: `Tecnico/server.mjs` lines 14 and 158. D-053: a server that only works inside the Mac is fine, despite "No servers" in the global instructions (D-035).
- acceptance_criteria:
  - AC1 [mechanical: `cd Tecnico && grep -n "listen(PORT, '127.0.0.1'" server.mjs`] GIVEN the server code WHEN it is searched THEN the server listens on `127.0.0.1` only
  - AC2 [judgement] GIVEN Skill Dex running WHEN another device on the same network opens the Mac's address on port 4173 THEN it gets no answer
- scope: The local server.
- conditions: none
- exceptions: none
- source: D-053
- status: active
- version: 1
- priority: 2
- ratified_by: D-053 v1

### REQ-LAU-005 Changes come only from Skill Dex's own page
- pattern: unwanted
- statement: If a request to change data does not come from a Skill Dex page on `localhost` or `127.0.0.1` with a JSON body, then Skill Dex shall reject it.
- rationale: `Tecnico/server.mjs` lines 98 to 101 check `Origin` and `Content-Type` on every POST. Protects `watchlist.json` and the analysis launcher from other web pages.
- acceptance_criteria:
  - AC1 [judgement] GIVEN Skill Dex running WHEN another web page tries to send a discard or an analysis request THEN the server answers 403 and nothing changes
- scope: The local server.
- conditions: none
- exceptions: none
- source: D-053
- status: active
- version: 1
- priority: 2
- ratified_by: D-053 v1

### REQ-LAU-006 The server stops when the tab closes
- pattern: event
- statement: When the last Skill Dex tab is closed, Skill Dex shall stop its local server.
- rationale: D-014: only the tab should need closing. `Tecnico/server.mjs` lines 164 to 169: about 6 seconds after the page says goodbye, or 3 minutes without a ping from a page (README: "si el navegador está en segundo plano").
- acceptance_criteria:
  - AC1 [judgement] GIVEN one open Skill Dex tab and no analysis running WHEN <private> closes it THEN within about 10 seconds nothing answers on port 4173
- scope: The local server.
- conditions: No analysis is running (REQ-LAU-007).
- exceptions: none
- source: D-014, D-053
- status: active
- version: 1
- priority: 2
- ratified_by: D-053 v1

### REQ-LAU-007 An analysis keeps running after the tab closes
- pattern: complex
- statement: While an **análisis** runs, when the last Skill Dex tab is closed, Skill Dex shall keep its server running until the **análisis** ends.
- rationale: `Tecnico/server.mjs` line 166 skips the shutdown while a job exists; README: "Puedes cerrar la pestaña: la app sigue hasta terminar".
- acceptance_criteria:
  - AC1 [judgement] GIVEN an analysis running WHEN <private> closes the tab and opens Skill Dex again ten minutes later THEN the analysis has finished and its result is in the watchlist
- scope: The local server.
- conditions: none
- exceptions: none
- source: D-053
- status: active
- version: 1
- priority: 2
- ratified_by: D-053 v1

### REQ-LAU-008 Missing Node.js is reported
- pattern: unwanted
- statement: If Node.js cannot be found when `Skill Dex.app` starts, then Skill Dex shall show a dialog saying that it needs Node.js.
- rationale: `Tecnico/lanzar.sh` line 7.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a Mac without Node.js in the known places WHEN <private> opens `Skill Dex.app` THEN a dialog says "No encuentro Node.js. Skill Dex lo necesita."
- scope: Starting the app.
- conditions: none
- exceptions: none
- source: D-053
- status: active
- version: 1
- priority: 2
- ratified_by: D-053 v1

### REQ-LAU-009 Refresh on demand
- pattern: event
- statement: When the user presses "Refrescar datos", Skill Dex shall rescan the skills and session logs and reload the page.
- rationale: <private> asked how the data updates (session A, line 36: "Esto como se actualiza?"). `Tecnico/web/catalog.js`, `refresh`; `Tecnico/server.mjs`, `/api/refresh`. In the applied redesign the button sits in "Actividad y salud".
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill used in omp after the page was opened WHEN <private> presses "Refrescar datos" THEN the page reloads with that use counted
- scope: The main page.
- conditions: The local server is running.
- exceptions: none
- source: D-053
- status: active
- version: 1
- priority: 2
- ratified_by: D-053 v1

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
- status: active
- version: 1
- priority: 2
- ratified_by: D-053 v1

### REQ-LAU-011 A fresh copy starts on any Mac
- pattern: ubiquitous
- statement: Skill Dex shall start from a fresh copy of its repository on another Mac without relying on any path of <private>'s Mac.
- rationale: D-055: anyone must be able to install it. Today `Skill Dex.app` is outside the repository and its `main.scpt` holds `<path>`; `Tecnico/lanzar.sh` itself finds its folder relative to where it is.
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
- rationale: D-055 ("Preparar la app para que cualquiera pueda instalarla"). Today the only note is `Seguimiento/README.md`, written for <private> and outside the repository. The language of the instructions is OP-026.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the repository page WHEN someone who has never seen Skill Dex follows the instructions THEN they can install and open it without asking <private>
- scope: The repository.
- conditions: none
- exceptions: none
- source: D-055
- status: active
- version: 1
- priority: 2
- ratified_by: D-055 v1
- note: The language is English (REQ-LAU-013). Built in 749b7e7, confirmed by D-094. The MIT licence, holder <private>, is added for publication (D-105).

### REQ-LAU-013 The public instructions are in English
- pattern: ubiquitous
- statement: Skill Dex shall write the install instructions of its public repository in English only.
- rationale: D-066 ([quote omitted]), an active choice over the preselected [quote omitted].
- acceptance_criteria:
  - AC1 [judgement] GIVEN the public repository WHEN its install instructions are read THEN they are in English and there is no Spanish copy
- scope: The repository's install instructions.
- conditions: none
- exceptions: none
- source: D-066
- status: active
- version: 1
- priority: 2
- ratified_by: D-066 v1
- note: built in 749b7e7, confirmed by D-094.
