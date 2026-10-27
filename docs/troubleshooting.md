# Troubleshooting

**Every figure is $0 and nothing reacts.** The page was opened as `file://`.
Serve it over HTTP. See [getting-started.md](getting-started.md).

**One section stopped updating after an HTML edit.** A DOM id was renamed or
removed, so its lookup returned `null`. Check the console for
`Cannot set properties of null`. See [architecture.md](architecture.md).

**Everything after a certain point stopped updating.** Same cause. A write to
a `null` element throws, and nothing after it in
`DisplayManager.updateAll()` runs. The first error in the console is the
real one.

**A new tab button does nothing.** Its name isn't registered in
`js/tabManager.js`. See [architecture.md](architecture.md).

**Tax looks too high.** Check whether deductions were left at 0. The
standard deduction isn't applied automatically. See
[tax-rules.md](tax-rules.md).

**The Node check throws `document is not defined`.** Something in
`js/taxCalculator.js` now touches the DOM. Move it to `DisplayManager` or
`UIControls`.

**Fonts look different.** Google Fonts didn't load. This is cosmetic, and
the app works without it.
