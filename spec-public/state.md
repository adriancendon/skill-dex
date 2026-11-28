# State

Replace the content of this file when the state changes; do not add to it. History is in version control and in `decisions.md`.

## Now

- keelblocks adopted on 2026-11-25 for the whole app at once (D-031, D-032). Core tier. His answers are D-037 to D-133. 133 decisions (125 owner, 5 constraint, 3 derived: D-074, D-099 and D-123, open to his correction); 45 open points, all decided; R-001 to R-006.
- Public: `github.com/<private>/skill-dex` has been PUBLIC since 2026-11-28 under the MIT licence (D-105, D-113), after a security audit (D-111: 4 low findings, all fixed, D-114). Its first commit still names <private>, <private> and <private>, accepted by him. `skill-dex-spec` (this package) and `skill-dex-archivo` (old history) stay private. Every push to the public repo needs his OK, except the multi-agent change, pre-approved to be pushed directly (D-118, D-119).
- Shipped earlier: design D with phases 1 to 7 (749b7e7, D-094), his categories, the security review (D-096, D-101, D-102), reports regenerated in English (D-098, D-100).
- Branch `multi-agente`, merged into `main` and pushed on 2026-11-28: support for any agent that uses `SKILL.md` (D-117), English names with the old ones still read and his data folder migrated with a backup (D-120), rarity by how uncommon the skill is on GitHub (D-121), export cleanup, models configurable per runner and Linux best effort (D-123). His `Skill Dex.app` icon was rebuilt to call `launch.sh`.
- 157 requirements in 9 area files: 147 `fulfilled`, 3 `active` (REQ-LAU-015, Linux not tested; REQ-UPD-014 and REQ-LAU-016, built and approved by D-133, not yet accepted), 1 `ready` (REQ-LAU-011, fresh Mac not tested), 0 `draft`, 4 `superseded`, 2 `descoped`.
- Accepted: on 2026-11-28 he accepted all nine areas, CAT, USE, ANA, SEC, DIS, UPD, LAU, DAT and UI, each with a "si", the preselected option, after screenshots in `Seguimiento/versiones/aceptacion/` (D-124 to D-132). The acceptance of LAU excludes the untested Linux part and the fresh-Mac test.
- Priority 2 on every requirement is a placeholder: <private> gave no order.
- Old documents `Seguimiento/README.md` and `estado.md` stay as history with one pointer line each (D-039).

## Next

1. Ask him to accept REQ-UPD-014 and REQ-LAU-016 (`active` to `fulfilled`).
2. `spec-public` refresh approved (D-133).
3. Needs validation from the audit, not confirmed: the analysis agent reads third-party text with unrestricted bash and the full environment; any web page may read the catalogue (`data.js` cross-origin, DNS rebinding); `/api/discover/search` fans out to GitHub with no budget or cache cap; `skillcheck` has no symlink gate on cloned trees; the launcher log uses a predictable path in `/tmp`.
4. Test Linux (REQ-LAU-015) and a fresh copy as a second user (REQ-LAU-011) when he wants.
5. Run `index`, then `check`, after every change.

## Waiting for the owner

- His acceptance of REQ-UPD-014 and REQ-LAU-016.

## Read first

- `README.md` (format), then `glossary.md`, then the area file in hand under `requirements/` and the decisions and open points it names.

## Coverage

- Read in full: <private>'s typed messages, the five form calls and answers, his design messages and the agent messages before them, `~/.omp/agent/AGENTS.md`, `Seguimiento/README.md`, `estado.md`, `config.json`, `Tecnico/.gitignore`, `Tecnico/scan.mjs`, `server.mjs`, `lanzar.sh`, `security.mjs`, `lib-security.mjs`, `skillcheck.mjs`, `web/index.html`, `web/catalog.js`, the `<skill>` skill and the script inside `Skill Dex.app`.
- Read in part: `Tecnico/web/detail.js`, `web/catalog.css`, the versions in `Seguimiento/versiones/` (proposal D's `index.html`: level, XP, sort, rows, icons, sections). Structure only: `Seguimiento/watchlist.json`, `security-triage.json`, `skills-meta.json`.
- Also read: the question table and his answer (2026-11-27).
- Not read: `Tecnico/web/detail.css`, `Tecnico/web/data.js`, `Seguimiento/analisis/*.md`, `Tecnico/cache/`, the screenshots, the updated D mockup (in progress).
- Not covered by requirements: keyboard and screen-reader behaviour, the mobile layout beyond the bottom bar, the visual style beyond day and night mode.

## Verified

- `check` passes (structure only, not owner acceptance). Judgement criteria are unassessed until his acceptance review. The GitHub repository was published and audited on 2026-11-28.
