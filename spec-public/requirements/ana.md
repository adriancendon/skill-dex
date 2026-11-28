# ANA: Análisis y watchlist

Drafted from `Tecnico/server.mjs`, `Tecnico/web/catalog.js`, `Tecnico/web/detail.js`, `Seguimiento/watchlist.json` (structure only), `Seguimiento/README.md` and the `<skill>` skill (`~/.omp/agent/managed-skills/<skill>/SKILL.md`), which the app's analyses follow. <private> confirmed the analysis as it works today (D-043) and the discard rules (D-044). Priority 2 is a placeholder: he gave no order.

### REQ-ANA-001 Analyse a skill from the app
- pattern: event
- statement: When the user submits a URL or a name in "Analizar skill", Skill Dex shall start an **análisis** of that skill in the background.
- rationale: D-015 (option A). `Tecnico/web/catalog.js`, `openAnalyze` and `runAnalyze`; `Tecnico/server.mjs`, `/api/analyze`, which runs `omp -p` with the `<skill>` steps (`buildPrompt`, `startJob`).
- acceptance_criteria:
  - AC1 [judgement] GIVEN Skill Dex opened through `Skill Dex.app` and no analysis running WHEN <private> pastes a GitHub URL of a new skill and presses "Analizar sin instalar" THEN the page switches to the Watchlist tab with a new entry for it
- scope: The "Analizar skill" dialog.
- conditions: The local server is running.
- exceptions: An empty text, a text over 300 characters or with a line break is refused with a message.
- source: D-015, D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-002 The entry shows that it is being analysed
- pattern: state
- statement: While an **análisis** runs, Skill Dex shall show its watchlist card as "Analizando…" with the time elapsed.
- rationale: D-015: the card sits in the watchlist marked as analysing until the report fills it in. `Tecnico/web/catalog.js`, `wlActs` and the 5-second `ping` loop; the page reloads when the run ends.
- acceptance_criteria:
  - AC1 [judgement] GIVEN an analysis just started WHEN <private> looks at the Watchlist tab THEN its card says "Analizando…" with a clock that advances, and it comes first in the list
  - AC2 [judgement] GIVEN the analysis ends WHEN the page reloads by itself THEN the card shows the score, the verdict and the report
- scope: The Watchlist tab.
- conditions: none
- exceptions: none
- source: D-015, D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-003 Only one analysis at a time
- pattern: unwanted
- statement: If the user starts an **análisis** while another one is running, then Skill Dex shall refuse the new one with a message saying that only one runs at a time.
- rationale: D-016. `Tecnico/server.mjs`.
- acceptance_criteria:
  - AC1 [mechanical: `cd Tecnico && grep -n "if (job) return send(res, 409" server.mjs`] GIVEN the server code WHEN it is searched THEN the analyse request is answered with status 409 whenever a job is running
  - AC2 [judgement] GIVEN an analysis running WHEN <private> starts a second one THEN he sees the message and no second entry appears
- scope: Analyses launched from the app.
- conditions: none
- exceptions: none
- source: D-016, D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-004 Limited permissions
- pattern: ubiquitous
- statement: Skill Dex shall run each **análisis** with only the read, bash, web search, grep and glob tools, from a new temporary folder, with no writing to the project by the agent.
- rationale: D-017, confirmed as built by D-043. `Tecnico/server.mjs` (`--tools read,bash,web_search,grep,glob`) and (working folder from `mkdtemp`); the prompt (`buildPrompt`) forbids writing project files, installing, running code of the analysed repository and `rm`. The app writes the result itself (REQ-ANA-008, REQ-ANA-009). The agent had proposed [quote omitted]; what is built is stricter.
- acceptance_criteria:
  - AC1 [mechanical: `cd Tecnico && grep -n "'--tools', 'read,bash,web_search,grep,glob'" server.mjs`] GIVEN the server code WHEN it is searched THEN the analysis is started with exactly these five tools
  - AC2 [judgement] GIVEN a finished analysis WHEN the project folder is compared before and after THEN only the report, `watchlist.json`, `web/data.js` and the job log changed, all written by the app
- scope: Analyses launched from the app.
- conditions: none
- exceptions: `bash` is not sandboxed; its limits are instructions in the prompt (R-005).
- source: D-017, D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-005 Time and cost limit
- pattern: ubiquitous
- statement: Skill Dex shall stop an **análisis** that runs longer than 20 minutes or costs more than 1.5 dollars.
- rationale: `Tecnico/server.mjs` (`--max-time 20m`, `--max-cost 1.5`); the README and the dialog tell <private> these limits, and D-043 confirms them. D-036 asks to avoid waste. <private> was told an analysis costs about 0.10 to 0.30 dollars (D-015 context).
- acceptance_criteria:
  - AC1 [mechanical: `cd Tecnico && grep -n "'--max-time', '20m', '--max-cost', '1.5'" server.mjs`] GIVEN the server code WHEN it is searched THEN the analysis is started with these two limits
- scope: Analyses launched from the app.
- conditions: none
- exceptions: none
- source: D-043, D-036
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-006 An analysis never installs
- pattern: ubiquitous
- statement: Skill Dex shall not install, copy or link the analysed skill into any skills folder as part of an **análisis**.
- rationale: D-006. The prompt in `Tecnico/server.mjs` (`buildPrompt`) and `<skill>` ("NO instalar la skill. No copiar a `~/.omp/agent/skills`, no symlinks, no `npx skills add`") forbid it; the dialog says "Analizar sin instalar".
- acceptance_criteria:
  - AC1 [judgement] GIVEN an analysis of a skill that is not installed WHEN it has finished THEN `~/.omp/agent/skills` and `~/.omp/agent/managed-skills` hold the same folders as before and the skill shows only in the watchlist
- scope: Analyses launched from the app and from an omp conversation.
- conditions: none
- exceptions: none
- source: D-006, D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-007 What the report says, in order
- pattern: ubiquitous
- statement: Skill Dex shall produce for each **análisis** an **informe** that says, in this order, what the skill does, its reviews and score, whether it triggers by itself or has to be called by hand, and an honest recommendation on whether to install it.
- rationale: D-007. The `<skill>` delivery format has six sections: what it does, reviews and score, security, activation, overlaps, recommendation; it keeps his four in his order and adds two, which D-043 accepts.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a finished analysis WHEN <private> reads its **informe** in the **ficha** THEN he finds the four answers in this order, the recommendation ends in one of three verdicts (install, install with changes, do not install), and reviews or stars that could not be found are said to be missing rather than invented
- scope: Reports in `Seguimiento/analisis/`.
- conditions: none
- exceptions: none
- source: D-007, D-043, D-084
- status: active
- version: 2
- priority: 2
- ratified_by: D-084 v2
- changes:
  - v2 D-084: the three verdicts are named by meaning in English, not as the Spanish words "Instalar", "Instalar con cambios" and "No instalar"
- note: built in 749b7e7, confirmed by D-094.

### REQ-ANA-008 The report is saved
- pattern: event
- statement: When an **análisis** finishes with a result, Skill Dex shall save its **informe** as `Seguimiento/analisis/<id>.md`.
- rationale: D-015 (the entry fills in with the report) and D-018 (the full analysis readable in the app). `Tecnico/server.mjs`, `startJob`, writes the file with a first line naming the date.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a finished analysis of a new skill WHEN <private> opens `Seguimiento/analisis/` THEN a Markdown file with its id holds the report
- scope: Analyses launched from the app.
- conditions: none
- exceptions: none
- source: D-015, D-018, D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-009 The watchlist entry is filled in
- pattern: event
- statement: When an **análisis** finishes with a result, Skill Dex shall fill the **watchlist** entry with the name, source, category, score out of 10, verdict, short note and date of the analysis.
- rationale: D-008 and D-015. `Tecnico/server.mjs`, `startJob`, reads the `RESULT` block of the agent's answer.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a finished analysis WHEN <private> looks at its card THEN it shows the score, the verdict and a status of "Recomendada" or "Por analizar"
- scope: Analyses launched from the app.
- conditions: none
- exceptions: none
- source: D-008, D-015, D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-010 An analysis never discards by itself
- pattern: ubiquitous
- statement: Skill Dex shall not mark an entry as **descartada** as the result of an **análisis**.
- rationale: `Tecnico/server.mjs`, `buildPrompt` ("NUNCA descartada") and `startJob` (only "recomendada" or "en-analisis"); README: [quote omitted]. Fits D-010, where <private> discards; D-043 confirms it. The six entries discarded by an agent earlier were confirmed by <private> (D-044).
- acceptance_criteria:
  - AC1 [judgement] GIVEN an analysis whose verdict is "No instalar" WHEN it finishes THEN the entry stays in the Watchlist tab as "Por analizar", not under Descartadas
- scope: Analyses launched from the app.
- conditions: none
- exceptions: none
- source: D-043, D-044
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-011 Already investigated skills are recognised
- pattern: event
- statement: When the user asks to analyse a skill that is already in the **watchlist**, Skill Dex shall show its status and verdict, and for a **descartada** entry the date and reason, without starting a new **análisis**.
- rationale: D-010: a later question about the same skill is answered with when and why it was discarded. `Tecnico/server.mjs` match by id, source URL or name; the README says this costs nothing.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a discarded entry with a reason WHEN <private> enters its URL in "Analizar skill" THEN a dialog "Ya investigada" names the date and the reason, offers "Ver informe", and no analysis starts
- scope: The "Analizar skill" dialog.
- conditions: none
- exceptions: An entry whose previous analysis failed is analysed again directly.
- source: D-010, D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-012 Analyse a known skill again
- pattern: event
- statement: When the user confirms "Analizar de nuevo" for a skill already in the **watchlist**, Skill Dex shall start a new **análisis** of that same entry.
- rationale: `Tecnico/web/catalog.js`, `runAnalyze(true, …)`; `Tecnico/server.mjs` reuses the entry. Today it also deletes the discard reason and date; D-044 asks to keep them as history (REQ-ANA-024). The button warns that it consumes quota.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the "Ya investigada" dialog WHEN <private> presses "Analizar de nuevo (consume cuota)" THEN the same entry goes to "Analizando…" and no second entry appears
- scope: The "Analizar skill" dialog.
- conditions: No other analysis is running.
- exceptions: none
- source: D-043, D-044
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-013 Cancel a running analysis
- pattern: event
- statement: When the user confirms "Cancelar" on a running **análisis**, Skill Dex shall stop it and mark its entry as failed with the reason "Cancelado por ti".
- rationale: `Tecnico/web/catalog.js`, `cancelJob`; `Tecnico/server.mjs`, `/api/cancel` and `startJob`.
- acceptance_criteria:
  - AC1 [judgement] GIVEN an analysis running WHEN <private> presses "Cancelar" and confirms THEN within a few seconds the card shows "Cancelado por ti" with "Reintentar" and "Quitar intento"
- scope: The Watchlist tab.
- conditions: none
- exceptions: none
- source: D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-014 Remove a failed attempt
- pattern: event
- statement: When the user presses "Quitar intento" on an entry whose **análisis** failed, Skill Dex shall remove that entry from the **watchlist**.
- rationale: `Tecnico/web/catalog.js`, `removeW`; `Tecnico/server.mjs`, `/api/remove`.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a failed entry WHEN <private> presses "Quitar intento" THEN the entry disappears from the Watchlist tab and from `watchlist.json`
- scope: The Watchlist tab.
- conditions: none
- exceptions: none
- source: D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-015 Only failed attempts can be removed
- pattern: unwanted
- statement: If a request asks to remove a **watchlist** entry whose **análisis** did not fail, then Skill Dex shall refuse it and keep the entry.
- rationale: D-010 keeps investigated and discarded entries. `Tecnico/server.mjs`.
- acceptance_criteria:
  - AC1 [mechanical: `cd Tecnico && grep -n "solo se pueden quitar análisis fallidos" server.mjs`] GIVEN the server code WHEN it is searched THEN the remove request is refused unless the entry's status is `error`
  - AC2 [judgement] GIVEN a recommended or discarded entry WHEN <private> looks at its card THEN it offers no way to remove it
- scope: The local server.
- conditions: none
- exceptions: none
- source: D-010, D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-016 An analysis cut off by closing the app is marked failed
- pattern: event
- statement: When the local server starts and finds an entry still marked as analysing, Skill Dex shall mark that entry as failed with the reason that the app closed during the **análisis**.
- rationale: `Tecnico/server.mjs`.
- acceptance_criteria:
  - AC1 [judgement] GIVEN an entry left as "analizando" in `watchlist.json` WHEN <private> opens `Skill Dex.app` THEN its card shows [quote omitted] with "Reintentar"
- scope: The local server.
- conditions: none
- exceptions: none
- source: D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-017 A discard needs a reason
- pattern: unwanted
- statement: If the user tries to discard a **watchlist** entry without giving a reason, then Skill Dex shall refuse the discard.
- rationale: D-010 wants to be told later [quote omitted]. `Tecnico/server.mjs`; `Tecnico/web/catalog.js`, `discard`, asks for the reason with the verdict filled in.
- acceptance_criteria:
  - AC1 [mechanical: `cd Tecnico && grep -n "falta el motivo" server.mjs`] GIVEN the server code WHEN it is searched THEN a discard without a reason is answered with an error
  - AC2 [judgement] GIVEN a watchlist entry WHEN <private> presses "Descartar con motivo" and leaves the reason empty THEN the entry stays in the Watchlist tab
- scope: The Watchlist tab and the local server.
- conditions: none
- exceptions: none
- source: D-010, D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-018 A discarded entry is kept with its reason and date
- pattern: event
- statement: When the user discards a **watchlist** entry with a reason, Skill Dex shall keep the entry as **descartada** with that reason and the date.
- rationale: D-010. `Tecnico/server.mjs`, `/api/watch`, writes `discard_reason` and `discarded_at` into `Seguimiento/watchlist.json`; the report stays in `Seguimiento/analisis/`. Six older discarded entries have no reason; their report verdict serves as reason (D-044, REQ-ANA-025).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a watchlist entry WHEN <private> discards it with a reason THEN it moves to the Descartadas tab showing the date and the reason, and its report still opens from the **ficha**
- scope: The Watchlist and Descartadas tabs.
- conditions: none
- exceptions: none
- source: D-010, D-043, D-044, D-060
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-019 Recover a discarded entry
- pattern: event
- statement: When the user presses "Recuperar en watchlist" on a **descartada** entry, Skill Dex shall return it to the **watchlist** as "Por analizar".
- rationale: `Tecnico/web/catalog.js`, `wlActs`; `Tecnico/server.mjs`. Today it also deletes the discard reason and date; D-044 asks to keep them as history (REQ-ANA-024).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a discarded entry WHEN <private> presses "Recuperar en watchlist" THEN it shows again in the Watchlist tab and not under Descartadas
- scope: The Descartadas tab.
- conditions: none
- exceptions: none
- source: D-043, D-044
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-020 An installed skill leaves the watchlist view
- pattern: state
- statement: While a **watchlist** entry has the same id as an installed skill, Skill Dex shall show it only among the installed skills.
- rationale: `Tecnico/scan.mjs` filters such entries out of the watchlist view; the entry stays in `watchlist.json`. The first version promised [quote omitted].
- acceptance_criteria:
  - AC1 [judgement] GIVEN a watchlist entry whose skill <private> installs under the same folder name WHEN Skill Dex is rescanned THEN it appears under Instaladas and no longer under Watchlist
- scope: The catalogue.
- conditions: none
- exceptions: An entry installed under another folder name stays in the watchlist.
- source: D-043, D-008, D-060
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-021 The full output of each analysis is kept
- pattern: event
- statement: When an **análisis** ends, Skill Dex shall write the agent's full output to `Tecnico/cache/job-<id>.log`.
- rationale: `Tecnico/server.mjs`, `startJob`; the error message of a failed analysis names this file. `cache/` is not in git (REQ-DAT-004).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a finished, failed or cancelled analysis WHEN <private> or an agent opens `Tecnico/cache/` THEN a log with that id exists
- scope: Analyses launched from the app.
- conditions: none
- exceptions: none
- source: D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-022 SkillSpector runs inside every analysis
- pattern: ubiquitous
- statement: Skill Dex shall include a SkillSpector scan through `Tecnico/skillcheck.mjs` in every **análisis** of a skill that has a `SKILL.md`.
- rationale: D-012. Step 3 of `<skill>` makes it compulsory; the app's prompt allows `node …/skillcheck.mjs` and asks to check every "revisar" or [quote omitted] finding in the real code.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a finished analysis of a skill with a `SKILL.md` WHEN <private> reads the security part of its **informe** THEN it gives the `skillcheck.mjs` verdict and says for each "revisar" or [quote omitted] finding whether it is a **falso positivo** and why
- scope: Analyses launched from the app and from an omp conversation.
- conditions: none
- exceptions: Tools that are not skills (a CLI, a proxy) are reviewed by hand instead.
- source: D-012, D-043
- status: active
- version: 1
- priority: 2
- ratified_by: D-043 v1

### REQ-ANA-024 The previous discard reason is kept as history
- pattern: event
- statement: When a **descartada** entry is recovered or analysed again, Skill Dex shall keep its previous discard reason and date as history of that entry.
- rationale: D-044. Not built: `Tecnico/server.mjs` delete `discard_reason` and `discarded_at`. Keeps what D-010 asked for: a later question about the skill can still be answered with why it was discarded before.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a discarded entry with a reason WHEN <private> presses "Recuperar en watchlist" THEN its **ficha** still shows the earlier reason and date as history
  - AC2 [judgement] GIVEN the same entry analysed again WHEN <private> or omp looks it up THEN the earlier reason and date are still in `Seguimiento/watchlist.json`
- scope: The watchlist and its file.
- conditions: none
- exceptions: none
- source: D-044
- status: active
- version: 1
- priority: 2
- ratified_by: D-044 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-ANA-025 A discard without a written reason shows the report's verdict
- pattern: unwanted
- statement: If a **descartada** entry has no recorded discard reason, then Skill Dex shall show the verdict of its report as the reason.
- rationale: D-044 makes the report verdict the reason of <skill>, <skill>, <skill>, <private>, <private> and <skill>. Built: `Tecnico/web/catalog.js` (`card`, `runAnalyze`) shows `discard_reason || verdict`.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the Descartadas tab WHEN <private> looks at <private> THEN its card shows the verdict of its report as the reason
- scope: The Descartadas tab and the "Ya investigada" dialog.
- conditions: none
- exceptions: none
- source: D-044
- status: active
- version: 1
- priority: 2
- ratified_by: D-044 v1
- builder_choice: whether the verdict is also written into `discard_reason` in `Seguimiento/watchlist.json`

### REQ-ANA-026 Analysis reports are written in English
- pattern: ubiquitous
- statement: Skill Dex shall have each **informe** written in English.
- rationale: D-084 (owner answer: yes, like the rest of the app). Not built: the prompt in `Tecnico/server.mjs` asks for a report in Spanish and `<skill>` writes in Spanish. Reports already in `Seguimiento/analisis/` are in Spanish and are analysed again (D-092, REQ-ANA-027).
- acceptance_criteria:
  - AC1 [judgement] GIVEN an analysis started after this is built WHEN <private> reads its **informe** in the **ficha** THEN the whole report is in English
- scope: Reports of analyses run from the app or with `<skill>`.
- conditions: none
- exceptions: Quotes from the analysed skill keep their own language.
- source: D-084
- status: active
- version: 1
- priority: 2
- ratified_by: D-084 v1
- builder_choice: the English verdict words that replace "Instalar", "Instalar con cambios" and "No instalar", and the places that read them (`Tecnico/server.mjs`, `Tecnico/web/`)
- note: built in 749b7e7, confirmed by D-094.

### REQ-ANA-027 Reports written in Spanish are produced again in English
- pattern: ubiquitous
- statement: Skill Dex shall have every skill whose **informe** is in Spanish analysed again, so that its **informe** is in English.
- rationale: D-092 (OP-039): he chose analysing again over translating or leaving them. It costs about 1.5 dollars per skill; Main plans 12 such reports, to be regenerated after his OK, since each new run spends money (REQ-ANA-005 limits one run to 1.5 dollars).
- acceptance_criteria:
  - AC1 [judgement] GIVEN the reports in `Seguimiento/analisis/` WHEN the new analyses have finished THEN every report is in English and none has been lost
  - AC2 [judgement] GIVEN a skill whose report was in Spanish WHEN its analysis is run again THEN a discarded entry stays discarded with its reason (REQ-ANA-024) and nothing is installed
- scope: The reports in `Seguimiento/analisis/` written before D-084.
- conditions: none
- exceptions: The report of <skill> stays in Spanish and its entry stays discarded: its regeneration hit the cost cap of one analysis.
- source: D-092, D-100
- status: active
- version: 2
- priority: 2
- ratified_by: D-100 v2
- changes:
  - v2 D-100: <skill> keeps its Spanish report
- builder_choice: the order of the runs, and whether the Spanish report is kept apart until the English one exists
- note: 11 of 12 reports regenerated in English with the six headings (D-098); <skill> excepted by D-100.

### REQ-ANA-028 Agent tasks run with whichever CLI is available
- pattern: ubiquitous
- statement: Skill Dex shall run analyses, short descriptions and pair advice with whichever of the omp, claude and codex command-line tools is available.
- rationale: D-117 (option 1). Where omp is used it keeps its explicit model; the choice of runner decides the rest.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a Mac with only the codex CLI WHEN the user starts an analysis THEN it runs with codex
- scope: Analyses, short descriptions and pair advice.
- conditions: none
- exceptions: none
- source: D-117
- status: ready
- version: 1
- priority: 2
- ratified_by: D-117 v1

### REQ-ANA-029 Agent tasks are disabled when no CLI is available
- pattern: state
- statement: While none of the omp, claude and codex tools is available, Skill Dex shall disable analyses, short descriptions and pair advice and say why.
- rationale: D-117: the rest of the app keeps working without an agent.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a Mac with none of the three tools WHEN the user opens the app THEN the catalogue works and the analysis buttons are disabled with an explanation
- scope: Analyses, short descriptions and pair advice.
- conditions: none
- exceptions: none
- source: D-117
- status: ready
- version: 1
- priority: 2
- ratified_by: D-117 v1

### REQ-ANA-030 The model of each runner is configurable
- pattern: ubiquitous
- statement: Skill Dex shall let the user set the model of each runner in the configuration or in an environment variable.
- rationale: D-123: the model was hardcoded; the README now documents the setting.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a model set in `models` of the configuration for a runner WHEN an analysis runs with it THEN that model is used
- scope: Agent tasks.
- conditions: none
- exceptions: none
- source: D-123
- status: ready
- version: 1
- priority: 2
- ratified_by: D-119 v1
