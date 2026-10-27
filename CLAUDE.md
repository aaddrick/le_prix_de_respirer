# Working in this repository

A static tax calculator: federal, Maryland state, and Anne Arundel County
income tax, shown as a calculator plus step-by-step "tax math" tabs. Plain
HTML, CSS, and ES6 modules. No build, no dependencies, no `package.json`.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Serve it over HTTP. Opening `index.html` as `file://` fails silently on the
module imports and shows a page of zeros.

## Read only what the task needs

| If you are | Read |
|---|---|
| changing a bracket, rate, or deduction, or adding a jurisdiction | [docs/tax-rules.md](docs/tax-rules.md) |
| changing UI, a tab, or how modules talk to each other | [docs/architecture.md](docs/architecture.md) |
| about to say a change works | [docs/testing.md](docs/testing.md) |
| hitting zeros, a blank tab, or a console error | [docs/troubleshooting.md](docs/troubleshooting.md) |
| editing anything in `docs/` | [docs/CLAUDE.md](docs/CLAUDE.md) |

Everything else is reachable from [docs/index.md](docs/index.md).

## Rules that cost the most when missed

**`js/taxCalculator.js` never touches the DOM.** It is the only module you can
run in Node, and that is the only automated check this repo has. A
`document` reference in it breaks the check in [docs/testing.md](docs/testing.md).

**DOM ids are the interface between `index.html` and the modules.** Each
module looks its elements up by id, and a renamed id does not throw: the
lookup returns `null` and that part of the page stops updating. Grep `js/` for
an id before you rename or delete it in `index.html`.

**Run the Node check after any change to `js/taxCalculator.js`.** There is no
test framework and no CI. A wrong bracket renders a plausible number, so
nobody notices by looking.

**Don't add a build step, framework, or `package.json`.** The project is meant
to have no setup at all, so adding any of them is a design change. Ask before
you do it.

## Issues, PRs, and commits

**Issues and PR descriptions are for people skimming.** Keep them to a few
sentences: what changed and why, plus anything the reviewer has to decide.
Don't include file-by-file lists, verification logs, or restatements of the
diff. A long body gets skimmed, and the one line that needed a decision gets
missed.

**Details go in commit messages.** Put the reasoning, the alternatives you
rejected, and what you verified in the commit body. It travels with the code
and shows up in `git log` and `git blame`. A PR description disappears once
the PR is merged.

`AGENTS.md` is a symlink to this file so harnesses that read `AGENTS.md` get
the same guidance. Edit `CLAUDE.md`.
