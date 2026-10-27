/**
 * Main Calculator Application Module
 * The only place the modules meet: reads the Setup inputs (UIControls),
 * calculates Scenario A, Scenario B and the all-provinces table
 * (TaxCalculator), renders (DisplayManager). See docs/architecture.md.
 */

import { TaxCalculator } from './taxCalculator.js';
import { UIControls } from './uiControls.js';
import { DisplayManager } from './displayManager.js';
import { ThemeManager } from './themeManager.js';
import { TabManager } from './tabManager.js';

const MATH_TABS = ['federal-math', 'provincial-math', 'payroll-math'];

export class TaxCalculatorApp {
    constructor() {
        this.taxCalculator = new TaxCalculator();
        this.displayManager = new DisplayManager();
        this.themeManager = new ThemeManager();
        this.tabManager = new TabManager();
        this.uiControls = new UIControls(() => this.updateCalculations());

        this.provinces = this.taxCalculator.listProvinces();
        this.uiControls.setProvinceOptions(this.provinces);

        document.addEventListener('tabChanged', () => this.syncMathSwitch());

        this.updateCalculations();
    }

    /** The A/B switch shows only on the math tabs, and only when comparing. */
    syncMathSwitch() {
        const onMathTab = MATH_TABS.includes(this.tabManager.getActiveTab());
        this.displayManager.setMathSwitchVisible(onMathTab && this.uiControls.isComparing());
    }

    /**
     * Recalculate from the current inputs and re-render every tab.
     * The engine throws on bad input or bad data; the message is shown
     * instead of a page of stale or zero numbers.
     */
    updateCalculations() {
        const v = this.uiControls.getValues();
        try {
            const calc = this.taxCalculator;
            const ra = calc.calculate(v.a);
            const rb = v.compare ? calc.calculate(v.b) : null;
            const rows = calc.compareAll({
                employmentIncome: v.a.employmentIncome,
                otherDeductions: v.a.otherDeductions
            });
            const salesData = Object.fromEntries(rows.map(r => [r.province, calc.getJurisdictionData(r.province)]));
            const mathProvince = v.mathScenario === 'b' && rb ? v.b.province : v.a.province;

            this.displayManager.updateAll({
                ra,
                rb,
                dataA: { prov: calc.getJurisdictionData(v.a.province), fed: calc.getJurisdictionData('fed'), payroll: calc.getJurisdictionData('payroll') },
                dataB: rb ? { prov: calc.getJurisdictionData(v.b.province), fed: calc.getJurisdictionData('fed'), payroll: calc.getJurisdictionData('payroll') } : null,
                rows,
                salesData,
                mathScenario: v.mathScenario,
                mathData: {
                    fed: calc.getJurisdictionData('fed'),
                    prov: calc.getJurisdictionData(mathProvince),
                    payroll: calc.getJurisdictionData('payroll')
                }
            });
            this.lastResult = { a: ra, b: rb, rows };
        } catch (err) {
            console.error(err);
            this.displayManager.showError(`Could not calculate: ${err.message}`);
        }
        this.syncMathSwitch();
    }

    /** Current inputs, results and theme (for debugging from the console). */
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
