# State

Replace the content of this file when the state changes; do not add to it. History is in version control and in `decisions.md`.

## Now

- keelblocks adopted on 2026-11-25 for the whole app at once (D-031, D-032). Core tier. His answers are D-037 to D-123; D-099 records the builders' choices he accepted with the owner's approval.
- `decisions.md`: 123 decisions (115 owner, 5 constraint, 3 derived: D-074, D-099 and D-123, open to his correction). 43 open points, all decided. R-001 to R-006.
- Shipped: the new version, design D with phases 1 to 7, is merged into `main` (commit 749b7e7) and pushed to the private repository `<private>/skill-dex` (D-094). It holds: sidebar with Library, Discover, Watchlist, Updates, Discarded and Health; one ranked list with list/cards views and short English descriptions in a file he can edit; level with eight titles, a level and a rarity for each skill, a level-up card, no achievements and no mastered mark; favourites in `Seguimiento/marks.json`; Updates from `ORIGEN.md` sources, security-checked, with a confirmed "Update" (16 real updates found, none applied); Discover with typed search, labels and use without a GitHub login; security findings closed only under the D-056 criterion; reports in English by `<skill>`. His categories and the proposed `security-triage.json` are installed (D-095, D-096); the originals are in `Seguimiento/versiones/final/antes-de-instalar/`.
- 155 requirements in 9 area files: 128 `active`, 21 `ready`, 4 `superseded`, 2 `descoped`, none `fulfilled`. By area: CAT 19 active, 8 ready, 2 superseded · USE 18 active, 3 ready, 1 superseded, 2 descoped · ANA 26 active, 3 ready · SEC 15 active · LAU 12 active, 3 ready · DAT 9 active, 3 ready · UI 5 active, 1 superseded · DIS 12 active · UPD 12 active, 1 ready. The `ready` ones are the multi-agent and review work built on `multi-agente` but not yet pushed (REQ-CAT-001, 015, 022 to 029 as listed in D-117, REQ-USE-001, 013, 024, REQ-ANA-028 to 030, REQ-DAT-010 to 012, REQ-LAU-014, 015), plus REQ-LAU-011 and REQ-UPD-013.
- `active` here means built in 749b7e7 and confirmed to ship by D-094. It is not `fulfilled`: his OK confirms the result as a whole, not acceptance against each criterion. `fulfilled` needs his explicit acceptance per requirement.
- Left `ready`: REQ-LAU-011 (a fresh copy was not tested on a second Mac). REQ-UPD-013 (no update source) is `ready`, not built. REQ-USE-004 and REQ-USE-012 are confirmed and `active` (D-103); OP-004 is closed, no upper level (D-104).
- Security review done (D-101, D-102): 0 findings to check, 103 minor notices, 54 closed; <skill> keeps its Spanish report (D-100, REQ-ANA-027 active with that exception).
- Publication being prepared (D-105 to D-110): MIT licence, holder <private>. Repositories: `skill-dex` (code, private until the owner's approval, then public with fresh history and a clean spec export), `skill-dex-spec` (full package, private), `skill-dex-archivo` (old history, private). README screenshot with example data. <skill> comes from a third party (D-106); his name stays in private data.
- Multi-agent change (D-116 to D-118): Skill Dex is for anyone, even without omp. Being built on the branch `multi-agente` (skill folders of omp, Claude Code, Codex, `~/.agents/skills`, project folders, custom folders; usage from their logs; analyses with omp, claude or codex or disabled; agent badges and filter; README for any `SKILL.md` agent). He approved pushing it directly after verification, for this change only. The four audit fixes are merged, REQ-SEC-012 to REQ-SEC-015 `active` (D-114). No Docker, colima or VMs without his OK (D-115).
- External review pass (D-119 to D-123), on the branch `multi-agente` together with the multi-agent change, to be pushed directly (D-118): English names with the old ones still read and his files converted with a backup (D-120); rarity by how uncommon the skill is on GitHub (D-121); models configurable per runner, real clone URL, Linux best effort, export cleanup (D-123). Next, his acceptance review by area from screenshots, yes or no per area (D-122); the fresh-Mac test was not chosen, so REQ-LAU-011 stays `ready`. All open points are now in English.
- Published (D-113): `github.com/<private>/skill-dex` is PUBLIC since 2026-11-28 under MIT; its first commit still names <private>, <private> and <private>, accepted by him. `skill-dex-spec` and `skill-dex-archivo` stay private. Every push to the public repo needs his OK (skill <skill>). Security audit before publishing (D-111): 4 confirmed low findings, none medium or higher, report in `<home>/security-audit-skill/skill-dex/run-1/`.
- Priority 2 on every `ready` and `active` requirement is a placeholder: <private> gave no order.
- Old documents `Seguimiento/README.md` and `estado.md` stay as history with one pointer line each (D-039).

## Next

1. Verify and push the `multi-agente` branch (D-118); then mark REQ-CAT-001, REQ-CAT-015, REQ-CAT-024 to REQ-CAT-029, REQ-USE-001, REQ-USE-024, REQ-ANA-028, REQ-ANA-029, REQ-DAT-010 and REQ-LAU-014 `active`. Every other push to the public repo needs his OK.
2. Needs validation from the audit, not confirmed: the analysis agent reads third-party text with unrestricted bash and the full environment; any web page may read the catalogue (`data.js` cross-origin, DNS rebinding); `/api/discover/search` fans out to GitHub with no budget or cache cap; `skillcheck` has no symlink gate on cloned trees; the launcher log uses a predictable path in `/tmp`.
4. Test a fresh copy on a second Mac (REQ-LAU-011).
6. Run `index`, then `check`, after every change.

## Waiting for the owner

- His acceptance, per requirement, of the shipped result (`active` to `fulfilled`).
- English names of the four rarities (REQ-USE-013), left to the builder.


## Read first

- `README.md` (format), then `glossary.md`, then the area file in hand under `requirements/` and the decisions and open points it names.

## Coverage

- Read in full: <private>'s typed messages, the five form calls and answers, his design messages and the agent messages before them, `~/.omp/agent/AGENTS.md`, `Seguimiento/README.md`, `estado.md`, `config.json`, `Tecnico/.gitignore`, `Tecnico/scan.mjs`, `server.mjs`, `lanzar.sh`, `security.mjs`, `lib-security.mjs`, `skillcheck.mjs`, `web/index.html`, `web/catalog.js`, the `<skill>` skill and the script inside `Skill Dex.app`.
- Read in part: `Tecnico/web/detail.js`, `web/catalog.css`, the versions in `Seguimiento/versiones/` (proposal D's `index.html`: level, XP, sort, rows, icons, sections). Structure only: `Seguimiento/watchlist.json`, `security-triage.json`, `skills-meta.json`.
- Also read: the question table and his answer (2026-11-27).
- Not read: `Tecnico/web/detail.css`, `Tecnico/web/data.js`, `Seguimiento/analisis/*.md`, `Tecnico/cache/`, the screenshots, the updated D mockup (in progress).
- Not covered by requirements: keyboard and screen-reader behaviour, the mobile layout beyond the bottom bar, the visual style beyond day and night mode.

## Verified

- `node --check` passed on the seven `.mjs` and web `.js` files (syntax only), on 2026-11-25.
- The mechanical criteria of REQ-ANA-003, REQ-ANA-004, REQ-ANA-005, REQ-ANA-015, REQ-ANA-017, REQ-SEC-002, REQ-LAU-004, REQ-DAT-002 (AC1) and REQ-DAT-004 were run on 2026-11-25 and showed what they state. They check the code or the repository, not the running app.
- Not run: the app, its server, the scans, SkillSpector. Judgement criteria are unassessed. That the GitHub repository is private was not checked. `check` passing is structural, not owner acceptance.
