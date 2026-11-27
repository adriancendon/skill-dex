# State

Replace the content of this file when the state changes; do not add to it. History is in version control and in `decisions.md`.

## Now

- keelblocks adopted on 2026-11-25 for the whole app at once (D-031, D-032). Core tier. His answers are D-037 to D-110 (session B, up to line 873, 2026-11-27); D-099 records the builders' choices he accepted with his "OK final, sí a todo".
- `decisions.md`: 110 decisions (104 owner, 4 constraint, 2 derived: D-074 and D-099, both open to his correction). 39 open points, all decided. R-001 to R-006.
- Shipped: the new version, design D with phases 1 to 7, is merged into `main` (commit 749b7e7) and pushed to the private repository `<private>/skill-dex` (D-094). It holds: sidebar with Library, Discover, Watchlist, Updates, Discarded and Health; one ranked list with list/cards views and short English descriptions in a file he can edit; level with eight titles, a level and a rarity for each skill, a level-up card, no achievements and no mastered mark; favourites in `Seguimiento/marks.json`; Updates from `ORIGEN.md` sources, security-checked, with a confirmed "Update" (16 real updates found, none applied); Discover with typed search, labels and use without a GitHub login; security findings closed only under the D-056 criterion; reports in English by `<skill>`. His categories and the proposed `security-triage.json` are installed (D-095, D-096); the originals are in `Seguimiento/versiones/final/antes-de-instalar/`.
- 136 requirements in 9 area files: 126 `active`, 4 `ready`, 4 `superseded`, 2 `descoped`, none `fulfilled`. By area: CAT 21 active, 2 superseded · USE 20 active, 1 superseded, 2 descoped · ANA 26 active · SEC 11 active · LAU 12 active, 1 ready · DAT 7 active, 2 ready · UI 5 active, 1 superseded · DIS 12 active · UPD 12 active, 1 ready.
- `active` here means built in 749b7e7 and confirmed to ship by D-094. It is not `fulfilled`: his OK confirms the result as a whole, not acceptance against each criterion. `fulfilled` needs his explicit acceptance per requirement.
- Left `ready`: REQ-LAU-011 (a fresh copy was not tested on a second Mac), REQ-DAT-008 (the git history still holds personal data, so the public repository must be a fresh one), REQ-DAT-009 (export tool built, nothing published). REQ-UPD-013 (no update source, from <private>) is `ready`, not built. REQ-USE-004 and REQ-USE-012 are confirmed and `active` (D-103); OP-004 is closed, no upper level (D-104).
- Security review done (D-101, D-102): 0 findings to check, 103 minor notices, 54 closed; <skill> keeps its Spanish report (D-100, REQ-ANA-027 active with that exception).
- Publication being prepared (D-105 to D-110): MIT licence, holder <private>. Repositories: `skill-dex` (code, private until his "publícalo", then public with fresh history and a clean spec export), `skill-dex-spec` (full package, private), `skill-dex-archivo` (old history, private). README screenshot with example data. <skill> comes from his friend <private> (D-106); his name stays in private data.
- Priority 2 on every `ready` and `active` requirement is a placeholder: <private> gave no order.
- Old documents `Seguimiento/README.md` and `estado.md` stay as history with one pointer line each (D-039).

## Next

4. Test a fresh copy on a second Mac (REQ-LAU-011).
5. Publishing later, only with his explicit approval: MIT licence recommended; a fresh public repository with one clean commit and the clean export of this package (REQ-DAT-008, REQ-DAT-009, D-065); the full package stays private.
6. Run `index`, then `check`, after every change.

## Waiting for the owner

- His acceptance, per requirement, of the shipped result (`active` to `fulfilled`).
- His explicit "publícalo" to make the repository public.
- English names of the four rarities (REQ-USE-013), left to the builder.


## Read first

- `README.md` (format), then `glossary.md`, then the area file in hand under `requirements/` and the decisions and open points it names.

## Coverage

- Read in full: <private>'s typed messages in sessions A and B, the five form calls and answers in session B (lines 253 to 323), his design messages (lines 398, 403, 428) and the agent messages before them (lines 395, 400, 426), `~/.omp/agent/AGENTS.md`, `Seguimiento/README.md`, `estado.md`, `config.json`, `Tecnico/.gitignore`, `Tecnico/scan.mjs`, `server.mjs`, `lanzar.sh`, `security.mjs`, `lib-security.mjs`, `skillcheck.mjs`, `web/index.html`, `web/catalog.js`, the `<skill>` skill and the script inside `Skill Dex.app`.
- Read in part: `Tecnico/web/detail.js`, `web/catalog.css`, the versions in `Seguimiento/versiones/` (proposal D's `index.html`: level, XP, sort, rows, icons, sections). Structure only: `Seguimiento/watchlist.json`, `security-triage.json`, `skills-meta.json`.
- Also read: the question table of session B line 460 and his answer at line 461 (2026-11-27).
- Not read: `Tecnico/web/detail.css`, `Tecnico/web/data.js`, `Seguimiento/analisis/*.md`, `Tecnico/cache/`, the screenshots, the updated D mockup (in progress).
- Not covered by requirements: keyboard and screen-reader behaviour, the mobile layout beyond the bottom bar, the visual style beyond day and night mode.

## Verified

- `node --check` passed on the seven `.mjs` and web `.js` files (syntax only), on 2026-11-25.
- The mechanical criteria of REQ-ANA-003, REQ-ANA-004, REQ-ANA-005, REQ-ANA-015, REQ-ANA-017, REQ-SEC-002, REQ-LAU-004, REQ-DAT-002 (AC1) and REQ-DAT-004 were run on 2026-11-25 and showed what they state. They check the code or the repository, not the running app.
- Not run: the app, its server, the scans, SkillSpector. Judgement criteria are unassessed. That the GitHub repository is private was not checked. `check` passing is structural, not owner acceptance.
