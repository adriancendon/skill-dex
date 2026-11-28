# DIS: Discover skills

A new section <private> asked for (D-052). Nothing of it is built. He decided what it does in the final form (D-058, D-059, D-061) and on 2026-11-27 (D-085, D-086): suggestions, a box to type a search, and labels on skills he already knows. Section and button names follow the English interface (REQ-UI-005). Priority 2 is a placeholder: he gave no order.

### REQ-DIS-001 A section to discover skills on GitHub
- pattern: ubiquitous
- statement: Skill Dex shall offer a "Discover" section that finds skills on GitHub.
- rationale: D-052. How it finds them is REQ-DIS-005 and REQ-DIS-006 (suggestions) and REQ-DIS-009 (a typed search).
- acceptance_criteria:
  - AC1 [judgement] GIVEN Skill Dex open WHEN <private> goes to the discovery section THEN he sees skills found on GitHub
- scope: A new section of the app.
- conditions: The Mac is online.
- exceptions: none
- source: D-052, D-059
- status: active
- version: 1
- priority: 2
- ratified_by: D-059 v1
- builder_choice: the English name of the section
- note: built in 749b7e7, confirmed by D-094.

### REQ-DIS-002 A discovered skill can be opened on GitHub
- pattern: event
- statement: When the user chooses to open a skill found in "Discover", Skill Dex shall open its page on GitHub.
- rationale: D-058.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a discovered skill WHEN <private> chooses to open it THEN its GitHub page opens in the browser
- scope: "Discover".
- conditions: none
- exceptions: none
- source: D-058
- status: active
- version: 1
- priority: 2
- ratified_by: D-058 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-DIS-003 A discovered skill can be analysed
- pattern: event
- statement: When the user chooses to analyse a skill found in "Discover", Skill Dex shall start an **analysis** of it as "Analizar skill" does.
- rationale: D-058 and D-059 (the user decides whether to analyse it). Keeps one way of analysing (D-015, REQ-ANA-001), with its limits: one at a time, already investigated skills recognised (REQ-ANA-011).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a discovered skill not in the watchlist WHEN <private> chooses to analyse it THEN it appears in the Watchlist tab as being analysed
  - AC2 [judgement] GIVEN a discovered skill that was already discarded WHEN he chooses to analyse it THEN he is told when and why it was discarded, as REQ-ANA-011 does
- scope: "Discover".
- conditions: none
- exceptions: none
- source: D-058, D-059, D-015
- status: active
- version: 1
- priority: 2
- ratified_by: D-058 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-DIS-004 Discovering never installs
- pattern: ubiquitous
- statement: Skill Dex shall not install a skill found in "Discover".
- rationale: D-006 and D-058. Installing happens only when <private> asks for it afterwards.
- acceptance_criteria:
  - AC1 [judgement] GIVEN any use of "Discover" WHEN the skill folders are compared before and after THEN they are unchanged
- scope: "Discover".
- conditions: none
- exceptions: none
- source: D-006, D-058
- status: active
- version: 1
- priority: 2
- ratified_by: D-058 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-DIS-005 Suggestions from what the user uses
- pattern: ubiquitous
- statement: Skill Dex shall suggest in "Discover" skills from GitHub that fit what the user uses.
- rationale: D-059. Usage comes from REQ-USE-001.
- acceptance_criteria:
  - AC1 [judgement] GIVEN <private>'s most used skills are about SEO WHEN he opens "Discover" THEN the suggestions include SEO-related skills he does not have
- scope: "Discover".
- conditions: none
- exceptions: none
- source: D-059
- status: active
- version: 1
- priority: 2
- ratified_by: D-059 v1
- builder_choice: how the fit with his usage is worked out
- note: built in 749b7e7, confirmed by D-094.

### REQ-DIS-006 A random popular skill
- pattern: event
- statement: When the user asks for a popular skill in "Discover", Skill Dex shall show one skill picked at random from the most used skills on GitHub, with a short explanation of what it is used for.
- rationale: D-059. The user then analyses it or adds it to the watchlist (REQ-DIS-003, REQ-DIS-007).
- acceptance_criteria:
  - AC1 [judgement] GIVEN "Discover" WHEN <private> asks for a popular skill twice THEN each time one skill appears with a short explanation and the options to analyse it or add it to the watchlist, and the two picks can differ
- scope: "Discover".
- conditions: none
- exceptions: none
- source: D-059
- status: active
- version: 1
- priority: 2
- ratified_by: D-059 v1
- builder_choice: how "most used" is measured on GitHub (for example stars), said in the app next to the pick
- note: built in 749b7e7, confirmed by D-094.

### REQ-DIS-007 A discovered skill can go to the watchlist without an analysis
- pattern: event
- statement: When the user chooses to add a skill found in "Discover" to the **watchlist**, Skill Dex shall add it there without analysing it.
- rationale: D-058 and D-059. It costs nothing; an analysis can follow later.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a discovered skill WHEN <private> adds it to the watchlist THEN it appears in the Watchlist tab with its GitHub link and no report, and no analysis starts
- scope: "Discover" and the watchlist.
- conditions: none
- exceptions: none
- source: D-058, D-059
- status: active
- version: 1
- priority: 2
- ratified_by: D-058 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-DIS-008 GitHub is searched with the login already on the Mac
- pattern: ubiquitous
- statement: Skill Dex shall search GitHub with the GitHub session already open on the user's Mac when there is one, without storing any key in its repository.
- rationale: D-061; the key stays on the Mac (REQ-DAT-008). Without a session it still works (D-093, REQ-DIS-011).
- acceptance_criteria:
  - AC1 [judgement] GIVEN <private>'s Mac with his GitHub session open WHEN "Discover" searches THEN it works without asking him for a key
  - AC2 [judgement] GIVEN the repository WHEN it is searched for GitHub tokens or keys THEN none is found
- scope: "Discover".
- conditions: none
- exceptions: none
- source: D-061, D-093
- status: active
- version: 2
- priority: 2
- ratified_by: D-093 v2
- changes:
  - v2 D-093: the search no longer needs a GitHub session
- builder_choice: how the session is read (for example through the GitHub command line already installed)
- note: built in 749b7e7, confirmed by D-094.

### REQ-DIS-009 A box to type what to look for
- pattern: event
- statement: When the user types words in the search box of "Discover" and submits them, Skill Dex shall show the skills found on GitHub for those words.
- rationale: D-085 (owner answer: yes). Complements the suggestions of REQ-DIS-005 and REQ-DIS-006.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the discovery section WHEN <private> types "seo" in the box and submits THEN he sees skills found on GitHub for that word, each with the actions of REQ-DIS-002, REQ-DIS-003 and REQ-DIS-007
- scope: "Discover".
- conditions: The Mac is online.
- exceptions: none
- source: D-085, D-093
- status: active
- version: 2
- priority: 2
- ratified_by: D-093 v2
- changes:
  - v2 D-093: the typed search no longer needs a GitHub session
- builder_choice: how many results are shown and what each result shows
- note: built in 749b7e7, confirmed by D-094.

### REQ-DIS-010 Skills the user already knows carry a label
- pattern: ubiquitous
- statement: Skill Dex shall mark each skill shown in "Discover" that is already installed, in the watchlist or discarded with the label "Installed", "In watchlist" or "Discarded".
- rationale: D-086: shown with a label, not hidden, so that <private> does not analyse the same skill twice. A discarded skill's reason is told when he tries to analyse it (REQ-DIS-003 AC2).
- acceptance_criteria:
  - AC1 [judgement] GIVEN suggestions that include an installed skill, one in the watchlist and a discarded one WHEN <private> looks at the results THEN each carries its label and none is hidden
  - AC2 [judgement] GIVEN a skill he does not have at all WHEN it appears in the results THEN it carries no label
- scope: "Discover", suggestions and typed searches.
- conditions: none
- exceptions: none
- source: D-086
- status: active
- version: 1
- priority: 2
- ratified_by: D-086 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-DIS-011 Without a GitHub session the search works within GitHub's limit
- pattern: state
- statement: While no GitHub session is open on the Mac, Skill Dex shall search GitHub without logging in, within the search limit GitHub gives to anonymous requests.
- rationale: D-093: other users, once the app is public (D-055), may have no session.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a Mac with no GitHub session WHEN the user opens "Discover" THEN suggestions and typed searches show results until GitHub's limit is reached
  - AC2 [judgement] GIVEN the limit reached WHEN the user searches again THEN a message says the limit was reached, not that nothing was found
- scope: "Discover".
- conditions: The Mac is online.
- exceptions: none
- source: D-093
- status: active
- version: 1
- priority: 2
- ratified_by: D-093 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-DIS-012 A notice explains how to sign in for a higher limit
- pattern: state
- statement: While no GitHub session is open on the Mac, Skill Dex shall show in "Discover" a notice that explains how to sign in to GitHub to search more.
- rationale: D-093.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a Mac with no GitHub session WHEN the user opens "Discover" THEN a notice says that signing in raises the limit and how to do it, in English
  - AC2 [judgement] GIVEN a Mac with a GitHub session WHEN the user opens it THEN the notice is not shown
- scope: "Discover".
- conditions: none
- exceptions: none
- source: D-093
- status: active
- version: 1
- priority: 2
- ratified_by: D-093 v1
- note: built in 749b7e7, confirmed by D-094.
