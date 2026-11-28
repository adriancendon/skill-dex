# UPD: Skill updates

A new section <private> asked for (D-072). Nothing of it is built. He decided how it works on 2026-11-27 (D-077 to D-082): updates come from the skill's source repository and version number, are looked for only when he presses "Check for updates", pass the security check first, cover only external skills, warn about his local edits and save a copy of his version, and are applied by an "Update" button that asks for confirmation. Buttons and labels follow the English interface (REQ-UI-005). Priority 2 is a placeholder: he gave no order.

### REQ-UPD-001 A section to review skill updates
- pattern: ubiquitous
- statement: Skill Dex shall offer a section where the user can review the updates available for the installed skills.
- rationale: D-072. It is one more section of the sidebar (REQ-UI-006). How updates are found is REQ-UPD-005, when REQ-UPD-006, which skills are included REQ-UPD-007.
- acceptance_criteria:
  - AC1 [judgement] GIVEN an installed skill whose source has a newer version WHEN <private> opens the updates section THEN that skill is listed as having an update
  - AC2 [judgement] GIVEN no skill with an update WHEN he opens the section THEN it says that everything is up to date
- scope: A new section of the app.
- conditions: none
- exceptions: none
- source: D-072
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-072 v1
- accepted_by: D-129 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-UPD-002 Nothing updates without the user's action
- pattern: ubiquitous
- statement: Skill Dex shall not change an installed skill unless the user has explicitly chosen to update it.
- rationale: Reviewing updates (D-072) is a step before changing anything, as analysing is before installing (D-006). D-082 makes the explicit choice a confirmed "Update" click (REQ-UPD-010).
- acceptance_criteria:
  - AC1 [judgement] GIVEN skills with updates available WHEN <private> opens and closes the updates section without choosing to update THEN every skill folder is unchanged
- scope: The updates section.
- conditions: none
- exceptions: none
- source: D-082
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-082 v1
- accepted_by: D-129 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-UPD-003 Every update is security-checked before it can be applied
- pattern: event
- statement: When an update of a skill is found, Skill Dex shall check the new version with the security scan and its approved false-positive criterion before the user can apply it.
- rationale: D-079 (owner answer: yes, always); the security scan and criterion are REQ-SEC-004 and REQ-SEC-007.
- acceptance_criteria:
  - AC1 [judgement] GIVEN an update with a finding to review WHEN <private> looks at it in the updates section THEN he sees the finding before any option to apply it
- scope: The updates section.
- conditions: none
- exceptions: none
- source: D-079
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-079 v1
- accepted_by: D-129 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-UPD-004 The user sees what an update changes
- pattern: event
- statement: When the user opens an update of a skill, Skill Dex shall show which files of the skill change and the old and new version where known.
- rationale: D-077 asks to show which files change, so that <private> can judge an update before applying it.
- acceptance_criteria:
  - AC1 [judgement] GIVEN an update that changes `SKILL.md` and one script WHEN <private> opens it THEN he sees those two files listed as changed
- scope: The updates section.
- conditions: none
- exceptions: none
- source: D-077
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-077 v1
- accepted_by: D-129 v1
- note: The mockup shows this as the "Review changes" button. Built in 749b7e7, confirmed by D-094.

### REQ-UPD-005 Updates are found from the source repository and the version number
- pattern: event
- statement: When the user checks for updates, Skill Dex shall compare each installed external skill with the newest version in its source repository, using its source repository and its version number.
- rationale: D-077. Many skills do not record where they came from (OP-031); the source and version are what Skill Dex can compare.
- acceptance_criteria:
  - AC1 [judgement] GIVEN an installed skill whose source repository has a newer version WHEN <private> checks for updates THEN the skill is listed with its old and new version
  - AC2 [judgement] GIVEN an installed skill whose source repository is not known WHEN he checks for updates THEN it is not reported as up to date by mistake, and he can tell it could not be checked
- scope: The updates section.
- conditions: The Mac is online.
- exceptions: A skill whose source repository is not known cannot be compared.
- source: D-077
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-077 v1
- accepted_by: D-129 v1
- builder_choice: how a skill's source repository is found, and how a skill that cannot be checked is shown
- note: built in 749b7e7, confirmed by D-094.

### REQ-UPD-006 Updates are looked for only when the user asks
- pattern: event
- statement: When the user presses "Check for updates", Skill Dex shall look for updates of the installed skills, and at no other time.
- rationale: D-078, so that nothing is spent without his asking.
- acceptance_criteria:
  - AC1 [judgement] GIVEN Skill Dex opened and left idle WHEN <private> has not pressed "Check for updates" THEN no request was made to any skill's source repository
  - AC2 [judgement] GIVEN the updates section WHEN he presses "Check for updates" THEN the updates found are listed
- scope: The updates section.
- conditions: none
- exceptions: none
- source: D-078
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-078 v1
- accepted_by: D-129 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-UPD-007 Only external skills are checked
- pattern: ubiquitous
- statement: Skill Dex shall offer updates only for installed skills that come from outside, and none for skills the user wrote or that omp learned by itself.
- rationale: D-080: the skills of other origins come from no repository. The **origin** values `user` and `self-learned` are not external; `third-party` is (the old Spanish values `usuario`, `auto-aprendida` and `tercero` are still read, D-120).
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill of **origin** `self-learned` and an external skill with a newer version WHEN <private> checks for updates THEN only the external skill is listed
- scope: The updates section.
- conditions: none
- exceptions: none
- source: D-080
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-080 v1
- accepted_by: D-129 v1
- builder_choice: how a skill counts as external when its **origin** is `user` but it was cloned from a repository
- note: built in 749b7e7, confirmed by D-094.

### REQ-UPD-008 A warning about the user's own edits
- pattern: event
- statement: When the user opens an update of a skill whose files he changed by hand, Skill Dex shall warn him that the update replaces his changes.
- rationale: D-081; an update could otherwise erase his edits without his noticing.
- acceptance_criteria:
  - AC1 [judgement] GIVEN an external skill edited by hand and a newer version of it WHEN <private> opens the update THEN he reads a warning that his changes will be replaced
  - AC2 [judgement] GIVEN an external skill left as installed WHEN he opens its update THEN there is no such warning
- scope: The updates section.
- conditions: none
- exceptions: none
- source: D-081
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-081 v1
- accepted_by: D-129 v1
- builder_choice: how his edits are detected
- note: built in 749b7e7, confirmed by D-094.

### REQ-UPD-009 His version is saved before updating
- pattern: event
- statement: When the user confirms the update of a skill, Skill Dex shall save a copy of his current version of that skill before replacing it.
- rationale: D-081. The copy lets him get his edits back.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill he edited by hand WHEN he confirms its update THEN a copy of his previous version exists, and he can say where it is
- scope: The updates section.
- conditions: none
- exceptions: none
- source: D-081
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-081 v1
- accepted_by: D-129 v1
- builder_choice: where the copy is kept, as long as it stays out of the repository (REQ-DAT-008)
- note: built in 749b7e7, confirmed by D-094.

### REQ-UPD-010 The "Update" button asks for confirmation
- pattern: event
- statement: When the user presses "Update" on a skill's update, Skill Dex shall ask him to confirm before changing the skill.
- rationale: D-082.
- acceptance_criteria:
  - AC1 [judgement] GIVEN an update listed WHEN <private> presses "Update" and then cancels THEN the skill folder is unchanged
- scope: The updates section.
- conditions: none
- exceptions: none
- source: D-082
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-082 v1
- accepted_by: D-129 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-UPD-011 A confirmed update replaces the skill's files
- pattern: event
- statement: When the user confirms an update, Skill Dex shall replace the skill's files with the new version.
- rationale: D-082: Skill Dex applies the update itself, not an agent.
- acceptance_criteria:
  - AC1 [judgement] GIVEN an update listed WHEN <private> presses "Update" and confirms THEN the skill's files are the new version and the skill no longer appears as having an update
- scope: The updates section.
- conditions: none
- exceptions: none
- source: D-082
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-082 v1
- accepted_by: D-129 v1
- note: built in 749b7e7, confirmed by D-094.

### REQ-UPD-012 A version can be skipped
- pattern: event
- statement: When the user presses "Skip this version" on an update, Skill Dex shall stop listing that version as an update of the skill.
- rationale: The mockup of D has a "Skip this version" button next to "Review changes" and "Update"; <private> confirmed he wants it (D-091): it ignores one version and stops warning about it until a newer one comes out.
- acceptance_criteria:
  - AC1 [judgement] GIVEN an update listed WHEN <private> presses "Skip this version" THEN that version leaves the list and the skill folder is unchanged
- scope: The updates section.
- conditions: none
- exceptions: none
- source: D-091
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-091 v1
- accepted_by: D-129 v1
- builder_choice: how a skipped version can be brought back
- note: built in 749b7e7, confirmed by D-094.

### REQ-UPD-013 A skill with no update source shows who it came from
- pattern: ubiquitous
- statement: Skill Dex shall show a skill that `skills-meta.json` marks as having no update source as coming from the person named there, with no update source, instead of as unknown.
- rationale: D-110 and D-106: <skill> comes from a third party and has no repository. The name stays in his private data, not in public code.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a skill marked in `skills-meta.json` as having no update source and a giver WHEN <private> opens Updates THEN it reads "from" the giver's name with "no update source", not "Source unknown"
  - AC2 [judgement] GIVEN the public repository WHEN it is searched for the giver's name THEN it is not found
- scope: The updates section.
- conditions: none
- exceptions: none
- source: D-110, D-106
- status: fulfilled
- version: 1
- priority: 2
- ratified_by: D-110 v1
- accepted_by: D-129 v1
- note: built on branch multi-agente, merged and pushed 2026-11-28

### REQ-UPD-014 Updates never shows a check date and "No check yet" together
- pattern: state
- statement: While a check date is saved for the updates but no result is cached, Skill Dex shall show one coherent message in Updates.
- rationale: Updates shows "Last checked: <date>" and "No check yet" at the same time.
- acceptance_criteria:
  - AC1 [judgement] GIVEN a saved check date and no cached result WHEN <private> opens Updates THEN it does not show both messages
- scope: Skill Dex as published.
- conditions: none
- exceptions: none
- source: OP-044, D-133
- status: active
- version: 1
- priority: 2
- ratified_by: D-133 v1
- note: Built: Updates shows "Check again to see results" when a date is saved without results. Approved by D-133; not yet accepted.
