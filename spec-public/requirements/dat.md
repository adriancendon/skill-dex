# DAT: Datos y privacidad

Drafted from `Tecnico/web/catalog.js`, `Tecnico/server.mjs`, `Tecnico/scan.mjs`, `Tecnico/.gitignore`, `Seguimiento/README.md` and the state of the git repository in `Tecnico/`. <private> decided where his marks are kept (D-054) and that the repository becomes public later without his data (D-055). Priority 2 is a placeholder: he gave no order.

### REQ-DAT-001 Favourite marks are saved to a file
- pattern: ubiquitous
- statement: Skill Dex shall save the **favorita** marks in a file of the user's data, so that they survive another browser or a cleared cache.
- rationale: D-054, without the mastered mark that D-090 removes. Today the marks live only in the browser's local storage (`Tecnico/web/catalog.js`, key `skilldex.v1`; R-003). The file must stay out of the repository (REQ-DAT-008).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill marked as favourite in one browser WHEN <private> opens Skill Dex in another browser THEN the mark is there
  - AC2 [judgement] GIVEN marks set before this change WHEN the new version first opens in the browser that holds them THEN they are kept, not lost
- scope: Favourite marks.
- conditions: none
- exceptions: none
- source: D-054, D-090
- status: active
- version: 2
- priority: 2
- ratified_by: D-090 v2
- changes:
  - v2 D-090: the mastered mark is no longer saved
- builder_choice: the file's name and format, and whether the browser keeps a copy
- note: built in 749b7e7, confirmed by D-094.

### REQ-DAT-002 The repository stays private until the new design is ready
- pattern: state
- statement: While the new design is not ready, Skill Dex shall keep its repository `<private>/skill-dex` private on GitHub.
- rationale: D-033 and D-055. `Tecnico/` is a git repository with remote `https://github.com/<private>/skill-dex.git` (checked with `git -C Tecnico remote -v`); that it is private was not checked here. Making it public later is a publication step that needs <private>'s explicit approval.
- acceptance_criteria:
  - AC1 [mechanical: `git -C Tecnico remote -v`] GIVEN the project WHEN the command runs THEN the remote `origin` is `https://github.com/<private>/skill-dex.git`
  - AC2 [judgement] GIVEN the repository page on GitHub WHEN <private> opens it signed out THEN it is not visible
- scope: `Tecnico/`.
- conditions: none
- exceptions: `Seguimiento/` and today's `Skill Dex.app` are outside the repository; <private>'s data stays out (REQ-DAT-008).
- source: D-033, D-055
- status: active
- version: 1
- priority: 2
- ratified_by: D-055 v1

### REQ-DAT-003 The watchlist is a file both the app and omp read
- pattern: ubiquitous
- statement: Skill Dex shall keep the **watchlist**, with its discards and their reasons, in `Seguimiento/watchlist.json`.
- rationale: D-010 needs the reason to survive so that a later question can be answered; D-054 confirms that the watchlist lives in a file that omp also reads (`<skill>` step 0). Written by `Tecnico/server.mjs` (`writeWL`).
- acceptance_criteria:
  - AC1 [judgement] GIVEN an entry discarded in the app WHEN an omp agent is asked about the same skill THEN it finds the entry, the date and the reason in `Seguimiento/watchlist.json`
- scope: The watchlist.
- conditions: none
- exceptions: In a copy installed by someone else, the file sits in that person's data folder (REQ-LAU-011).
- source: D-010, D-054
- status: active
- version: 1
- priority: 2
- ratified_by: D-054 v1

### REQ-DAT-004 Generated files stay out of git
- pattern: ubiquitous
- statement: Skill Dex shall keep the generated `web/data.js` and the `cache/` folder out of its git repository.
- rationale: D-033 and D-055 (no personal data in the repository). `Tecnico/.gitignore` lists `cache/`, `web/data.js`, `.venv-skillspector/`, `node_modules/` and `.DS_Store`. `web/data.js` holds local paths and usage data and is rebuilt by every scan.
- acceptance_criteria:
  - AC1 [mechanical: `git -C Tecnico check-ignore web/data.js cache/`] GIVEN the repository WHEN the command runs THEN it prints both paths, which means git ignores them
- scope: `Tecnico/`.
- conditions: none
- exceptions: none
- source: D-033, D-055
- status: active
- version: 1
- priority: 2
- ratified_by: D-055 v1

### REQ-DAT-005 A short how-to-use note
- pattern: ubiquitous
- statement: Skill Dex shall come with a short note in Spanish that tells <private> how to open and use it.
- rationale: D-035 ("with a short how-to-use note"). Today that note is `Seguimiento/README.md`; it stays as history with a pointer to this package and is corrected when a design is applied (D-039).
- acceptance_criteria:
  - AC1 [judgement] GIVEN the project folder WHEN <private> reads the note THEN he can open Skill Dex and find each part of the screen it describes
- scope: The project.
- conditions: none
- exceptions: none
- source: D-035, D-039, D-062
- status: active
- version: 1
- priority: 2
- ratified_by: D-062 v1
- note: The note is for <private> and stays in Spanish; the app's interface becomes English (D-063). Its content is corrected when a design is applied (D-039).

### REQ-DAT-006 SkillSpector only contacts the vulnerability database
- pattern: ubiquitous
- statement: Skill Dex shall let SkillSpector contact no service other than `api.osv.dev`, for dependency checks.
- rationale: README section [quote omitted]: "solo consulta dependencias a api.osv.dev". Not checked in the code or by watching the network; it rests on SkillSpector's static mode (REQ-SEC-002).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a security scan running WHEN its network traffic is watched THEN the only outside host contacted is `api.osv.dev`
- scope: Security scans.
- conditions: none
- exceptions: none
- source: D-062
- status: active
- version: 1
- priority: 2
- ratified_by: D-062 v1

### REQ-DAT-007 Session logs are read on this Mac only
- pattern: ubiquitous
- statement: Skill Dex shall read the omp session logs only on this Mac, to count uses, and send nothing from them elsewhere.
- rationale: `Tecnico/scan.mjs` read the logs and write the counts to `Tecnico/web/data.js`; nothing in the scan uses the network.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a rescan WHEN the code of `scan.mjs` is read THEN it opens no network connection and writes only `Tecnico/web/data.js`
- scope: The usage scan.
- conditions: none
- exceptions: Analyses launched from the app send their prompt and what they read to the model they run on.
- source: D-062
- status: active
- version: 1
- priority: 2
- ratified_by: D-062 v1

### REQ-DAT-008 None of <private>'s data goes into the repository
- pattern: ubiquitous
- statement: Skill Dex shall keep the user's skills list, usage counts, watchlist, analysis reports, security reviews and marks out of its repository.
- rationale: D-055. Today these live in `Seguimiento/` (outside `Tecnico/`), `Tecnico/web/data.js` and `Tecnico/cache/` (ignored, REQ-DAT-004), and the browser. The `<skill>` skill and `Tecnico/server.mjs` write into `Seguimiento/`, a folder name of <private>'s own layout; a public copy needs its own data folder (REQ-LAU-011).
- acceptance_criteria:
  - AC1 [judgement] GIVEN the repository before it is made public WHEN its files and its history are searched for watchlist entries, report texts, usage counts and the names of <private>'s personal skills THEN none is found
- scope: The repository and its history.
- conditions: none
- exceptions: none
- source: D-055
- status: active
- version: 1
- priority: 2
- ratified_by: D-055 v1
- note: Built and published (D-113): `<private>/skill-dex` is public since 2026-11-28. Accepted exception: its first public commit still names <private>, <private> and <private> (D-113). The requirements package quotes <private> and stays private (REQ-DAT-009).

### REQ-DAT-009 Only a clean version of this package goes public
- pattern: event
- statement: When the repository is made public, Skill Dex shall publish only a clean version of its requirements package, without <private>'s quotes or personal data.
- rationale: D-065. This package quotes his messages, names his skills and watchlist entries, and cites paths of his Mac and his session files; the full package stays private.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the public repository WHEN its requirements package and its history are read THEN they hold no quote of <private>, none of his skill or watchlist names, and no path of his Mac or sessions
  - AC2 [judgement] GIVEN the full package WHEN <private> looks for it THEN it is still kept, in a private place
- scope: `Tecnico/spec/` and the public repository.
- conditions: none
- exceptions: none
- source: D-065
- status: active
- version: 1
- priority: 2
- ratified_by: D-065 v1
- builder_choice: where the full package is kept private (for example a private repository or a private branch) and how the clean version is produced
- note: Built and published (D-113): the public repository carries only the clean export; the full package is the private repository `skill-dex-spec`, and the exporter never copies its `.git`.

### REQ-DAT-010 Custom skill folders are configured in the data folder
- pattern: ubiquitous
- statement: Skill Dex shall keep the custom skill folders the user adds in its configuration in the user's data folder, out of the repository.
- rationale: D-117 (custom folders) and D-055 (no personal data in the repository).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a custom folder added WHEN the repository is searched for its path THEN it is not found
- scope: The configuration.
- conditions: none
- exceptions: none
- source: D-117
- status: ready
- version: 1
- priority: 2
- ratified_by: D-117 v1

### REQ-DAT-011 Data names are in English and the old names are still read
- pattern: ubiquitous
- statement: Skill Dex shall use English names for its files, folders, statuses, origins and settings while still reading the old Spanish names.
- rationale: D-120.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a data folder with the old names WHEN Skill Dex starts THEN it reads them and converts them to the new names after saving a backup copy
  - AC2 [judgement] GIVEN a fresh install WHEN the data folder is created THEN it uses only English names
- scope: Files, statuses, origins and configuration.
- conditions: none
- exceptions: none
- source: D-120
- status: ready
- version: 1
- priority: 2
- ratified_by: D-120 v1

### REQ-DAT-012 The public export carries no process or personal traces
- pattern: ubiquitous
- statement: Skill Dex shall strip session and line references, mentions of who shared a skill and the Spanish approval text from the public export of this package.
- rationale: D-123: the external review (D-119) found them in the public package.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the public export WHEN it is searched for session line references, mentions of who shared a skill and Spanish approval text THEN none is found
- scope: The public export.
- conditions: none
- exceptions: none
- source: D-123
- status: ready
- version: 1
- priority: 2
- ratified_by: D-119 v1
