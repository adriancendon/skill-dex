# Requirements package

This folder holds what a builder needs to work without guessing: the decisions that were made, the requirements that follow from them, the terms they use, and the current state. It follows the keelblocks format. Everything here is plain Markdown, apart from the data schemas and API contracts of a full package (see "Tiers"); `tools/keelblocks.py` checks it.

## Files

| File | Content | Edited by hand |
|---|---|---|
| `decisions.md` | Decisions, open points and risks. The only place where a decision is recorded. | yes |
| `requirements/*.md` | Requirements, one file per area. | yes |
| `glossary.md` | Terms the requirements use. | yes |
| `state.md` | Where the work stands now. Replaced, never appended to. | yes |
| `trace.md` | Overview and reverse indexes. | no, generated |
| `tools/keelblocks.py` | The checker. | no, copied |
| `architecture.md` | Full tier only: the architecture in the sections of arc42, and which pieces of the full tier apply. | yes |
| `c4.md` | Full tier only: the elements of the system and their relationships, in two tables. | yes |
| `views.md` | Full tier only: diagrams drawn from `c4.md`. | no, generated |
| `adr/*.md` | Full tier only: architecture decision records (ADRs). | yes |
| `schemas/` | Full tier only, when data schemas apply: JSON Schemas with example instances. | yes |
| `api/` | Full tier only, when API contracts apply: OpenAPI contracts. | yes |

Reading order for someone new: this file, `state.md`, `glossary.md`, then the requirements of the area in hand, and from there the decisions they name. In a full package, read `architecture.md` and `views.md` after `glossary.md`, and the ADRs that the requirements, the architecture or the decisions name.

## Commands

Run from the folder that contains this package (the examples assume the package folder is `spec`):

```
python3 spec/tools/keelblocks.py check     # report every broken rule, exit 1 if any
python3 spec/tools/keelblocks.py index     # rewrite trace.md, and views.md in a full package, from the sources
python3 spec/tools/keelblocks.py rules     # list the rules
```

Run `index`, then `check`, after every change to this folder. The script needs Python 3.9 or newer; a core package needs nothing else, a full package needs Python 3.11 or newer and three Python packages (see "Tiers"). The Markdown files you write are UTF-8; one that is not stops the script with exit code 2, as does a folder that is no package. A line of a Markdown, JSON or YAML file ends at CR, LF or CRLF, as CommonMark, JSON and YAML 1.2 have it, and a report names the line counted so: a byte order mark belongs to no line, and any other character, such as U+2028, U+0085 or a form feed, is text within its line. A damaged `trace.md` or `views.md` is only reported as out of date, and `index` writes it anew. A file name that is not UTF-8, which some file systems allow, is shown escaped where `check` names it in a report line and where `index` writes it into `trace.md`: each byte that is not UTF-8 as Python names it, a lone surrogate such as `\udce9` for the byte `0xE9`, written as JSON writes it. A name in UTF-8, such as `größe.md`, is shown as it is.

## How an entry is written

An entry starts with a level-3 heading that carries its id and a title, followed by a list of fields:

```
### <ID> <Title>
- field: value on one line
- list_field:
  - first item
  - second item
```

Field names are lower case. A field has either a value on its line or a list below it, never both. A long value may continue on following lines indented by two spaces. A field that has nothing to say is left out; an empty one is reported. Text below the fields that is not a field is a free note. Text inside fenced code blocks (opened with three or more backticks or tildes) is ignored by the checker.

A level-3 heading that begins with an id is an entry wherever it stands. In a file where its kind does not live it is reported and defines nothing. A heading that only resembles an id, such as `### D-1 ...`, is reported as a malformed id in `decisions.md` and under `requirements/`, where entries live, and in a full package also under `adr/`; it is ordinary text in any other file.

Ids are never reused and never renumbered. Refer to an entry by its id anywhere in this folder. The checker reads every file here whose name ends in `.md`, in subfolders and linked folders too, each folder once, and reports ids that are not defined. An id in inline code counts as a reference like any other; only fenced code blocks are left out. The checker does not read this `README.md`, the generated `trace.md`, in a full package the generated `views.md`, `tools/`, or files and folders whose name starts with a dot.

| Kind | Id | Lives in |
|---|---|---|
| Decision | `D-001` | `decisions.md` |
| Open point | `OP-001` | `decisions.md` |
| Risk | `R-001` | `decisions.md` |
| Requirement | `REQ-<AREA>-001`, area in capitals | `requirements/*.md` |
| ADR, full tier only | `ADR-001` | `adr/*.md` |

## Decisions

```
### D-007 Entries are listed unread first
- date: 2026-03-02
- origin: owner
- quote: (omitted from the public copy)
- decision: The list shows unread entries before read ones; each group is ordered by date added, newest first.
- supersedes: D-003 (the order by date alone)
```

| Field | Required | Content |
|---|---|---|
| `date` | yes | `YYYY-MM-DD`. |
| `origin` | yes | `owner`: the owner decided. `constraint`: a fact the owner stated. `derived`: worked out by someone else inside an owner decision, open to the owner's correction. |
| `quote` | for `owner` and `constraint` | The owner's words, verbatim, in the language they were said in. |
| `basis` | for `derived` | The owner decision or constraint it is derived from. |
| `decision` | yes | What holds from now on. Keep it to a sentence or two. |
| `context` | no | What was asked or what led to it. |
| `supersedes` | no | The other decision it replaces, with the part replaced in round brackets if it is only a part. What stands in the brackets, nested brackets included, describes; an id there is not a replaced decision. A bracket that is never closed describes everything after it. A bracket inside quoted text (see "Patterns") opens and closes nothing. |
| `superseded_by` | when another decision supersedes this one | The replacing decision. Both directions must be written. |
| `affects`, `note` | no | Requirements it touches; free remark. |

A proposal, a recommendation or a reviewer's finding is not a decision. It becomes one when the owner says so, and then it is recorded with the owner's words.

## Open points and risks

```
### OP-002 Archive old entries?
- status: open
- question: Should entries read more than 90 days ago leave the default list?
- depends: REQ-LIST-006 stays a draft until this is decided.

### R-001 Hand-edited file can be malformed
- from: D-002
- risk: A user edit can leave a line the program cannot read.
- mitigation: REQ-STORE-002 skips and reports such lines.
```

An open point has `status` (`open`, `decided`, `parked`, `dropped`), `question` (what is open) and `depends` (what waits for it). Only the owner moves it out of `open`: `decided` needs `decided_by`, `parked` and `dropped` need `status_by`, each naming an owner decision or constraint. A risk has `risk` and `mitigation` (write `none` if there is none), and optionally `from`. Both may carry a `note`.

## Requirements

```
### REQ-LIST-003 Adding a known address is rejected
- pattern: unwanted
- statement: If the user adds an address that is already in the **reading list**, then lantern shall reject the addition with a message that names the existing **entry**.
- rationale: A second copy would have to be marked read twice (OP-001, D-009).
- acceptance_criteria:
  - AC1 [mechanical: `python3 -m unittest tests.test_add.DuplicateTest.test_file_unchanged`] GIVEN a reading list with one entry WHEN the user adds the same address again THEN the reading list file is byte-identical to before
  - AC2 [judgement] GIVEN the same state WHEN the owner reads the printed message THEN he can tell which entry already exists
- scope: The `add` command.
- conditions: none
- exceptions: Addresses that differ only in a trailing slash count as different.
- priority: 2
- source: D-009
- parent: REQ-LIST-007
- status: ready
- version: 1
- ratified_by: D-010 v1
- builder_choice: wording of the message
```

| Field | Required | Content |
|---|---|---|
| `pattern` | yes | One of the patterns below. |
| `statement` | yes | One sentence in the shape of the pattern. It says what the system does, not how it is built. It is always the current truth. |
| `rationale` | yes | Why, with the decision or observation behind it. |
| `acceptance_criteria` | yes | List of criteria, see below. |
| `scope` | yes | Where it applies. |
| `conditions`, `exceptions` | yes | What must hold; what is excluded. Write `none` after considering them. |
| `source` | yes | The decision the requirement comes from. A draft may name an open point instead. |
| `status` | yes | See the life cycle below. |
| `version` | yes | Starts at 1. Raised when a ratified requirement changes in statement, criteria, scope, conditions or exceptions. A version that was never ratified is edited in place. Giving or changing `parent` does not raise it. |
| `priority` | from `ready` on | 1 (first) to 5, in the owner's order. A draft may leave it out. |
| `ratified_by` | from `ready` on | The owner decision that ratified this version, followed by the version: `D-010 v2`. |
| `accepted_by` | for `fulfilled` | The owner decision that accepted the result of this version, followed by the version: `D-011 v2`. |
| `status_by` | for `parked` and `descoped` | The owner decision that set it aside. |
| `changes` | from version 2 on | A list with one item per version, each `vN D-nnn: what changed`, as in the example under "Changing a requirement". |
| `supersedes`, `superseded_by` | for `superseded` | The replaced or replacing requirement; both directions. `superseded_by` and the status `superseded` go together: neither stands without the other. Replacements do not run in a circle. |
| `parent` | no | The story or requirement this one belongs to, see "Stories and parents". |
| `units` | no | Files or modules it touches, separated by `;`. |
| `builder_choice` | no | What the builder may decide. Everything not listed here is binding. |
| `slice`, `note` | no | Delivery group; free remark. |

### Patterns

A single requirement is written in one of the six sentence shapes of EARS (Easy Approach to Requirements Syntax, Mavin et al., https://alistairmavin.com/ears/). Name the system by its real name. The seventh pattern, `story`, is for the level above, see "Stories and parents".

| Pattern | Shape |
|---|---|
| `ubiquitous` | The *system* shall *response*. |
| `state` | While *state*, the *system* shall *response*. |
| `event` | When *trigger*, the *system* shall *response*. |
| `optional` | Where *feature is present*, the *system* shall *response*. |
| `unwanted` | If *unwanted trigger*, then the *system* shall *response*. |
| `complex` | While *state*, when *trigger*, the *system* shall *response*. |
| `story` | As a *role*, I want *goal*, so that *benefit*. |

A statement ends with a full stop. An EARS statement has `shall` exactly once and a response after it: this format asks for one response per requirement, and two things the system must do are two requirements. `complex` means a state or feature first (`While`, `Where`), then a trigger (`when`, `if`). After an `if` the system may follow `then`; in `unwanted` it must.

The checker holds a statement to these points and to the outline of its pattern, not to finer grammar. It reads the statement as one line, a continued value joined with spaces, and first leaves out quoted text: inline code, from a run of backticks to the next run of exactly as many, and text from one straight double quote (`"`) to the next one outside inline code. A command or a quoted message may hold anything, `shall` and full stops included. A backslash means nothing to the checker, here or anywhere else in the package, except before a `|` in a row of `glossary.md` (see "Terms"): it does not keep a backtick, a quote mark, a bracket or a bold mark from counting. In what is left, the checker requires that

- the statement ends with a full stop;
- an EARS statement has ` shall ` (lower case, a space on each side) exactly once, with a letter, a digit or quoted text after it; two that share the space between them count as two;
- an EARS statement begins with `When ` for `event`, `If ` for `unwanted`, `While ` for `state`, `Where ` for `optional`, and `While ` or `Where ` for `complex`; a `ubiquitous` statement begins with none of these four words;
- in the other five patterns a `, ` stands before `shall`: the system is what follows the last one, and the condition is what stands between the first word and it. The condition of `complex` holds `, when ` or `, if ` (in upper or lower case) and is split in two at the first of them; the condition of `state` and `optional` holds neither;
- the word `then` (lower case) opens the system in `unwanted`, may open it in `complex` when the condition is split at `, if `, and opens it in no other pattern; it does not belong to the system;
- the system, each part of the condition, and in `ubiquitous` all that stands before `shall`, hold a letter, a digit or quoted text besides a leading `the`, `a` or `an` (in upper or lower case);
- a `story` is `As a `, `As an ` or `As the `, its role up to the first `, I want `, its goal up to the last `, so that `, its benefit and the full stop; role, goal and benefit each hold a letter, a digit or quoted text.

The checker does not count sentences, clauses or triggers, and round brackets mean nothing to it in a statement. Whether a statement is one sentence with one trigger stays with the author and the reviewer.

### Stories and parents

Single requirements say what the system does. The level above them says what someone wants to achieve. That level is optional, and the owner chooses its form once per project: user stories (`pattern: story`, the usual template, https://agilealliance.org/glossary/user-story-template), requirements in an EARS shape, or no upper level at all. A story begins `As a`, `As an` or `As the`, and keeps the commas of the shape.

```
### REQ-LIST-007 Find the next thing to read
- pattern: story
- statement: As a reader, I want to save addresses in one place and see which ones I have not read, so that I can pick my next read without searching.
- rationale: The purpose the owner named for the tool (D-001); the form follows D-012.
- acceptance_criteria:
  - AC1 [judgement] GIVEN the built program WHEN the owner has used it for a week THEN he picks his next read from `lantern list` alone
- scope: The whole tool.
- conditions: none
- exceptions: none
- priority: 1
- source: D-001, D-012
- status: active
- version: 1
- ratified_by: D-013 v1
```

A requirement names its upper-level entry in `parent`. There are two levels and no more: an entry that has a parent cannot be one, a story cannot have a parent, and a descoped entry cannot be a parent. A parent has the same fields and life cycle as any requirement, and it cannot be `fulfilled` while one of its children is unfinished. A child is finished when it is `fulfilled` or `descoped`, or when it is `superseded` and every requirement that replaces it is finished. An area file plays the part of an epic.

### Acceptance criteria

Each criterion checks one observable thing and reads `ACn [how] GIVEN context WHEN action THEN observable result`.

- `[mechanical: ...]` names the command that checks it as inline code, with whatever a reader needs to run it: backticks around the command, more than one on each side if the command has backticks of its own. Inline code that holds nothing but white space names no command. The checker looks for `] GIVEN `, ` WHEN ` and ` THEN ` outside inline code only, so a command may hold them.
- `[judgement]` means a person decides by looking, normally the owner.

"The tests pass" is not a criterion: say what is true when they pass.

### Terms

A term written in **bold** in the fields of a requirement, or in the note below them, must have a row with a meaning in `glossary.md`. Bold is text with two asterisks on each side (`**term**`), or with two underscores on each side that have no letter or digit directly outside them (`__term__`), with neither white space nor the same mark directly inside the marks; it ends at the first marks that can close it. Inline code is found first, and marks inside it mark nothing. Bold stays within one block of lines and may run over the line breaks inside it. A block is a field with the lines that continue its value, one item of a field's list with the lines that continue it, or a paragraph of the note. A paragraph of the note ends at a blank line, and a line that begins a list item starts a new one: after any spaces or tabs, `-`, `*` or `+`, or digits and `.` or `)`, followed by a space, a tab or the end of the line. Lines the checker leaves out end a block as well: a fenced code block, and a field that is set aside (see "Rules the checker enforces").

The term is what stands between the marks, with every run of white space, line breaks included, read as one space. If it is in italics as a whole, with the same mark, `*` or `_`, at each end and no white space directly inside them (`*term*`, `_term_`), these two marks are taken off. If it is then one piece of inline code as a whole, the term is what the code holds, without white space at its ends, and if that is nothing, there is no term. Otherwise it must be plain words: anything that Markdown could show otherwise than it is written makes the checker report the term instead of guessing it (GLO02). That is a `*`, a backtick, a backslash, `[`, `]`, `<`, `>`, `~`, `|`, the form of a character reference, or underscores that do not stand between two letters or digits. The form of a character reference is `&`, then `#` and digits 0 to 9, `#x` or `#X` and hexadecimal digits, or a letter A to Z in upper or lower case and further such letters and digits 0 to 9, and then `;`, as in `&amp;` or `&#42;`. Write a term that needs any of these as inline code, and in its row of `glossary.md` write a `|` in it as `\|`; marks that are meant as written belong in inline code too.

A row of `glossary.md` is a line that begins with `|`. Without that `|`, and without a `|` at the end of the line that has no backslash directly before it, the row is split into cells at every `|` that has no backslash directly before it. A `|` directly after a backslash stays in its cell as `|`, and that backslash is left out, as in a Markdown table: the cell `` `a\|b` `` holds the term `a|b`. The first cell holds the term, the second the meaning. The first cell is read the way bold is read in a requirement: if it holds bold, the term is what that bold marks, and around the bold the cell may hold nothing but `*` and `_`; a first cell without bold is read like the text between bold marks. A first cell that is not plain words or one piece of inline code is reported (GLO02) and defines nothing. A row defines nothing either if its first cell is empty or holds only dashes, colons and spaces, if its term is `Term` in any case (the heading row), or if it has no meaning. A marked term matches a row whose term is the same text, upper and lower case aside, as `GRÖSSE` matches `Größe`. A marked term that ends in `s`, `es` or `ies` also matches the row of the word without that `s`, without that `es`, or with `y` in place of that `ies`. Other plurals, as in German or Italian, match only a row of their own: mark the singular, or give the plural its own row. Mark a term where a reader could otherwise understand it differently.

### Life cycle

| Status | Meaning | Set by |
|---|---|---|
| `draft` | Written, not yet agreed. | anyone |
| `ready` | Ratified; may be built. | owner decision in `ratified_by` |
| `active` | Being built, or built and not yet accepted. | the builder |
| `fulfilled` | The owner accepted the result against the criteria. | owner decision in `accepted_by` |
| `parked` | Set aside for later. | owner decision in `status_by` |
| `descoped` | Will not be done. Kept with its reason. | owner decision in `status_by` |
| `superseded` | Replaced by another requirement. | `superseded_by` |

Green checks move the work forward; they do not make a requirement `fulfilled`. Only the owner's acceptance does.

### Changing a requirement

Rewrite the fields so that they state the new truth. Do not leave the old wording in place with a remark beside it. If the current version has been ratified, raise `version` and add a `changes` item that names the decision behind the change:

```
- version: 2
- changes:
  - v2 D-007: the order changed from newest first to unread first
```

A version that was never ratified is simply edited; it keeps its number and needs no `changes` item.

A changed requirement has not been ratified or accepted in its new form. Remove `ratified_by` and `accepted_by`, and set `status` back to `draft`. When the owner has ratified the new version, it is `ready` or `active` again with `ratified_by: D-nnn v2`. It becomes `fulfilled` only when the owner accepts the result of the new version. Because both fields carry the version, a ratification or acceptance left over from an earlier version is reported. History is the `changes` list plus version control. The checker does not compare earlier file versions: it cannot see a change that was made without raising `version`.

## State

`state.md` says where the work stands, what comes next and what waits for the owner. When the state changes, replace the content. The file has a size budget of 12,000 bytes (`check --state-budget` changes it); what does not fit is history and belongs in version control.

## Tiers

A package is core or full. It is full when its root holds a file named `architecture.md`; otherwise it is core. Everything this description says about the full tier applies to a full package only. In a core package `ADR-001` is ordinary text, and the files and folders of the full tier are read like any other: a Markdown file for its ids, anything else not at all.

A full package adds what says how the system is built: the architecture (`architecture.md`), its elements and relationships (`c4.md`) with the diagrams drawn from them (`views.md`), architecture decision records (`adr/`), and, where they apply, data schemas (`schemas/`) and API contracts (`api/`). Each piece applies only when its condition holds: an ADR is written when a decision changes the structure of the system, data schemas when the system stores or exchanges data, API contracts when it has an HTTP API. `architecture.md` states for data schemas and for API contracts whether they apply (see "Architecture"). In a full package `trace.md` also lists the ADRs, the schemas and the contracts. Text that a report or `trace.md` takes from a JSON or YAML file stays on its line and can be written: a control character such as a line break, and a lone surrogate (an escape such as `\ud800` that stands for no character), are shown escaped, as JSON writes them.

The script that ships with keelblocks creates a full package with `init --tier full`, or adds the full tier to a core package: it writes `architecture.md`, `c4.md`, the folder `adr/` and `views.md`, and overwrites nothing that exists. It does not create `schemas/` or `api/`; they come when the package states that they apply.

A core package made with an earlier keelblocks holds copies of the script and of this description that do not know the full tier. Before `init --tier full` adds the tier to it, replace both copies together: `tools/keelblocks.py` with the script of the keelblocks-start skill and `README.md` with its format description. Then run `init --tier full`, and then `index` and `check` with the package's own copy, `tools/keelblocks.py`. `init --tier full` says so in one line when a copy in the package differs from its own.

The checker needs Python 3.11 or newer and three Python packages for a full package: `jsonschema` 4.18 or newer, `libfyaml` 1.0.0rc2 or newer, which reads the contracts as YAML 1.2 (see "API contracts"), and `regress` 2026.9.1 or newer, which reads the regular expressions of the schemas as JSON Schema asks (see "Data schemas"). Install them with

```
python3 -m pip install jsonschema "libfyaml>=1.0.0rc2" regress
```

On an older Python, or without these packages, `check` and `index` on a full package, and `init` for one, write nothing, say what is missing, and exit with code 2. A core package needs none of this, and the script does not load the packages for it.

## Architecture

`architecture.md` is divided by its level-2 headings: lines that begin with `## `, outside fenced code blocks. The heading text, with white space at its ends left out, is compared as written. These parts must each stand exactly once, in this order:

```
## Applicability
## 1. Introduction and Goals
## 2. Architecture Constraints
## 3. Context and Scope
## 4. Solution Strategy
## 5. Building Block View
## 6. Runtime View
## 7. Deployment View
## 8. Cross-cutting Concepts
## 9. Architecture Decisions
## 10. Quality Requirements
## 11. Risks and Technical Debts
## 12. Glossary
```

The twelve section names are those of the arc42 template by Gernot Starke and Peter Hruschka (https://arc42.org), English version 9.1, read 2026-11-15. Other level-2 headings may stand anywhere; what stands below them belongs to no part and is not checked.

A section is its heading and the lines after it up to the next level-2 heading or the end of the file. Each of the twelve sections must hold a line that is not blank; lines of a fenced code block count. A section that does not apply says so on a line that begins with `Not applicable:` and gives the reason after the colon; a line anywhere in the file, outside fenced code blocks, that begins with `Not applicable:` and has nothing but white space after it is reported. Nothing else about the content is checked: what the sections say is for the author and the reviewer.

### Applicability

The part `## Applicability` holds one table. Its rows are the lines of the part, outside fenced code blocks, that begin with `|`, and each is split into cells as a row of `glossary.md` is (see "Terms"), with white space at the ends of each cell left out. The first row is the header and its cells are `Piece`, `Applies` and `Reason`. The second row separates the header from the rest: it has as many cells as the header, and each cell is one or more `-` with or without a `:` at either end. Every further row has three cells and states one piece:

```
| Piece | Applies | Reason |
|---|---|---|
| Data schemas | yes | |
| API contracts | no | The tool runs on the command line and offers no HTTP API. |
```

There is exactly one row for `Data schemas` and one for `API contracts`, written so. `Applies` is `yes` or `no`, and `Reason` is not empty when it is `no`. Reported are: a part without a table, another header, a missing separator row, a row with another number of cells, a row for another piece, a missing or repeated row, another value, and a `no` without a reason. A table with another header is not read further. A piece whose row is reported, or that has more than one row, is not compared with the files.

The files must agree with the table. `Data schemas` `yes` needs at least one file whose name ends in `.schema.json` directly in `schemas/`; `no` allows no file in `schemas/` or in a folder below it. `API contracts` `yes` needs at least one file whose name ends in `.yaml`, `.yml` or `.json` directly in `api/`; `no` allows no file in `api/` or in a folder below it. Files and folders whose name starts with a dot are not counted. ADRs need no row: they always belong to the full tier. Whether the table is true, for example whether the system has an HTTP API, is for the owner and the reviewer.

## C4 tables and views

`c4.md` describes the system in the terms of the C4 model (Simon Brown, https://c4model.com/), in two tables. Its level-2 headings `## Elements` and `## Relationships` must each stand exactly once; other level-2 headings may stand beside them. Each of the two parts holds one table, read as `Applicability` is: the rows are the lines of the part, outside fenced code blocks, that begin with `|`, split into cells as a row of `glossary.md` is, with white space at the ends of each cell left out; the first row is the header and the second the separator. The cells of the headers are exactly these:

```
## Elements

| Id | Type | Name | Parent | Technology | Description |
|---|---|---|---|---|---|
| member | person | Member | | | Borrows tools from the library. |
| tackhouse | software_system | Tackhouse | | | Lends the tools of the library. |
| api | container | API | tackhouse | Python 3.12 | Answers the requests of the app. |

## Relationships

| From | To | Technology | Description |
|---|---|---|---|
| member | api | HTTPS/JSON | Borrows a tool. |
```

A part without a table, or with another header or without the separator row, is reported, and its table is not read further. A row below the separator has as many cells as its header; a row with another number of cells is reported and read no further.

An element row:

- `Id` is a lower-case letter followed by lower-case letters, digits and hyphens, and is not the `Id` of an earlier row. A row whose `Id` is not so written, or repeats an earlier one, is reported and defines no element.
- `Type` is one of `person`, `software_system`, `external_system`, `container` and `component`.
- `Name` and `Description` are not empty.
- `Parent` is empty for a `person`, a `software_system` and an `external_system`. For a `container` it is the `Id` of a `software_system`, for a `component` the `Id` of a `container`. A container is inside the software_system its `Parent` names; a component is inside the container its `Parent` names and inside that container's software_system. A `Parent` that names no element of the type its row asks for puts the element inside nothing.
- `Technology` is not empty for a `container` and a `component`; for the other types it may be empty.
- At least one row is a `software_system`.

A relationship row:

- `From` and `To` are the `Id`s of elements. They are not the same element, and neither is inside the other.
- `Description` is not empty.
- `Technology` is not empty when `From` or `To` is a `container` or a `component`.
- The relationship points from `From` to `To`.

An element whose type is not one of the five is reported, and the rules that depend on a type are not applied where its type would decide them: to its own parent and technology, to elements that name it as their parent, and to the technology of a relationship whose other end is no container or component. An element or a relationship that names the `Id` of a row that was reported for its number of cells or its `Id` is not reported again for that name. When the table of elements is not read, the relationships are not held to the elements and no `software_system` is asked for. Cell text other than ids and types is taken as written and never interpreted. The rule that an id of an entry anywhere in the package must be defined (REF01) holds in `c4.md` as in every other file.

### Views

`index` draws `views.md` from `c4.md`, and `check` reports it when it is missing or out of date (GEN01). Do not edit it. It holds one Mermaid flowchart (https://mermaid.js.org/syntax/flowchart.html) for each view:

- the system context view, always;
- a container view for every software_system that has containers;
- a component view for every container that has components.

There is no code level. Each view has a level-2 heading as its title, one line that says its scope, and the diagram; a legend at the top of the file says what the shapes and lines mean. A node shows the name, the type, the technology where there is one, and the description of its element. An arrow points from `From` to `To` and shows the description and the technology where there is one.

A view draws each relationship between the elements it shows, after its ends have been replaced:

- In the context view, an end that is a container or a component is replaced by the software_system it is inside.
- In the container view of a software_system, an end that is a component of that system is replaced by its container, and an end inside another software_system is replaced by that system.
- In the component view of a container, an end inside another container of the same software_system is replaced by that container, and an end inside another software_system by that system.

A relationship whose two ends become the same element is left out, and relationships that become the same in both ends, description and technology are drawn once. The context view shows every person, software_system and external_system, and every relationship that is left after the replacement. A container view shows the containers of its software_system, and a component view the components of its container, inside a box that stands for that system or container; it draws the relationships that have, after the replacement, at least one end inside the box, and shows another element only when such a relationship reaches it. Elements and arrows follow the order of the rows in the tables, and the views follow each other in that order too: the context view, the container views, the component views.

An element is left out of the views when its row defines no element, when its type is not one of the five, or when its parent does not fit its type; so is everything inside it. A relationship is left out when its row has another number of cells, when its ends are not two elements of which neither is inside the other, or when one of its ends is left out.

The box of a container or component view shows the name and the type of its system or container on one line, such as `Tackhouse [software_system]`, so that the elements inside leave it room.

The diagram does not use the user's ids: its nodes are named `e1`, `e2`, ... after the rows of the elements, and the box of a view is named `b1`, so no word of the tables can be read as Mermaid syntax. Text from the tables, the names, technologies and descriptions, is written into the diagram with every character other than the letters A to Z and a to z and the space as a Mermaid entity code (`#35;` for `#`, `#228;` for `ä`), so that it shows as written. The type of an element, one of the five words of `Type` since no other is drawn, is written as it is, in the brackets of a node and in the title of a box, as in `[software_system]`. In the titles of the views a name is written with a backslash before each character of ASCII punctuation, so that Markdown shows it as written.

## ADRs

An architecture decision record (ADR, after Michael Nygard: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) records a decision that changes the structure of the system: its building blocks, their interfaces or dependencies, its technology, its deployment, or the form of data it stores or exchanges. ADRs exist in a full package only. Each is an entry `ADR-001` in a file under `adr/`, in subfolders too, as requirements are under `requirements/`, and the rules for entries hold for it as for the other kinds.

```
### ADR-004 Reminders go through the mail provider's HTTP API
- date: 2026-05-20
- status: accepted
- context: (omitted from the public copy)
- options:
  - the HTTP API of a mail provider
  - a mail server of our own
- decision: The reminder worker sends reminders through the HTTP API of a mail provider.
- consequences: The worker needs the provider's key, and reminders wait while the provider cannot be reached. There is no mail server to run.
- accepted_by: D-008
- supersedes: ADR-002
- affects: REQ-LOAN-003
- units: `worker/remind.py`
```

| Field | Required | Content |
|---|---|---|
| `date` | yes | `YYYY-MM-DD`. |
| `status` | yes | See the statuses below. |
| `context` | yes | What led to the decision: the problem, the forces, the limits. |
| `decision` | yes | What is done. |
| `consequences` | yes | What follows, the good and the bad. |
| `options` | no | The options that were considered. |
| `accepted_by` | for `accepted` | The owner decision that accepted it. |
| `status_by` | for `rejected` and `deprecated` | The owner decision that rejected it or set it aside. |
| `supersedes`, `superseded_by` | for `superseded` | The replaced or replacing ADR; both directions. `superseded_by` and the status `superseded` go together: neither stands without the other. Replacements do not run in a circle. |
| `affects` | no | Requirements it touches. |
| `units` | no | Files or modules it touches. |
| `note` | no | Free remark. |

| Status | Meaning | Set by |
|---|---|---|
| `proposed` | Written, not yet decided. | anyone |
| `accepted` | Holds. | owner decision in `accepted_by` |
| `rejected` | Was considered and does not hold. | owner decision in `status_by` |
| `superseded` | Replaced by another ADR. | `superseded_by` |
| `deprecated` | No longer holds, and nothing replaces it. | owner decision in `status_by` |

`accepted_by` and `status_by` name an owner decision (`origin: owner`); unlike those of a requirement they carry no version. A version in one of them, a `v` followed by digits that stands as a word of its own anywhere in the field, as in `D-008 v1` or `D-008 (v2)`, is reported (ADR03). An ADR is written `proposed`. Only the owner accepts it, by a decision recorded in `decisions.md` in his words that names the ADR; the ADR does not replace that decision. An accepted ADR is not edited: a new ADR supersedes it and says what holds now. The checker cannot see an edit and does not look for one. A term in bold in an ADR is not looked up in the glossary.

## Data schemas

`schemas/` holds JSON Schemas (https://json-schema.org/draft/2020-12) of the data the system stores or exchanges, each with example instances that must pass and instances that must fail:

```
schemas/
  tool.schema.json
  loan.schema.json
  instances/
    tool.valid-drill.json
    tool.invalid-no-name.json
```

- A schema is a file `<name>.schema.json` directly in `schemas/`. A `<name>`, and a `<label>` below, is lower-case letters, digits and hyphens, and begins with a letter or a digit.
- `schemas/instances/` holds files `<name>.valid-<label>.json` and `<name>.invalid-<label>.json`, where `schemas/<name>.schema.json` is a schema of the package.
- Markdown files directly in `schemas/` are read as package Markdown. Every other file or folder in `schemas/` or in `schemas/instances/` is reported. Files and folders whose name starts with a dot are not read.
- Every JSON or YAML file the full tier reads, the schemas, the instances and the contracts, and every file a reference of a contract leads to, must lie inside the package folder once links are resolved. One that a link leads out of the package folder is reported and not read. Markdown files keep the rule of "Ids".
- A JSON file of the package is UTF-8 text in JSON. A key given twice in one object, and `NaN`, `Infinity` and `-Infinity`, which JSON does not have, are reported; a file that cannot be read as JSON is read no further. A number keeps the exact value it is written with, also through validation, as JSON Schema 2020-12 reads numbers: `0.29` is a multiple of `0.01`, `1.0` is an integer and equal to `1`, and `1e2` is `100`. A whole number keeps all its digits, however many. A number of 10 to the power of 10^18 or more in size, such as `1e1000000000000000000`, cannot be held exactly; it is reported, and the file is read no further. A message shows a number as it is written.
- The top level of a schema is an object with `"$schema": "https://json-schema.org/draft/2020-12/schema"`, an `$id` that is a non-empty string and the `$id` of no other schema of the package, and `type`. The schema is valid against the meta-schema of JSON Schema 2020-12, and the patterns the meta-schema marks as `format: regex`, the values of `pattern` and the keys of `patternProperties`, are valid regular expressions.
- A pattern is read as JSON Schema 2020-12 asks, as a regular expression of ECMA-262 in its Unicode mode, by the Python package `regress`; the checker does not read patterns with Python's own `re`. So `\p{L}` is a letter of any script, `\d` and `\w` stand only for the ASCII digits and word characters, and `\s` includes every Unicode space. A pattern that ECMA-262 does not accept, such as `(?i)a` or `\a`, is reported (SCH02). The same reading holds wherever the validator uses a pattern: for `pattern`, for `patternProperties`, and for the properties that `additionalProperties` and `unevaluatedProperties` leave to it.
- A lone surrogate in a pattern, a JSON escape such as `\ud800` that stands for no character, is read as ECMA-262 reads it in its Unicode mode: as a code point of the pattern, which only that code point matches. What decides is the run of backslashes directly before it, inside a character class as outside: after none or an even number, such as `\\` for one backslash, it stands for itself; after an odd number it is the operand of an escape, which ECMA-262 does not accept in its Unicode mode, and the schema is reported (SCH02). A text that holds a lone surrogate, a string or the key of an object, cannot be matched against a pattern: an instance that would need it is reported as one that cannot be validated (SCH04), with the text shown escaped; nothing in it is replaced or left out.
- Every schema has at least one valid and at least one invalid instance. A valid instance validates against its schema without an error; an invalid one fails. A report shows the first three errors, ordered by their place, each with its JSON path; an error found more than once is shown once.
- Every key `$ref` that has a string as its value in a subschema is resolved when the package is checked, also where no instance reaches it, and so is every key `$dynamicRef` with a string value in a subschema, which JSON Schema 2020-12 resolves first as it resolves a `$ref`. Each must lead, without network access, to a part of a schema of the package that is itself a schema. The meta-schemas are not schemas of the package. Nothing is fetched; a reference that leads nowhere else is reported. A reference is resolved against its base, as JSON Schema 2020-12 gives it:
  - A subschema is a value that JSON Schema 2020-12 reads as a schema: the top level of the file; in a subschema, the value of `additionalProperties`, `contains`, `contentSchema`, `else`, `if`, `items`, `not`, `propertyNames`, `then`, `unevaluatedItems` and `unevaluatedProperties`, each item of the list of `allOf`, `anyOf`, `oneOf` and `prefixItems`, and each value of the object of `$defs`, `definitions`, `dependentSchemas`, `patternProperties` and `properties`. Everything else in a subschema, such as `const`, `default`, `enum`, `examples` and keywords JSON Schema does not have, is data, down to its last level. A list, or any other value that is not an object, in the place of a subschema is no subschema, and what a list holds is data.
  - A subschema with an `$id` (a string) is a resource of its own. The base of the top level is the `$id` of the file as it is written; it is not read against anything. Below the top level, a subschema's base is its `$id`, without its fragment, read against the base of the subschema around it. A subschema without an `$id` has the base of the subschema around it. An `$id` in data names nothing and changes no base.
  - A `$ref` or `$dynamicRef` in a subschema is read against the base of that subschema, also when the `$id` stands in the same object. A key `$ref` or `$dynamicRef` in data is data, as JSON Schema 2020-12 has it: it is neither resolved nor reported.
  - Reading an `$id` or a reference against a base follows RFC 3986, section 5.2, in the same way for every scheme. Against `git://example.test/dir/one`, the reference `two` is `git://example.test/dir/two`, as it would be under `https:`; against `urn:example:one` it is `urn:two`, since that base has no `/` in its path; a reference that is only a fragment keeps the whole base. A top level whose `$id` is relative is read in the same steps, as written. The validator reads every reference as the checker does.
  - The part before `#`, read against the base, names a resource: a schema of the package by its `$id`, or a subschema by its `$id`. With nothing before `#`, it is the resource of the base. The fragment is a JSON Pointer (`#/$defs/toolId`), followed from that resource, or an anchor (`#toolId`) of that resource. A JSON Pointer that leads into a subschema with an `$id` of its own is followed as well; JSON Schema advises against such pointers, but a validator follows them. A JSON Pointer is read as RFC 6901 has it, by the same rule as in "API contracts": after its percent-encoding is decoded as UTF-8, `~` stands only in `~0` and `~1`, and a fragment that begins with `/` and holds another `~` is no JSON Pointer and is reported; a fragment whose percent-encoding does not decode as UTF-8, such as `%FF`, `%C3` alone or the encoded surrogate `%ED%A0%80`, is reported in the same way; a step into a list takes only a position written `0`, `1`, ... without leading zeros or a sign, so that `00`, `01`, `+0` and `-1`, also when percent-encoded, lead nowhere and are reported. A key of an object that looks like a number stays a key.
  - What a reference leads to must be a schema: valid against the meta-schema of JSON Schema 2020-12, which takes an object or `true` or `false`. A reference that leads to anything else, such as a text, a number, `null` or a list under `default`, or an object there whose `type` JSON Schema does not have, is reported, and no instance is held to the schema that holds the reference.
  - A subschema below the top level whose `$schema` is not `https://json-schema.org/draft/2020-12/schema` is reported, and the references of that file are not resolved: under another dialect `$id` and `$ref` can mean something else, which the checker does not read. An `$id` that cannot be read as a URI reference is reported in the same way, at the top level as below it; at the top level the schema then has no `$id` by which another can find it.
  - A text can be read as a URI reference when it is a URI-reference by the grammar of RFC 3986 (section 4.1), as JSON Schema 2020-12 requires of `$id` and `$ref`. Among other things, it holds no space and no other character RFC 3986 does not allow, a `%` only before two hexadecimal digits, and brackets only around a host that is an IPv6 address (without a zone) or an IPvFuture. A `$ref` that cannot be read as one is reported; its percent-encoded form, such as `bad%20id.json`, is read as usual.
- The `$id` of a subschema, read against its base, is the `$id` of no other schema of the package and of no other subschema in the package's schemas.
- `format` is an annotation only, as JSON Schema 2020-12 has it by default: a value that does not have its format does not make an instance fail.
- A schema whose `$id` can be read but that is reported about its form (SCH02), or about an `$id` or `$schema` inside it that the checker does not read (SCH05), is set aside: a reference into it from another schema is not followed and not reported again. A schema without a readable `$id` cannot be found by one, so a reference meant for it is reported as leading nowhere.
- An instance is held to its schema only when that schema, and every schema it refers to directly or through others, has no report of its own about its form or its references (SCH02, SCH05). If the validator still cannot hold it to the schema, the instance is reported as one that cannot be validated (SCH04).

## API contracts

`api/` holds the contracts of the system's HTTP APIs in OpenAPI (https://spec.openapis.org/oas/).

- A contract is a file directly in `api/` whose name ends in `.yaml`, `.yml` or `.json`. Markdown files directly in `api/` are read as package Markdown. Every other file or folder in `api/` is reported. Files and folders whose name starts with a dot are not read. A contract that a link leads out of the package folder is reported and not read (see "Data schemas").
- A contract is UTF-8 text, read as YAML 1.2 (`.yaml`, `.yml`) by the Python package `libfyaml`, which builds plain data and runs nothing, or as JSON (`.json`) as in "Data schemas". A contract is read only as plainly written. What follows is not plain, so each is reported with its reason and the contract is read no further:
  - a YAML anchor (`&name`), reported on the line where the anchored value or its tag begins, an alias (`*name`), and the merge key `<<`, written as a plain key or tagged `!!merge`;
  - a tag outside the JSON schema of YAML 1.2, which OpenAPI limits a contract to: that schema has `!!null`, `!!bool`, `!!int`, `!!float`, `!!str`, `!!map` and `!!seq`, and the non-specific tag `!`, which YAML resolves to one of them, is read; any other tag, such as `!!binary`, `!!set`, `!!omap`, `!!timestamp` or a tag of the author's own such as `!point`, is reported;
  - a key that is not a string: a list or a mapping as a key, and a key that is empty or null (`: x`, `~: x`, `null: x`). A key that YAML 1.2 reads as a number or as `true` or `false` is read as that value (see the JSON Pointers below);
  - a key given twice in one mapping, and two keys of one mapping that the checker cannot hold apart, such as `1` and `true`, or `1` and `1.0`;
  - a file that holds no YAML document, such as an empty file or one of comments only, and a file that holds more than one;
  - a contract that `libfyaml` cannot read; it is reported as one that cannot be read as YAML.

  A scalar that YAML 1.2 resolves to an integer or a float, plain or tagged `!!int` or `!!float`, is a number, never a string, and is taken from its text: the written text of a plain scalar, and of a quoted or block scalar, which is a number only when tagged, the text YAML decodes from it, with its escapes such as `\x32`, its folded lines and its chomping. An integer, decimal with or without a sign or written with `0o` or `0x`, keeps all its digits, however many. A float keeps the exact value it is written with, as a number in a JSON file does (see "Data schemas"), also beyond the range of a double, such as `1e400`, `-1.0e+400` or `1e-400`; `.inf`, `-.inf` and `.nan` are floats. A number of 10 to the power of 10^18 or more in size, such as `1e1000000000000000000`, cannot be held exactly; it is reported wherever it stands, and the contract is read no further. A scalar tagged `!!int` or `!!float` whose text does not have the form YAML 1.2 gives that tag, such as `!!int abc` or `!!int "1\x2e5"`, cannot be read. `libfyaml` builds a number tagged `!!int` or `!!float`, in any spelling of the tag (`!!int`, `!<tag:yaml.org,2002:int>`, a `%TAG` handle), only within its own range: an integer greater than -2^64 and less than 2^64, a float within the range of a double. A tagged number it does not build is reported as one that cannot be read; written without the tag, such as `18446744073709551616` for `!!int 18446744073709551616`, it keeps all its digits. Where `libfyaml` holds a tagged integer exactly, from -2^63 to 2^64-1, the value of its text is that value, or the contract is reported. Its top level is a mapping.
- `openapi` is a string `3.0.x`, `3.1.x` or `3.2.x`, where `x` is one or more digits. `info` is a mapping whose `title` and `version` are non-empty strings. `paths`, where it stands, is a mapping; it may be empty. A contract holds what its OpenAPI version requires: a `3.0.x` contract has `paths`, and a `3.1.x` or `3.2.x` contract has at least one of `paths`, `components` and `webhooks` as a mapping. When `openapi` is not one of the three versions, none of them is asked for.
- An operation is the value of an HTTP method of a path item: of `get`, `put`, `post`, `delete`, `options`, `head`, `patch` and `trace`, and for `3.2.x` also of `query` and of every key of the mapping `additionalOperations`. Path items are the values of `paths`, of `webhooks` and of `components.pathItems`, and those of the callbacks: a callback is a value of `callbacks` in an operation or of `components.callbacks`, and maps expressions to path items. Keys that begin with `x-` in `paths` and in a callback are extensions, as OpenAPI has them, and hold no path item; `webhooks` has no extensions, so every key there names a webhook. A path item or callback that is not a mapping holds no operation. A path item's own `$ref` is not followed, but the operations beside it belong to that path item and are read. A callback that holds `$ref` is a reference: it is not followed, and nothing beside the `$ref` is read as an expression. When `openapi` is not one of the three versions, the operations of the contract are not read.
- Every operation, wherever its path item stands, is a mapping with an `operationId` that is a non-empty string. The `operationId` of an operation is used by no other operation in the same contract file; two contract files may use the same one. A key `operationId` anywhere else, in an example or a schema, is no operation id.
- A contract is read from its place in the package, `api/<file>`, and nothing in it changes that. A key `$id` anywhere in a contract, and `$self` at the top of a `3.2.x` contract, would give a part of it or the whole of it another base; each is reported as not read, and the references of that contract are not resolved.
- Every key `$ref` that has a string as its value, anywhere in a contract, must have one of two plain forms and lead to something inside the package without network access. A reference is judged on its text as written, before anything in it is decoded: it must be a URI-reference by the grammar of RFC 3986, as in "Data schemas".
  - `#` and a JSON Pointer leads to a place in the same contract.
  - A relative path, with or without `#` and a JSON Pointer after it, leads to a file of the package. The path is relative to `api/`, read with its percent-encoding decoded as UTF-8; a path whose percent-encoding does not decode as UTF-8, such as `%FF.yaml`, is reported. It has no query: no `?` before the fragment, also not one with nothing after it. It does not begin with `/`, and names a file that exists inside the package folder, with no file or folder on the way inside the package whose name starts with a dot. A schema of the package is referred to in this way, by its path, such as `../schemas/tool.schema.json#/$defs/toolId`.
  - Every other reference is reported as not read: one with a scheme (such as `https:`), also one that names a schema by its `$id`; one that begins with `//`; an empty one; text that is not a URI-reference by RFC 3986, such as one that holds a space, a tab, a line break or braces, a `%` that is not followed by two hexadecimal digits, or `http://[x`; one with a query, such as `a.yaml?#/info` or `?#/info`; and one whose fragment is no JSON Pointer, such as an anchor `#name`.
  - A JSON Pointer is empty for the whole of the contract or file, or `/` and the keys and positions that lead into it, after its percent-encoding is decoded as UTF-8; one whose percent-encoding does not decode as UTF-8, such as `#/%FF`, is no JSON Pointer and is reported. `~1` stands for `/` and `~0` for `~`, and `~` stands nowhere else, as RFC 6901 has it: a pointer with another `~`, such as `#/x~z`, is no JSON Pointer and is reported, not read as a key. A position in a list is written `0`, `1`, ... without leading zeros or a sign. A key that YAML reads as a whole number, of any number of digits, also one written with `0x` or `0o` or tagged `!!int` such as `!!int -9223372036854775809`, matches the token of its decimal digits, such as `31` for `0x1F`. A file that a pointer leads into is read as JSON (`.json`) or YAML (`.yaml`, `.yml`) as above, also only as plainly written; in any other file a pointer cannot be followed and is reported. A reference to a file without a fragment needs only its file.
- Nothing else in a contract is checked: it is not validated against the OpenAPI schema, and its examples are not held to their schemas.

## Rules the checker enforces

| Rule | Meaning |
|---|---|
| PKG01 | A core file of the package is missing (`glossary.md`, `state.md`). |
| ID01 | An id is defined more than once. |
| ID02 | An entry heading is not `### <ID> <title>` with a well-formed id. |
| ID03 | An entry sits in the wrong file. |
| REF01 | A referenced id is not defined. |
| FLD01 | A required field is missing. |
| FLD02 | A field is unknown or given twice. |
| FLD03 | A field value is not allowed. |
| FLD04 | A field is empty. |
| DEC01 | An owner decision or constraint has no verbatim quote. |
| DEC02 | A derived decision's `basis` names no owner decision or constraint. |
| OP01 | An open point's status is not backed by the owner decision it needs. |
| SUP01 | A supersession names no valid entry, is not linked in both directions or runs in a circle. |
| EARS01 | The statement does not follow the outline of its declared pattern. |
| EARS02 | The statement does not end with a full stop, or an EARS statement has not exactly one `shall` with a response after it. |
| AC01 | An acceptance criterion is missing or malformed. |
| AC02 | Acceptance criteria are not numbered AC1, AC2, ... in order. |
| AC03 | A mechanical criterion names no command in backticks. |
| GLO01 | A term marked in bold has no meaning in the glossary. |
| GLO02 | A term marked in bold, or the term of a glossary row, is not plain words or one piece of inline code. |
| VER01 | `version` and the `changes` lines disagree. |
| VER02 | `ratified_by` or `accepted_by` does not name the current version. |
| LIF01 | A ratified status has no `ratified_by`. |
| LIF02 | `fulfilled` has no `accepted_by`. |
| LIF03 | `ratified_by`, `accepted_by` or `status_by` names no owner decision. |
| LIF04 | Status `superseded` and `superseded_by` do not go together. |
| LIF05 | `parked` or `descoped` has no `status_by`. |
| HIE01 | `parent` does not name one other requirement that can be a parent. |
| HIE02 | A parent is `fulfilled` while one of its children is unfinished. |
| SRC01 | `source` names no decision. |
| STA01 | `state.md` is over its size budget. |
| GEN01 | `trace.md`, or in a full package `views.md`, is missing or out of date. |

These rules apply to a full package only:

| Rule | Meaning |
|---|---|
| PKG02 | `c4.md` is missing from a full package. |
| ARC01 | A part of `architecture.md` is missing, stands twice, or is out of order. |
| ARC02 | A section of `architecture.md` is empty, or a `Not applicable:` line gives no reason. |
| ARC03 | The `Applicability` table is malformed, or does not state each piece once with `yes`, or `no` and a reason. |
| ARC04 | The files in `schemas/` or `api/` do not agree with the `Applicability` table. |
| MDL01 | `c4.md` lacks `## Elements` or `## Relationships`, has one twice, or a table there has no header and separator as the format gives them. |
| ELM01 | An element row has another number of cells, an id that is malformed or repeated, an unknown type, or an empty name or description. |
| ELM02 | An element's parent does not fit its type. |
| ELM03 | A container or component has no technology. |
| ELM04 | `c4.md` has no `software_system`. |
| REL01 | A relationship row has another number of cells or an empty description. |
| REL02 | A relationship does not join two different elements of which neither is inside the other. |
| REL03 | A relationship with a container or component at one end has no technology. |
| ADR01 | An accepted ADR has no `accepted_by`. |
| ADR02 | A rejected or deprecated ADR has no `status_by`. |
| ADR03 | An ADR's `accepted_by` or `status_by` carries a version. |
| SCH01 | A file or folder in `schemas/` is not allowed there, an instance names no schema of the package, or a link leads a schema or an instance out of the package folder. |
| SCH02 | A schema cannot be read as JSON, lacks `$schema` 2020-12, a unique `$id` or `type`, is not valid against the meta-schema, or the `$id` of a subschema is not unique. |
| SCH03 | A schema has no valid or no invalid instance. |
| SCH04 | An instance cannot be read as JSON, cannot be validated, or a valid instance fails or an invalid one passes. |
| SCH05 | A `$ref` or `$dynamicRef` in a schema does not lead to a schema inside the package, or its base cannot be read. |
| API01 | A file or folder in `api/` is not allowed there, or a link leads a contract out of the package folder. |
| API02 | A contract cannot be read, uses a YAML anchor, alias or merge key or a tag outside the JSON schema of YAML 1.2, has a key that is not a string, holds no YAML document or more than one, or its top level is not a mapping. |
| API03 | `openapi`, `info` or `paths` of a contract is malformed, or a member its OpenAPI version requires is missing. |
| API04 | An operation has no `operationId`, or an `operationId` is used twice in one contract. |
| API05 | A `$ref` in a contract has none of the plain forms or does not lead inside the package, or the contract has `$id` or `$self`. |

The checker enforces these rules and nothing more. What the sections above say about writing well, for example that a decision takes a sentence or two or that a criterion checks one observable thing, is for the author and the reviewer. Whether a statement is true, a criterion is sufficient or a decision was understood correctly stays a matter for review and for the owner.

A field that a report names as wrong is set aside until it is put right: no rule after that reads it, and `trace.md` leaves it out. Only the ids in it are still looked up, like ids anywhere. A report names a field as wrong when it says that the field

- is unknown, empty, or given twice (then every copy of it);
- holds a value that is not allowed, or a value beside a list;
- is a statement that does not end with a full stop, has not exactly one `shall` with a response after it, or does not follow the outline of its pattern;
- holds a criterion that is malformed, out of order or without its command, or a malformed change line;
- has to name other entries and does not name what its row asks for: nothing, itself, more than the one parent, the wrong kind of entry, a decision that is not the owner's (for an open point: neither the owner's nor a constraint), or a version that is not the current one, or in an ADR a version at all;
- is a `parent` on a story, below a second level or under a descoped requirement;
- is a `decided_by` or `status_by` that does not go with the status of its open point.

A report that says a field is missing, or that entries or fields do not agree with each other, sets nothing aside: a replacement linked in one direction only or in a circle, a parent fulfilled before its children, a version without its change lines, a `superseded_by` without the status `superseded`, a derived decision whose `basis` leads to no owner decision. Nor does a report about a marked term (GLO01, GLO02).

This description and `tools/keelblocks.py` come from keelblocks, Copyright (c) 2026 cagatay.io, under the MIT licence; the licence text is at the top of the script. Your own decisions and requirements in this folder are yours and not covered by it.

The template of `architecture.md` that `init --tier full` writes is adapted from the arc42 template by Gernot Starke and Peter Hruschka (https://arc42.org) and is licensed under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). What you write into it is yours.
