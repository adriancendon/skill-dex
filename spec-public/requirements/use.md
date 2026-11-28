# USE: Usage and game

Drafted from `Tecnico/scan.mjs`, `Tecnico/web/catalog.js`, `Tecnico/web/detail.js`, `Seguimiento/config.json` and `Seguimiento/README.md`. The placement of the chart waits for the design (OP-001); the game is decided with the new design (D-049, OP-015), except what D-047, D-050 and D-051 already fix. Priority 2 is a placeholder: <private> gave no order.

### REQ-USE-001 Uses are counted from the omp sessions
- pattern: ubiquitous
- statement: Skill Dex shall count one **recorded use** for each `read` of a skill's `skill://` address or of its `SKILL.md` found in the session logs of omp, Claude Code and Codex, counting each tool call once.
- rationale: D-004 asks to measure how often each skill is used; D-117 adds the logs of Claude Code and Codex to those of omp (REQ-USE-024).
- acceptance_criteria:
  - AC1 [judgement] GIVEN an omp session in which an agent read `skill://seo` WHEN Skill Dex is rescanned THEN the use count of `seo` has grown by one for that day
- scope: Installed skills.
- conditions: none
- exceptions: Skills loaded without the `read` tool, and skills that Skill Dex does not list are not counted.
- source: D-004, D-062, D-117
- status: fulfilled
- version: 2
- priority: 2
- ratified_by: D-117 v2
- accepted_by: D-125 v2
- changes:
  - v2 D-117: logs of Claude Code and Codex are counted as well
- note: built on branch multi-agente, merged and pushed 2026-11-28
### REQ-USE-002 Chart of uses per day
- pattern: ubiquitous
- statement: Skill Dex shall show a chart of the total uses per day over the last 30 days.
- rationale: D-004 asks for a usage chart; D-030 keeps the uses-per-day section. `Tecnico/web/catalog.js`, `header`, draws it with a table of the same data under [quote omitted]. The 30 days include days before the season start, which D-047 keeps visible without XP. Its place on screen is REQ-USE-003.
- acceptance_criteria:
  - AC1 [judgement] GIVEN uses recorded on several days WHEN <private> looks at the chart THEN it has one bar per day for 30 days, and pointing at a bar shows the date and the number of uses
- scope: The main page.
- conditions: none
- exceptions: none
- source: D-004, D-030, D-047
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-047 v1
- accepted_by: D-125 v1

### REQ-USE-003 The chart is on the main screen
- pattern: ubiquitous
- statement: Skill Dex shall show the chart of uses per day on its main screen without the user opening another panel.
- rationale: D-030 refers to the section as it was in the previous version, on the main screen. Design D (D-070) shows it as "Daily rhythm" at the top of the library, marking the days before the season as giving no XP. The applied redesign hides it behind "Actividad y salud".
- acceptance_criteria:
  - AC1 [judgement] GIVEN Skill Dex just opened WHEN <private> looks at the first screen THEN the chart of uses per day is visible without pressing anything
- scope: The main page.
- conditions: none
- exceptions: none
- source: D-030, D-070
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-070 v1
- accepted_by: D-125 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-USE-004 Activity of one skill
- pattern: event
- statement: When the user opens the **detail view** of an installed skill, Skill Dex shall show its uses since the **season** start, its historical uses, its last use and a chart of its last 30 days.
- rationale: D-004 at the level of one skill. `Tecnico/web/detail.js`, `activity`, with the full list by date under "Ver registro por fecha".
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill used on known days WHEN <private> opens its **detail view** THEN the three figures and the 30-day chart match those days
- scope: The **detail view** of installed skills.
- conditions: none
- exceptions: none
- source: D-004, D-103
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-103 v1
- accepted_by: D-125 v1
- note: Built before; confirmed by D-103.

### REQ-USE-005 Only season uses give experience
- pattern: ubiquitous
- statement: Skill Dex shall give **XP** only for uses dated on or after the **season** start set in `Seguimiento/config.json`.
- rationale: D-005. `Tecnico/scan.mjs` compute `since` from the field `season_start` (today `2026-11-24`; the old name `inicio` is still read, D-120); `Tecnico/web/catalog.js`, `xp`, uses only `since`. README: changing that date starts a new season.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill with uses before and after the start date WHEN <private> opens its **detail view** THEN the XP earned by use equals 10 times the uses since the start date only
- scope: Collection XP and skill levels.
- conditions: none
- exceptions: none
- source: D-005, D-047
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-047 v1
- accepted_by: D-125 v1

### REQ-USE-006 Historical uses are shown apart
- pattern: ubiquitous
- statement: Skill Dex shall show each skill's historical uses, including those before the **season** start, separately from its season uses.
- rationale: D-047: earlier uses stay visible, apart, without XP. `Tecnico/web/catalog.js` (`hist`, card counter) and `Tecnico/web/detail.js`.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill used only before the start date WHEN <private> looks at its card and **detail view** THEN he sees its historical uses and zero season uses
- scope: Cards and the **detail view** of installed skills.
- conditions: none
- exceptions: none
- source: D-047
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-047 v1
- accepted_by: D-125 v1

### REQ-USE-007 How the collection earns experience
- pattern: ubiquitous
- statement: Skill Dex shall add to the collection 10 **XP** per installed skill, 10 per season use, 25 per **mastered** skill, 15 per installed skill with its own **report** and 5 per recommended watchlist entry.
- rationale: `Tecnico/web/catalog.js`, `xp`; told to <private> (without the 5 for recommended entries). Part of the gamification of D-003 and D-023; the exact numbers are OP-015.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the current collection WHEN <private> opens the **detail view** of a skill and reads [quote omitted] THEN the figures follow these rules
- scope: The collection level.
- conditions: none
- exceptions: none
- source: D-070
- status: superseded
- version: 1
- superseded_by: REQ-USE-021

### REQ-USE-008 Titles of the collection levels
- pattern: ubiquitous
- statement: Skill Dex shall name the collection level with a title that changes every two levels: Newcomer at levels 1 and 2, Explorer at 3 and 4, Builder at 5 and 6, Craftsman at 7 and 8, Strategist at 9 and 10, Expert at 11 and 12, Master at 13 and 14, and Legend from level 15.
- rationale: D-088 (the form's proposal, preselected and accepted). Replaces the Spanish seven titles built in `Tecnico/web/catalog.js` (`TITLES`) and the six shown in design D; the interface is in English (D-063).
- acceptance_criteria:
  - AC1 [judgement] GIVEN the collection at level 3 WHEN <private> looks at the level THEN it reads level 3 with the title Explorer and the XP left to the next level
  - AC2 [judgement] GIVEN the collection at level 20 WHEN he looks at the level THEN the title is Legend
- scope: The collection level.
- conditions: none
- exceptions: none
- source: D-088
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-088 v1
- accepted_by: D-125 v1
- builder_choice: how the title and the level are laid out together
- note: built in 749b7e7, confirmed by D-094.

### REQ-USE-009 Level of one skill
- pattern: ubiquitous
- statement: Skill Dex shall give each installed skill a level equal to the whole square root of its season uses.
- rationale: D-089 keeps the level of each skill. `Tecnico/web/catalog.js`, `sLvl`, and `Tecnico/web/detail.js`, `rewards`: 1 use is level 1, 4 uses level 2, 9 uses level 3 (told to <private>). It gives no collection XP (REQ-USE-021).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill with 9 season uses WHEN <private> opens its **detail view** THEN it shows level 3 and 7 uses to level 4
- scope: The **detail view** of installed skills.
- conditions: none
- exceptions: none
- source: D-089
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-089 v1
- accepted_by: D-125 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-USE-010 Achievements
- pattern: ubiquitous
- statement: Skill Dex shall show eleven achievements, each marked as reached or pending.
- rationale: `Tecnico/web/catalog.js`, `header`, list `A`: first skill, 10 and 25 installed, 10 skills used, 100 uses, a skill at level 5, one mastered, one analysed, 3 investigated, a whole category mastered, everything mastered. <private> did not keep them (D-089).
- acceptance_criteria:
  - AC1 [judgement] GIVEN the current collection WHEN <private> opens [quote omitted] THEN he sees the eleven achievements and which of them he has reached
- scope: The main page.
- conditions: none
- exceptions: none
- source: D-089
- status: descoped
- version: 1
- status_by: D-089

### REQ-USE-011 The most used skills are rewarded
- pattern: ubiquitous
- statement: Skill Dex shall show the three installed skills with the most season uses as [quote omitted].
- rationale: D-023 asks to reward the most used skills. `Tecnico/web/catalog.js`, `header`, builds the podium from season uses; with no season use it shows a message instead. The proposal adds a [quote omitted] tab. How it looks is part of the game decided with the design (OP-015).
- acceptance_criteria:
  - AC1 [judgement] GIVEN season uses for several skills WHEN <private> looks at [quote omitted] THEN the three skills with the most season uses appear in order with their counts, and a click opens their **detail view**
- scope: The main page.
- conditions: none
- exceptions: Skills without season uses do not appear.
- source: D-023, D-062
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-062 v1
- accepted_by: D-125 v1
- note: How it looks may change with the new design and game (OP-001, OP-015).

### REQ-USE-012 Unused skills are suggested for review
- pattern: ubiquitous
- statement: Skill Dex shall mark for review, under "Para revisar", every installed skill with no **recorded use** in its history, with a **finding to review**, or with no use this season.
- rationale: D-023 asks to recommend reviewing unused skills. `Tecnico/web/catalog.js`, `needsReview`; the selector inside the filter also lists security only, never used, and skills unused this season but used before, separately.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill that was never used WHEN <private> chooses "Para revisar" THEN it is listed with the reason [quote omitted]
  - AC2 [judgement] GIVEN a skill used only before the season start WHEN he chooses [quote omitted] in the selector THEN it is listed
- scope: The Instaladas tab.
- conditions: none
- exceptions: none
- source: D-023, D-103
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-103 v1
- accepted_by: D-125 v1
- note: Built before; confirmed by D-103. The filter also offers never used, security only, and unused this season but used before as separate choices.

### REQ-USE-013 Rarity by how uncommon the skill is on GitHub
- pattern: ubiquitous
- statement: Skill Dex shall give each installed skill one of four rarities from the number of public GitHub repositories that contain it: 1 is Legendary, 2 to 9 Epic, 10 to 49 Rare, 50 or more Common, and Common when the number is unknown.
- rationale: D-121 replaces the size-based rarity of D-089, which let a bloated skill be Legendary. It is decoration and says nothing about quality.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill found in one public repository WHEN <private> opens its **detail view** THEN its rarity is Legendary
  - AC2 [judgement] GIVEN a skill whose count could not be found WHEN he opens its **detail view** THEN its rarity is Common
- scope: The **detail view** of installed skills.
- conditions: none
- exceptions: none
- source: D-089, D-121
- status: fulfilled
- version: 2
- priority: 2
- ratified_by: D-121 v2
- accepted_by: D-125 v2
- changes:
  - v2 D-121: rarity is how uncommon the skill is on GitHub, not its size
- builder_choice: how the count is searched on GitHub, and how it is cached
- note: built on branch multi-agente, merged and pushed 2026-11-28

### REQ-USE-014 Reviewing never uninstalls
- pattern: ubiquitous
- statement: Skill Dex shall leave every installed skill folder unchanged.
- rationale: D-023 leaves the decision on unused skills to <private> ("si aun tiene sentido"); D-009 asks for health ideas "sin borrar nada". No code in `Tecnico/` writes to the skill folders; `Tecnico/web/catalog.js` says "Revisar no significa eliminar".
- acceptance_criteria:
  - AC1 [judgement] GIVEN any use of the app, including review filters, refresh and security scans WHEN the skill folders are compared before and after THEN they are unchanged
- scope: The whole app.
- conditions: none
- exceptions: none
- source: D-023, D-009, D-062
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-062 v1
- accepted_by: D-125 v1

### REQ-USE-015 Catalogue health panel
- pattern: ubiquitous
- statement: Skill Dex shall show, in its own Health section, a **catalogue health** panel with the tokens of all descriptions, the heaviest skills, pairs of similar skills, unused skills and load warnings.
- rationale: D-009 (option 2: duplicates, unused, weight in context). Computed in `Tecnico/scan.mjs`, shown today by `Tecnico/web/catalog.js`, `healthPanel`. Design D does not show it, so D-083 moves it to a section of its own in the sidebar.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the current collection WHEN <private> opens the Health section THEN he sees the five groups with their counts and can unfold each list
- scope: The Health section.
- conditions: none
- exceptions: none
- source: D-009, D-062, D-083
- status: fulfilled
- version: 2
- priority: 2
- ratified_by: D-083 v2
- accepted_by: D-125 v2
- changes:
  - v2 D-083: the panel moves from the main page to a Health section of the sidebar
- note: built in 749b7e7, confirmed by D-094.

### REQ-USE-016 Similar skills
- pattern: ubiquitous
- statement: Skill Dex shall list as similar every pair of installed skills whose significant description words overlap by at least 20 percent, counted as shared words over all words of the two, up to 12 pairs.
- rationale: D-009 asks for duplicates in the health panel; D-046 confirms showing them. `Tecnico/scan.mjs` (word overlap of at least 0.2, words longer than three letters minus a stop list). The panel says similar descriptions do not mean duplicate functions. The recommendation per pair is REQ-USE-017.
- acceptance_criteria:
  - AC1 [judgement] GIVEN `<skill>` and `copywriting` installed WHEN <private> unfolds "Comparar pares" THEN the pair is listed with its share in percent
- scope: The health panel.
- conditions: none
- exceptions: none
- source: D-009, D-046
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-046 v1
- accepted_by: D-125 v1

### REQ-USE-017 Advice for each pair of similar skills
- pattern: ubiquitous
- statement: Skill Dex shall give, for each pair of similar skills, a recommendation to keep one of them, to adapt them so they no longer overlap, or to keep both separate, with the reason.
- rationale: D-046. Not built: the health panel only lists the pairs (`Tecnico/web/catalog.js`, `healthPanel`). The recommendation never uninstalls or changes a skill by itself (REQ-USE-014); <private> decides.
- acceptance_criteria:
  - AC1 [judgement] GIVEN `<skill>` and `copywriting` listed as similar WHEN <private> opens the pair THEN he reads which one to keep, how to adapt them, or why to keep both, with a short reason he can follow
  - AC2 [judgement] GIVEN any recommendation WHEN the skill folders are compared before and after THEN nothing was changed by it
- scope: The pairs of REQ-USE-016.
- conditions: none
- exceptions: none
- source: D-046
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-046 v1
- accepted_by: D-125 v1
- builder_choice: how the recommendation is worked out (rules on usage and descriptions, or an agent's reading), as long as each pair gets one of the three outcomes with a reason
- note: built in 749b7e7, confirmed by D-094.

### REQ-USE-018 Each level costs more than the one before
- pattern: ubiquitous
- statement: Skill Dex shall require more **XP** to reach each collection level than it required to reach the level before it.
- rationale: D-050. Today every level costs the same 300 XP (`Tecnico/web/catalog.js`, `header`).
- acceptance_criteria:
  - AC1 [judgement] GIVEN the level shown with the XP left to the next one WHEN <private> compares two consecutive levels THEN the second needed more XP than the first
- scope: The collection level.
- conditions: none
- exceptions: none
- source: D-050
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-050 v1
- accepted_by: D-125 v1
- builder_choice: the formula of the increase, shown to <private> with the new design before it is applied (D-025)
- note: built in 749b7e7, confirmed by D-094.

### REQ-USE-019 A congratulation message at each new level
- pattern: event
- statement: When the collection reaches a new level, Skill Dex shall show the user a message that congratulates him on that level.
- rationale: D-051. Not built. The kind of message and its texts are proposed in OP-024 and wait for <private>'s choice.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the collection one use away from a new level WHEN that use is counted and Skill Dex refreshes THEN a congratulation message names the new level, and it does not appear again for the same level
- scope: The main page.
- conditions: none
- exceptions: none
- source: D-051
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-051 v1
- accepted_by: D-125 v1
- note: Its form is REQ-USE-020 (D-057); its texts are in English (REQ-UI-005). Built in 749b7e7, confirmed by D-094.

### REQ-USE-020 The level-up message is a centred card shown once
- pattern: ubiquitous
- statement: Skill Dex shall show the level-up message once per level, as a card in the centre of the screen with the new level and title, what made the collection rise, a next goal and a button to close it.
- rationale: D-057 (option A of the final form), with the titles of D-088 (REQ-USE-008). The texts are written in English (D-063, REQ-UI-005). The proposal in OP-024 also said no sound and no user name, because the app will be public (D-055); the form showed only option A and an example without a name.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a new level reached WHEN Skill Dex refreshes THEN a centred card shows the new level and its title from REQ-USE-008, what made it rise and a next goal, in English, and closes with its button
  - AC2 [judgement] GIVEN the card closed WHEN Skill Dex refreshes again at the same level THEN the card does not appear again
- scope: The main page.
- conditions: none
- exceptions: none
- source: D-057, D-063, D-088
- status: fulfilled
- version: 2
- priority: 2
- ratified_by: D-088 v2
- accepted_by: D-125 v2
- changes:
  - v2 D-088: the title shown on the card is one of the eight titles of REQ-USE-008
- builder_choice: the exact English texts and the button label, following the tone of the form's example
- note: built in 749b7e7, confirmed by D-094.

### REQ-USE-021 Only season uses earn experience, 10 XP each
- pattern: ubiquitous
- statement: Skill Dex shall give the collection 10 **XP** for each season use of an installed skill and no XP for anything else.
- rationale: Design D (D-070) counts XP this way ("Only season uses earn XP"); <private> approved D as shown (D-075), which confirms it. Replaces the draft REQ-USE-007, never ratified, which also gave XP for installing, mastering and analysing skills and for recommended watchlist entries. D-047 already excluded earlier uses.
- acceptance_criteria:
  - AC1 [judgement] GIVEN 12 season uses in total WHEN <private> looks at his XP THEN it reads 120, whatever skills he installed, mastered or analysed
- scope: The collection level.
- conditions: none
- exceptions: none
- source: D-047, D-070
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-070 v1
- accepted_by: D-125 v1
- supersedes: REQ-USE-007
- note: built in 749b7e7, confirmed by D-094.

### REQ-USE-022 The cost of each level
- pattern: ubiquitous
- statement: Skill Dex shall require 100 + 50 × (L − 1) **XP** to go from level L to level L + 1, that is 100, 150, 200, 250 and so on.
- rationale: D-050 asks that each level cost more; design D (D-070) shows this cost, and <private> approved D as shown (D-075), which confirms it. It fills the formula left as a builder choice in REQ-USE-018.
- acceptance_criteria:
  - AC1 [judgement] GIVEN 260 season XP WHEN <private> looks at his level THEN he is at level 3 with 190 XP to go (100 for level 2, 150 for level 3, 200 for level 4)
- scope: The collection level.
- conditions: none
- exceptions: none
- source: D-050, D-070
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-070 v1
- accepted_by: D-125 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-USE-023 The mastered mark is shown in the Health section
- pattern: ubiquitous
- statement: Skill Dex shall show in the Health section which installed skills the user has marked as **mastered**.
- rationale: D-083 put the mastered mark in the Health section; D-090 removes the mark, so nothing is shown.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill marked as mastered in its **detail view** WHEN <private> opens the Health section THEN he sees that skill listed as mastered
- scope: The Health section.
- conditions: none
- exceptions: none
- source: D-083
- status: descoped
- version: 1
- status_by: D-090

### REQ-USE-024 Uses are also counted from Claude Code and Codex logs
- pattern: ubiquitous
- statement: Skill Dex shall count a use from the Claude Code and Codex session logs when an agent there reads a skill.
- rationale: D-117: usage from the logs of every agent supported, with each tool call counted once.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a Claude Code session that read a skill WHEN Skill Dex is rescanned THEN that skill's use count has grown for that day
- scope: Installed skills.
- conditions: none
- exceptions: none
- source: D-117
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-117 v1
- accepted_by: D-125 v1
- note: built on branch multi-agente, merged and pushed 2026-11-28
