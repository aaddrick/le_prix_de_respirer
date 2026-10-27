# Tax rules

Every rate and threshold lives in a data module under `js/data/`, one file per
jurisdiction. `js/taxCalculator.js` holds the arithmetic and no numbers. When
the UI or a page shows a rate, it got it from a module here.

| Module | What it holds |
|---|---|
| `js/data/fed.js` | Federal brackets, basic personal amount and its phase-out, Canada employment amount, the Quebec abatement |
| `js/data/payroll.js` | CPP, CPP2, QPP, QPP2, EI, EI at the Quebec rate, QPIP |
| `js/data/<code>.js` | One province or territory (`nl pe ns nb qc on mb sk ab bc yt nt nu`) |
| `js/data/index.js` | Imports every module above and exports them, plus `PROVINCE_CODES`, the display order |

The tax year is the `year` field in each module, and the engine refuses to run
if it is not the `YEAR` constant in `js/taxCalculator.js`. Nothing else in the repo holds a bracket
value.

## Module layout

Each module is `export default { ... }` and is plain data. Every field in the
table below must be present. A field that does not apply is an explicit `null`,
not an omission. The engine throws on an absent field and never defaults to 0,
because a dropped surtax or premium renders a plausible, wrong number.
`validateJurisdiction()` and `validatePayroll()` in `js/taxCalculator.js` list
exactly which fields are required.

| Field | Meaning |
|---|---|
| `code`, `name`, `year` | Identity and tax year |
| `brackets` | `[[upperLimit, rate], ...]`, ascending, last limit `Infinity`, rates as decimals |
| `credits` | `creditRate`, `basicPersonalAmount`, `bpaPhaseOut`, `canadaEmploymentAmount`, `payrollCredits`, `other` |
| `surtax` | `{ base, tiers: [{threshold, rate}] }` |
| `taxReduction` | A reduction of the form twice a basic amount minus the tax (Ontario) |
| `lowIncomeReduction` | A low-income reduction, with a `kind` that picks its formula |
| `healthPremium` | A premium that is piecewise in taxable income and is not reduced by credits |
| `abatement` | Federal only: the Quebec abatement |
| `salesTax` | GST, PST, HST and QST rates for the sales-tax table |
| `costOfLiving` | `null` everywhere. See the out-of-scope list below |
| `special` | A rule that fits no field above: `{name, description, how, params}`, where `how` is prose for people and `params` holds any numbers the engine reads (an empty object if none) |
| `sources` | `[{fields, url, title, retrieved}]`; every numeric field is covered by at least one |
| `flags` | `[{field, status, note}]` for values not confirmed from an official 2026 source |

`brackets` must ascend and end at `Infinity`: if the limits are out of order,
slices are skipped, and if the last limit is not `Infinity`, income above it
goes untaxed. `validateBrackets()` rejects both, so a mistake here throws instead of
rendering.

The `payroll` module also gives each pension plan a base rate and an enhanced
rate that sum to `rate`. The base share is a credit, the enhanced first-tier
share is a deduction from income, and the second-tier plan (`cpp2`, `qpp2`) is
wholly a deduction. Open `js/data/payroll.js` for the field names.

## Sources and flags

Every numeric field is covered by a `sources` entry: a URL, a title, and the
date it was read. Prefer the CRA, Revenu Quebec, or the province or territory's
finance ministry. A secondary source is acceptable only with a `flags` entry.

`flags` is how the project says what it does not know:

- `PROVISIONAL`: a value read from a source that may still change, or that is
  not the final 2026 publication.
- `UNVERIFIED`: a value that could not be confirmed from an official 2026
  source.
- `CONFLICT`: two official sources disagree. The note names both values and
  both URLs, and the module uses one of them. Resolve it from a primary
  source, such as the statute, and not by picking the more convenient figure.

A flag names the field and says why. The tax-math tabs show a jurisdiction's
flags, and the footer date is the newest `retrieved` date across the modules.
Read the flags in a module before you trust its output for that jurisdiction, and keep a flag until a primary source
confirms the value. Delete a flag only in the same change that cites the source
that settles it. A flag you leave behind misleads the next reader in the other
direction.

## Order of operations

The engine applies the same order to every jurisdiction. A jurisdiction that
differs states the difference in `special`, and the engine implements only the
`special` names it knows.

1. Payroll for the year, one employer.
2. Net income: income minus the enhanced pension share, the second-tier plan,
   and `otherDeductions`. Quebec's own return also subtracts the workers'
   deduction.
3. Bracket tax on that net income.
4. Minus non-refundable credits at the jurisdiction's `creditRate`, floored
   at 0: basic personal amount, the payroll items listed in
   `credits.payrollCredits`, the Canada employment amount, and `credits.other`.
5. Plus surtax on the tax after credits.
6. Minus `taxReduction` and `lowIncomeReduction`, together capped at the
   remaining tax.
7. Federal only, for a Quebec resident: minus the Quebec abatement.
8. Plus `healthPremium`, which credits do not reduce.

If you reorder these, tax is credited before it is floored or the surtax is
computed on the wrong base, and the result still looks plausible. The header
of `js/taxCalculator.js` gives the same order, and the code below it holds the
formulas.

## Special rules

`special` entries are allowlisted by name in `ALLOWED_SPECIALS` in
`js/taxCalculator.js`. An unknown
name throws `unknown special`, so a new rule cannot be added to a data module
and silently ignored.

- **Quebec workers' deduction** (`js/data/qc.js`): deducted from Quebec net
  income only. The engine reads its rate and cap from `params` and never from
  the `how` text, so edit the numbers in `params`. If `params` is missing or
  not numeric the engine throws.
- **Quebec enhanced QPP deduction** (`js/data/qc.js`): the same deduction the
  engine already applies in step 2, so the engine does not apply it twice.
  Its `params` is empty because the numbers come from `js/data/payroll.js`.
  Quebec lists no separate credit for QPP, EI or QPIP, so `payrollCredits` is
  empty there.
- **Yukon Canada employment credit** (`js/data/yt.js`): documents the generic
  `credits.canadaEmploymentAmount` rule, which any module may use.

To add a rule, describe it in `special` with its `params`, add its name to
`ALLOWED_SPECIALS`, and implement it in `js/taxCalculator.js`. A name added to one side only
throws on the first `calculate()`.

## Annual values and payroll values

The calculator computes the tax on an annual return for a full year, not the
amount withheld per pay. A few jurisdictions change a rate or a credit amount
part-way through 2026. For those, record the value that applies on the 2026
return, never the catch-up or pro-rated value that payroll uses from the
mid-year change, and add a `flags` entry naming both values and where each
comes from. Otherwise the result is a number that is right for a July paycheque
and wrong for the year. The same distinction explains why a figure from the
CRA payroll calculator can differ from this one: payroll formulas leave out
some low-income reductions that the return applies.

## Updating for a new tax year

1. Fetch each source URL in the module's `sources` and read the new year's
   figures from it. Do not infer them from the old year.
2. Edit the module's numbers, `year`, and the `retrieved` date together, one
   jurisdiction at a time.
3. Flag anything you could not confirm, instead of carrying the old value
   forward unmarked.
4. Change `YEAR` in `js/taxCalculator.js`.
5. Regenerate the reference scenarios in [testing.md](testing.md) from the
   engine and check them against figures you compute independently from the
   published tables. If you copy the new output into the doc without that
   check, the page confirms whatever the code now says.

## Adding a jurisdiction

1. Write `js/data/<code>.js` to the layout above, with `sources` and `flags`.
2. Import it in `js/data/index.js` and add it to the exports and to
   `PROVINCE_CODES`. A module that is not in the index is never loaded and
   never errors.
3. If a rule fits no field, describe it in `special` and add it to the engine's
   allowlist as above.
4. Add it to the UI. See [architecture.md](architecture.md) for why DOM ids
   matter.
5. Run the checks in [testing.md](testing.md).

## Out of scope

These are left out on purpose. Don't add one without deciding it is in scope.

- **Personal credits other than the basic amount.** The calculator takes
  employment income, a province or territory, and optional other deductions.
  There are no spousal, dependant, age, disability or medical credits and no
  self-employment income.
- **The federal top-up tax credit.** It is $0 at the incomes where credits
  stay below the first bracket threshold, so `js/data/fed.js` records it under
  `flags` and does not model it.
- **The Alberta supplemental credit.** The same reasoning applies, and
  `js/data/ab.js` records it under `flags`.
- **Refundable credits and benefits.** Take-home pay understates cash at low
  incomes because of this.
- **Cost of living.** `costOfLiving` is `null` in every module. There is no
  citable province-level measure for the year, and a figure without a source is
  worse than none.
