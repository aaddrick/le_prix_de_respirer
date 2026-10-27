# Testing

There is no test framework and no CI. A wrong bracket still produces a
reasonable-looking number, so looking at the page is not a check. Use the
two steps below and say which ones you ran.

## 1. The Node check (calculation changes)

`js/taxCalculator.js` imports cleanly in Node 18 or later:

```bash
node --input-type=module -e "
import { TaxCalculator } from './js/taxCalculator.js';
const r = new TaxCalculator().calculateAllTaxes({
  federalIncome: 75000, federalAdjustments: 0, federalDeductions: 0, federalCredits: 0,
  stateIncome: 75000, stateAdjustments: 0, stateDeductions: 0, stateCredits: 0,
  filingStatus: 2 });
console.log(r.federal.totalTax, r.state.totalTax, r.county.totalTax,
  r.totals.effectiveRate.toFixed(2), r.totals.postTaxIncome);"
```

Expected at the time of writing:

```
8523 3510 2025 18.74 60942
```

That is federal, Maryland, county, total effective rate %, and take-home.
**Every other input has to be 0.** The figures assume no deductions. If you
enter a standard deduction, you get different, correct numbers. Don't "fix"
the code to match these figures.

If you change a bracket on purpose, these figures change. Recompute them,
check them by hand against the published table, and update this block in the
same commit. If you leave them stale, the next contributor will "fix" correct
code.

## 2. The manual pass (UI changes)

Serve the site (see [getting-started.md](getting-started.md)) and keep the
console open. A clean run shows no errors.

- Enter the reference scenario above on the Calculator tab. Check the totals,
  and check that the slider and number box stay in sync both ways.
- Switch filing status. Every figure should update.
- Open all four tabs. The bracket tables fill only while their tab is
  visible.
- Toggle the theme, reload, and confirm the theme sticks.
- Narrow the window to phone width. The CSS is mobile first.
- If you touched a shared module, click every button on `example.html`.
