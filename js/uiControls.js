/**
 * UI Controls Module
 * Reads the inputs and keeps each slider and number box in sync both ways.
 * Ids are listed in notes/ui-ids.md.
 */

const DEFAULT_PROVINCE = 'on';

export class UIControls {
    /**
     * @param {Function} updateCallback - called after any input changes
     */
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
        this.elements = this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // One literal lookup per id (see notes/ui-ids.md).
        const elements = {
            incomeSlider: document.getElementById('income-slider'),
            incomeInput: document.getElementById('income-input'),
            provinceSelect: document.getElementById('province-select'),
            deductionsSlider: document.getElementById('deductions-slider'),
            deductionsInput: document.getElementById('deductions-input')
        };
        for (const [key, e] of Object.entries(elements)) {
            if (!e) console.warn(`UIControls: missing element for ${key}`);
        }
        return elements;
    }

    setupEventListeners() {
        this.setupInputSync(this.elements.incomeSlider, this.elements.incomeInput);
        this.setupInputSync(this.elements.deductionsSlider, this.elements.deductionsInput);
        if (this.elements.provinceSelect) {
            this.elements.provinceSelect.addEventListener('change', () => this.updateCallback());
        }
    }

    /**
     * Two-way sync. The slider is clamped to its own max; the number box
     * keeps whatever (non-negative) value was typed.
     */
    setupInputSync(slider, input) {
        if (!slider || !input) return;

        slider.addEventListener('input', () => {
            input.value = slider.value;
            this.updateCallback();
        });

        input.addEventListener('input', () => {
            const value = this.parseAmount(input.value);
            slider.value = String(Math.min(value, Number(slider.max)));
            this.updateCallback();
        });

        // Normalise what is shown once the user leaves the box (blank -> 0, negative -> 0).
        input.addEventListener('change', () => {
            input.value = String(this.parseAmount(input.value));
        });
    }

    /** Non-negative finite number from a text value; anything else is 0. */
    parseAmount(raw) {
        const n = Number.parseFloat(raw);
        return Number.isFinite(n) && n > 0 ? n : 0;
    }

    /**
     * Fill the province select from TaxCalculator.listProvinces().
     * @param {{code: string, name: string}[]} provinces
     * @param {string} [selected]
     */
    setProvinceOptions(provinces, selected = DEFAULT_PROVINCE) {
        const select = this.elements.provinceSelect;
        if (!select) return;
        select.replaceChildren();
        for (const { code, name } of provinces) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            select.appendChild(option);
        }
        if (provinces.some(p => p.code === selected)) {
            select.value = selected;
        }
    }

    /**
     * @returns {{employmentIncome: number, province: string, otherDeductions: number}}
     */
    getValues() {
        return {
            employmentIncome: this.parseAmount(this.elements.incomeInput?.value),
            province: this.elements.provinceSelect?.value || DEFAULT_PROVINCE,
            otherDeductions: this.parseAmount(this.elements.deductionsInput?.value)
        };
    }

    /**
     * Set any of the inputs (used by setState and tests). Does not fire the callback.
     */
    setValues({ employmentIncome, province, otherDeductions } = {}) {
        const setPair = (slider, input, value) => {
            if (value === undefined || !input) return;
            const v = this.parseAmount(value);
            input.value = String(v);
            if (slider) slider.value = String(Math.min(v, Number(slider.max)));
        };
        setPair(this.elements.incomeSlider, this.elements.incomeInput, employmentIncome);
        setPair(this.elements.deductionsSlider, this.elements.deductionsInput, otherDeductions);
        if (province !== undefined && this.elements.provinceSelect) {
            this.elements.provinceSelect.value = province;
        }
    }

    reset() {
        this.setValues({ employmentIncome: 75000, province: DEFAULT_PROVINCE, otherDeductions: 0 });
        this.updateCallback();
    }

    setDisabled(disabled) {
        Object.values(this.elements).forEach(el => {
            if (el) el.disabled = disabled;
        });
    }

    enable() {
        this.setDisabled(false);
    }

    disable() {
        this.setDisabled(true);
    }
}
