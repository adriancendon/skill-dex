# CAT: Catálogo (the list of skills)

Drafted from `Tecnico/scan.mjs`, `Tecnico/web/index.html`, `Tecnico/web/catalog.js`, `Tecnico/web/detail.js` and `Seguimiento/README.md`. The web files are the redesign applied without <private>'s approval; it stays until design D (D-070, mockups in `Seguimiento/versiones/propuestas-diseno/d/`) is built. D-048 ratified the catalogue's behaviour; D-070 to D-073 ratified the design-dependent parts. Priority 2 is a placeholder: <private> gave no order.

### REQ-CAT-001 Installed skills are listed
- pattern: ubiquitous
- statement: Skill Dex shall list as installed every folder that holds a `SKILL.md` in the skill folders it reads (REQ-CAT-024).
- rationale: D-001 and D-003 ask for a list of all installed skills; D-117 widens the folders from the two of omp to those of any agent. Project skills are REQ-CAT-015.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill folder with a `SKILL.md` in any folder it reads WHEN <private> opens Skill Dex after a rescan THEN the skill appears under Instaladas with the name and description from its `SKILL.md`
  - AC2 [judgement] GIVEN a folder without `SKILL.md` in any folder it reads WHEN Skill Dex is rescanned THEN it does not appear
- scope: The Instaladas tab.
- conditions: none
- exceptions: Project skills are REQ-CAT-015.
- source: D-001, D-003, D-048, D-117
- status: ready
- version: 2
- priority: 2
- ratified_by: D-117 v2
- changes:
  - v2 D-117: the folders are no longer only the two of omp
### REQ-CAT-002 The list follows what is installed now
- pattern: event
- statement: When the skills are rescanned, Skill Dex shall list the skills that are installed at that moment.
- rationale: D-003 asks for a dynamic list of the installed skills rather than a fixed snapshot. `Tecnico/scan.mjs` rebuilds `web/data.js` from the skill folders on every run.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill installed after the last scan WHEN <private> rescans ("Refrescar datos" or opening `Skill Dex.app`) THEN the new skill appears
  - AC2 [judgement] GIVEN a skill removed after the last scan WHEN <private> rescans THEN it is gone from Instaladas
- scope: The Instaladas tab.
- conditions: none
- exceptions: Between two scans the list shows the state of the last scan.
- source: D-003, D-048
- status: active
- version: 1
- priority: 2
- ratified_by: D-048 v1

### REQ-CAT-003 Each skill has a category
- pattern: ubiquitous
- statement: Skill Dex shall give each installed skill the category set for it in `Seguimiento/skills-meta.json`, or else the category its name suggests.
- rationale: `Tecnico/scan.mjs` guess one of SEO, Marketing y Ads, Rendimiento y calidad, Diseño y UI, Agencia web, Personal y sistema or Otras from the name; lets `skills-meta.json` override it. Supports the ordered list of D-001. The emoji setting in the same file is replaced by the skill's own icon (D-039, REQ-CAT-011).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill named `<skill>` and no entry in `skills-meta.json` WHEN <private> opens its card THEN its category is SEO
  - AC2 [judgement] GIVEN an entry in `skills-meta.json` that sets another category for a skill WHEN Skill Dex is rescanned THEN that category is shown
- scope: Cards, the category filter and the category grouping.
- conditions: none
- exceptions: none
- source: D-048, D-039
- status: active
- version: 1
- priority: 2
- ratified_by: D-048 v1

### REQ-CAT-004 Search
- pattern: event
- statement: When the user types in the search field, Skill Dex shall show only the entries whose name, description, category, note or discard reason contains the typed text.
- rationale: D-022 asks for simple filters. `Tecnico/web/catalog.js`, function `render`, matches these five fields, ignoring case.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the Instaladas tab WHEN <private> types "seo" THEN only skills with "seo" in one of those fields remain and the result line counts them
  - AC2 [judgement] GIVEN the Descartadas tab WHEN he types a word from a discard reason THEN the entry with that reason is shown
- scope: All three tabs.
- conditions: none
- exceptions: none
- source: D-022, D-048
- status: active
- version: 1
- priority: 2
- ratified_by: D-048 v1

### REQ-CAT-005 Filters
- pattern: ubiquitous
- statement: Skill Dex shall offer filters for the installed skills by category, by origin, by **favorita**, by **dominada** and by "Para revisar".
- rationale: D-022 asks for simple filters. The set is the one in `Tecnico/web/index.html` (pills Todas, Favoritas, Dominadas, Para revisar; selects for category and origin, "Limpiar filtros"), confirmed by D-048.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the Instaladas tab WHEN <private> picks each filter in turn THEN the list shows only the matching skills and "Limpiar filtros" restores all of them
- scope: The Instaladas tab; the category filter also applies to the watchlist tabs.
- conditions: none
- exceptions: none
- source: D-022, D-048
- status: active
- version: 1
- priority: 2
- ratified_by: D-048 v1
- builder_choice: how the filters are laid out

### REQ-CAT-006 Sort orders
- pattern: ubiquitous
- statement: Skill Dex shall let the user order the installed skills by category, by most uses, by most recent use or by name.
- rationale: The orders of the select `srt` in `Tecnico/web/index.html` and of `render` in `Tecnico/web/catalog.js` ("Vista general" keeps the scan order). Supports the ordered list of D-001.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the Instaladas tab WHEN <private> chooses [quote omitted] THEN the skill with the most season uses comes first
  - AC2 [judgement] GIVEN the same tab WHEN he chooses [quote omitted] THEN the skills are grouped under one heading per category with the share used this season
- scope: The Instaladas tab; on the watchlist tabs only "Nombre" applies.
- conditions: none
- exceptions: none
- source: D-048
- status: superseded
- version: 1
- priority: 2
- ratified_by: D-048 v1
- superseded_by: REQ-CAT-018

### REQ-CAT-007 Installed, watchlist and discarded are three views of one catalogue
- pattern: ubiquitous
- statement: Skill Dex shall show the installed skills, the **watchlist** and the **descartada** entries as three tabs of the same catalogue, each with its count.
- rationale: D-002 asks that analysed skills join the same list; D-008 keeps them in a watchlist apart from the installed ones; D-010 keeps discarded ones. The tabs are in `Tecnico/web/index.html` (`collection-nav`).
- acceptance_criteria:
  - AC1 [judgement] GIVEN installed skills, watchlist entries and discarded entries WHEN <private> opens Skill Dex THEN he can switch between the three tabs on one page and each tab shows its number of entries
- scope: The catalogue.
- conditions: none
- exceptions: none
- source: D-002, D-008, D-010, D-048, D-060
- status: superseded
- version: 1
- priority: 2
- ratified_by: D-048 v1
- builder_choice: tab labels and order
- superseded_by: REQ-UI-006

### REQ-CAT-008 A click on a card opens its detail
- pattern: event
- statement: When the user clicks a skill card, Skill Dex shall open the **ficha** of that skill in a dialog over the catalogue.
- rationale: D-018. Built in `Tecnico/web/catalog.js` (click handler on `.card`) and `Tecnico/web/detail.js` (`detail`).
- acceptance_criteria:
  - AC1 [judgement] GIVEN any card in any tab WHEN <private> clicks it THEN a dialog with that skill's **ficha** opens on top of the catalogue
- scope: Cards of all three tabs and the [quote omitted] entries.
- conditions: none
- exceptions: A click on a button or link inside the card does what that button or link does.
- source: D-018, D-048
- status: active
- version: 1
- priority: 2
- ratified_by: D-048 v1
- builder_choice: full-screen or pop-up dialog (D-018 allows either)

### REQ-CAT-009 The detail shows the full analysis
- pattern: event
- statement: When the user opens the **ficha** of a skill that has an **informe**, Skill Dex shall show the complete **informe** inside the app.
- rationale: D-018 asks to see the detailed analysis in the app. `Tecnico/web/detail.js`, `fullReport`, renders the Markdown of `Seguimiento/analisis/<id>.md`, folded under [quote omitted].
- acceptance_criteria:
  - AC1 [judgement] GIVEN a watchlist entry with a report in `Seguimiento/analisis/` WHEN <private> opens its **ficha** THEN he can read the whole report there, without opening another program
  - AC2 [judgement] GIVEN a skill without a report WHEN he opens its **ficha** THEN it says that there is no report yet
- scope: The **ficha** of installed and watchlist skills.
- conditions: none
- exceptions: none
- source: D-018, D-048
- status: active
- version: 1
- priority: 2
- ratified_by: D-048 v1

### REQ-CAT-010 Closing the detail
- pattern: event
- statement: When the user presses Escape, clicks outside the dialog or presses its close button, Skill Dex shall close the **ficha** and return to the catalogue.
- rationale: `Tecnico/web/catalog.js`, `closeModal` and its key and click handlers; README [quote omitted].
- acceptance_criteria:
  - AC1 [judgement] GIVEN an open **ficha** WHEN <private> presses Escape THEN it closes and the catalogue is where he left it
- scope: The **ficha** dialog.
- conditions: none
- exceptions: none
- source: D-048
- status: active
- version: 1
- priority: 2
- ratified_by: D-048 v1

### REQ-CAT-011 Each skill shows its own icon
- pattern: ubiquitous
- statement: Skill Dex shall show for each skill an icon that represents that skill, drawn from its description, on a badge coloured by its category.
- rationale: D-029 and D-069 (the icons of proposal A, kept in design D, D-070); the own icon replaces the emoji setting (D-039). In `Seguimiento/versiones/propuestas-diseno/d/index.html` the icon comes from a per-skill list, else from words of the description, else from the category. Not built in the applied redesign, which shows a two-letter category code (`Tecnico/web/catalog.js`, `catCode`).
- acceptance_criteria:
  - AC1 [judgement] GIVEN the installed skills WHEN <private> looks at the list or the cards THEN each skill has an icon on a badge of its category's colour, and for a sample of skills he can tell why the icon fits the description
  - AC2 [judgement] GIVEN a skill installed after the icons were made WHEN Skill Dex is rescanned THEN that skill also has an icon
- scope: The list, the cards, the **ficha**, the watchlist and "Descubre skills".
- conditions: none
- exceptions: none
- source: D-029, D-039, D-069, D-070
- status: active
- version: 1
- priority: 2
- ratified_by: D-070 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-CAT-012 What each skill shows without opening it
- pattern: ubiquitous
- statement: Skill Dex shall show for each skill in the list, without opening it, its icon, its name, its category, a short description, how much it is used, its last use and whether it needs attention.
- rationale: D-028 (more information at a glance), D-038 (without filling the screen) and design D (D-070): each row of `Seguimiento/versiones/propuestas-diseno/d/index.html` shows the rank in the top 10, the icon, the name, a category tag, a notice ("N to check" for security findings, "Untried" for never used), the description, a 30-day mini chart, the uses, the last use and a favourite star. The description is the short one of REQ-CAT-019. The applied redesign shows only the name and one line.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the list WHEN <private> looks at a skill without clicking it THEN he can tell what it is for, how much he uses it, when he last used it and whether it has security findings or was never used
- scope: The list and the cards view (REQ-CAT-020).
- conditions: none
- exceptions: none
- source: D-028, D-038, D-070
- status: active
- version: 1
- priority: 2
- ratified_by: D-070 v1
- builder_choice: the exact layout of a row and of a card, following the approved mockup
- note: built in 749b7e7, confirmed by D-094.

### REQ-CAT-013 The catalogue scrolls instead of shrinking
- pattern: ubiquitous
- statement: Skill Dex shall let the catalogue run beyond one screen, with every skill reachable by scrolling, rather than shrink cards to fit the screen.
- rationale: D-027: more than 100 skills may come and they need not fit. The applied redesign aimed at all 31 skills in one screen.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a catalogue with more skills than fit in the window WHEN <private> scrolls THEN he reaches every skill and the cards keep their size and content
- scope: The catalogue.
- conditions: none
- exceptions: none
- source: D-027, D-070
- status: active
- version: 1
- priority: 2
- ratified_by: D-070 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-CAT-014 Favourite mark
- pattern: event
- statement: When the user presses "Guardar favorita" in a **ficha**, Skill Dex shall switch the favourite mark on or off for the skill.
- rationale: `Tecnico/web/detail.js` and `Tecnico/web/catalog.js`, `tg`. The "Marcar dominada" button goes with the mastered mark (D-090). Where the marks are stored is REQ-DAT-001. The button label becomes English with the interface (D-063).
- acceptance_criteria:
  - AC1 [judgement] GIVEN an installed skill WHEN <private> presses "Guardar favorita" in its **ficha** THEN it appears under the Favoritas filter, and pressing again removes it
- scope: The **ficha** of installed skills.
- conditions: none
- exceptions: none
- source: D-048, D-090
- status: active
- version: 2
- priority: 2
- ratified_by: D-090 v2
- changes:
  - v2 D-090: the mastered mark and its button are removed
- note: built in 749b7e7, confirmed by D-094.

### REQ-CAT-015 Each project's skills are listed with their project
- pattern: ubiquitous
- statement: Skill Dex shall also list the skills that live in the skill folders of each of the user's projects, each labelled with the name of its project.
- rationale: D-048; D-117 widens the project folders to `.omp`, `.claude`, `.agents` and `.codex` skills (REQ-CAT-025) instead of only `.omp/skills` under `~/Developer`.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the keelblocks skills in `~/Developer/Skills/.omp/skills/` WHEN <private> opens Skill Dex after a rescan THEN they appear in the catalogue, each labelled with the project "Skills"
  - AC2 [judgement] GIVEN a skill with the same name in two projects WHEN he looks at the catalogue THEN both appear and he can tell them apart by their project label
- scope: The catalogue, its search and its filters.
- conditions: none
- exceptions: none
- source: D-048, D-117
- status: ready
- version: 2
- priority: 2
- ratified_by: D-117 v2
- changes:
  - v2 D-117: project skill folders of every agent, not only `.omp/skills`
- builder_choice: how projects are found; whether the project label is also a filter
### REQ-CAT-016 One global list ranked by use
- pattern: ubiquitous
- statement: Skill Dex shall show all installed skills in one list ordered by default by their all-time uses, with the top 10 places numbered.
- rationale: D-068 (see the most used skills globally, not per section) and design D (D-070), which sorts by all-time uses by default; the agent explained the choice: the season began on 2026-11-24 and few skills have season uses yet.
- acceptance_criteria:
  - AC1 [judgement] GIVEN skills of several categories WHEN <private> opens the library THEN the skill with the most uses overall is first whatever its category, and the first ten show their place number
- scope: The library of installed skills.
- conditions: none
- exceptions: Skills without uses carry no place number.
- source: D-068, D-070
- status: active
- version: 1
- priority: 2
- ratified_by: D-070 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-CAT-017 Grouping by category is optional and keeps the order
- pattern: event
- statement: When the user switches on "Group by category", Skill Dex shall group the list by category while keeping inside each group the order chosen for the whole list.
- rationale: D-068 and design D (D-070). Grouping is off by default, so the global ranking of REQ-CAT-016 is what <private> sees first.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the list sorted by all-time uses WHEN <private> switches on "Group by category" THEN each category shows its skills in that order, and switching it off brings back the single global list
- scope: The library of installed skills.
- conditions: none
- exceptions: none
- source: D-068, D-070
- status: active
- version: 1
- priority: 2
- ratified_by: D-070 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-CAT-018 Sort orders
- pattern: ubiquitous
- statement: Skill Dex shall let the user order the list by uses this season, by all-time uses, by most recent use or by name.
- rationale: Design D (D-070): "Most used (season)", "Most used (all time)", "Recently used", "Name". Replaces REQ-CAT-006, whose "by category" order becomes the switch of REQ-CAT-017.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the list WHEN <private> chooses each order in turn THEN the list follows it, and the first places stay numbered for the two use-based orders
- scope: The library of installed skills; on the watchlist only the name order applies.
- conditions: none
- exceptions: none
- source: D-070
- status: active
- version: 1
- priority: 2
- ratified_by: D-070 v1
- supersedes: REQ-CAT-006
- note: built in 749b7e7, confirmed by D-094.

### REQ-CAT-019 Short descriptions in the list
- pattern: ubiquitous
- statement: Skill Dex shall show in the list and in the cards a short description of each skill in natural, direct language, and its full original description only in the **ficha**.
- rationale: D-071. Where the short texts come from and their language: D-076, REQ-CAT-022.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the list WHEN <private> reads the descriptions THEN each fits in one short line, says plainly what the skill is for, and none is the long original text
  - AC2 [judgement] GIVEN a skill's **ficha** WHEN he opens it THEN its full original description is there
- scope: The list, the cards and the **ficha**.
- conditions: none
- exceptions: none
- source: D-071
- status: active
- version: 1
- priority: 2
- ratified_by: D-071 v1
- note: The short texts are written in English and kept in an editable file (REQ-CAT-022). Built in 749b7e7, confirmed by D-094.

### REQ-CAT-020 List view or cards view
- pattern: event
- statement: When the user chooses the list view or the cards view, Skill Dex shall show the skills in the chosen view.
- rationale: D-073. Both views keep the same order, filters and grouping, and show what REQ-CAT-012 asks.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the library in list view WHEN <private> chooses the cards view THEN the same skills appear as cards, in the same order and with the same filters, and he can switch back
- scope: The library of installed skills.
- conditions: none
- exceptions: none
- source: D-073
- status: active
- version: 1
- priority: 2
- ratified_by: D-073 v1
- builder_choice: the look of the cards, shown to <private> in the updated mockup (D-025)
- note: built in 749b7e7, confirmed by D-094.

### REQ-CAT-021 The chosen view is remembered
- pattern: ubiquitous
- statement: Skill Dex shall open the library in the view last chosen in that browser.
- rationale: Derived from D-073 by D-074, like the theme memory of REQ-UI-002; confirmed by <private> when he approved D as shown (D-075).
- acceptance_criteria:
  - AC1 [judgement] GIVEN the cards view chosen WHEN <private> closes and reopens Skill Dex in the same browser THEN it opens in the cards view
- scope: The library of installed skills.
- conditions: none
- exceptions: none
- source: D-074
- status: active
- version: 1
- priority: 2
- ratified_by: D-075 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-CAT-022 Short descriptions are kept in an editable file
- pattern: ubiquitous
- statement: Skill Dex shall keep the short description of each skill, written in English by an agent once for that skill, in a file the user can edit.
- rationale: D-076 (OP-037): written once, so that scans cost nothing and the text does not change by itself; in a file, so that <private> can correct it. English follows D-063.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the collection WHEN <private> opens the file of short descriptions THEN each skill has one description there, in English, and he can edit any of them
  - AC2 [judgement] GIVEN he edited a description and Skill Dex scanned again WHEN he looks at the list THEN his edited text is shown
- scope: The short descriptions of REQ-CAT-019.
- conditions: none
- exceptions: none
- source: D-076
- status: active
- version: 1
- priority: 2
- ratified_by: D-076 v1
- builder_choice: the name and format of the file, and where it is kept so that it stays out of the repository (REQ-DAT-008)
- note: The agent that writes them runs with the CLI chosen by REQ-ANA-028; omp keeps its explicit model (D-117). Built in 749b7e7, confirmed by D-094.

### REQ-CAT-023 A new skill gets its short description when it appears
- pattern: event
- statement: When a skill appears in the collection without a short description, Skill Dex shall have an agent write one for it and add it to the file of short descriptions.
- rationale: D-076 (OP-037, option a): the new skills receive their own description when they appear.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a newly installed skill WHEN <private> looks at the list after the next scan THEN it has a short description in English, and the descriptions of the other skills are unchanged
- scope: The short descriptions of REQ-CAT-019.
- conditions: none
- exceptions: none
- source: D-076
- status: active
- version: 1
- priority: 2
- ratified_by: D-076 v1
- builder_choice: whether the description is written at the scan or when the skill is first shown
- note: built in 749b7e7, confirmed by D-094.

### REQ-CAT-024 Skills are read from the folders of any agent
- pattern: ubiquitous
- statement: Skill Dex shall read the skill folders of omp, Claude Code and Codex, the shared `~/.agents/skills` folder and any custom folder the user adds.
- rationale: D-117 (option 1): Skill Dex is for anyone who uses `SKILL.md` skills, with or without omp (D-116).
- acceptance_criteria:
  - AC1 [judgement] GIVEN skills in `~/.claude/skills` and `~/.codex/skills` WHEN the user opens Skill Dex after a rescan THEN both appear in the catalogue
  - AC2 [judgement] GIVEN a custom folder added in the settings WHEN Skill Dex is rescanned THEN its skills appear
- scope: The catalogue.
- conditions: none
- exceptions: none
- source: D-117
- status: ready
- version: 1
- priority: 2
- ratified_by: D-117 v1

### REQ-CAT-025 Project skill folders of every agent are read
- pattern: ubiquitous
- statement: Skill Dex shall read the `.omp`, `.claude`, `.agents` and `.codex` skill folders of each of the user's projects.
- rationale: D-117; replaces the choice in D-099 that only `.omp/skills` under `~/Developer` count.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a project with `.claude/skills` and one with `.codex/skills` WHEN Skill Dex is rescanned THEN their skills appear, each labelled with its project
- scope: The catalogue.
- conditions: none
- exceptions: none
- source: D-117
- status: ready
- version: 1
- priority: 2
- ratified_by: D-117 v1

### REQ-CAT-026 A skill found in several places is listed once
- pattern: ubiquitous
- statement: Skill Dex shall list a skill that is reached through several folders or links once, naming every agent that can use it.
- rationale: D-117: the shared `~/.agents/skills` folder and links make the same skill appear in more than one place.
- acceptance_criteria:
  - AC1 [judgement] GIVEN one skill folder linked from two agent folders WHEN Skill Dex is rescanned THEN it appears once and shows both agents
- scope: The catalogue.
- conditions: none
- exceptions: none
- source: D-117
- status: ready
- version: 1
- priority: 2
- ratified_by: D-117 v1

### REQ-CAT-027 Each skill shows the agent it belongs to
- pattern: ubiquitous
- statement: Skill Dex shall show on each skill a badge for each agent that can use it.
- rationale: D-117 (agent badges).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill in the Claude Code folder WHEN the user looks at the list and the cards THEN it carries a Claude Code badge
- scope: The list, the cards and the ficha.
- conditions: none
- exceptions: none
- source: D-117
- status: ready
- version: 1
- priority: 2
- ratified_by: D-117 v1

### REQ-CAT-028 The catalogue can be filtered by agent
- pattern: event
- statement: When the user chooses an agent in the agent filter, Skill Dex shall show only the skills of that agent.
- rationale: D-117 (agent filter).
- acceptance_criteria:
  - AC1 [judgement] GIVEN skills of two agents WHEN the user chooses one agent in the filter THEN only its skills are listed
- scope: The library.
- conditions: none
- exceptions: none
- source: D-117
- status: ready
- version: 1
- priority: 2
- ratified_by: D-117 v1

### REQ-CAT-029 An empty catalogue says where it looked
- pattern: state
- statement: While no skill folder with a `SKILL.md` is found, Skill Dex shall tell the user which folders it looked in and how to add a custom folder.
- rationale: D-117 and D-116: a person without omp must not meet a blank screen.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a Mac with no skill folders WHEN the user opens Skill Dex THEN a message names the folders searched and explains how to add one
- scope: The library.
- conditions: none
- exceptions: none
- source: D-117
- status: ready
- version: 1
- priority: 2
- ratified_by: D-117 v1
