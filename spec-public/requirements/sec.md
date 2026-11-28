# SEC: Security

Drafted from `Tecnico/security.mjs`, `Tecnico/lib-security.mjs`, `Tecnico/skillcheck.mjs`, `Tecnico/scan.mjs`, `Tecnico/web/detail.js`, `Tecnico/web/catalog.js`, `Seguimiento/security-triage.json` (structure only) and `Seguimiento/README.md`. SkillSpector was not run for this adoption. <private> approved the false-positive criterion (D-056) and the small security rules (D-062). Priority 2 is a placeholder: he gave no order.

### REQ-SEC-001 Scan the installed skills that changed
- pattern: event
- statement: When the user presses "Refrescar y escanear seguridad", Skill Dex shall scan with SkillSpector every installed skill whose files changed since its last scan.
- rationale: D-009 (option 1). `Tecnico/security.mjs` hashes each skill folder and rescans only changed ones, four at a time, keeping all findings in `Tecnico/cache/security.json`; the server then rescans (`/api/refresh` with `security`). The button label becomes English with REQ-UI-005.
- acceptance_criteria:
  - AC1 [judgement] GIVEN one installed skill edited since the last scan WHEN <private> presses the button THEN only that skill gets a new scan date in its **detail view**, and the others keep theirs
- scope: Installed skills.
- conditions: SkillSpector is installed in `Tecnico/.venv-skillspector`.
- exceptions: Without SkillSpector the scan is skipped with a message in the log.
- source: D-009, D-062
- status: active
- version: 1
- priority: 2
- ratified_by: D-062 v1

### REQ-SEC-002 The scan sends no skill files to a model
- pattern: ubiquitous
- statement: Skill Dex shall run SkillSpector only in its static mode, which sends no skill files to any model.
- rationale: D-009 chose option 1, which named `--no-llm`; D-062 confirms it. `Tecnico/lib-security.mjs`.
- acceptance_criteria:
  - AC1 [mechanical: `cd Tecnico && grep -n "'--no-llm'" lib-security.mjs`] GIVEN the code WHEN it is searched THEN the only SkillSpector call passes `--no-llm`
- scope: Scans of installed skills and `skillcheck.mjs`.
- conditions: none
- exceptions: SkillSpector still queries a public vulnerability database for dependencies (REQ-DAT-006).
- source: D-009, D-062
- status: active
- version: 1
- priority: 2
- ratified_by: D-062 v1

### REQ-SEC-003 The security state of each skill is visible
- pattern: ubiquitous
- statement: Skill Dex shall show for each installed skill its security state after **triage**.
- rationale: D-009 (option 1: [quote omitted]). Design D (D-070) shows "N to check" on a skill's row when findings are pending and the full state in its detail. The applied redesign shows "Revisar seguridad" on a card only when a finding is pending (`Tecnico/web/detail.js`, `security`).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a scanned skill WHEN <private> looks at it THEN he can tell whether it has findings pending, minor notices only, or none
  - AC2 [judgement] GIVEN a skill never scanned WHEN he opens its **detail view** THEN it says it has no scan and that this does not mean it is safe
- scope: The list, the cards and the **detail view** of installed skills.
- conditions: none
- exceptions: none
- source: D-009, D-070
- status: active
- version: 1
- priority: 2
- ratified_by: D-070 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-SEC-004 Findings are closed only under the approved criterion
- pattern: ubiquitous
- statement: Skill Dex shall close a security finding as a **false positive** without showing it to the user only when the finding meets one of the six conditions of the approved criterion and none of its exclusions.
- rationale: D-056 approves the criterion quoted in its context: the six conditions (text the skill does not run, an ordinary word read as a command, code that does the opposite of what is feared, advice for people, data read only on the Mac, scanner confidence under 60 %) and the exclusions (sends data to the internet without saying so, deletes files outside its folder, asks for passwords or keys, installs programs by itself, or is [quote omitted]). Today `Tecnico/lib-security.mjs`, `classify`, differs: it treats every finding in documentation or with confidence under 0.6 as noise even when it is critical or falls under an exclusion, and it treats "analysis-evasion" findings as noise although no condition covers them. Medium and low severity findings stay minor notices, as today (they are not closed, only shown as notices).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a critical finding in a skill's reference document WHEN the scan is triaged THEN it is shown to <private>, not closed as noise
  - AC2 [judgement] GIVEN a finding where the Spanish word "su" is read as a command WHEN the scan is triaged THEN it is closed with condition 2 recorded
  - AC3 [judgement] GIVEN a finding that meets no condition WHEN the scan is triaged THEN it is shown to <private>
- scope: Installed skills, `skillcheck.mjs` and the analyses that use it.
- conditions: none
- exceptions: none
- source: D-045, D-056
- status: active
- version: 1
- priority: 2
- ratified_by: D-056 v1
- builder_choice: which conditions are applied by code and which by an agent reading the finding, as long as a doubtful case is shown to <private>
- note: built in 749b7e7, confirmed by D-094.

### REQ-SEC-005 Each closure names the condition that justifies it
- pattern: ubiquitous
- statement: Skill Dex shall record each **false positive** it closes with the date, the skill and the number of the condition that justifies it, and show that record in the skill's **detail view**.
- rationale: D-056. Today `Seguimiento/security-triage.json` holds a free reason and `reviewed_at` but no condition number; findings that `classify` drops as noise get a generic reason and no date.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a closed false positive WHEN <private> opens the skill's **detail view** THEN he sees the date and the number of the condition, and can read what that condition says
- scope: Installed skills.
- conditions: none
- exceptions: A finding closed by the owner (D-101) is recorded as decided by him, with the date, instead of a condition number.
- source: D-056, D-101
- status: active
- version: 2
- priority: 2
- ratified_by: D-101 v2
- changes:
  - v2 D-101: owner closures are recorded as decided by him
- note: built in 749b7e7, confirmed by D-094.

### REQ-SEC-006 Remaining alerts stay in front of <private>
- pattern: ubiquitous
- statement: Skill Dex shall show every **finding to review** that remains after **triage** until it is recorded as reviewed.
- rationale: D-013, D-045 and D-056. The health panel counts them, the review filter lists their skills, and the **detail view** lists each one (`Tecnico/web/catalog.js`, `healthPanel`, `needsReview`; `Tecnico/web/detail.js`, `security`).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill with one pending finding WHEN <private> opens Skill Dex THEN the health panel counts it, "Para revisar" lists the skill, and its **detail view** shows the file, line and snippet of the finding
- scope: Installed skills.
- conditions: none
- exceptions: Scanner coverage gaps ("analysis-evasion") are shown as minor notices, not as findings to review; they stay visible in the detail view and are never closed by themselves (D-102).
- source: D-013, D-045, D-056, D-102
- status: active
- version: 2
- priority: 2
- ratified_by: D-102 v2
- changes:
  - v2 D-102: coverage gaps are minor notices

### REQ-SEC-007 A verdict for a skill not yet installed
- pattern: event
- statement: When `Tecnico/skillcheck.mjs` is given a git URL or a local path, Skill Dex shall print one of the verdicts limpia, solo avisos menores, revisar a mano or crítico, with the findings behind it.
- rationale: D-012: SkillSpector inside the analysis flow; D-062 confirms it. `Tecnico/skillcheck.mjs` applies the same **triage** and prints the raw result next to it. Its output is read by agents, not shown in the app.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the URL of a public skill repository WHEN an agent runs `node Tecnico/skillcheck.mjs <url>` THEN it prints one of the four verdicts, the counts after **triage** and each finding to review
- scope: `skillcheck.mjs`, used by analyses.
- conditions: SkillSpector is installed in `Tecnico/.venv-skillspector`.
- exceptions: none
- source: D-012, D-062
- status: active
- version: 1
- priority: 2
- ratified_by: D-062 v1

### REQ-SEC-008 Remote skills are checked from a temporary copy that is then deleted
- pattern: event
- statement: When `Tecnico/skillcheck.mjs` is given a git URL, Skill Dex shall clone it into a new folder under the system temporary folder, scan it there and delete that folder afterwards.
- rationale: D-062 accepts [quote omitted] Today `Tecnico/skillcheck.mjs` clone into `mkdtemp` and leave the copy for macOS to clear; deleting it after the scan is not built. Keeps the check apart from the skills folders (D-006).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a git URL WHEN `skillcheck.mjs` runs THEN it prints "Clonado en" followed by a path in the temporary folder, and no skills folder changes
  - AC2 [judgement] GIVEN the same run WHEN it has finished THEN the folder it printed no longer exists
- scope: `skillcheck.mjs`.
- conditions: none
- exceptions: none
- source: D-062
- status: active
- version: 1
- priority: 2
- ratified_by: D-062 v1
- builder_choice: how the folder is deleted (the safety guard blocks `rm -rf`)
- note: built in 749b7e7, confirmed by D-094.

### REQ-SEC-009 A clean scan is not presented as a guarantee
- pattern: ubiquitous
- statement: Skill Dex shall present a scan without pending findings as the absence of alerts and never as proof that the skill is safe.
- rationale: D-062. The texts in `Tecnico/web/detail.js`, `Tecnico/web/catalog.js` and `Tecnico/skillcheck.mjs`. Limits R-004.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill whose scan is clean WHEN <private> reads its security part THEN the wording says that nothing was flagged and that the scan is not a guarantee
- scope: All security texts.
- conditions: none
- exceptions: none
- source: D-062
- status: active
- version: 1
- priority: 2
- ratified_by: D-062 v1

### REQ-SEC-010 Findings closed before the criterion are checked again
- pattern: ubiquitous
- statement: Skill Dex shall show to the user again every finding recorded as reviewed in `Seguimiento/security-triage.json` that does not meet the approved criterion.
- rationale: D-056: the seven findings the agent closed on 2026-11-24, before the criterion existed (OP-007), are checked against it. Those that meet a condition get it recorded (REQ-SEC-005); the rest go back in front of <private>.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the seven entries of `Seguimiento/security-triage.json` WHEN they are checked against the criterion THEN each either names the condition that justifies it or shows again as pending in its skill's **detail view**
- scope: Installed skills.
- conditions: none
- exceptions: none
- source: D-056
- status: active
- version: 1
- priority: 2
- ratified_by: D-056 v1
- note: built in 749b7e7, confirmed by D-094.


### REQ-SEC-011 An owner closure reopens when the file or folder changes
- pattern: event
- statement: When a file or folder closed by the owner as a **false positive** changes, Skill Dex shall show its findings again as findings to review.
- rationale: D-101. Findings in a folder are tied to a hash of the folder's contents.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a finding closed by the owner WHEN a file inside its file or folder changes and the scan runs THEN the finding is shown to review again
- scope: Findings closed with `by: "owner"`.
- conditions: none
- exceptions: none
- source: D-101
- status: active
- version: 1
- priority: 2
- ratified_by: D-101 v1
- note: Built in the latest commit after 749b7e7, confirmed by D-101.

### REQ-SEC-012 A malformed request URL does not crash the server
- pattern: unwanted
- statement: If a request has a URL that cannot be parsed, then Skill Dex shall answer it with an error and keep running.
- rationale: Audit finding `server.mjs/http-handler-uncontained-throw-crashes-process` (low): one malformed URL raises an unhandled error that stops the server. Decided in D-114; proposed in OP-040; merged and pushed.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the running server WHEN a request with a malformed URL arrives THEN it gets an error response and the next request is served
- scope: Skill Dex as published.
- conditions: none
- exceptions: none
- source: OP-040, D-114
- status: active
- version: 1
- priority: 2
- ratified_by: D-114 v1
- note: Smallest fix from the audit: Contain every error of the request handler: parse the URL and decode the static path in a try that returns 400, turn a handler rejection into a 500, and handle errors of the static file stream.

### REQ-SEC-013 The loopback API does not trust a client-asserted header
- pattern: unwanted
- statement: If a request to the local API carries only an Origin header and no proof of being from the user's own page, then Skill Dex shall refuse it.
- rationale: Audit finding `server.mjs/loopback-api-origin-header-as-peer-authentication` (low): any local program can set Origin and drive paid analyses or change data. Decided in D-114; proposed in OP-041; merged and pushed.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the running server WHEN a local program sends a change request with a forged Origin header THEN it is refused
- scope: Skill Dex as published.
- conditions: none
- exceptions: none
- source: OP-041, D-114
- status: active
- version: 1
- priority: 2
- ratified_by: D-114 v1
- note: Smallest fix from the audit: Bind the API to the launching user with a per-launch secret: a random token in a 0600 file in the data folder, passed by the launcher and answered with a strict cookie; refuse every other request.

### REQ-SEC-014 Triage exclusions look at the full finding text
- pattern: event
- statement: When the triage tests the exclusions of the approved criterion on a finding, Skill Dex shall test the full finding text and not only a 140-character snippet.
- rationale: Audit finding `lib-security.mjs/exclusion/evaluated-on-140-char-snippet` (low): an exclusion word after character 140 lets a finding be closed by itself. The criterion is D-056. Decided in D-114; proposed in OP-042; merged and pushed.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a finding whose exclusion word comes after character 140 WHEN the scan is triaged THEN it is not closed as a false positive
- scope: Skill Dex as published.
- conditions: none
- exceptions: none
- source: OP-042, D-114
- status: active
- version: 1
- priority: 2
- ratified_by: D-114 v1
- note: Smallest fix from the audit: Run the exclusion test on the full text and explanation, computed before the snippet is cut, and add a regression test.

### REQ-SEC-015 Runnable files in templates or examples folders are not closed as guides
- pattern: unwanted
- statement: If a finding is in a file under a templates, examples or samples folder whose type is not a known text or data type, then Skill Dex shall keep it for review.
- rationale: Audit finding `lib-security.mjs/isGuide/template-folder-any-file-type` (low): any unknown file type there is treated as an inert guide, so its findings are closed. Decided in D-114; proposed in OP-043; merged and pushed.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a runnable file without extension under `examples/` with a finding WHEN the scan is triaged THEN the finding stays to review
- scope: Skill Dex as published.
- conditions: none
- exceptions: none
- source: OP-043, D-114
- status: active
- version: 1
- priority: 2
- ratified_by: D-114 v1
- note: Smallest fix from the audit: Apply the folder rule only to md, mdx, markdown, txt, rst, html, json, yaml and csv, and add a regression test that `examples/run` stays in review.
