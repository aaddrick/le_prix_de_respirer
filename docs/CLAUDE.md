# Working on the docs

Read this before editing anything in `docs/`.

`AGENTS.md` in this directory is a symlink to this file, so every harness gets
the same guidance. Edit `CLAUDE.md`.

## What these pages are for

`README.md` introduces the project. `docs/` explains how to change it without
breaking a property you did not know was there. The root `CLAUDE.md` routes an
agent to one page here. It doesn't summarize them, so an agent only loads the
page its task needs.

## Rules

**Every page states a failure mode, not just a rule.** A bare imperative gets
dropped the first time a model is under load. A rule with its failure attached
survives paraphrase. Example: "a renamed id returns `null` and that section
stops updating" instead of "don't rename ids".

**No page owns a fact that lives in the tree.** Don't put line counts, file
counts, bracket values, or file trees on these pages. The Copilot instructions
these pages replaced had all four, and within a few PRs every count was wrong.
Name the file and the symbol (`this.federalBrackets` in
`js/taxCalculator.js`) and let the reader open it.

**Link to the file, not to the fact.** Cite by path. A path is greppable and
breaks loudly on a rename. A description like "the calculator module" breaks
silently.

**Prefer the concrete number and its condition.** "$8,523 federal at $75,000
married with every other input at 0" can be checked. "About $8.5k" cannot.
The one place numbers live here is the reference scenario in `testing.md`,
and it ships with the command that reproduces it.

## Mechanics

**Reachability.** Every page must be linked from [index.md](index.md). If a
task would send an agent straight to the page, also add a row to the routing
table in the root `CLAUDE.md`. Nobody reads an unlinked page, and nothing
flags one in a diff.

**Keep the root `CLAUDE.md` short.** It loads in full every session. Detail
belongs here. The root file gets a route and only the rules that are costly
to miss.
