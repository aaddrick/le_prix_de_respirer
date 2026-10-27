# Federal Income Tax Calculator - Modular Architecture

This calculator has been refactored into a modular architecture where each section can be modified or replaced independently.

Contributor docs (running it, architecture, tax rules, testing) are in [docs/](docs/index.md).

## Project Structure

```
├── index.html          # Main HTML file
├── js/
│   ├── main.js          # Main application coordinator
│   ├── taxCalculator.js # Tax calculation logic
│   ├── uiControls.js    # Input controls and form handling
│   ├── displayManager.js # Display updates and visualization
│   └── themeManager.js  # Dark/light mode functionality
└── README.md
```

## Modular Components

### 1. TaxCalculator (`js/taxCalculator.js`)
Handles all tax calculation logic including:
- Federal tax bracket calculations
- Standard deductions
- AGI and taxable income computations
- Baseline scenario calculations

**Usage:**
```javascript
import { TaxCalculator } from './js/taxCalculator.js';

const calculator = new TaxCalculator();
const result = calculator.calculateTaxes({
    income: 75000,
    adjustments: 0,
    deductions: 0,
    credits: 2000,
    filingStatus: 2 // 1 = single, 2 = married
});
```

### 2. UIControls (`js/uiControls.js`)
Manages all input controls and form interactions:
- Slider and input field synchronization
- Form value getters and setters
- Input validation
- Event handling

**Usage:**
```javascript
import { UIControls } from './js/uiControls.js';

const controls = new UIControls(() => {
    // This callback runs when any input changes
    console.log('Input changed:', controls.getValues());
});
```

### 3. DisplayManager (`js/displayManager.js`)
Handles all display updates and visualizations:
- Currency formatting
- Visual calculation flow updates
- Baseline comparison displays
- Income breakdown visualization

**Usage:**
```javascript
import { DisplayManager } from './js/displayManager.js';

const display = new DisplayManager();
display.updateAll({
    customCalculation: calculationResults,
    baselineCalculation: baselineResults,
    inputs: inputValues,
    standardDeduction: 29200
});
```

### 4. ThemeManager (`js/themeManager.js`)
Manages dark/light mode functionality:
- Theme persistence
- System preference detection
- Theme toggle functionality

**Usage:**
```javascript
import { ThemeManager } from './js/themeManager.js';

const theme = new ThemeManager();
theme.setTheme('dark'); // or 'light'
```

### 5. Main Application (`js/main.js`)
Coordinates all components and manages application state:
- Initializes all modules
- Handles inter-component communication
- Provides global application API

## Benefits of Modular Architecture

### 1. **Independent Development**
- Each module can be developed and tested separately
- Different developers can work on different sections simultaneously
- Easier to track changes and debug specific functionality

### 2. **Easy Customization**
- Replace tax calculation logic without touching UI code
- Swap out visualization components independently
- Modify input controls without affecting calculations

### 3. **Maintainability**
- Clear separation of concerns
- Smaller, focused files are easier to understand
- Changes to one module don't affect others

### 4. **Testability**
- Each module can be unit tested independently
- Mock dependencies easily for isolated testing
- Clear interfaces make testing straightforward

## Example: Replacing the Tax Calculator

To implement a different tax system, you only need to replace the `TaxCalculator` class:

```javascript
// Create a new calculator (e.g., for a different country)
class UKTaxCalculator {
    calculateTaxes(params) {
        // Implement UK tax logic here
        return {
            agi: /* calculated value */,
            taxableIncome: /* calculated value */,
            // ... other properties
        };
    }
    
    getStandardDeduction() {
        return 12570; // UK personal allowance
    }
}

// Replace in main.js:
// this.taxCalculator = new TaxCalculator();
this.taxCalculator = new UKTaxCalculator();
```

## Example: Custom Display Component

To create a different visualization:

```javascript
class ChartDisplayManager {
    updateVisualizationBar(params) {
        // Instead of a bar chart, show a pie chart
        this.renderPieChart(params);
    }
    
    renderPieChart(params) {
        // Custom chart implementation
    }
}

// Replace in main.js:
// this.displayManager = new DisplayManager();
this.displayManager = new ChartDisplayManager();
```

## Development Guidelines

### Adding New Features
1. Determine which module the feature belongs to
2. If it doesn't fit existing modules, create a new one
3. Update the main application to use the new module
4. Maintain the same interface pattern for consistency

### Modifying Existing Features
1. Locate the appropriate module
2. Make changes only within that module
3. Ensure the public interface remains compatible
4. Test that other modules still work correctly

### Creating New Modules
1. Export a class with clear public methods
2. Keep internal implementation private
3. Document the public interface
4. Follow the same patterns as existing modules

This modular architecture makes the calculator flexible, maintainable, and extensible while preserving all existing functionality.