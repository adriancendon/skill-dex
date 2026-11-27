# Glossary

Every term marked in **bold** in a requirement has a row here. Meanings are as found in the code, `Seguimiento/README.md`, the sessions and <private>'s interview answers; "(unsure)" marks a meaning he has not confirmed.

| Term | Meaning |
|---|---|
| Skill Dex | The app in this project: a local web page, started from `Skill Dex.app`, that lists <private>'s skills, measures their use, scans their security and keeps a watchlist of skills he investigated. Its interface is to be entirely in English (D-063); it is published on GitHub later (D-055). Spanish words in this glossary are the project's terms, not interface texts. |
| skill | A folder with a `SKILL.md` that omp loads to give an agent instructions for a kind of task. Skill Dex lists those under `~/.omp/agent/skills` and `~/.omp/agent/managed-skills`, and also each project's own skills, labelled with the project (D-048). |
| skill de proyecto | A skill that lives inside one project (for example in its `.omp/skills/` folder) and is shown with the name of that project (D-048). |
| origen | Where an installed skill comes from: `usuario` (in `~/.omp/agent/skills`), `auto-aprendida` (in `~/.omp/agent/managed-skills`) or `tercero` (its real path lies in a `skills-terceros` folder). |
| categoría | One of SEO, Marketing y Ads, Rendimiento y calidad, Diseño y UI, Agencia web, Personal y sistema, Otras; guessed from the skill name or set in `Seguimiento/skills-meta.json`. |
| watchlist | The list of skills and tools under evaluation that are not installed, kept in `Seguimiento/watchlist.json`; distinct from the installed skills (D-008). A skill that gets installed leaves it; a discarded one leaves it and goes to Descartadas (D-060). Each entry has a status: "en-analisis" (shown as "Por analizar"), "analizando", "recomendada", "descartada" or "error". |
| descartada | Status of a watchlist entry <private> decided against. The entry, its report, the reason and the date are kept, not deleted (D-010); without a written reason, the report's verdict is the reason (D-044). |
| recomendada | Status of a watchlist entry whose analysis recommends "Instalar" or "Instalar con cambios". It installs nothing. |
| análisis | The investigation of one skill or tool before installing it: what it does, reviews and score, security, activation, overlaps and a recommendation, following the `<skill>` skill. Run from the app (`omp -p` in the background) or in an omp conversation. Never installs (D-006). |
| informe | The written result of an analysis, a Markdown file in `Seguimiento/analisis/<id>.md`, shown in the ficha. New ones are in English (D-084); older ones are in Spanish (OP-039). |
| ficha | The detail view of one skill, opened by clicking its card: description, rewards, activity, security, full report and technical data. In <private>'s message (D-018) "fichas de skills" means the cards in the list; in the app, "ficha" is the detail dialog. |
| uso registrado | One read of a skill's `skill://` address or `SKILL.md` by an agent, found in the omp session logs on this Mac. Uses in other tools are not counted. |
| temporada | The period counted from the date `inicio` in `Seguimiento/config.json` (today 2026-11-24). Only season uses give XP; changing the date starts a new season. The word was introduced by an agent, not by <private>. |
| histórico | All recorded uses of a skill, before and after the season start. Shown apart and gives no XP (D-047). |
| XP | Experience points of the collection. Today: 10 per installed skill, 10 per season use, 25 per mastered skill, 15 per installed skill with its own report, 5 per recommended watchlist entry; each level 300 XP. With design D: 10 per season use and nothing else, and level L costs 100 + 50 × (L − 1) XP (D-070, REQ-USE-021, REQ-USE-022). |
| nivel | Either the collection level (eight titles, a new one every two levels, D-088; a centred congratulation card at each new one, D-051, D-057) or the level of one skill (the whole square root of its season uses, kept by D-089). |
| dominada | A mark <private> could set on a skill he considered mastered. Removed (D-090); it no longer gives XP, is not saved and is not shown in Health. |
| favorita | A mark <private> sets on a skill to find it with the Favoritas filter. To be saved in a file as well as in the browser (D-054). |
| rareza | Four rarities of a skill from its size (lines and files); today Común, Rara, Épica, Legendaria, English names to be chosen. Decoration of the game; it says nothing about quality. Kept by D-089. |
| premios | The eleven achievements of the first gamified version, each reached or pending. Not kept (D-089). |
| Para revisar | The filter of installed skills that suggests a review: never used, or with a finding to review; inactive this season is a separate choice. Reviewing never uninstalls. Its label becomes English with the interface (D-063). |
| salud del catálogo | The panel with the tokens of all skill descriptions, the heaviest skills, pairs of similar skills (each with a recommendation, D-046), unused skills and load warnings. It lives in the Health section of the sidebar (D-083). |
| SkillSpector | A security scanner for skills by NVIDIA, installed only inside `Tecnico/.venv-skillspector` and run in its static mode (`--no-llm`), which sends no files to a model. |
| skillcheck | `Tecnico/skillcheck.mjs`: runs SkillSpector and the triaje on a URL or path of a skill that is not installed; the security step of an analysis. |
| triaje | The rules that sort SkillSpector's findings into "revisar", "info" (minor notices), "ruido" (noise) and "revisada" (already reviewed), in `Tecnico/lib-security.mjs`. |
| hallazgo por revisar | A security finding that the approved criterion does not allow to close: it meets none of the six conditions, falls under an exclusion, or leaves the agent in doubt (D-056). It stays in front of <private> until it is reviewed. |
| falso positivo | A finding that looks like a risk but is not. It may be closed without <private> only if it meets one of the six conditions of the criterion he approved and none of its exclusions (D-056, quoted there); each closure is recorded with its date and condition number and shown in the ficha. |
| centro de mando | <private>'s word for what Skill Dex should be: one place from which he sees his skills and takes decisions (D-024). |
| propuesta intermedia | The design mix of the previous and the redesigned version, built read-only and kept in `Seguimiento/versiones/propuesta-intermedia/`; not applied (D-034, D-042). Replaced as a candidate by design D (D-070). |
| propuesta D | The approved design (D-070): proposal B's left sidebar, proposal A's skill icons, one global list ranked by all-time uses with optional grouping by category, a "Daily rhythm" chart, plus short descriptions, a list/cards switch and an updates section (D-071 to D-073). Mockups in `Seguimiento/versiones/propuestas-diseno/d/`. |
| descripción corta | The one-line, plain description of a skill shown in the list and the cards instead of its long original description, which stays in the ficha (D-071). Written once by an agent, in English, and kept in a file <private> can edit (D-076). |
| vista de lista, vista de tarjetas | The two ways the library can show the skills; the user chooses (D-073). |
| actualización de skill | A newer version of an installed external skill, found in its source repository when he presses "Check for updates", security-checked, and applied only by his confirmed "Update" (D-072, D-077 to D-082). |
| Descubre skills | A section to come that finds skills on GitHub: suggestions from what the user uses, a random pick among the most used skills and a box to type a search; each result can be analysed, added to the watchlist or opened on GitHub, and is labelled if already installed, in the watchlist or discarded (D-052, D-058, D-059, D-085, D-086), using the GitHub session on the Mac (D-061). |
