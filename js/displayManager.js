/**
 * Display Manager Module
 * Writes every result to the page. Every number shown comes from the
 * TaxCalculator result (notes/engine.md) or from the data module the engine
 * hands back through getJurisdictionData(); none is typed into the HTML.
 * Ids are listed in notes/ui-ids.md.
 */

const moneyFormat = new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0
});

/** Whole-dollar currency. Non-finite values show as '-'. */
export function formatCurrency(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
    // Avoid "-$0" for tiny negative float noise.
    const v = Math.abs(value) < 0.5 ? 0 : value;
    return moneyFormat.format(v);
}

/** A computed share or marginal rate, as a percentage with fixed decimals. */
export function formatPercent(rate, digits = 2) {
    if (typeof rate !== 'number' || !Number.isFinite(rate)) return '-';
    const p = rate * 100;
    return `${(Math.abs(p) < 0.005 ? 0 : p).toFixed(digits)}%`;
}

/** A statutory rate from the data (e.g. 0.0505, 0.0043): 2 to 3 decimals, no float noise. */
export function formatRate(rate) {
    if (typeof rate !== 'number' || !Number.isFinite(rate)) return '-';
    let s = (rate * 100).toFixed(3);
    if (s.endsWith('0')) s = s.slice(0, -1);
    return `${s}%`;
}

const PENSION_DEDUCTION_LABELS = {
    cppEnhanced: 'Enhanced CPP contributions (first additional)',
    qppEnhanced: 'Enhanced QPP contributions (first additional)',
    cpp2: 'CPP2 contributions (second additional)',
    qpp2: 'QPP2 contributions (second additional)'
};

export class DisplayManager {
    constructor() {
        this.elements = this.initializeElements();
    }

    /**
     * One literal lookup per id so a grep of js/ lists every id this module
     * needs (docs/learnings/test-methodology-and-coverage.md, structural checks).
     */
    initializeElements() {
        const elements = {
            'app-error': document.getElementById('app-error'),
            'pct-take-home': document.getElementById('pct-take-home'),
            'pct-federal': document.getElementById('pct-federal'),
            'pct-provincial': document.getElementById('pct-provincial'),
            'pct-payroll': document.getElementById('pct-payroll'),
            'pct-provincial-label': document.getElementById('pct-provincial-label'),
            'bar-take-home': document.getElementById('bar-take-home'),
            'bar-federal': document.getElementById('bar-federal'),
            'bar-provincial': document.getElementById('bar-provincial'),
            'bar-payroll': document.getElementById('bar-payroll'),
            'legend-provincial-name': document.getElementById('legend-provincial-name'),
            'sum-fed-net-income': document.getElementById('sum-fed-net-income'),
            'sum-fed-after-credits': document.getElementById('sum-fed-after-credits'),
            'sum-fed-abatement-row': document.getElementById('sum-fed-abatement-row'),
            'sum-fed-abatement': document.getElementById('sum-fed-abatement'),
            'sum-fed-tax-label': document.getElementById('sum-fed-tax-label'),
            'sum-prov-after-credits': document.getElementById('sum-prov-after-credits'),
            'sum-prov-surtax-row': document.getElementById('sum-prov-surtax-row'),
            'sum-prov-surtax': document.getElementById('sum-prov-surtax'),
            'sum-prov-reductions-list': document.getElementById('sum-prov-reductions-list'),
            'sum-prov-tax-label': document.getElementById('sum-prov-tax-label'),
            'sum-fed-taxable': document.getElementById('sum-fed-taxable'),
            'sum-fed-tax': document.getElementById('sum-fed-tax'),
            'sum-fed-marginal': document.getElementById('sum-fed-marginal'),
            'sum-prov-title': document.getElementById('sum-prov-title'),
            'sum-prov-taxable': document.getElementById('sum-prov-taxable'),
            'sum-prov-health-row': document.getElementById('sum-prov-health-row'),
            'sum-prov-health-label': document.getElementById('sum-prov-health-label'),
            'sum-prov-health': document.getElementById('sum-prov-health'),
            'sum-prov-tax': document.getElementById('sum-prov-tax'),
            'sum-prov-marginal': document.getElementById('sum-prov-marginal'),
            'sum-pension-label': document.getElementById('sum-pension-label'),
            'sum-pension': document.getElementById('sum-pension'),
            'sum-pension2-label': document.getElementById('sum-pension2-label'),
            'sum-pension2': document.getElementById('sum-pension2'),
            'sum-ei': document.getElementById('sum-ei'),
            'sum-qpip-row': document.getElementById('sum-qpip-row'),
            'sum-qpip': document.getElementById('sum-qpip'),
            'sum-payroll-total': document.getElementById('sum-payroll-total'),
            'total-federal': document.getElementById('total-federal'),
            'total-provincial-label': document.getElementById('total-provincial-label'),
            'total-provincial': document.getElementById('total-provincial'),
            'total-payroll': document.getElementById('total-payroll'),
            'total-deductions': document.getElementById('total-deductions'),
            'total-take-home': document.getElementById('total-take-home'),
            'total-effective-rate': document.getElementById('total-effective-rate'),
            'total-effective-income-tax-rate': document.getElementById('total-effective-income-tax-rate'),
            'total-marginal-rate': document.getElementById('total-marginal-rate'),
            'total-marginal-rate-payroll': document.getElementById('total-marginal-rate-payroll'),
            'payroll-math-title': document.getElementById('payroll-math-title'),
            'payroll-flags': document.getElementById('payroll-flags'),
            'payroll-steps': document.getElementById('payroll-steps'),
            'payroll-total': document.getElementById('payroll-total'),
            'payroll-marginal-rate': document.getElementById('payroll-marginal-rate'),
            'payroll-sources': document.getElementById('payroll-sources'),
            'fed-math-title': document.getElementById('fed-math-title'),
            'fed-flags': document.getElementById('fed-flags'),
            'fed-steps': document.getElementById('fed-steps'),
            'fed-deductions-table': document.getElementById('fed-deductions-table'),
            'fed-deductions-total': document.getElementById('fed-deductions-total'),
            'fed-bracket-table': document.getElementById('fed-bracket-table'),
            'fed-bracket-total-income': document.getElementById('fed-bracket-total-income'),
            'fed-bracket-total-tax': document.getElementById('fed-bracket-total-tax'),
            'fed-credits-table': document.getElementById('fed-credits-table'),
            'fed-credits-total': document.getElementById('fed-credits-total'),
            'fed-extras': document.getElementById('fed-extras'),
            'fed-net-tax': document.getElementById('fed-net-tax'),
            'fed-marginal-rate': document.getElementById('fed-marginal-rate'),
            'fed-sources': document.getElementById('fed-sources'),
            'prov-math-title': document.getElementById('prov-math-title'),
            'prov-flags': document.getElementById('prov-flags'),
            'prov-steps': document.getElementById('prov-steps'),
            'prov-deductions-table': document.getElementById('prov-deductions-table'),
            'prov-deductions-total': document.getElementById('prov-deductions-total'),
            'prov-bracket-table': document.getElementById('prov-bracket-table'),
            'prov-bracket-total-income': document.getElementById('prov-bracket-total-income'),
            'prov-bracket-total-tax': document.getElementById('prov-bracket-total-tax'),
            'prov-credits-table': document.getElementById('prov-credits-table'),
            'prov-credits-total': document.getElementById('prov-credits-total'),
            'prov-extras': document.getElementById('prov-extras'),
            'prov-net-tax': document.getElementById('prov-net-tax'),
            'prov-marginal-rate': document.getElementById('prov-marginal-rate'),
            'prov-sources': document.getElementById('prov-sources')
        };
        Object.entries(elements).forEach(([id, e]) => {
            if (!e) console.warn(`DisplayManager: missing #${id}`);
        });
        return elements;
    }

    el(id) {
        return this.elements[id] || null;
    }

    setText(id, text) {
        const e = this.el(id);
        if (e) e.textContent = text;
    }

    setHidden(id, hidden) {
        const e = this.el(id);
        if (e) e.classList.toggle('hidden', hidden);
    }

    // Kept for callers that used the old method names.
    formatCurrency(value) { return formatCurrency(value); }
    formatPercentage(rate) { return formatPercent(rate); }

    // ------------------------------------------------------------------
    // Errors
    // ------------------------------------------------------------------

    showError(message) {
        this.setText('app-error', message);
        this.setHidden('app-error', false);
    }

    clearError() {
        this.setText('app-error', '');
        this.setHidden('app-error', true);
    }

    // ------------------------------------------------------------------
    // Entry point
    // ------------------------------------------------------------------

    /**
     * @param {object} result - TaxCalculator.calculate() result
     * @param {{fed: object, prov: object, payroll: object}} data - getJurisdictionData() modules
     */
    updateAll(result, data) {
        this.clearError();
        this.updateCalculator(result, data);
        this.updateJurisdictionMath('fed', result.federal, result, data.fed, data);
        this.updateJurisdictionMath('prov', result.provincial, result, data.prov, data);
        this.updatePayrollMath(result, data.payroll);
    }

    // ------------------------------------------------------------------
    // Calculator tab
    // ------------------------------------------------------------------

    updateCalculator(r, data = {}) {
        const income = r.input.employmentIncome;
        const provName = r.input.provinceName;
        const share = v => (income > 0 ? v / income : 0);

        const shares = {
            'take-home': income > 0 ? share(r.totals.takeHome) : 1,
            federal: share(r.federal.net),
            provincial: share(r.provincial.net),
            payroll: share(r.payroll.total)
        };
        Object.entries(shares).forEach(([key, s]) => {
            this.setText(`pct-${key}`, formatPercent(s, 1));
            const bar = this.el(`bar-${key}`);
            if (bar) {
                const width = Math.max(0, s) * 100;
                bar.style.width = `${width}%`;
                bar.textContent = width >= 9 ? `${width.toFixed(0)}%` : '';
            }
        });
        this.setText('pct-provincial-label', `${provName} tax`);
        this.setText('legend-provincial-name', `${provName} tax`);
        const provBar = this.el('bar-provincial');
        if (provBar) provBar.title = `${provName} tax`;

        // Federal card
        this.setText('sum-fed-net-income', formatCurrency(r.federal.netIncome));
        this.setText('sum-fed-taxable', formatCurrency(r.federal.taxableIncome));
        this.setText('sum-fed-after-credits', formatCurrency(r.federal.afterCredits));
        const hasAbatement = r.input.province === 'qc';
        this.setHidden('sum-fed-abatement-row', !hasAbatement);
        this.setText('sum-fed-abatement', `−${formatCurrency(r.federal.abatement)}`);
        this.setText('sum-fed-tax-label', hasAbatement ? 'Federal tax (after abatement):' : 'Federal tax:');
        this.setText('sum-fed-tax', formatCurrency(r.federal.net));
        this.setText('sum-fed-marginal', formatPercent(r.federal.marginalRate));

        // Provincial card
        this.setText('sum-prov-title', `${provName} tax`);
        this.setText('sum-prov-taxable', formatCurrency(r.provincial.taxableIncome));
        // Components of provincial tax, in the engine's order, so the lines add up to the total.
        const prov = r.provincial;
        const hasSurtax = Boolean(data.prov && data.prov.surtax);
        this.setText('sum-prov-after-credits', formatCurrency(prov.afterCredits));
        this.setHidden('sum-prov-surtax-row', !hasSurtax);
        this.setText('sum-prov-surtax', `+${formatCurrency(prov.surtax)}`);
        const redHost = this.el('sum-prov-reductions-list');
        if (redHost) {
            redHost.replaceChildren(...prov.reductions.map(x => {
                const row = document.createElement('div');
                row.className = 'summary-row';
                const l = document.createElement('span');
                l.className = 'summary-label';
                l.textContent = `${x.name}:`;
                const v = document.createElement('span');
                v.className = 'summary-value';
                v.textContent = `−${formatCurrency(x.amount)}`;
                row.append(l, v);
                return row;
            }));
        }
        const parts = [];
        if (hasSurtax) parts.push('surtax');
        if (prov.reductions.length) parts.push('reductions');
        if (prov.healthPremiumName) parts.push(prov.healthPremiumName);
        this.setText('sum-prov-tax-label', parts.length
            ? `${provName} tax (incl. ${parts.join(', ')}):`
            : `${provName} tax:`);
        const hasHealth = Boolean(r.provincial.healthPremiumName);
        this.setHidden('sum-prov-health-row', !hasHealth);
        if (hasHealth) {
            this.setText('sum-prov-health-label', `${r.provincial.healthPremiumName}:`);
            this.setText('sum-prov-health', `+${formatCurrency(r.provincial.healthPremium)}`);
        }
        this.setText('sum-prov-tax', formatCurrency(r.provincial.net));
        this.setText('sum-prov-marginal', formatPercent(r.provincial.marginalRate));

        // Payroll card
        const p = r.payroll;
        const isQpp = p.plan === 'QPP';
        const pension = isQpp ? p.qpp : p.cpp;
        const pension2 = isQpp ? p.qpp2 : p.cpp2;
        this.setText('sum-pension-label', `${p.plan} contributions:`);
        this.setText('sum-pension', formatCurrency(pension));
        this.setText('sum-pension2-label', `${p.plan}2 contributions:`);
        this.setText('sum-pension2', formatCurrency(pension2));
        this.setText('sum-ei', formatCurrency(p.ei));
        this.setHidden('sum-qpip-row', !isQpp);
        this.setText('sum-qpip', formatCurrency(p.qpip));
        this.setText('sum-payroll-total', formatCurrency(p.total));

        // Totals
        const t = r.totals;
        this.setText('total-federal', formatCurrency(r.federal.net));
        this.setText('total-provincial-label', `${provName} tax`);
        this.setText('total-provincial', formatCurrency(r.provincial.net));
        this.setText('total-payroll', formatCurrency(t.payroll));
        this.setText('total-deductions', formatCurrency(t.totalDeductions));
        this.setText('total-take-home', formatCurrency(t.takeHome));
        this.setText('total-effective-rate', formatPercent(t.effectiveRate));
        this.setText('total-effective-income-tax-rate', formatPercent(t.effectiveIncomeTaxRate));
        this.setText('total-marginal-rate', formatPercent(t.marginalRateIncomeTax));
        this.setText('total-marginal-rate-payroll', formatPercent(t.marginalRateIncludingPayroll));
    }

    // ------------------------------------------------------------------
    // Federal / provincial tax-math tabs
    // ------------------------------------------------------------------

    /**
     * @param {'fed'|'prov'} prefix
     * @param {object} j - JurisdictionResult
     * @param {object} r - full result
     * @param {object} jData - the jurisdiction's data module
     * @param {object} data - all data modules ({fed, prov, payroll})
     */
    updateJurisdictionMath(prefix, j, r, jData, data) {
        const isFed = prefix === 'fed';
        const year = r.input.year;
        const taxLabel = isFed ? 'Federal tax' : `${j.name} tax`;

        this.setText(`${prefix}-math-title`, isFed
            ? `Federal tax math, ${year}`
            : `${j.name} tax math, ${year}`);

        this.renderFlags(`${prefix}-flags`, jData, j.name);
        this.renderSources(`${prefix}-sources`, jData);

        // Deductions from income
        const d = r.deductionsFromIncome;
        const dedRows = Object.keys(PENSION_DEDUCTION_LABELS)
            .filter(k => k in d)
            .map(k => [PENSION_DEDUCTION_LABELS[k], d[k]]);
        dedRows.push(['Other deductions (e.g. RRSP)', d.other]);
        if (!isFed && r.input.province === 'qc') {
            dedRows.push(['Deduction for workers (Quebec return only)', d.qcWorkerDeduction]);
        }
        const dedTotal = isFed ? d.federalTotal : d.provincialTotal;
        this.fillTable(`${prefix}-deductions-table`, dedRows.map(([label, v]) => [label, formatCurrency(v)]));
        this.setText(`${prefix}-deductions-total`, formatCurrency(dedTotal));

        // Brackets
        let activeIndex = -1;
        j.brackets.forEach((b, i) => { if (b.taxableInBracket > 0) activeIndex = i; });
        this.fillTable(`${prefix}-bracket-table`, j.brackets.map(b => [
            formatCurrency(b.from),
            Number.isFinite(b.to) ? formatCurrency(b.to) : 'and up',
            formatRate(b.rate),
            formatCurrency(b.taxableInBracket),
            formatCurrency(b.tax)
        ]), activeIndex);
        this.setText(`${prefix}-bracket-total-income`, formatCurrency(j.taxableIncome));
        this.setText(`${prefix}-bracket-total-tax`, formatCurrency(j.bracketTax));

        // Credits
        this.fillTable(`${prefix}-credits-table`, j.creditsDetail.map(c => [
            c.name, formatCurrency(c.amount), formatRate(c.rate), formatCurrency(c.credit)
        ]));
        this.setText(`${prefix}-credits-total`, formatCurrency(j.creditsTotal));

        // Steps
        const steps = [];
        steps.push(this.step(
            { label: 'Employment income', value: formatCurrency(r.input.employmentIncome), cls: 'calc-gross-income' },
            '−',
            { label: 'Deductions from income', value: formatCurrency(dedTotal), cls: 'calc-adjustments' },
            { label: 'Net income', value: formatCurrency(j.netIncome), cls: 'calc-result' }
        ));
        const topRate = activeIndex >= 0 ? formatRate(j.brackets[activeIndex].rate) : formatRate(j.brackets[0].rate);
        steps.push(this.step(
            { label: 'Taxable income', value: formatCurrency(j.taxableIncome), cls: 'calc-result' },
            '×',
            { label: 'Brackets (top rate reached)', value: topRate, cls: 'calc-tax-rate' },
            { label: 'Tax on brackets', value: formatCurrency(j.bracketTax), cls: 'calc-pre-credit-tax' },
            'Each slice of income is taxed at its own bracket rate; see the bracket table below.'
        ));

        // Optional steps, in the engine's order of operations (notes/engine.md).
        const optional = [];
        if (jData && jData.surtax) {
            optional.push({ op: '+', label: 'Surtax', value: j.surtax, after: j.afterSurtax });
        }
        if (j.reductions.length > 0) {
            const label = j.reductions.length === 1 ? j.reductions[0].name : 'Tax reductions';
            optional.push({ op: '−', label, value: j.reductionsTotal, after: j.afterSurtax - j.reductionsTotal });
        }
        if (isFed && r.input.province === 'qc') {
            const abRate = data.fed && data.fed.abatement ? ` (${formatRate(data.fed.abatement.quebec)})` : '';
            optional.push({ op: '−', label: `Quebec abatement${abRate}`, value: j.abatement,
                after: j.afterSurtax - j.reductionsTotal - j.abatement });
        }
        if (j.healthPremiumName) {
            optional.push({ op: '+', label: j.healthPremiumName, value: j.healthPremium, after: j.net });
        }

        const creditsBox = { label: `Credits at ${formatRate(j.creditRate)}`, value: formatCurrency(j.creditsTotal), cls: 'calc-credits' };
        const afterCreditsLabel = optional.length ? 'Tax after credits' : taxLabel;
        const afterCreditsValue = optional.length ? j.afterCredits : j.net;
        steps.push(this.step(
            { label: 'Tax on brackets', value: formatCurrency(j.bracketTax), cls: 'calc-pre-credit-tax' },
            '−',
            creditsBox,
            { label: afterCreditsLabel, value: formatCurrency(afterCreditsValue), cls: optional.length ? 'calc-result' : 'calc-total-tax' },
            j.bracketTax < j.creditsTotal ? 'Credits can only bring tax down to $0; they are not refundable.' : ''
        ));

        let prevLabel = 'Tax after credits';
        let prevValue = j.afterCredits;
        optional.forEach((o, i) => {
            const last = i === optional.length - 1;
            const after = last ? j.net : o.after;
            const afterLabel = last ? taxLabel : `After ${o.label.toLowerCase()}`;
            steps.push(this.step(
                { label: prevLabel, value: formatCurrency(prevValue), cls: 'calc-result' },
                o.op,
                { label: o.label, value: formatCurrency(o.value), cls: o.op === '+' ? 'calc-pre-credit-tax' : 'calc-credits' },
                { label: afterLabel, value: formatCurrency(after), cls: last ? 'calc-total-tax' : 'calc-result' }
            ));
            prevLabel = afterLabel;
            prevValue = after;
        });

        const stepsEl = this.el(`${prefix}-steps`);
        if (stepsEl) stepsEl.replaceChildren(...steps);

        this.renderExtras(`${prefix}-extras`, j, jData, r, isFed, data);

        this.setText(`${prefix}-net-tax`, formatCurrency(j.net));
        this.setText(`${prefix}-marginal-rate`, formatPercent(j.marginalRate));
    }

    /** Surtax tiers, reductions and health premium tables, only where the jurisdiction has them. */
    renderExtras(id, j, jData, r, isFed, data) {
        const host = this.el(id);
        if (!host) return;
        const blocks = [];

        if (jData && jData.surtax && Array.isArray(jData.surtax.tiers)) {
            blocks.push(this.tableBlock(
                `${j.name} surtax`,
                ['Tax after credits above', 'Surtax rate'],
                jData.surtax.tiers.map(t => [formatCurrency(t.threshold), formatRate(t.rate)]),
                ['Surtax', formatCurrency(j.surtax)],
                'Each tier applies to the part of tax after credits above its threshold; the tiers add up.'
            ));
        }

        if (j.reductions.length > 0) {
            blocks.push(this.tableBlock(
                'Tax reductions',
                ['Reduction', 'Before cap', 'Applied'],
                j.reductions.map(x => [x.name, formatCurrency(x.potential), formatCurrency(x.amount)]),
                ['Total applied', '', formatCurrency(j.reductionsTotal)],
                'Reductions together cannot exceed the tax left after credits and surtax.'
            ));
        }

        if (isFed && r.input.province === 'qc' && data.fed && data.fed.abatement) {
            blocks.push(this.tableBlock(
                'Quebec abatement',
                ['Abatement rate', 'Abatement'],
                [[formatRate(data.fed.abatement.quebec), formatCurrency(j.abatement)]],
                null,
                'Quebec residents get this refundable reduction of federal tax because Quebec runs some programs the federal government funds elsewhere.'
            ));
        }

        if (j.healthPremiumName && jData && jData.healthPremium && Array.isArray(jData.healthPremium.tiers)) {
            blocks.push(this.tableBlock(
                j.healthPremiumName,
                ['Taxable income from', 'To', 'Premium'],
                jData.healthPremium.tiers.map(t => [
                    formatCurrency(t.from),
                    t.to === null || !Number.isFinite(t.to) ? 'and up' : formatCurrency(t.to),
                    t.rate > 0
                        ? `${formatCurrency(t.base)} + ${formatRate(t.rate)} over ${formatCurrency(t.from)}, max ${formatCurrency(t.max)}`
                        : formatCurrency(t.base)
                ]),
                [`Your premium (taxable income ${formatCurrency(j.taxableIncome)})`, '', formatCurrency(j.healthPremium)],
                'Added after credits and reductions; credits do not reduce it.'
            ));
        }

        host.replaceChildren(...blocks);
    }

    // ------------------------------------------------------------------
    // Payroll tab
    // ------------------------------------------------------------------

    updatePayrollMath(r, pData) {
        const p = r.payroll;
        const det = p.detail;
        const isQpp = p.plan === 'QPP';
        const pk = isQpp ? 'qpp' : 'cpp';
        const p2k = isQpp ? 'qpp2' : 'cpp2';
        const eik = det.ei.quebecRate ? 'eiQuebec' : 'ei';
        const pd = pData || {};
        const pension = pd[pk] || {};
        const pension2 = pd[p2k] || {};
        const ei = pd[eik] || {};
        const qpip = pd.qpip || {};

        this.setText('payroll-math-title', `Payroll math, ${r.input.year}: ${p.plan} plan`);
        this.renderFlags('payroll-flags', pData, 'payroll');
        this.renderSources('payroll-sources', pData);

        const steps = [];
        steps.push(this.step(
            { label: 'Pensionable earnings', value: formatCurrency(det.pension.pensionableEarnings), cls: 'calc-gross-income' },
            '×',
            { label: `${p.plan} rate`, value: formatRate(det.pension.rate), cls: 'calc-tax-rate' },
            { label: `${p.plan} contributions`, value: formatCurrency(det.pension.total), cls: 'calc-total-tax' },
            `Salary up to the maximum pensionable earnings (${formatCurrency(pension.ympe)}) minus the `
            + `${formatCurrency(pension.basicExemption)} basic exemption; maximum ${formatCurrency(pension.maxContribution)}. `
            + `Base ${formatRate(det.pension.baseRate)} = ${formatCurrency(det.pension.base)} (claimed as a credit); `
            + `enhanced ${formatRate(det.pension.enhancedRate)} = ${formatCurrency(det.pension.enhanced)} (deducted from income).`
        ));
        steps.push(this.step(
            { label: 'Earnings between the two ceilings', value: formatCurrency(det.pension2.earnings), cls: 'calc-gross-income' },
            '×',
            { label: `${p.plan}2 rate`, value: formatRate(det.pension2.rate), cls: 'calc-tax-rate' },
            { label: `${p.plan}2 contributions`, value: formatCurrency(det.pension2.total), cls: 'calc-total-tax' },
            `Salary between ${formatCurrency(pension.ympe)} and ${formatCurrency(pension2.yampe)}; `
            + `maximum ${formatCurrency(pension2.max)}. Deducted from income.`
        ));
        steps.push(this.step(
            { label: 'Insurable earnings', value: formatCurrency(det.ei.insurableEarnings), cls: 'calc-gross-income' },
            '×',
            { label: det.ei.quebecRate ? 'EI rate (Quebec)' : 'EI rate', value: formatRate(det.ei.rate), cls: 'calc-tax-rate' },
            { label: 'EI premiums', value: formatCurrency(det.ei.total), cls: 'calc-total-tax' },
            `Salary up to the maximum insurable earnings (${formatCurrency(ei.mie)}); maximum ${formatCurrency(ei.max)}.`
            + (det.ei.quebecRate ? ' Quebec has a lower EI rate because QPIP pays parental benefits instead.' : '')
        ));
        if (isQpp) {
            const insurable = Math.min(r.input.employmentIncome, qpip.mie);
            steps.push(this.step(
                { label: 'QPIP insurable earnings', value: formatCurrency(insurable), cls: 'calc-gross-income' },
                '×',
                { label: 'QPIP rate', value: formatRate(det.qpip.rate), cls: 'calc-tax-rate' },
                { label: 'QPIP premiums', value: formatCurrency(det.qpip.total), cls: 'calc-total-tax' },
                `Quebec Parental Insurance Plan: salary up to ${formatCurrency(qpip.mie)}; maximum ${formatCurrency(qpip.max)}.`
            ));
        } else {
            const note = document.createElement('p');
            note.className = 'note-text';
            note.textContent = 'QPIP (Quebec Parental Insurance Plan) applies to Quebec residents only: $0 here.';
            steps.push(note);
        }

        const host = this.el('payroll-steps');
        if (host) host.replaceChildren(...steps);

        this.setText('payroll-total', formatCurrency(p.total));
        this.setText('payroll-marginal-rate', formatPercent(p.marginalRate));
    }

    // ------------------------------------------------------------------
    // Shared builders
    // ------------------------------------------------------------------

    /** One calc-step row: [a] op [b] = [c], with an optional note below. */
    step(a, op, b, c, note = '') {
        const wrap = document.createElement('div');
        wrap.className = 'calc-step';
        const row = document.createElement('div');
        row.className = 'calc-step-mobile';
        row.append(this.box(a), this.operator(op), this.box(b), this.operator('='), this.box(c));
        wrap.appendChild(row);
        if (note) {
            const p = document.createElement('p');
            p.className = 'calc-step-note';
            p.textContent = note;
            wrap.appendChild(p);
        }
        return wrap;
    }

    box({ label, value, cls }) {
        const box = document.createElement('div');
        box.className = `calc-box ${cls || ''}`.trim();
        const l = document.createElement('div');
        l.className = 'calc-box-label';
        l.textContent = label;
        const v = document.createElement('div');
        v.className = 'calc-box-value';
        v.textContent = value;
        box.append(l, v);
        return box;
    }

    operator(symbol) {
        const o = document.createElement('div');
        o.className = 'calc-operator';
        o.textContent = symbol;
        return o;
    }

    /** Replace a tbody's rows. activeIndex highlights one row. */
    fillTable(tbodyId, rows, activeIndex = -1) {
        const tbody = this.el(tbodyId);
        if (!tbody) return;
        tbody.replaceChildren(...rows.map((cells, i) => {
            const tr = document.createElement('tr');
            if (i === activeIndex) tr.className = 'active-bracket';
            cells.forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
            return tr;
        }));
    }

    /** A titled bracket-table card with an optional total row and note. */
    tableBlock(title, headers, rows, totalRow, note) {
        const container = document.createElement('div');
        container.className = 'bracket-table-container';
        const h = document.createElement('h3');
        h.textContent = title;
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        const table = document.createElement('table');
        table.className = 'bracket-table';
        const thead = document.createElement('thead');
        const htr = document.createElement('tr');
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            htr.appendChild(th);
        });
        thead.appendChild(htr);
        const tbody = document.createElement('tbody');
        rows.forEach(cells => {
            const tr = document.createElement('tr');
            cells.forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.append(thead, tbody);
        if (totalRow) {
            const tfoot = document.createElement('tfoot');
            const tr = document.createElement('tr');
            tr.className = 'total-row';
            totalRow.forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
            tfoot.appendChild(tr);
            table.appendChild(tfoot);
        }
        wrapper.appendChild(table);
        container.append(h, wrapper);
        if (note) {
            const p = document.createElement('p');
            p.className = 'calc-step-note table-note';
            p.textContent = note;
            container.appendChild(p);
        }
        return container;
    }

    /** PROVISIONAL / UNVERIFIED flags from a data module; hidden when there are none. */
    renderFlags(id, jData, name) {
        const host = this.el(id);
        if (!host) return;
        const flags = (jData && Array.isArray(jData.flags)) ? jData.flags : [];
        if (flags.length === 0) {
            host.replaceChildren();
            host.classList.add('hidden');
            return;
        }
        const title = document.createElement('p');
        title.className = 'flag-title';
        title.textContent = `Not yet confirmed: ${flags.length} ${name} value${flags.length === 1 ? '' : 's'} `
            + 'could not be checked against an official 2026 source. The calculation uses them as shown.';
        const items = flags.map(f => {
            const d = document.createElement('details');
            d.className = 'flag-item';
            const s = document.createElement('summary');
            const badge = document.createElement('span');
            badge.className = `flag-badge flag-${String(f.status).toLowerCase()}`;
            badge.textContent = f.status;
            const field = document.createElement('code');
            field.textContent = f.field;
            s.append(badge, ' ', field);
            const note = document.createElement('p');
            note.textContent = f.note || '';
            d.append(s, note);
            return d;
        });
        host.replaceChildren(title, ...items);
        host.classList.remove('hidden');
    }

    /** Source links from a data module (http/https only). */
    renderSources(id, jData) {
        const host = this.el(id);
        if (!host) return;
        const sources = (jData && Array.isArray(jData.sources)) ? jData.sources : [];
        host.replaceChildren(...sources.map(src => {
            const li = document.createElement('li');
            let safe = null;
            try {
                const u = new URL(src.url);
                if (u.protocol === 'https:' || u.protocol === 'http:') safe = u.href;
            } catch { /* not a URL */ }
            if (safe) {
                const a = document.createElement('a');
                a.href = safe;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = src.title || safe;
                li.appendChild(a);
            } else {
                li.append(src.title || String(src.url || ''));
            }
            if (src.retrieved) li.append(` (retrieved ${src.retrieved})`);
            return li;
        }));
    }
}
