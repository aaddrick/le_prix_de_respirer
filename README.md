# Le prix de respirer: Canadian income tax calculator

A static calculator for Canadian income tax, tax year 2026. On the Setup tab,
enter an employment income, a province or territory, and an optional "other
deductions" amount such as an RRSP contribution. Switch on a second scenario to
compare two salaries or two places. The Take-home tab (`output`) leads with take-home pay for
each scenario and the difference between them, then a side-by-side table of
federal tax, provincial or territorial tax, payroll deductions (CPP or QPP, EI,
QPIP in Quebec), and the effective and marginal rates. The same salary can also
be compared across all 13 provinces and territories, with the GST, HST, PST and
QST that apply in each. The tax-math tabs show each step for federal tax,
provincial tax and payroll.

It is a single filer with employment income. Spousal, dependant and other
personal credits, refundable credits and benefits, and cost-of-living figures
are out of scope. See [docs/tax-rules.md](docs/tax-rules.md).

## Provisional values and verifying them

Every rate and threshold lives in `js/data/` with its source URL and retrieval
date. A value that could not be confirmed from an official 2026 source carries
an entry in that module's `flags` list, marked `PROVISIONAL`, `UNVERIFIED` or
`CONFLICT`. The tax-math tabs list the flags for the jurisdiction on screen,
and the "Verify these numbers" section of the Take-home tab links to the official
pages each figure came from. Check a figure there before relying on it. This is
an estimate for comparing options, not tax advice or a filing tool, and the
page footer says so.

## Run it

There is nothing to install, no build and no dependencies. Serve the folder
over HTTP and open it:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Opening `index.html` as `file://` shows a page of zeros, because browsers block
module imports from `file://`.

## For contributors

Everything about changing it is in [docs/](docs/index.md): the architecture,
how to update the tax data, the tests, and troubleshooting. The calculator
module `js/taxCalculator.js` has no DOM access and runs in Node, which is how
it is checked.
