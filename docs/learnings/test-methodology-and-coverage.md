[< Back to docs index](../index.md)

# Test methodology and coverage

How checks on this repo are written so a green result means something. The
claim behind every section: **a check proves nothing until you have seen it
fail when the code it guards is broken.** A wrong rate still renders a
plausible number, and this repo has no CI, so a check that cannot fail looks
exactly like a check that passed.

This page is adapted from the methodology page of
[claude-desktop-debian](https://github.com/aaddrick/claude-desktop-debian/blob/main/docs/learnings/test-methodology-and-coverage.md),
a bash and Electron packaging repo. It keeps the lessons that carry over and
restates them for a static site with a DOM-free calculator. The commands and
scenarios themselves live in [testing.md](../testing.md). This page says how
to write and judge them.

> **Where things live.** Rates are in one DOM-free module per jurisdiction
> under `js/data/`, and `js/taxCalculator.js` holds the arithmetic.

## What you can run

| Surface | Needs | Covers |
|---|---|---|
| Node check on `js/taxCalculator.js` | `node` 18 or later | Every calculation. The only automated check. |
| Data module checks | `node` | Each jurisdiction module loads, has the agreed fields, and every number is sourced. |
| Independent recomputation | `node` | The calculator against figures derived from the published tables, never from the repo's own data. |
| Manual pass over HTTP | `python3 -m http.server`, a browser | Wiring: DOM ids, tabs, console, phone width. |

Nothing here needs a framework or a `package.json`. Adding one to run a check
is a design change, so don't. A check is a `node --input-type=module -e` block
in a doc, or a standalone `.mjs` file that imports the module and exits
non-zero on failure.

## Checks that pin nothing

Every trap in this section produced a check that went green without guarding
what it claimed. The fix is always the [mutation check](#the-mutation-check).

### A check that exits 0 on a failed comparison

The Node check prints figures for a person to compare. Printing is not
asserting. If you wrap it in a script and the script ends in `console.log`,
the exit code is 0 whatever the numbers are, so the next person (or agent)
reads "ran clean" as "correct". An automated check compares to the expected
value and sets `process.exitCode = 1` on any mismatch, and a thrown error
counts as a failure.

```js
// WRONG: prints, always exits 0.
console.log(r.federal.totalTax);

// RIGHT: compares, and the exit code carries the result.
if (r.federal.totalTax !== expected) {
  console.error('federal', r.federal.totalTax, 'expected', expected);
  process.exitCode = 1;
}
```

Do not use `assert` calls that sit inside a `try` which swallows the
exception. A `catch` that logs and continues turns every assertion into a
print.

### Bracket checks need a near-miss fixture

A reference scenario at one mid-bracket income pins the arithmetic but not the
edges. A mistyped limit, a `<` where `<=` belongs, or a missing `Infinity`
row all leave a mid-bracket figure untouched. For every jurisdiction, test the
three incomes around each limit you care about: one dollar below, exactly on,
and one dollar above. Tax must be continuous across the limit. A jump at a
limit means the slices were skipped or double counted, and the result is a
smaller or larger number that still looks reasonable.

Do the same for every other threshold in a data module: a credit that phases
out, a surtax that starts above a provincial tax amount, a health premium
tier, and each payroll cap (the pensionable earnings ceiling and the
insurable earnings ceiling). Contributions must stop growing at the cap and
must not drop above it. If a fixture sits nowhere near an edge, loosening that
edge changes no result, and the check is not pinning it.

Prove it by moving one limit by a dollar in a scratch copy (see
[the mutation check](#the-mutation-check)) and watching a check go red.

### Expected values come from outside the code under test

A check whose expected value is computed by importing the same data module and
re-applying the same formula can only fail if the two copies drift apart. A
wrong rate in the data module is wrong in both, and the check passes.

Take each expected figure from the published table (CRA or the provincial
ministry, with the URL recorded next to the figure), worked by hand or by a
separate script that carries its own copy of the numbers typed from the
source. The independent script is the verifier's own, written from the
cited tables and never importing from `js/data/`. If your reference scenario can only be produced by
running the calculator, it is a snapshot, not a check. Label it a snapshot, and say in
[testing.md](../testing.md) how it was cross-checked.

### A stub that mirrors production cannot catch a change to production

The calculator takes plain numbers, so it rarely needs a stub. The same trap
appears when a check feeds `TaxCalculator` a hand-built data object shaped
like the real one. If the module reads a field the stub does not have, or
the real module renames a field, the stub keeps the check green while the
real wiring is broken.

At least one check per jurisdiction loads the real module from
`js/data/<code>.js`, passes it through the real calculator, and
checks the figure from the independent source. Stubs are for isolating one
rule (a surtax on its own). They never replace the real load.

### `PASS` must mean "read and verified", never "failed to read"

The commonest false green here is a check that loops over zero items. A data
index that fails to import a module, a glob that matches nothing, or a
jurisdiction list that came back empty all make `for` loops finish without a
single comparison, and the script prints "all passed".

Every check that loops over jurisdictions asserts the list first: it is
non-empty and contains every province and territory code in `js/data/index.js`, one per
jurisdiction. It counts the comparisons it made and fails if the count is
zero. It treats these as failures, not as passes or skips:

- a field that is `undefined`, `NaN`, or a string where a number belongs
- a bracket table that is missing, empty, or whose last row is not
  `Infinity`
- an upper limit that is not strictly greater than the one before it
- a rate outside zero to one (rates are decimals)
- a numeric field with no entry in the module's sources, or a `flags` entry
  marked unverified or provisional that the report does not list

The existing checks in [testing.md](../testing.md) have the same hole in
miniature: a missing `import` fails loudly, but a result object that lost a
key prints `undefined` and still exits 0. Compare against numbers, not against
"it printed something".

The same applies to the browser pass. A page of zeros is the signature of a
failed module import (see [troubleshooting.md](../troubleshooting.md)).
"Looks fine" after loading the page over `file://` is a failed read reported
as success.

### Two checks that must share one predicate

If a check re-implements a rule to decide what to expect, and the calculator
implements the same rule separately, the two will disagree at the edge that
matters. A common case: the check treats a limit as inclusive and the
calculator as exclusive, and the check "agrees" at every income except the one
it never tests.

Pick one definition of each rule and write it down next to the data (for
example, whether a limit is the top of its slice). The check pins that
definition with independent expected values at one dollar below, on, and one
dollar above the limit, as in the near-miss section above. It never gets the
expected tax from `calculateBracketTax()` in `js/taxCalculator.js`, because
that makes the expectation circular. Sharing is only for the helper that
decides which inputs to test, such as the list of limits read from the data
module, so the check and the calculator cannot disagree about
where the edges are. Rules that exist only in the independent computation (for
instance the Quebec abatement) get their own near-miss fixture on the
calculator side as well.

### Negative assertions that cannot fail

"No tax is charged below the credit threshold" is easy to write so it cannot
fail: `if (!(tax > 0)) ...` passes for `NaN` and `undefined` as well as for
zero. Assert the positive form (`tax === 0`) with a strict comparison, and
check `Number.isFinite` first. The same goes for "this US field is gone":
`result.state === undefined` passes whether the field was removed or the whole
result is empty, so assert the expected new keys exist in the same check.

## Isolation from the author's machine

A check must give the same answer on a contributor's laptop and on the
verifier's. Three things leak in:

- **The server's working directory.** Start the server from the repo root. A
  server started one level up serves `index.html` but 404s the module imports,
  and the page shows zeros.
- **Browser state.** The theme is stored in `localStorage` under `theme`
  (see [architecture.md](../architecture.md)), and a cached module can hide a
  broken import. Do the manual pass in a fresh profile or private window with
  the cache disabled.
- **Node version and flags.** State the Node version you ran. ES module
  imports behave differently under an older runtime, and `--input-type=module`
  is what the existing check relies on.

Do not read the clock or the locale inside the calculator or a check. A check
that formats money with `toLocaleString` compares strings that differ by
machine, so compare numbers.

## Smoke tests: does it start

The unit-level Node check proves the arithmetic. It does not prove the page
loads. A cheap load check exercises the real import graph in a browser:

1. Serve the repo root over HTTP.
2. Load `index.html` and `example.html` with the console open.
3. A clean run has no console errors and no failed network requests for
   `js/` files, and the calculator tab shows non-zero figures for a non-zero
   salary.

A page can render with every module failing quietly, so check the figures, not
just the absence of an error. After the Canada rewrite, repeat step 3 once per
province and territory: a missing or misnamed module file only
breaks the one jurisdiction that imports it, so a pass on a single province
proves nothing about the others.

## Structural checks: wiring that only breaks in the browser

Some invariants are invisible to the Node check because they live between
`index.html` and the scripts.

**DOM-id contract.** For every id a module looks up, `index.html` must contain
it, and `example.html` must too if it imports that module. A renamed id
returns `null` and one update stops with no error. Before a change is called
done, list the ids each of `js/uiControls.js` and `js/displayManager.js`
requests and check each against `index.html`:

```bash
grep -rhoE "getElementById\('[^']+'\)" js/ | sort -u
grep -rhn 'getElementById(`' js/
grep -rhn 'querySelector' js/
grep -o 'id="[^"]*"' index.html | sort -u
```

Compare the first and last lists. An id requested in `js/` and absent from
the HTML is a failure. The second command finds ids built in a template
literal, such as the tab button and panel ids in `js/tabManager.js`. The
first pattern cannot see them, so a renamed tab passes the comparison and
breaks at runtime. For each hit, read the code to find the names that fill
the placeholder (the tab names are listed in `bindTabEvents()` and
`setActiveTab()`), build each full id, and check it against `index.html`.
The third command finds selector lookups, which need the same manual read. Do this after the UI work in the Canada rewrite in particular, which
replaces the state, county, and filing-status controls and must leave no
lookup behind that points at a removed element.

**No DOM in the calculator.** `js/taxCalculator.js`, and each data module
must import in Node with no `document`, `window`, or
`localStorage`. The Node check is the test of that. It also fails if a data
module imports something that touches the DOM, so run it after adding any
import.

**Leftovers from the old jurisdiction.** After the rewrite, grep the repo for
the removed vocabulary (the old state, county, IRS, and filing-status terms).
A stale label or tab heading next to correct figures is the likeliest
leftover, and nothing else in this repo will flag it.

## Making a rule testable

The calculator is already testable because it is DOM-free. Keep it that way,
and when a rule is buried, lift it out the way the source repo lifted inline
blocks into named helpers:

1. Move the rule into a named method on `TaxCalculator` that takes numbers and
   returns a number. A rule that is only reachable through
   `calculateAllTaxes()` can only be checked together with every other rule,
   and a failure then points at the whole pipeline.
2. Prove the move changed nothing: run the existing reference scenario in
   [testing.md](../testing.md) before and after. The figures must be
   identical. If they move, the refactor changed behavior, so stop and find
   out why before adding the new check.
3. Check the new method at its edges, and on the failing side, not just the
   happy path. A credit that floors at zero is checked at an income where it
   would go negative.
4. Do not give the method knowledge of the page. Anything that reads or
   writes an element belongs in `js/displayManager.js` or
   `js/uiControls.js`.

## Reviewing a change

What to demand from your own change and from someone else's.

- **Run the mutation check.** If breaking a rate by hand does not turn
  anything red, the change is unguarded. A green run over a known defect
  proves a hole in the checks, not that the code is right.
- **Claimed verification must be reproducible.** "Checked against the CRA
  page" with no URL, and no command anyone can rerun, cannot be re-verified.
  Put the command in [testing.md](../testing.md) or the commit body, and the
  source URL beside the figure.
- **Re-fetch the source for every rate you change.** A value copied from a
  summary or a third-party table can be last year's. Open the official page,
  confirm it states the tax year, and record the URL and the retrieval date
  next to the value (the `sources` field in each data module, and
  `flags` for anything not confirmed). A value you could not confirm is flagged
  as unverified, never filled in from memory, because a guessed rate looks
  exactly like a checked one.
- **Name the level of verification honestly.** Say which checks ran (Node
  check, independent recomputation, manual pass) and which did not. A change
  checked only in Node is not browser-verified, and the report says so.
  Untested paths get "not run", not "should work".
- **Hollow assertions.** A check that compares a value to itself, or whose
  name promises more than it asserts ("handles Quebec" over one income),
  hides the uncovered cases. Name each check after the figure it pins.
- **Magic numbers need a source.** A literal rate or limit in
  `js/taxCalculator.js` with no data-module entry and no citation is an
  orphan. Rates belong in the data modules, and the calculator
  owns the arithmetic only.

## The mutation check

Before calling any check done, break the code it guards and confirm the check
fails. Do it on a copy, so a half-reverted edit cannot ship:

```bash
d=$(mktemp -d) && cp -r js "$d/js" && echo "$d"
# change one rate, limit, or cap in the copy, then run the check against it
```

Run the check against the copy by pointing its import at
`$d/js/taxCalculator.js`. The check must exit non-zero. Then remove only that
directory (`rm -rf "$d"` after confirming `$d` is non-empty and is the
`mktemp` path). Do not edit the real file and rely on remembering to undo it.

Mutations worth running for the Canada rewrite, each against the jurisdiction
it touches (the data modules):

- Nudge one bracket rate. A check at an income in that bracket fails.
- Move one bracket limit by a dollar. The near-miss fixture at that limit
  fails.
- Delete the `Infinity` row. The check that rejects a table without it fails.
- Change a payroll cap. The above-the-cap fixture fails.
- Drop the Quebec abatement from the federal calculation. The Quebec scenario
  fails and every other province still passes.
- Make one jurisdiction module export an empty object. The all-jurisdictions
  check fails rather than skipping it.
- Remove an `import` of one module from the data index. The check that
  asserts the full list of codes fails.

For each new check ask:

1. Does it compare to a number and set a non-zero exit on mismatch?
2. Is there a fixture one dollar either side of each edge it claims to pin?
3. Does the expected value come from a source other than the code under test?
4. Does at least one case load the real data module and the real calculator?
5. Can it print PASS while having compared nothing?
6. If you revert the fix, does a check fail?

Question 6 is the one that matters. The rest are the ways its answer comes
out "no" while the run stays green.

## What this repo's checks do not cover

Say so in the report instead of implying otherwise. The Node check does not
cover layout, the tab wiring, the theme, or whether a tab renders. Only the
manual pass does that. No check here covers whether a rate is current:
only a person re-reading the official source does. The tax year is a fact
about the source, not about the code.
