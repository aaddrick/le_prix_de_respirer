/**
 * Main Calculator Application Module
 * The only place the modules meet: reads inputs (UIControls), calculates
 * (TaxCalculator), renders (DisplayManager). See docs/architecture.md.
 */

import { TaxCalculator } from './taxCalculator.js';
import { UIControls } from './uiControls.js';
import { DisplayManager } from './displayManager.js';
import { ThemeManager } from './themeManager.js';
import { TabManager } from './tabManager.js';

export class TaxCalculatorApp {
    constructor() {
        this.taxCalculator = new TaxCalculator();
        this.displayManager = new DisplayManager();
        this.themeManager = new ThemeManager();
        this.tabManager = new TabManager();
        this.uiControls = new UIControls(() => this.updateCalculations());

        this.uiControls.setProvinceOptions(this.taxCalculator.listProvinces());
        this.updateCalculations();
    }

    /**
     * Recalculate from the current inputs and re-render every tab.
     * The engine throws on bad input or bad data; the message is shown
     * instead of a page of stale or zero numbers.
     */
    updateCalculations() {
        const inputs = this.uiControls.getValues();
        try {
            const result = this.taxCalculator.calculate(inputs);
            const data = {
                fed: this.taxCalculator.getJurisdictionData('fed'),
                prov: this.taxCalculator.getJurisdictionData(inputs.province),
                payroll: this.taxCalculator.getJurisdictionData('payroll')
            };
            this.displayManager.updateAll(result, data);
            this.lastResult = result;
        } catch (err) {
            console.error(err);
            this.displayManager.showError(`Could not calculate: ${err.message}`);
        }
    }

    reset() {
        this.uiControls.reset();
    }

    /** Current inputs, result and theme (for debugging from the console). */
    getState() {
        return {
            inputs: this.uiControls.getValues(),
            calculation: this.lastResult,
            theme: this.themeManager.getCurrentTheme()
        };
    }

    setState(state) {
        if (state.inputs) this.uiControls.setValues(state.inputs);
        if (state.theme) this.themeManager.setTheme(state.theme);
        this.updateCalculations();
    }

    enable() {
        this.uiControls.enable();
    }

    disable() {
        this.uiControls.disable();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.taxCalculatorApp = new TaxCalculatorApp();
});
