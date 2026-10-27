# Troubleshooting

**Every figure is $0 and nothing reacts.** The page was opened as `file://`.
Serve it over HTTP. See [getting-started.md](getting-started.md).

**One section stopped updating after an HTML edit.** A DOM id was renamed or
removed, so its lookup returned `null`. Check the console for
`Cannot set properties of null`. See [architecture.md](architecture.md).

**Everything after a certain point stopped updating.** Same cause. A write to
a `null` element throws, and nothing after it in the `DisplayManager` update
runs. The first error in the console is the real one.

**A new tab button does nothing.** Its name isn't registered in
`js/tabManager.js`. See [architecture.md](architecture.md).

**A red message replaces the results.** `TaxCalculator.calculate()` threw.
The message names the jurisdiction and the field: a data module is missing a
required field, has an unknown `special`, has brackets out of order, or the
input was negative. The engine throws instead of using 0 so that a bad value
cannot render a plausible figure. Fix the data module named in the message. See
[tax-rules.md](tax-rules.md).

**Scenario B or the A/B switch is missing.** The compare switch on the Setup
tab is off. It defaults to on. Scenario B, its Take-home column and the switch
above the math tabs all depend on it, and the figures for A are unaffected.

**A rate has no source link.** The link is built from the module's `sources`,
and no entry's `fields` covers that field. Add the source in the data module.
See [tax-rules.md](tax-rules.md).

**A province is missing from the selector or the comparison.** Its module is
not imported or exported in `js/data/index.js`, or its code is missing from
`PROVINCE_CODES`. `compareAll()` throws if any module is missing, so check the
console.

**Take-home looks too high or low.** The calculator covers a single filer's
employment income, so it leaves out personal credits and refundable benefits
beyond the basic amount. Check whether "other deductions" was left at 0. A
value shown with a `PROVISIONAL` or `UNVERIFIED` flag on a tax-math tab is not
confirmed from an official 2026 source. See [tax-rules.md](tax-rules.md).

**The Node check throws `document is not defined`.** Something in
`js/taxCalculator.js` or `js/data/` now touches the DOM. Move it to
`DisplayManager` or `UIControls`.

**Fonts look different.** The font files in `fonts/` returned 404, so the
page fell back to system fonts. The usual cause is serving from the wrong
directory, so check that the server was started in the repo root and look for
404s on `fonts/` in the browser's network panel. This is cosmetic, and the app
works without them.
