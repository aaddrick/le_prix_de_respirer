/**
 * UI Controls Module
 * Reads the Setup inputs for Scenario A and B, keeps each slider and number
 * box in sync both ways, and owns the compare toggle and the math-tab A/B
 * switch. Ids are described in docs/architecture.md.
 */

const DEFAULTS = {
    a: { province: 'on' },
    b: { province: 'ab' }
};

export class UIControls {
    /**
     * @param {Function} updateCallback - called after any input changes
     */
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
        this.mathScenario = 'a';
        this.elements = this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // One literal lookup per id.
        const elements = {
            a: {
                provinceSelect: document.getElementById('a-province-select'),
                incomeSlider: document.getElementById('a-income-slider'),
                incomeInput: document.getElementById('a-income-input'),
                deductionsSlider: document.getElementById('a-deductions-slider'),
                deductionsInput: document.getElementById('a-deductions-input')
            },
            b: {
                provinceSelect: document.getElementById('b-province-select'),
                incomeSlider: document.getElementById('b-income-slider'),
                incomeInput: document.getElementById('b-income-input'),
                deductionsSlider: document.getElementById('b-deductions-slider'),
                deductionsInput: document.getElementById('b-deductions-input')
            },
            compareToggle: document.getElementById('compare-toggle'),
            scenarioBCard: document.getElementById('scenario-b-card'),
            mathSwitchA: document.getElementById('math-switch-a'),
            mathSwitchB: document.getElementById('math-switch-b')
        };
        for (const s of ['a', 'b']) {
            for (const [key, e] of Object.entries(elements[s])) {
                if (!e) console.warn(`UIControls: missing element for ${s}.${key}`);
            }
        }
        for (const key of ['compareToggle', 'scenarioBCard', 'mathSwitchA', 'mathSwitchB']) {
            if (!elements[key]) console.warn(`UIControls: missing element for ${key}`);
        }
        return elements;
    }

    setupEventListeners() {
        for (const s of ['a', 'b']) {
            const e = this.elements[s];
            this.setupInputSync(e.incomeSlider, e.incomeInput);
            this.setupInputSync(e.deductionsSlider, e.deductionsInput);
            if (e.provinceSelect) {
                e.provinceSelect.addEventListener('change', () => this.updateCallback());
            }
        }

        const toggle = this.elements.compareToggle;
        if (toggle) {
            toggle.addEventListener('change', () => {
                this.syncCompareVisibility();
                if (!toggle.checked) this.setMathScenario('a', false);
                this.updateCallback();
            });
        }
        this.syncCompareVisibility();

        if (this.elements.mathSwitchA) {
            this.elements.mathSwitchA.addEventListener('click', () => this.setMathScenario('a'));
        }
        if (this.elements.mathSwitchB) {
            this.elements.mathSwitchB.addEventListener('click', () => this.setMathScenario('b'));
        }
    }

    syncCompareVisibility() {
        const on = this.isComparing();
        if (this.elements.scenarioBCard) this.elements.scenarioBCard.classList.toggle('hidden', !on);
    }

    isComparing() {
        return this.elements.compareToggle ? this.elements.compareToggle.checked : true;
    }

    /** Which scenario the math tabs explain ('a' or 'b'). */
    setMathScenario(which, fire = true) {
        this.mathScenario = which === 'b' ? 'b' : 'a';
        const { mathSwitchA: a, mathSwitchB: b } = this.elements;
        if (a) {
            a.classList.toggle('active', this.mathScenario === 'a');
            a.setAttribute('aria-pressed', String(this.mathScenario === 'a'));
        }
        if (b) {
            b.classList.toggle('active', this.mathScenario === 'b');
            b.setAttribute('aria-pressed', String(this.mathScenario === 'b'));
        }
        if (fire) this.updateCallback();
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
     * Fill both province selects from TaxCalculator.listProvinces().
     * @param {{code: string, name: string}[]} provinces
     */
    setProvinceOptions(provinces) {
        for (const s of ['a', 'b']) {
            const select = this.elements[s].provinceSelect;
            if (!select) continue;
            select.replaceChildren(...provinces.map(({ code, name }) => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = name;
                return option;
            }));
            const wanted = DEFAULTS[s].province;
            select.value = provinces.some(p => p.code === wanted) ? wanted : provinces[0]?.code;
        }
    }

    readScenario(s) {
        const e = this.elements[s];
        return {
            employmentIncome: this.parseAmount(e.incomeInput?.value),
            province: e.provinceSelect?.value || DEFAULTS[s].province,
            otherDeductions: this.parseAmount(e.deductionsInput?.value)
        };
    }

    /**
     * @returns {{a: object, b: object, compare: boolean, mathScenario: 'a'|'b'}}
     *   a and b are calculate() inputs: {employmentIncome, province, otherDeductions}
     */
    getValues() {
        const compare = this.isComparing();
        return {
            a: this.readScenario('a'),
            b: this.readScenario('b'),
            compare,
            mathScenario: compare ? this.mathScenario : 'a'
        };
    }

    /**
     * Set inputs (used by setState and tests). Does not fire the callback.
     * @param {{a?: object, b?: object, compare?: boolean}} values
     */
    setValues({ a, b, compare } = {}) {
        const setPair = (slider, input, value) => {
            if (value === undefined || !input) return;
            const v = this.parseAmount(value);
            input.value = String(v);
            if (slider) slider.value = String(Math.min(v, Number(slider.max)));
        };
        for (const [s, v] of [['a', a], ['b', b]]) {
            if (!v) continue;
            const e = this.elements[s];
            setPair(e.incomeSlider, e.incomeInput, v.employmentIncome);
            setPair(e.deductionsSlider, e.deductionsInput, v.otherDeductions);
            if (v.province !== undefined && e.provinceSelect) e.provinceSelect.value = v.province;
        }
        if (compare !== undefined && this.elements.compareToggle) {
            this.elements.compareToggle.checked = Boolean(compare);
            this.syncCompareVisibility();
        }
    }

    setDisabled(disabled) {
        for (const s of ['a', 'b']) {
            Object.values(this.elements[s]).forEach(el => { if (el) el.disabled = disabled; });
        }
        if (this.elements.compareToggle) this.elements.compareToggle.disabled = disabled;
    }

    enable() { this.setDisabled(false); }
    disable() { this.setDisabled(true); }
}
