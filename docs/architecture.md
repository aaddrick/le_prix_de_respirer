# Architecture

## Modules

Each file in `js/` exports one class, except the data modules. `js/main.js`
builds the classes in `TaxCalculatorApp` and is the only place they meet.

| File | Owns | Touches the DOM |
|---|---|---|
| `js/data/<code>.js`, `js/data/index.js` | Every rate and threshold, one module per jurisdiction, plus `payroll` and the shared index | No, and must not |
| `js/taxCalculator.js` | The arithmetic: payroll, credits, surtax, reductions, comparison across provinces | No, and must not |
| `js/uiControls.js` | Reading the inputs for both scenarios, keeping each slider and number box in sync | Yes |
| `js/displayManager.js` | Writing every result, formatting, the bracket, credit and payroll tables | Yes |
| `js/tabManager.js` | Which tab is visible, Ctrl/Cmd+number shortcuts | Yes |
| `js/themeManager.js` | Dark/light mode, stored in `localStorage` under `theme` | Yes |

`js/data/index.js` imports every data module and exports them together.
`js/taxCalculator.js` imports that index and nothing else for its numbers, so
a module that is missing from the index is never loaded. See
[tax-rules.md](tax-rules.md) for the data layout.

A small inline script in the head of `index.html` applies the stored theme
before the page paints, so a dark-mode reload does not flash light. It reads the
same `theme` key as `js/themeManager.js`, so change the key in both places or
the flash returns.

`js/taxCalculator.js` and `js/data/` stay DOM-free because they are the only
modules Node can import, and the check in [testing.md](testing.md) depends on
that.

## How an input reaches the screen

1. `UIControls` hears an `input` or `change` event on any Setup control and
   calls the callback `main.js` passed it.
2. `TaxCalculatorApp.updateCalculations()` calls `UIControls.getValues()`,
   then `TaxCalculator.calculate()` for Scenario A, and again for Scenario B
   when the compare switch is on.
3. It also calls `TaxCalculator.compareAll()` at Scenario A's salary for the
   all-provinces table, and `getJurisdictionData()` for the data modules whose
   `flags`, `sources` and `salesTax` are shown.
4. It hands all of that to `DisplayManager.updateAll()`, which renders every
   tab at once. `TabManager` fires a `tabChanged` event on `document`, and
   `main.js` listens for it to show the A/B switch above the math tabs.

`calculate()` and `compareAll()` throw on bad input or a bad data module.
`updateCalculations()` catches that and `DisplayManager.showError()` fills
`#app-error`. Without the catch, one bad value blanks every figure with a
console error and no explanation on the page.

A new feature follows the same path. Compute it in `TaxCalculator`, render it
in `DisplayManager`, and wire the two in `main.js`. A module that calls
another module directly skips `main.js`, and then nothing re-renders it when
an input changes.

## Tabs

Each tab is a button `#<name>-tab` paired with a panel `#<name>-content` in
`index.html`. The names are listed in `TAB_NAMES` in `js/tabManager.js`, and
the ids are built from them with a template literal, so a plain grep for a full
id string will not find them. A new tab needs both elements and an entry in
`TAB_NAMES`. If the button exists but the name isn't registered, clicking it
does nothing, with no error.

| Tab name | What it shows |
|---|---|
| `setup` | Scenario A and Scenario B inputs and the compare switch |
| `output` | Take-home headline, the side-by-side table, the bars, and the "Verify these numbers" section |
| `provinces` | The same salary in every province and territory, sortable, and the sales-tax table |
| `federal-math`, `provincial-math`, `payroll-math` | The steps behind each figure, for the scenario picked in the A/B switch |

Source links sit next to each rate. `sourceLinks()` and `EXTRA_VERIFY_LINKS` in
`js/displayManager.js` build them from the `sources` in the data modules, so a
link is never typed into `index.html`, and a rate shown with no link means its
module has no `sources` entry for that field.

## DOM ids are the interface

`initializeElements()` in `js/uiControls.js` and `js/displayManager.js`
looks up elements by id. `index.html` has no other contract with the
scripts. When an id is renamed, `getElementById` returns `null` and that one
update quietly stops, or it throws the first time something writes to it,
which takes down every update after it.

Repeated content, such as bracket rows, credit rows and the verify cards, is built by
`DisplayManager` inside a container id. A jurisdiction without a rule renders
no row, instead of a stale one from the last province.

Before renaming or deleting an id in `index.html`:

```bash
grep -rn 'the-old-id' js/
```

`example.html` imports the same modules, so check it as well.
