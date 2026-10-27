# Tax rules

Every rate and threshold lives in the constructor of `js/taxCalculator.js`.
Nothing else in the repo holds a bracket value. When a page or the UI shows
one, it got it from there.

| Property | What it holds |
|---|---|
| `this.federalBrackets` | Federal brackets, keyed `single` / `married` |
| `this.marylandBrackets` | Maryland state brackets |
| `this.anneArundelBrackets` | Anne Arundel County brackets |
| `this.standardDeductions` | Federal standard deduction |

The tax year is given in the comment above each table. Check it, and each
value, against the IRS or the Maryland Comptroller before you edit. The
tables have been edited piecemeal, so a single comment may not cover every
row under it.

## Bracket format

Each bracket is `[upperLimit, rate]`. Brackets are in ascending order, and
the last one is `[Infinity, rate]`. `calculateBracketTax()` taxes each slice
between the previous limit and this one. If brackets are out of order, slices
are skipped, and the result is a smaller number that still looks plausible.
If `Infinity` is missing, income above the last limit goes untaxed.

`filingStatus` is the number `1` (single) or `2` (married). Anything else is
treated as married.

## What feeds what

- **Federal:** income minus adjustments gives AGI. AGI minus deductions gives
  taxable income. Apply the brackets, then subtract credits, flooring at 0.
- **Maryland:** the same steps, using the separate state inputs.
- **County:** brackets applied to **state taxable income**. There are no
  separate county inputs and no county credit. A change to state deductions
  changes county tax too.
- **Deductions are user input.** The standard deduction is applied only in
  the baseline comparisons (`calculateBaseline()`,
  `calculateMarylandBaseline()`). A user who leaves deductions at 0 is taxed
  on gross income.
- `calculateMarylandBaseline()` uses the federal standard deduction
  (`getStandardDeduction()`), not a Maryland-specific one.
- Totals and take-home pay use the larger of federal and state income.

## Adding a jurisdiction

1. Add a bracket table and a `get<Name>Brackets(filingStatus)` getter to
   `TaxCalculator`.
2. Compute it in `calculateAllTaxes()`, add it to the returned object, and
   add it to `totals.totalTax`. If you skip that last step, the new tax is
   shown but take-home pay ignores it.
3. Add it to `getCompleteTaxBreakdown()` if it belongs in the bracket tables.
4. Add the markup to `index.html` and the rendering to `js/displayManager.js`.
   See [architecture.md](architecture.md) for why ids matter.
5. Run the check in [testing.md](testing.md). The reference figures should
   not move unless you meant them to.
