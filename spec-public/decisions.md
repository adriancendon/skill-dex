# Decisions, open points and risks

The only place where a decision is recorded. Owner quotes are verbatim. Entry format: `README.md`.

Quotes of the owner and their context are omitted from this public copy.

A line break inside one of his messages is written here as ` / `; nothing else in a quote is changed, typos included. These files live outside the repository (R-001). Dates below are Madrid dates. Choices that only appear in agent-written documents (`Seguimiento/README.md`, `Seguimiento/estado.md`, the `<skill>` skill) or in the code are not recorded as decisions; where they matter they are open points.

## Decisions

### D-001 A nice, visual and ordered list of all my skills
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex is a visually attractive, well-ordered list of all of <private>'s skills.

### D-002 Skills of interest are analysed and join the list
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skills <private> is interested in are analysed in this project and then added to the same list.

### D-003 The list is dynamic and gamified and shows the installed skills
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The list is dynamic (it reflects the skills installed now, not a fixed snapshot) and gamified.

### D-004 Measure how often each skill is used and chart it
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex measures how many times each skill is used and shows a usage chart.

### D-005 Experience counts from the start of the project
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Experience (XP) and levels count only uses from the start of the project onward; earlier uses give no XP.

### D-006 Analysing a skill never installs it
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: An analysis never installs the skill. Installing happens only when <private> asks for it afterwards.

### D-007 What an analysis reports, in this order
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Every analysis tells <private>, in this order: what the skill does; its reviews and score; in which cases it triggers automatically or whether he has to call it himself; and an honest recommendation on whether to install it.

### D-008 Analysed repos and skills go to the watchlist
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Repos and skills under evaluation are analysed and recorded in the watchlist, which is separate from the installed skills.

### D-009 Scan installed skills with SkillSpector and add a catalogue health panel
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex scans the installed skills with SkillSpector in its static mode (`--no-llm`, no files sent to a model) and shows the risk on the cards. It also has a health panel with similar skills, unused skills and context weight, and deletes nothing.

### D-010 Discarded watchlist entries are kept with their reason
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: <private> can discard a watchlist entry. A discarded entry is kept, not deleted, so that a later question about the same skill is answered with "already investigated and discarded for this reason".

### D-011 Fewer false positives in the security alert
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The security alert threshold is tuned so that fewer false positives are raised, accepting that some real findings may be flagged less.

### D-012 SkillSpector is part of the analysis flow
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Every skill analysis includes a SkillSpector scan as one of its steps, not as a separate step done outside the flow.

### D-013 <private> reviews the alerts that remain
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The security alerts that remain after false positives are removed are put in front of <private> for review; they are not closed without him.
- superseded_by: D-045 (that he reviews each false positive himself)

### D-014 Opening the app must not leave a Terminal window to close
- date: 2026-11-24
- origin: constraint
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Opening Skill Dex does not open a Terminal window; when he is done, closing the browser tab is all he has to close.

### D-015 Skills are analysed from a button in the app
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex has an "Analizar skill" action that takes a URL or a name and runs the analysis in the background. The new entry sits in the watchlist marked as analysing until the report, score and verdict fill it in.

### D-016 At most one analysis at a time
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Only one analysis launched from the app runs at a time.

### D-017 Analyses launched from the app run with limited permissions
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: An analysis launched from the app runs with limited permissions; it does not get the agent's full access.

### D-018 Clicking a skill card opens its detail with the full analysis
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: A click on a skill card opens a full-screen or pop-up detail view of that skill, inside the app, that includes the detailed analysis.

### D-019 Only OpenAI models; no subagent on another provider
- date: 2026-11-24
- origin: constraint
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Agent work on Skill Dex uses only OpenAI (ChatGPT) models, and no subagent is created on a model of another provider.
- superseded_by: D-040 (its reach beyond the redesign of 2026-11-24)

### D-020 Day and night mode
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex has a dark mode and a day mode.

### D-021 Nicer, easier to understand, better structured, minimalist
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex looks nicer, is easier to understand and better structured, and follows a minimalist design that works well. More detail about a skill is reached by clicking it.
- superseded_by: D-027 (the part [quote omitted])

### D-022 Simple filters
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex has simple filters to browse the skills.

### D-023 Gamification rewards the most used skills and suggests reviewing unused ones
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The gamification rewards the most used skills and recommends that <private> review the skills he does not use, to decide whether they still make sense. Deciding stays with him.

### D-024 A command center to see the skills and decide
- date: 2026-11-24
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex is a command center of the installed skills from which <private> can take decisions at a glance.
- superseded_by: D-027 (the part [quote omitted])

### D-025 No change to the app without prior approval
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Changes to the Skill Dex app are shown to <private> and approved by him before they are made.

### D-026 A mix of the old and the new design, shown first as a proposal
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The design to aim for is an intermediate mix of the previous and the redesigned version. It is shown as a proposal with screenshots, and the app is not changed until <private> says yes.

### D-027 Not every skill has to fit on the screen
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The catalogue does not have to fit all skills into one screen; scrolling is fine, because the collection may grow beyond 100 skills.
- supersedes: D-021 (the part [quote omitted]); D-024 (the part [quote omitted])

### D-028 More information about each skill at a glance
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The overview shows more information about each skill than its name, without opening it.

### D-029 Each skill has its own icon, invented from its description
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Each skill has an icon that represents it, invented by the agent from the skill's description.

### D-030 The uses-per-day chart stays
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The section with the chart of uses per day stays in Skill Dex.

### D-031 Adopt keelblocks in Skill Dex
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex gets a keelblocks package in `Tecnico/spec/`. Everything in it stays a draft until <private> confirms it; the app code and the existing documents are not changed by the adoption.
- note: D-041 confirms that this was a real choice, not an accepted default.

### D-032 The whole app at once
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The adoption covers the whole app in one pass, not one area first.
- note: D-041 confirms that this was a real choice, not an accepted default.

### D-033 Git, pushed to a private GitHub repository
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: `Tecnico/` is a git repository, pushed to a private repository on GitHub.

### D-034 The intermediate proposal is an open point, not applied
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The intermediate design proposal (then in `/tmp/skilldex-propuesta/`, now in `Seguimiento/versiones/propuesta-intermedia/` by D-042) is recorded as an open point (OP-001) and is not applied to the app.
- note: D-041 confirms that this was a real choice, not an accepted default.

### D-035 Personal tools: simple, one-click, private repo, no servers or accounts
- date: 2026-11-25
- origin: constraint
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex is the simplest thing that works on <private>'s Mac, starts with one app icon, has a short how-to-use note, and lives in a private GitHub repository. It needs no server, account or app store unless he asks for one.
- superseded_by: D-053 (the part "It needs no server"); D-055 (the part "lives in a private GitHub repository")

### D-036 Quality first, but do not waste money
- date: 2026-11-25
- origin: constraint
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Work done for or by Skill Dex weighs quality first but avoids waste, and <private> is warned before something unusually expensive runs.

### D-037 No design chosen yet; the applied redesign does not convince him
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The design of Skill Dex stays open (OP-001). The redesign now in the app is not accepted as the design. <private> wants to publish the app on GitHub and to add more features, and the new design has to allow for both.

### D-038 Very visual, easy to understand, an uncluttered screen
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex is very visual and easy to understand, and does not fill the screen with information.

### D-039 Old documents stay as history and point to the package
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: `Seguimiento/README.md` and `Seguimiento/estado.md` stay as they are, as history, each with one line that points to `Tecnico/spec/`. The README is corrected when a design is applied. The skill's own icon (D-029) replaces the emoji setting of `skills-meta.json`.

### D-040 "Only OpenAI" was only for the redesign
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: D-019 applied to the redesign of 2026-11-24 only. Other agent work on Skill Dex, and the analyses the app launches, use whatever model omp and the global routing choose.
- supersedes: D-019 (its reach beyond the redesign of 2026-11-24)

### D-041 The first form's answers were real choices
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: D-031, D-032 and D-034 were his real choices, not accepted defaults.

### D-042 The comparison versions are kept in Seguimiento/versiones
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The previous version lives in `Seguimiento/versiones/antes/` and the intermediate proposal in `Seguimiento/versiones/propuesta-intermedia/`, with their screenshots.

### D-043 The analysis works as it does today
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The analysis drafts REQ-ANA-001 to REQ-ANA-022 are ratified at version 1 as they describe today's behaviour, apart from the discard-reason history added by D-044. The report keeps his four points in his order and adds security and overlaps.
- affects: REQ-ANA-001 to REQ-ANA-022

### D-044 The six discards stand, with their report verdict as reason
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: <skill>, <skill>, <skill>, <private>, <private> and <skill> stay discarded; the verdict of each one's report is its discard reason. When a discarded entry is recovered or analysed again, its previous reason and date are kept as history.
- affects: REQ-ANA-024; REQ-ANA-025

### D-045 A clear false-positive criterion, approved once
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: A clear written criterion says what counts as a false positive. <private> approves it once; after that, findings that meet it may be closed with their reason without him reviewing each one. Findings that do not meet it stay in front of him.
- supersedes: D-013 (that he reviews each false positive himself)

### D-046 Similar skills: show them and recommend what to do
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex shows which skills are similar and, for each pair, recommends which one to keep, how to adapt them, or whether to keep both separate.
- affects: REQ-USE-016; REQ-USE-017

### D-047 Earlier uses are shown apart and give no XP
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Uses from before the season start stay visible, apart from season uses, and give no XP.
- affects: REQ-USE-002; REQ-USE-005; REQ-USE-006

### D-048 The catalogue also lists each project's skills
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The catalogue works as described in the question and also lists the skills that live inside each project, each labelled with its project. The catalogue drafts that depend on the design (icon, card content, scrolling) wait for OP-001.
- affects: REQ-CAT-001 to REQ-CAT-010; REQ-CAT-014; REQ-CAT-015

### D-049 The game is decided with the new design
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: How the game works (points, titles, skill levels, achievements, rarity, review filter) is decided together with the new design; OP-015 stays open.

### D-050 Each level costs more experience than the one before
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Each new collection level needs more XP than the previous one.
- affects: REQ-USE-018

### D-051 A congratulation message when a level is reached
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: When the user goes up a level, Skill Dex shows a message that congratulates him. The kind of message and its wording are to be proposed to <private> (OP-024).
- affects: REQ-USE-019

### D-052 A "Descubre skills" section that searches GitHub
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex gets a "Descubre skills" section that searches GitHub for skills.
- affects: REQ-DIS-001 to REQ-DIS-004

### D-053 The local server is fine
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex may run its own server that only listens on the Mac and stops when the tab closes; the launch and server drafts REQ-LAU-001 to REQ-LAU-010 are ratified at version 1.
- supersedes: D-035 (the part "It needs no server")
- affects: REQ-LAU-001 to REQ-LAU-010

### D-054 Favourite and mastered marks are also saved to a file
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Favourite and mastered marks are also saved in a file, so they are not lost with the browser. The watchlist stays in its file, which omp also reads.
- affects: REQ-DAT-001; REQ-DAT-003
- superseded_by: D-090 (the mastered mark)

### D-055 Public on GitHub later, without his data
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The repository stays private until the new design is ready, and is then made public. Skill Dex is prepared so that anyone can install it: <private>'s skills, uses, watchlist, reports and marks never go into the repository, and nothing in it depends on paths of his Mac.
- supersedes: D-035 (the part "lives in a private GitHub repository")
- affects: REQ-DAT-002; REQ-DAT-004; REQ-DAT-008; REQ-LAU-011; REQ-LAU-012

### D-056 The false-positive criterion is approved
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The criterion shown in the form is the rule for false positives. A finding may be closed without <private> only if it meets one of the six conditions and none of the exclusions; when in doubt it is shown to him; each closure is recorded in the ficha with the condition that justifies it. The seven findings closed before the criterion existed are checked against it.
- affects: REQ-SEC-004; REQ-SEC-005; REQ-SEC-006; REQ-SEC-010

### D-057 The level-up message is a centred card
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: At each new level Skill Dex shows, once, a card in the centre of the screen with the new level and title, what made it rise, a next goal and a button to close it.
- affects: REQ-USE-020

### D-058 What can be done with a discovered skill
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: For each skill found in "Descubre skills", <private> can analyse it (which never installs), add it to the watchlist without analysing, or open it on GitHub.
- affects: REQ-DIS-002; REQ-DIS-003; REQ-DIS-004; REQ-DIS-007

### D-059 Suggestions from use, and a random popular skill
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: "Descubre skills" suggests skills according to what <private> uses. It also has an option that shows one skill picked at random from the most used skills on GitHub, with a short explanation of its use; the user then decides whether to analyse it or only add it to the watchlist.
- affects: REQ-DIS-005; REQ-DIS-006

### D-060 Installed or discarded skills leave the watchlist
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: A watchlist skill that gets installed leaves the watchlist. A watchlist skill that is discarded leaves the watchlist and goes to the Descartadas section.
- affects: REQ-ANA-020; REQ-CAT-007; REQ-ANA-018

### D-061 Discovery uses his GitHub login on the Mac
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: "Descubre skills" searches GitHub with the GitHub session already open on the Mac; its key stays on the Mac and never goes into the repository.
- affects: REQ-DIS-008

### D-062 The small rules hold
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: All the listed rules hold except the Spanish interface (D-063): the temporary copy is deleted after the check, a clean scan is no guarantee, the scanner only queries a public database and sends no files, usage logs are read only on the Mac, the theme is remembered, and the nine named drafts are ratified at version 1.
- affects: REQ-SEC-008; REQ-SEC-009; REQ-DAT-006; REQ-DAT-007; REQ-UI-002; REQ-USE-001; REQ-USE-011; REQ-USE-014; REQ-USE-015; REQ-SEC-001; REQ-SEC-002; REQ-SEC-007; REQ-UI-001; REQ-DAT-005

### D-063 The app is entirely in English
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The whole interface of Skill Dex is in English.
- affects: REQ-UI-004; REQ-UI-005

### D-064 Until a new design exists, the current redesign stays
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The redesign now in `Tecnico/web/` stays in the app until a new design is approved. It is still not accepted as the design (D-037).

### D-065 A clean version of this package goes public; the full one stays private
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: When the repository becomes public, it carries a clean version of the requirements package without <private>'s quotes or personal data. The full package stays private.
- affects: REQ-DAT-009

### D-066 The public instructions are in English only
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The install instructions of the public repository are written in English only.
- affects: REQ-LAU-013

### D-067 The left sidebar of proposal B
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex has a left sidebar, as in proposal B, with the app name, its sections, the experience level and the day/night switch.
- affects: REQ-UI-006

### D-068 The list must show the most used skills globally
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The skills are shown as a list, and the list lets <private> see the most used skills across all categories, not only within each category.
- affects: REQ-CAT-016; REQ-CAT-017

### D-069 The icons of proposal A; nothing from C
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skills show the icons of proposal A. Nothing of proposal C is kept.
- affects: REQ-CAT-011

### D-070 Proposal D is the design, with changes
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex follows proposal D, with the short descriptions of this message and the changes of D-072 and D-073. Once built, D replaces the redesign now in `Tecnico/web/` (D-064). The app changes only after <private> approves the updated mockup with these changes (D-025).
- affects: REQ-CAT-011; REQ-CAT-012; REQ-CAT-013; REQ-CAT-016; REQ-CAT-017; REQ-CAT-018; REQ-CAT-019; REQ-USE-003; REQ-USE-021; REQ-USE-022; REQ-SEC-003; REQ-UI-003; REQ-UI-006

### D-071 Short, natural, direct descriptions in the list
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The list shows a short description of each skill, written in natural, direct language, instead of its long original description.
- affects: REQ-CAT-019

### D-072 A section to review skill updates
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex gets a section where <private> can review updates of his skills.
- affects: REQ-UPD-001

### D-073 A choice between a list view and a cards view
- date: 2026-11-25
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Besides the list, the skills can be shown as cards, and the user chooses between the two views.
- affects: REQ-CAT-020

### D-074 The chosen view is remembered
- date: 2026-11-25
- origin: derived
- basis: D-073
- decision: Skill Dex opens in the view (list or cards) last chosen in that browser, as it does with the theme (REQ-UI-002). Open to <private>'s correction.
- affects: REQ-CAT-021

### D-075 Proposal D, as it now stands, is approved
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The mockup of design D as shown on 2026-11-27 is approved for building, which satisfies D-025 for the design. Each build phase is still shown to him before it replaces the app, and he asked for the build plan to be laid out in phases. This also confirms the remembered view (D-074) and the game rules read from D (REQ-USE-021, REQ-USE-022) as shown.
- affects: REQ-CAT-021; REQ-USE-021; REQ-USE-022
- note: OP-015 stays open only for the level titles, the level of each skill, the achievements and the rarity.

### D-076 Short descriptions are written once by an agent, in English, in a file he can edit
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The short descriptions of the list (D-071) are written once for each skill by an agent, in English, and saved in a file <private> can edit.
- affects: REQ-CAT-019; REQ-CAT-022; REQ-CAT-023

### D-077 Updates come from the skill's source repository and its version number
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex finds the updates of a skill from its source repository and its version number, and shows which files change.
- affects: REQ-UPD-001; REQ-UPD-004; REQ-UPD-005

### D-078 Updates are looked for only when he presses "Check for updates"
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex looks for skill updates only when <private> presses "Check for updates", never by itself.
- affects: REQ-UPD-006

### D-079 Every update is security-checked first
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Every update passes the security check, with the false-positive criterion he approved (D-056), before he can apply it.
- affects: REQ-UPD-003

### D-080 Only skills that come from outside appear in Updates
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The Updates section covers only external skills; skills he wrote and skills omp learned by itself are not in it.
- affects: REQ-UPD-001; REQ-UPD-007

### D-081 Local edits: a warning and a copy of his version before updating
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: When a skill he changed by hand has an update, Skill Dex warns him, and saves a copy of his version before updating it.
- affects: REQ-UPD-008; REQ-UPD-009

### D-082 An "Update" button that asks for confirmation applies the update
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex applies an update itself when <private> presses "Update" and confirms; nothing is updated without that.
- affects: REQ-UPD-002; REQ-UPD-010; REQ-UPD-011

### D-083 The health panel, the similar pairs and the mastered mark get a Health section
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The catalogue health panel, the pairs of similar skills with their advice and the mastered mark move to a section of their own in the sidebar, called "Health".
- affects: REQ-USE-015; REQ-USE-016; REQ-USE-017; REQ-USE-023; REQ-UI-006
- superseded_by: D-090 (the mastered mark)

### D-084 Analysis reports are in English too
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The analysis reports are written in English, like the rest of the app (D-063).
- affects: REQ-ANA-026; REQ-UI-005

### D-085 "Descubre skills" has a box to type a search
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Besides the suggestions of D-059, "Descubre skills" has a box where <private> types what to look for.
- affects: REQ-DIS-009

### D-086 Known skills in "Descubre skills" carry a label
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: A skill in "Descubre skills" that is already installed, in the watchlist or discarded is shown with the label "Installed", "In watchlist" or "Discarded".
- affects: REQ-DIS-010

### D-087 All remaining phases are built at once; he reviews at the end
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: All remaining phases are built in one pass instead of one at a time. At the end he is told what he must review and which decisions were taken for him; whatever needs him during the build is asked while work continues on other points.

### D-088 Level titles: eight English titles, a new one every two levels
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The collection levels carry the titles Newcomer, Explorer, Builder, Craftsman, Strategist, Expert, Master and Legend, one new title every two levels.
- affects: REQ-USE-008; REQ-USE-020

### D-089 Each skill keeps its own level and its rarity; the achievements go
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Each skill keeps its own level and the size-based rarity. The achievements are not kept.
- affects: REQ-USE-009; REQ-USE-010; REQ-USE-013
- superseded_by: D-121 (the rarity)

### D-090 The mastered mark is removed
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The mastered mark is removed from the app, with its XP and its place in the Health section. The favourite mark stays.
- supersedes: D-083 (the mastered mark goes to the Health section); D-054 (saving the mastered mark in a file)
- affects: REQ-USE-023; REQ-CAT-014; REQ-DAT-001

### D-091 "Skip this version" stays in Updates
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The "Skip this version" button stays in the updates section.
- affects: REQ-UPD-012

### D-092 Reports written in Spanish are analysed again
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The skills whose analysis report is in Spanish are analysed again so that their reports are in English.
- affects: REQ-ANA-027

### D-093 "Descubre skills" works without a GitHub login
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Without a GitHub session "Descubre skills" works within GitHub's search limit and shows a notice that explains how to sign in to get more.
- affects: REQ-DIS-008; REQ-DIS-009; REQ-DIS-011; REQ-DIS-012

### D-094 The new version is merged into the app and pushed to the private repository
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The new version, with proposal D and phases 1 to 7, replaces the app and is pushed to the private repository.
- affects: REQ-UI-003; REQ-UI-005; REQ-UI-006; REQ-LAU-011

### D-095 His categories are installed
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The categories of the proposal are installed in `Seguimiento/skills-meta.json`.
- affects: REQ-CAT-003

### D-096 The proposed security review is adopted
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The 23 findings closed earlier stay closed, each with the condition of the criterion in D-056 that justifies it, and the proposed `security-triage.json` replaces the old one.
- affects: REQ-SEC-004; REQ-SEC-005; REQ-SEC-010

### D-097 Analyses keep using `<skill>`, changed to write in English
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Analyses keep using `<skill>`, and `<skill>` is changed so that reports are in English, with the six headings in order and English verdicts.
- affects: REQ-ANA-007; REQ-ANA-026

### D-098 The 12 Spanish reports are regenerated now
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The 12 analyses whose reports are in Spanish are run again now, one at a time.
- affects: REQ-ANA-027

### D-099 Choices taken by the agents that he accepted
- date: 2026-11-27
- origin: derived
- basis: D-094
- decision: The new version keeps these choices of the builders, listed to him under [quote omitted], and open to his correction: update sources come from the `ORIGEN.md` files; a critical finding in the new version blocks "Update"; files he deleted on purpose stay deleted; `<skill>` shows "Source unknown"; in Discover "popular" is GitHub stars and the explanation is GitHub's own description; project skills are only those in `.omp/skills` of the folders under `~/Developer` and count for XP and "To review"; the level of a skill is the whole square root of its season uses and the rarity depends on size; the first opening of the new version congratulates for no old level; "Preview level-up" is shown on desktop only; parts the scanner could not read stay pending; tokens are treated as keys and never closed by themselves; favourites are saved in `Seguimiento/marks.json`.
- affects: REQ-UPD-003; REQ-UPD-005; REQ-UPD-009; REQ-DIS-005; REQ-DIS-006; REQ-CAT-015; REQ-USE-009; REQ-USE-013; REQ-SEC-004; REQ-DAT-001
- note: The owner's approval followed a message that listed these, so they stand until he changes one; he did not discuss them one by one.
- superseded_by: D-102 (the choice on coverage gaps), D-117 (the choice on project skills)

### D-100 The <skill> report stays in Spanish; the entry stays discarded
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The old Spanish report of <skill> is kept and its entry stays discarded; it is not analysed again.
- affects: REQ-ANA-027

### D-101 Misread-text findings and the <skill> folder are closed as the owner's decisions
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The 28 findings of question A and the 3 of <skill>'s `__pycache__` are closed as false positives decided by <private>, each reopening if the file or folder changes; nothing is deleted.
- affects: REQ-SEC-004; REQ-SEC-005; REQ-SEC-011

### D-102 Scanner coverage gaps are shown as minor notices
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Coverage gaps of the scanner are shown as minor notices, not as findings to review; they stay visible in the ficha and are never closed by themselves.
- supersedes: D-099 (the choice that parts the scanner could not read stay pending)
- affects: REQ-SEC-004; REQ-SEC-006

### D-103 REQ-USE-004 and REQ-USE-012 are confirmed
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Activity of one skill in the ficha (REQ-USE-004) and the "To review" suggestion (REQ-USE-012) are ratified.
- affects: REQ-USE-004; REQ-USE-012

### D-104 No upper level of requirements
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Requirements have no user stories and no parents: the area files are the only grouping.
- affects: REQ-USE-001

### D-105 Skill Dex is published under the MIT licence
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The publication is prepared with the MIT licence, holder <private>.
- affects: REQ-DAT-008; REQ-DAT-009; REQ-LAU-012

### D-106 <skill> comes from a third party
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: <skill> is a third-party skill, shared directly, with no repository to update from. The name stays in his private data (`skills-meta.json`), not in public code.
- affects: REQ-UPD-013

### D-107 Two repositories: public code, private full package
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The code is one repository that becomes public and is the copy he uses. The full package `Tecnico/spec` stays as a separate private repository `skill-dex-spec`; the public repository carries only the clean export (for example `spec-public/`).
- affects: REQ-DAT-009

### D-108 The public repository starts with fresh history
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The public repository starts with a new history in one clean commit; the old repository is kept private as `skill-dex-archivo`.
- affects: REQ-DAT-008

### D-109 The README screenshot uses example data
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The screenshot in the public README is made with example data, nothing of his.
- affects: REQ-DAT-008; REQ-LAU-012

### D-110 Updates shows a skill with no source as coming from its giver
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: A skill can be marked in `skills-meta.json` as having no update source, with who it came from; Updates then shows "from <name>, no update source" instead of unknown.
- affects: REQ-UPD-013

### D-111 A full security audit comes before publishing
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The optional security audit is run first and the repository is published after it.
- affects: REQ-DAT-008; REQ-SEC-012; REQ-SEC-013; REQ-SEC-014; REQ-SEC-015

### D-112 The history of the public repository is cleaned
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The public history is to be cleaned of private names; the way was left to the options that followed (D-113).
- affects: REQ-DAT-008

### D-113 Skill Dex is published as it stands, with three private names in the first commit
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Option 3: the public repository stands as published, and its first commit still names <private>, <private> and <private>. Every further push to it needs his OK.
- affects: REQ-DAT-008; REQ-DAT-009

### D-114 The four audit fixes are approved
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The four fixes of the security audit are approved.
- affects: REQ-SEC-012; REQ-SEC-013; REQ-SEC-014; REQ-SEC-015

### D-115 No Docker, colima or virtual machines without his OK
- date: 2026-11-27
- origin: constraint
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: No Docker, colima or virtual machines are used on his Mac without his OK.
- affects: REQ-LAU-001

### D-116 Anyone, even without omp, can use Skill Dex
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex is not limited to omp: anyone, even without omp, can use it, and the published text is corrected to say so.
- affects: REQ-LAU-012; REQ-LAU-014

### D-117 Skill Dex works for any agent that uses SKILL.md
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Skill Dex lists and measures the skills of any agent that uses `SKILL.md` folders, and runs its agent tasks with whichever of omp, claude or codex is available, or disables them.
- supersedes: D-099 (project skills only in `.omp/skills` under `~/Developer`)
- affects: REQ-CAT-001; REQ-CAT-015; REQ-CAT-024; REQ-CAT-025; REQ-CAT-026; REQ-CAT-027; REQ-CAT-028; REQ-CAT-029; REQ-USE-001; REQ-USE-024; REQ-ANA-028; REQ-ANA-029; REQ-DAT-010; REQ-LAU-014

### D-118 This change is pushed directly, without showing it first
- date: 2026-11-27
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The multi-agent change is pushed to the public repository directly after verification, as a one-off.
- affects: REQ-LAU-014

### D-119 The points of an external review are to be fixed
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The eight points of the review are to be fixed or answered.
- affects: REQ-DAT-008; REQ-LAU-011; REQ-LAU-014; REQ-LAU-015; REQ-ANA-030; REQ-DAT-011; REQ-USE-013

### D-120 Everything goes to English names, with the old names still read
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: Names in the project are in English; the old Spanish names are still read and his files are converted to the new ones with a backup copy.
- affects: REQ-DAT-011

### D-121 Rarity is how uncommon a skill is on GitHub
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The rarity of a skill is how uncommon it is on GitHub, by the four tiers; unknown is Common. This replaces the size-based rarity.
- supersedes: D-089 (the size-based rarity)
- affects: REQ-USE-013

### D-122 The result is accepted by area, with screenshots
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: He accepts the work area by area, from screenshots, answering yes or no to each. The fresh-Mac test is not part of it.
- affects: REQ-LAU-011

### D-123 Builder changes made for the review
- date: 2026-11-28
- origin: derived
- basis: D-119
- context: (omitted from the public copy)
- decision: These builder choices stand until he changes them.
- affects: REQ-ANA-030; REQ-LAU-015; REQ-DAT-012; REQ-LAU-012

### D-124 The catalogue area is accepted
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: He accepts the result of the catalogue area against its criteria.
- affects: CAT requirements

### D-125 The usage and game area is accepted
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: He accepts the result of the usage and game area against its criteria.
- affects: USE requirements

### D-126 The analysis and watchlist area is accepted
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: He accepts the result of the analysis and watchlist area against its criteria.
- affects: ANA requirements

### D-127 The security area is accepted
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: He accepts the result of the security area against its criteria.
- affects: SEC requirements

### D-128 The Discover area is accepted
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: He accepts the result of the Discover area against its criteria.
- affects: DIS requirements

### D-129 The updates area is accepted
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: He accepts the result of the updates area against its criteria.
- affects: UPD requirements

### D-130 The launch and local server area is accepted
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: He accepts the result of the launch and local server area against its criteria. The untested Linux part and the fresh-Mac test are not covered.
- affects: LAU requirements

### D-131 The data and privacy area is accepted
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: He accepts the result of the data and privacy area against its criteria.
- affects: DAT requirements

### D-132 The interface area is accepted
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: He accepts the result of the interface area against its criteria.
- affects: UI requirements

### D-133 The two small fixes and the spec-public refresh are approved
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The Updates message and the per-port session token file are fixed, and `spec-public` is refreshed in the public repository.
- affects: REQ-UPD-014; REQ-LAU-016; REQ-DAT-009

### D-134 The two fixes are accepted
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: He accepts the fixes of REQ-UPD-014 and REQ-LAU-016.
- affects: REQ-UPD-014; REQ-LAU-016

### D-135 The remaining audit and review fixes are approved and published
- date: 2026-11-28
- origin: owner
- quote: (omitted from the public copy)
- context: (omitted from the public copy)
- decision: The fixes for the six points are approved, and pushing them to the public repository is approved.
- affects: REQ-ANA-004; REQ-ANA-022; REQ-ANA-031; REQ-SEC-008; REQ-SEC-016; REQ-LAU-017; REQ-DAT-009

## Open points

### OP-001 Which design does the app follow?
- status: decided
- question: No design is chosen (D-037), and the redesign now in the app is not accepted. Three versions exist to compare. (a) The redesign applied on 2026-11-24 without his approval, in `Tecnico/web/`: compact cards with a two-letter category code and one usage line; [quote omitted] at the side; the chart, health panel and achievements behind "Actividad y salud". (b) The previous version, rebuilt read-only in `Seguimiento/versiones/antes/` (level and figures on top, achievements, health and the chart on the main screen, emoji per skill, cards further down). (c) The intermediate proposal in `Seguimiento/versiones/propuesta-intermedia/` with screenshots `dia.png`, `noche.png`, `movil.png` (chart of uses per day and [quote omitted] on top, "Para decidir" notices, cards with own icon, description, uses, mini chart and security, grouped by category). The new design must be very visual, easy to understand and uncluttered (D-038) yet show more about each skill at a glance (D-028); it must keep the uses-per-day chart (D-030), give each skill its own icon (D-029), be ready for publication on GitHub (D-055) and leave room for more features such as "Descubre skills" (D-052) and the level-up message (D-051). What design does <private> approve? It is shown to him as a proposal before the app changes (D-025, D-026).
- depends: REQ-CAT-011, REQ-CAT-012, REQ-CAT-013, REQ-USE-003, REQ-SEC-003, REQ-UI-003 stay drafts; the game (OP-015) and the README correction (D-039) wait for it; publication waits for it (D-055).
- decided_by: D-070
- note: D-067, D-068 and D-069 say what he took from proposals A, B and C; D-070 approves D with the changes of D-071 to D-073. Applying it still needs his OK on the updated mockup (D-025).

### OP-002 What stays in the app until the design is chosen?
- status: decided
- question: After [quote omitted] the applied redesign (a in OP-001) was left in place, and D-037 says it does not convince him, without saying to remove it. Until the new design is approved, does the redesign stay in the app, or is the previous version (b) restored?
- depends: Which version of `Tecnico/web/` the drafts describe as today's behaviour.
- decided_by: D-064

### OP-003 What happens to the old documents?
- status: decided
- question: `Seguimiento/README.md` (how to open and use the app) and `Seguimiento/estado.md` ([quote omitted], out of date) were written by agents. Do they stay as they are, get a line pointing to `Tecnico/spec/`, or get rewritten from the package? Until decided they are not changed.
- depends: Which file agents treat as the description of Skill Dex; OP-005 and OP-006.
- decided_by: D-039

### OP-004 How is the level above single requirements written?
- status: decided
- question: User stories, requirements in the same EARS shape, or no upper level, with each area file grouping its requirements?
- depends: Whether requirements get a `parent`. Until decided, none has one.
- decided_by: D-104

### OP-005 README text written during the unapproved redesign
- status: decided
- question: The redesign session also edited `Seguimiento/README.md` ("Abre **Actividad y salud** …", the section [quote omitted] on "uso registrado", "Temporada", [quote omitted] and "Seguridad"). These describe the redesign that was applied without approval (D-025). Do these edits stay, or does the README go back to describing the version chosen in OP-001?
- depends: OP-003; whether the README describes the app truthfully.
- decided_by: D-039

### OP-006 README promises an emoji per skill that the app no longer shows
- status: decided
- question: `Seguimiento/README.md` section "Ajustes" says "`skills-meta.json`: categoría y emoji por skill". The previous version showed `s.emoji` with a category emoji as fallback; the applied redesign shows a two-letter category code (`Tecnico/web/catalog.js`, `catCode`) and ignores the emoji; `Seguimiento/skills-meta.json` is empty. D-029 asks for an icon per skill invented from its description. Does the icon of D-029 replace the emoji setting, and may <private> still override category and icon by hand in `skills-meta.json`?
- depends: REQ-CAT-003, REQ-CAT-011.
- decided_by: D-039
- note: D-039 settles the icon; the category override in `skills-meta.json` stays as built (REQ-CAT-003, D-048).

### OP-007 The remaining security alerts were closed by the agent, not by <private>
- status: decided
- question: D-013 says he wants to review the alerts left after false positives are removed. The agent then reviewed the 19 remaining findings itself, judged all of them false positives and recorded that in `Seguimiento/security-triage.json` (7 entries with reason), so the app shows "0 por revisar". Does the agent's review count, or should those findings be shown to him again until he confirms each? And in future: may an agent add entries to `security-triage.json`, as the `<skill>` skill tells it to, or only after he agrees?
- depends: REQ-SEC-005, REQ-SEC-006.
- decided_by: D-045
- note: The seven findings already recorded by the agent are to be checked against the criterion once <private> approves it (OP-023).

### OP-008 Where does "only OpenAI models" apply?
- status: decided
- question: D-019 was written at the top of the redesign request. Does it hold only for that redesign, for all agent work on Skill Dex, and also for the analyses the app launches? Today `Tecnico/server.mjs` runs `omp -p` without `--model`, so an analysis runs on whatever model omp uses by default, which may not be OpenAI. The global instructions say "Don't pick models by hand unless I ask" and let `<private>` route subagents across Claude, OpenAI and OpenCode Go.
- depends: A draft requirement that analyses run on an OpenAI model; removed after the decision.
- decided_by: D-040

### OP-009 Is a server that only listens on this Mac acceptable?
- status: decided
- question: The global instructions say "No servers, accounts or app stores unless I ask." (D-035). `Skill Dex.app` starts a Node server that only listens on `127.0.0.1:4173` and stops when the tab closes; it is needed to save discards and to launch analyses from the app (D-010, D-015). Is this local server fine, as part of what he asked for?
- depends: REQ-LAU-004 most directly; REQ-LAU-002 to REQ-LAU-010 all rely on the local server.
- decided_by: D-053

### OP-010 Earlier uses: ignored, or kept apart?
- status: decided
- question: Option 1, which he chose (D-005), said [quote omitted]. What was built keeps the earlier uses visible: each card's counter shows the historical total (README [quote omitted]), each detail shows [quote omitted], and the chart of the last 30 days includes days before the start date. The agent had recommended keeping the history apart as "usos totales". Is keeping the history visible, without XP, what he wants?
- depends: REQ-USE-002, REQ-USE-006.
- decided_by: D-047

### OP-011 Which skills count as "all my skills"?
- status: decided
- question: D-001 asks for a list of [quote omitted]. The scanner (`Tecnico/scan.mjs`) reads only `~/.omp/agent/skills` and `~/.omp/agent/managed-skills`. Skills elsewhere are not listed: for example the project skills under a project's `.omp/skills/` (such as the six keelblocks skills of this project), or `cua-driver` and `ghostex-visuals`, which appear in the usage history but not in those folders. Should Skill Dex list them too?
- depends: REQ-CAT-001, REQ-USE-001.
- decided_by: D-048
- note: Project skills are listed (REQ-CAT-015). Skills only seen in the usage history, such as `cua-driver` and `ghostex-visuals`, were not part of the question and stay unlisted unless they sit in a scanned folder.

### OP-012 Six watchlist entries are discarded without a reason
- status: decided
- question: In `Seguimiento/watchlist.json`, six entries have `status: descartada` (<skill>, <skill>, <skill>, <private>, <private>, <skill>) but no `discard_reason` and no `discarded_at`. They were set by the agent at analysis time, before the discard button existed [INFERENCE]. The README says [quote omitted] and the app now requires a reason. Did <private> decide these discards? If yes, is the verdict of each report the reason to record; if not, do they go back to "por analizar"?
- depends: REQ-ANA-010, REQ-ANA-018.
- decided_by: D-044

### OP-013 Are the similar-skill pairs a problem?
- status: decided
- question: The health panel lists pairs of installed skills with similar descriptions (for example `<skill>` / `performance`, `<skill>` / `copywriting`, `<skill>` / `<skill>`). The agent asked whether he sees them as a problem and got no answer. Should Skill Dex only show them, or also recommend keeping one of each pair?
- depends: REQ-USE-016.
- decided_by: D-046

### OP-014 Do these catalogue drafts describe what the list should do?
- status: decided
- question: REQ-CAT-003, REQ-CAT-005, REQ-CAT-006, REQ-CAT-007, REQ-CAT-010 and REQ-CAT-014 describe how the list works today (categories guessed from the skill name, filters, sort orders, the three tabs Instaladas, Watchlist and Descartadas, closing the detail, favourite and mastered marks). Is that what it should do, with which exceptions?
- depends: The drafts named in the question.
- decided_by: D-048

### OP-015 How does the game work in the new design?
- status: decided
- question: <private> decides the game together with the new design (D-049). Settled: only season uses give XP (D-047, D-070, D-075), level costs (D-050, D-070), a congratulation card (D-051, D-057), the level titles (D-088), each skill's own level and the rarity kept, the achievements dropped (D-089), the mastered mark removed (D-090).
- depends: REQ-USE-008, REQ-USE-009 and REQ-USE-013 are ready; REQ-USE-010 is descoped; REQ-USE-004 and REQ-USE-012 do not depend on the game and are asked apart.
- decided_by: D-089
- note: D-088 and D-090 settle the titles and the mastered mark.

### OP-016 Do these analysis and watchlist drafts describe what should happen?
- status: decided
- question: REQ-ANA-005, REQ-ANA-010, REQ-ANA-012, REQ-ANA-013, REQ-ANA-014, REQ-ANA-016, REQ-ANA-019, REQ-ANA-020 and REQ-ANA-021 describe today's analysis flow: limited to 20 minutes and 1.5 dollars per run; never sets "descartada" by itself; "Analizar de nuevo"; Cancelar; "Quitar intento" for failed runs; an analysis interrupted by closing the app is marked failed; "Recuperar en watchlist"; a watchlist entry that gets installed shows only among the installed skills; the full log is kept in `Tecnico/cache/`. "Limited permissions" (D-017) is implemented as: tools read, bash, web search, grep and glob only, a temporary working folder, no writing to the project (the app saves the result). The `<skill>` skill reports six sections (what it does, reviews and score, security, activation, overlaps, recommendation), adding security and overlaps to his four (D-007). Do these hold, with which exceptions?
- depends: The drafts named in the question; REQ-ANA-004, REQ-ANA-007.
- decided_by: D-043

### OP-017 Smaller security and privacy confirmations
- status: decided
- question: Four drafts were not part of any interview question: `skillcheck.mjs` clones a URL into the system temporary folder and leaves it there for the system to clean (REQ-SEC-008); a clean scan is presented as "no alerts", never as a guarantee (REQ-SEC-009); SkillSpector contacts only `api.osv.dev` for dependencies, as the README says (REQ-DAT-006); the usage scan reads the omp session logs on this Mac only and sends nothing (REQ-DAT-007). Do these hold?
- depends: The drafts named in the question.
- decided_by: D-062
- note: The final form asked about these four rules (question D). The temporary copy is to be deleted after the check (REQ-SEC-008).

### OP-018 Do these launch and server drafts describe what should happen?
- status: decided
- question: REQ-LAU-003 and REQ-LAU-005 to REQ-LAU-010 describe how the app starts and stops today: it rescans before opening the page; it rejects change requests that do not come from its own page; it stops a few seconds after the last tab closes (up to 3 minutes if the browser is in the background) unless an analysis runs; it shows a dialog when Node.js is missing; "Refrescar datos" rescans; without the server the page says to open `Skill Dex.app`. Do these hold?
- depends: The drafts named in the question.
- decided_by: D-053

### OP-019 Do these data drafts describe what should happen?
- status: decided
- question: REQ-DAT-001, REQ-DAT-003 and REQ-DAT-007 describe where data lives today: favourite and mastered marks only in the browser (lost in another browser, R-003); the watchlist and its discards in `Seguimiento/watchlist.json`; the omp session logs read on this Mac only. Do these hold?
- depends: The drafts named in the question.
- decided_by: D-054
- note: D-054 decides the marks (REQ-DAT-001) and the watchlist file (REQ-DAT-003). REQ-DAT-007 was not in the question and moved to OP-017.

### OP-020 Do these interface drafts describe what should happen?
- status: decided
- question: REQ-UI-002 and REQ-UI-004 describe today's interface: it opens in the theme last chosen in that browser, or the system theme; all text is in Spanish. Do these hold?
- depends: The drafts named in the question.
- decided_by: D-062
- note: D-062 confirms the theme memory; D-063 replaces the Spanish interface with an English one (REQ-UI-005).

### OP-021 Recovering or re-analysing a discarded entry erases its reason
- status: decided
- question: D-010 keeps discarded entries so that a later question is answered with the reason. Today "Recuperar en watchlist" and "Analizar de nuevo" on a discarded entry delete `discard_reason` and `discarded_at` (`Tecnico/server.mjs`), so the record of why it was discarded is lost. Should the old reason be kept as history when an entry is recovered or analysed again?
- depends: REQ-ANA-019, REQ-ANA-012.
- decided_by: D-044

### OP-022 The launcher and the data files are outside the repository
- status: decided
- question: D-035 asks for the tool to be kept tidy in a private GitHub repository. Only `Tecnico/` is in git. `Skill Dex.app` sits in the project root, holds an absolute path to `Tecnico/lanzar.sh` (its `main.scpt`), and is not in the repository; `Seguimiento/` (watchlist, reports, settings, screenshots) is not in it either. Should the launcher be rebuilt from the repository so that a fresh copy works, and should the watchlist and the reports be versioned too?
- depends: REQ-LAU-002, REQ-DAT-002.
- decided_by: D-055
- note: The launcher is rebuilt so that a fresh copy of the repository works (REQ-LAU-011); the watchlist, reports and other data in `Seguimiento/` stay out of the repository (REQ-DAT-008).

### OP-023 Which findings count as false positives?
- status: decided
- question: D-045 asks for a clear criterion that <private> approves once. Proposed text, in plain language (translated from the Spanish form): "A security scanner finding is a false positive, and the agent may close it without asking you, only if it meets at least one of these conditions: (1) it is in a text that the skill does not run or follow as an instruction: guides, examples, templates or data lists, not in a program or its main instructions (SKILL.md); (2) it is an ordinary word read as a command, for example Spanish 'su' read as the command 'su'; (3) the code does exactly the opposite of what the finding fears, for example a list that blocks dangerous addresses; (4) it is advice written for people ('never judge…', 'without warning'), not an order the agent will obey; (5) it reads data only inside your Mac and does not send it out, for example to start a local program; (6) the scanner itself says it is unsure (under 60 %). It is never a false positive, and is always shown to you: something that sends your data or files to the internet without the skill explaining it; something that deletes files outside its folder; something that asks for passwords, keys or tokens; something that installs programs by itself; and any 'critical' finding. If the agent doubts, it does not close it: it shows it to you. Each false positive is recorded with the date, the skill and the number of the condition that justifies it, and you can see it in the ficha. Medium or low severity findings are not alerts: they are shown as minor notices." Does he approve it, or what does he change? Once approved, the seven findings already closed are checked against it.
- depends: REQ-SEC-004, REQ-SEC-005, REQ-SEC-006 stay drafts.
- decided_by: D-056
- note: <private> approved the shorter text shown in the final form (quoted in D-056), not the longer draft above.

### OP-024 What kind of level-up message?
- status: decided
- question: D-051 asks for a proposal. Proposal: when a scan or refresh shows that the collection has gone up a level, a card appears in the middle of the screen once, with a short celebration (the new level and title, what made it rise, and a next goal) and an [quote omitted] button to close it; nothing plays a sound. Alternatives: (B) a small notice in a corner that fades out after a few seconds; (C) only a highlighted line next to the level. Because the app will be public (D-055), the texts do not use his name. Example texts to choose from: "You reach level 4 · Strategist! You have used 12 different skills this season. Next challenge: try one you have not used yet." / "Level 5 reached! Your star skill was <skill>, with 9 uses. You need 480 XP for level 6." / "Congratulations, you are now a Master! What lifted you most: 3 skills used for the first time." Which kind (A, B or C) and which tone does he choose?
- depends: REQ-USE-019 is ratified; its form and texts wait for this answer.
- decided_by: D-057
- note: The texts will be in English (D-063); the example texts above are only a guide to tone.

### OP-025 What does "Descubre skills" do exactly?
- status: decided
- question: D-052 asks for a section that searches GitHub for skills. Still to decide: (1) where it searches: only GitHub, or also lists of skills such as "awesome" lists and skill directories; (2) how a search starts: <private> types words, or Skill Dex also suggests skills from what he uses and what he lacks; (3) what each result shows (for example name, short description, stars, last update, author); (4) what he can do with a result: analyse it with "Analizar skill" (which never installs), add it to the watchlist without analysing, or only open it on GitHub; (5) whether skills already installed, in the watchlist or discarded are hidden or marked; (6) GitHub limits searches without an account, and searching with his GitHub account needs a token kept outside the repository: is that acceptable?
- depends: REQ-DIS-001 to REQ-DIS-004 stay drafts.
- decided_by: D-058
- note: D-058 (actions), D-059 (suggestions and a random popular skill) and D-061 (his GitHub login) answer points 1 to 4 and 6. Point 5 and free-text search remain open (OP-029, OP-028).

### OP-026 In which language are the public install instructions?
- status: decided
- question: D-055 makes the repository public later and asks for an app anyone can install. The app and its notes are in Spanish. Are the install instructions of the public repository in Spanish, in English, or in both?
- depends: REQ-LAU-012.
- decided_by: D-066

### OP-027 Does the requirements package go public with the code?
- status: decided
- question: D-055 keeps <private>'s data out of the repository, which becomes public later. This package lives in `Tecnico/spec/`, inside the repository, and quotes his messages, names his installed skills and his watchlist entries, and cites paths of his Mac and his session files. When the repository is made public, does the package go with it as it is, go with the personal parts removed, or stay out of the public repository?
- depends: REQ-DAT-008; publication (D-055).
- decided_by: D-065

### OP-028 Can the user also type what to look for in "Descubre skills"?
- status: decided
- question: D-059 asks for suggestions from what <private> uses and a random popular skill. The form also offered typing a search, and his answer did not say yes or no to that. Should "Descubre skills" also have a box to type what to look for?
- depends: Whether a typed search is added to REQ-DIS-001.
- decided_by: D-085

### OP-029 How do skills he already knows appear among the discoveries?
- status: decided
- question: When "Descubre skills" suggests a skill that is already installed, already in the watchlist or already discarded, what happens to it in the list of suggestions? Recommended: show it with a label ("Installed", "In watchlist", "Discarded") so that it is not analysed twice; the other option is not to show it. His answer to the first version of this question (D-060) explained how the watchlist works; it did not answer this.
- depends: A requirement on how discovery results show known skills.
- decided_by: D-086

### OP-030 Are the analysis reports also in English?
- status: decided
- question: D-063 wants the app entirely in English. The analysis reports shown in the app are written in Spanish today (the prompt in `Tecnico/server.mjs` asks for [quote omitted], and `<skill>` writes in Spanish). Should new reports be written in English, or stay in Spanish because they are for <private>?
- depends: REQ-UI-005 (whether reports count as interface), REQ-ANA-007.
- decided_by: D-084
- note: Reports written before this decision are in Spanish; whether they are translated is OP-039.

### OP-031 Where do the updates of a skill come from?
- status: decided
- question: To know whether a skill has a newer version, Skill Dex can look at (a) the GitHub repository it came from, comparing its files with the installed ones; (b) the version number some skills write in their `SKILL.md`; or (c) both. Recommended: (c), and show which files change. Many skills do not record where they came from; those could not be checked. Which does he prefer?
- depends: REQ-UPD-004 and how REQ-UPD-001 finds updates.
- decided_by: D-077

### OP-032 How often are updates looked for?
- status: decided
- question: Does Skill Dex look for updates every time the app opens, once a day, or only when he presses a "Check for updates" button? Recommended: only with the button, so that nothing is spent unless he asks.
- depends: REQ-UPD-001.
- decided_by: D-078

### OP-033 Does every update pass the security check first?
- status: decided
- question: A new version may bring dangerous changes. Does each update pass the security scanner (with the false-positive criterion he approved) before he can apply it? Recommended: yes, always.
- depends: REQ-UPD-003.
- decided_by: D-079

### OP-034 Are the skills he wrote himself included?
- status: decided
- question: Some skills were created by him or learned by omp on its own ("self-learned"); they come from no repository. Do they appear in the updates section? Recommended: no, only those that come from outside.
- depends: REQ-UPD-001 scope.
- decided_by: D-080

### OP-035 What happens to his own changes when updating?
- status: decided
- question: If he changed an external skill by hand and a newer version comes out, updating could erase his changes. What happens? (a) Warn him and do not update that skill until he confirms; (b) save a copy of his version before updating; (c) both. Recommended: (c).
- depends: REQ-UPD-002.
- decided_by: D-081

### OP-036 Does Skill Dex apply the update or only show it?
- status: decided
- question: When there is an update, does Skill Dex install it when he presses a button, or only show it and let an agent apply it when he asks? In both cases nothing is updated unless he decides. Recommended: an "Update" button that asks for confirmation.
- depends: REQ-UPD-002.
- decided_by: D-082

### OP-037 Where do the short descriptions come from?
- status: decided
- question: The list will show a short description of each skill (D-071). Options: (a) an agent writes it once per skill and it is saved in a file he can edit, new skills getting theirs when they appear; (b) it is generated again at every scan, which costs something each time and may change the text. Recommended: (a). Since the app will be in English (D-063), are they written in English? Recommended: yes.
- depends: REQ-CAT-019.
- decided_by: D-076

### OP-038 What happens to what proposal D does not show?
- status: decided
- question: Proposal D does not show the catalogue health panel (tokens, heavy skills, load warnings), the pairs of similar skills with their recommendation, which he already approved (REQ-USE-016, REQ-USE-017), or the "mastered" mark. Do they stay in the new app (for example in a section of their own or in each skill's ficha) or are they removed? Recommended: the similar pairs and the health panel in a sidebar section; the "mastered" mark is decided with the game (OP-015).
- depends: REQ-USE-015, REQ-USE-016, REQ-USE-017, REQ-CAT-014 in the new design.
- decided_by: D-083
- note: The row of the table also named the mastered mark, so it goes to the Health section too (REQ-USE-023); what "mastered" means is not defined (glossary).

### OP-039 Are the analysis reports that are already in Spanish translated?
- status: decided
- question: New reports are in English (D-084). Those that already exist in `Seguimiento/analisis/` are in Spanish. Are they translated into English, generated again, or left as they are?
- depends: Whether REQ-ANA-026 also covers the reports that already exist.
- decided_by: D-092

### OP-040 Should this audit finding be fixed: the malformed request URL that crashes the server?
- status: decided
- question: The security audit (`<home>/security-audit-skill/skill-dex/run-1/`) confirmed, with low severity: the malformed request URL that crashes the server. Is it fixed in the public repository? Recommended: yes. Every push to the public repository needs his OK.
- depends: REQ-SEC-012 stays a draft until he answers.
- decided_by: D-114

### OP-041 Should this audit finding be fixed: the loopback API trusting the Origin header?
- status: decided
- question: The security audit (`<home>/security-audit-skill/skill-dex/run-1/`) confirmed, with low severity: the loopback API trusting the Origin header. Is it fixed in the public repository? Recommended: yes. Every push to the public repository needs his OK.
- depends: REQ-SEC-013 stays a draft until he answers.
- decided_by: D-114

### OP-042 Should this audit finding be fixed: triage exclusions looking only at a 140-character snippet?
- status: decided
- question: The security audit (`<home>/security-audit-skill/skill-dex/run-1/`) confirmed, with low severity: triage exclusions looking only at a 140-character snippet. Is it fixed in the public repository? Recommended: yes. Every push to the public repository needs his OK.
- depends: REQ-SEC-014 stays a draft until he answers.
- decided_by: D-114

### OP-043 Should this audit finding be fixed: templates, examples and samples folders treated as inert even for runnable files?
- status: decided
- question: The security audit (`<home>/security-audit-skill/skill-dex/run-1/`) confirmed, with low severity: templates, examples and samples folders treated as inert even for runnable files. Is it fixed in the public repository? Recommended: yes. Every push to the public repository needs his OK.
- depends: REQ-SEC-015 stays a draft until he answers.
- decided_by: D-114

### OP-044 Should the "Last checked" and "No check yet" messages in Updates agree?
- status: decided
- question: Updates shows "Last checked: <date>" and "No check yet" at the same time when there is a saved date but no cached result. Is this fixed? Recommended: yes.
- depends: REQ-UPD-014 stays a draft until he answers.
- decided_by: D-133

### OP-045 Should each server port have its own session token file?
- status: decided
- question: The session token file (`cache/session-token`) is shared by every server started from the same folder, so a second test server on another port overwrites it and the app icon then opens the blocked page. Is this fixed with one token file per port? Recommended: yes.
- depends: REQ-LAU-016 stays a draft until he answers.
- decided_by: D-133

## Risks

### R-001 The quotes live outside the repository
- risk: The session files that hold <private>'s words are on this Mac only and are not in git; if they are lost, a quote can no longer be checked against its source.
- mitigation: none

### R-002 The comparison versions are outside git
- from: D-042
- risk: The previous version and the intermediate proposal that OP-001 compares now live in `Seguimiento/versiones/`, which is not in git; if that folder is lost they would have to be rebuilt from the omp session logs.
- mitigation: They are no longer in the system temporary folder (D-042); `Seguimiento/` lives in <private>'s Developer folder.

### R-003 Favourite and mastered marks lived only in the browser
- from: D-003
- risk: The favourite and mastered marks are kept in the browser's local storage (`Tecnico/web/catalog.js`); another browser, a cleared cache or a new Mac starts empty, and the XP that depends on mastered skills changes with them.
- mitigation: REQ-DAT-001 also saves them to a file (D-054); until that is built, the risk stands.

### R-004 The security scan is heuristic
- from: D-011
- risk: SkillSpector in static mode matches patterns; after the threshold was raised for fewer false positives, a real problem in documentation or of medium severity may not be flagged for review.
- mitigation: REQ-SEC-009 presents a clean scan as no alerts, not a guarantee; the analysis reads `SKILL.md` and scripts by hand (`<skill>` step 3).

### R-005 An unattended analysis clones and inspects untrusted repositories
- from: D-015
- risk: An analysis launched from the app clones external repositories and has `bash`; the limits on what it runs are instructions in its prompt, not a sandbox.
- mitigation: REQ-ANA-004 gives the agent no shell (a read-only sandbox for Codex) and REQ-ANA-031 an allowlisted environment; REQ-SEC-008 clones in a private temporary folder and REQ-SEC-016 removes symlinks; REQ-ANA-005 limits time and cost.

### R-006 Personal data could reach the public repository
- from: D-055
- risk: Once the repository is public, a generated file, a report or a hard-coded path that slips into a commit would publish <private>'s skills, usage or watchlist.
- mitigation: REQ-DAT-004 and REQ-DAT-008 keep data out of the repository; REQ-DAT-009 publishes only a clean version of this package (D-065); publication itself needs his explicit approval.
