# Architecture

## Modules

Each file in `js/` exports one class. `js/main.js` builds them all in
`TaxCalculatorApp` and is the only place they meet.

| File | Owns | Touches the DOM |
|---|---|---|
| `js/taxCalculator.js` | Brackets, deductions, every calculation | No, and must not |
| `js/uiControls.js` | Reading inputs, keeping each slider and number box in sync | Yes |
| `js/displayManager.js` | Writing every result, formatting, bracket tables | Yes |
| `js/tabManager.js` | Which tab is visible, Ctrl/Cmd+1 to 4 shortcuts | Yes |
| `js/themeManager.js` | Dark/light mode, stored in `localStorage` under `theme` | Yes |

`js/taxCalculator.js` stays DOM-free because it is the only module Node can
import, and the check in [testing.md](testing.md) depends on that.

## How an input reaches the screen

1. `UIControls` hears an `input` or `change` event and calls the callback
   `main.js` passed it.
2. `TaxCalculatorApp.updateCalculations()` calls `UIControls.getValues()`,
   then `TaxCalculator.calculateAllTaxes()`, then `calculateBaseline()`.
3. It hands all three results to `DisplayManager.updateAll()`.
4. The bracket tables are rebuilt only while the `bracket-breakdown` tab is
   active. `TabManager` fires a `tabChanged` event on `document` and `main.js`
   listens for it.

A new feature follows the same path. Compute it in `TaxCalculator`, render it
in `DisplayManager`, and wire the two in `main.js`. A module that calls
another module directly skips `main.js`, and then nothing re-renders it when
the filing status changes.

## Tabs

Each tab is a button `#<name>-tab` paired with a panel `#<name>-content` in
`index.html`. The names are listed in `bindTabEvents()` and
`setActiveTab()` in `js/tabManager.js`. A new tab needs both elements and an
entry in both functions. If the button exists but the name isn't registered,
clicking it does nothing, with no error.

## DOM ids are the interface

`initializeElements()` in `js/uiControls.js` and `js/displayManager.js`
looks up every element by id. `index.html` has no other contract with the
scripts. When an id is renamed, `getElementById` returns `null` and that one
update quietly stops, or it throws the first time something writes to it,
which takes down every update after it in `updateAll()`.

Before renaming or deleting an id in `index.html`:

```bash
grep -rn 'the-old-id' js/
```

`example.html` imports the same modules, so check it as well.
