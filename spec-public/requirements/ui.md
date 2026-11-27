# UI: Interfaz y tema

Drafted from `Tecnico/web/index.html`, `Tecnico/web/catalog.js`, `Tecnico/web/catalog.css` and the two versions kept in `Seguimiento/versiones/antes/` and `Seguimiento/versiones/propuesta-intermedia/` (read, not changed). The layout waits for OP-001. <private> confirmed the theme rules and asked for an English interface (D-062, D-063). Priority 2 is a placeholder: he gave no order.

### REQ-UI-001 Day and night mode
- pattern: event
- statement: When the user presses the theme button, Skill Dex shall switch between day mode and night mode.
- rationale: D-020, confirmed by D-062. `Tecnico/web/catalog.js`, `$('theme').onclick`; colours in `Tecnico/web/catalog.css` (`:root` and `:root[data-theme=dark]`).
- acceptance_criteria:
  - AC1 [judgement] GIVEN Skill Dex in day mode WHEN <private> presses the night-mode button THEN every part of the page, the **ficha** included, turns dark and stays readable, and the button now offers day mode
- scope: The whole page.
- conditions: none
- exceptions: none
- source: D-020, D-062
- status: active
- version: 1
- priority: 2
- ratified_by: D-062 v1

### REQ-UI-002 The chosen theme is remembered
- pattern: ubiquitous
- statement: Skill Dex shall open in the theme last chosen in that browser, or in the system's theme when none was chosen.
- rationale: D-062 ([quote omitted]). The inline script in `Tecnico/web/index.html` reads `skilldex.theme` from local storage, else `prefers-color-scheme`.
- acceptance_criteria:
  - AC1 [judgement] GIVEN night mode chosen WHEN <private> closes and reopens Skill Dex in the same browser THEN it opens in night mode
- scope: The whole page.
- conditions: none
- exceptions: none
- source: D-062
- status: active
- version: 1
- priority: 2
- ratified_by: D-062 v1

### REQ-UI-003 A minimal main screen
- pattern: ubiquitous
- statement: Skill Dex shall show on its main screen only what <private> needs to understand his collection and decide about a skill, leaving the rest to the **ficha**.
- rationale: D-021 (easier to understand, better structured, minimalist), D-024 (a command center to take decisions) and D-038 (very visual, easy to understand, without filling the screen with information); design D (D-070) is how it is laid out.
- acceptance_criteria:
  - AC1 [judgement] GIVEN Skill Dex just opened WHEN <private> looks at it for the first time in a while THEN he can say which skills he uses most, which ones to review and where to analyse a new one, without reading help text
- scope: The main page.
- conditions: none
- exceptions: none
- source: D-021, D-024, D-038, D-070
- status: active
- version: 1
- priority: 2
- ratified_by: D-070 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-UI-004 The interface is in Spanish
- pattern: ubiquitous
- statement: Skill Dex shall show all its interface text in Spanish.
- rationale: Described the interface as built (`<html lang="es">`). Never ratified; <private> rejected it in D-062 and asked for English (D-063).
- acceptance_criteria:
  - AC1 [judgement] GIVEN any screen of Skill Dex WHEN <private> reads it THEN labels, buttons and messages are in Spanish
- scope: The whole page.
- conditions: none
- exceptions: Skill names, descriptions and analysis sources keep their original language.
- source: D-063
- status: superseded
- version: 1
- superseded_by: REQ-UI-005

### REQ-UI-005 The interface is in English
- pattern: ubiquitous
- statement: Skill Dex shall show all its interface text in English.
- rationale: D-063 ([quote omitted]). Not built: every label in `Tecnico/web/` is Spanish (`<html lang="es">`). The level-up texts (REQ-USE-020) are written in English too. The analysis reports are in English as well (D-084, REQ-ANA-026).
- acceptance_criteria:
  - AC1 [judgement] GIVEN any screen of Skill Dex, dialogs and messages included WHEN <private> reads it THEN every label, button and message is in English
- scope: The whole app interface.
- conditions: none
- exceptions: Skill names and the original descriptions of skills keep their own language.
- source: D-063, D-084
- status: active
- version: 2
- priority: 2
- ratified_by: D-084 v2
- supersedes: REQ-UI-004
- changes:
  - v2 D-084: the analysis reports are no longer an exception; they are in English
- note: built in 749b7e7, confirmed by D-094.

### REQ-UI-006 A left sidebar with the app name, sections, level and theme switch
- pattern: ubiquitous
- statement: Skill Dex shall show a left sidebar with the app name, its sections with their counts, the user's level and the day/night switch.
- rationale: D-067 (proposal B's sidebar) and design D (D-070). The sections include the library of installed skills, the **watchlist**, the **descartada** entries, Discover (D-052), Updates (D-072, REQ-UPD-001) and Health (D-083). Replaces REQ-CAT-007, which put the first three in tabs.
- acceptance_criteria:
  - AC1 [judgement] GIVEN Skill Dex open on a computer WHEN <private> looks at the left side THEN he sees the app name, each section with its count, his level and the day/night switch, and a click on a section opens it
- scope: The whole app.
- conditions: none
- exceptions: On a phone the sidebar becomes a bar at the bottom, as in the mockup.
- source: D-067, D-070
- status: active
- version: 1
- priority: 2
- ratified_by: D-070 v1
- supersedes: REQ-CAT-007
- builder_choice: section names and order
- note: built in 749b7e7, confirmed by D-094.
