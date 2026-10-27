/**
 * Canadian income tax and payroll calculator, tax year 2026.
 *
 * DOM-free: this is the only module Node can import, and the repo's checks
 * depend on that. Every number comes from js/data/<code>.js; this file holds
 * the arithmetic only. Every schema field must be present in every data
 * module: null means "not applicable", an absent field throws.
 *
 * Order of operations for each jurisdiction:
 *   bracket tax
 *   - non-refundable credits x jurisdiction credit rate   (floor 0)
 *   + surtax (base: tax after credits)
 *   - tax reduction / low-income reduction               (floor 0)
 *   - Quebec abatement (federal only, Quebec residents)
 *   + health premium / contribution
 */
import defaultData from './data/index.js';

const YEAR = 2026;

/** Payroll items a jurisdiction may list in credits.payrollCredits. */
const PAYROLL_CREDIT_ITEMS = ['cppBase', 'ei', 'qppBase', 'eiQuebec', 'qpip'];

/**
 * `special` rules the engine implements. Any other name throws.
 * 'yukonCanadaEmploymentCredit' documents the generic canadaEmploymentAmount
 * rule (credited in any jurisdiction that has the field) and adds nothing.
 */
const ALLOWED_SPECIALS = [
    'QC deduction for workers',
    'QC deduction for enhanced QPP contributions',
    'yukonCanadaEmploymentCredit'
];

const SURTAX_BASES = ['afterCredits'];
const TAX_REDUCTION_KINDS = ['twiceBasicMinusTax'];
const LOW_INCOME_KINDS = ['baseMinusIncomeRate', 'lift'];

class DataError extends Error {
    constructor(code, msg) {
        super(`[js/data/${code}.js] ${msg}`);
        this.name = 'DataError';
    }
}

// ---------------------------------------------------------------------------
// Validation helpers: a missing or malformed required field throws, never 0.
// ---------------------------------------------------------------------------

function req(obj, path, code) {
    let cur = obj;
    for (const key of path.split('.')) {
        if (cur === null || cur === undefined || !(key in cur) || cur[key] === undefined) {
            throw new DataError(code, `missing required field '${path}'`);
        }
        cur = cur[key];
    }
    return cur;
}

function num(obj, path, code, { min = 0, max = Infinity } = {}) {
    const v = req(obj, path, code);
    if (typeof v !== 'number' || Number.isNaN(v)) {
        throw new DataError(code, `'${path}' must be a number, got ${JSON.stringify(v)}`);
    }
    if (v < min || v > max) {
        throw new DataError(code, `'${path}' = ${v} outside [${min}, ${max}]`);
    }
    return v;
}

const rate = (obj, path, code) => num(obj, path, code, { min: 0, max: 1 });

/**
 * A field that must be PRESENT but may be null ("not applicable").
 * An absent or undefined field throws: a dropped key must never silently
 * remove a tax.
 */
function nullable(obj, path, code) {
    const parts = path.split('.');
    const last = parts.pop();
    const parent = parts.length ? req(obj, parts.join('.'), code) : obj;
    if (parent === null || typeof parent !== 'object') throw new DataError(code, `'${parts.join('.')}' must be an object`);
    if (!(last in parent) || parent[last] === undefined) {
        throw new DataError(code, `missing field '${path}' (use null when not applicable, never omit)`);
    }
    return parent[last];
}

/** A present array (may be empty). */
function arr(obj, path, code) {
    const v = req(obj, path, code);
    if (!Array.isArray(v)) throw new DataError(code, `'${path}' must be an array`);
    return v;
}

/** A present field that is null or a number in [min, max]. */
function numOrNull(obj, path, code, opts) {
    return nullable(obj, path, code) === null ? null : num(obj, path, code, opts);
}

const TOP_LEVEL_KEYS = ['code', 'name', 'year', 'brackets', 'credits', 'surtax', 'healthPremium', 'taxReduction',
    'lowIncomeReduction', 'abatement', 'salesTax', 'costOfLiving', 'special', 'sources', 'flags'];
const CREDIT_KEYS = ['creditRate', 'basicPersonalAmount', 'bpaPhaseOut', 'canadaEmploymentAmount', 'cppQppEiCredit',
    'payrollCredits', 'payrollCreditsQuebecResident', 'other'];

/** Unknown keys throw, so a misspelt optional field (e.g. 'surTax') can't be silently ignored. */
function checkKeys(obj, allowed, code, where) {
    for (const k of Object.keys(obj)) {
        // Descriptive text keys (e.g. 'note') are ignored, per Director ruling 2026-10-27.
        if (typeof obj[k] === 'string') continue;
        if (!allowed.includes(k)) throw new DataError(code, `unknown field '${where}${k}' (not in the frozen schema)`);
    }
}

function validateBrackets(brackets, code, path = 'brackets') {
    if (!Array.isArray(brackets) || brackets.length === 0) {
        throw new DataError(code, `'${path}' must be a non-empty array`);
    }
    let prev = 0;
    brackets.forEach((b, i) => {
        if (!Array.isArray(b) || b.length !== 2) throw new DataError(code, `${path}[${i}] must be [upperLimit, rate]`);
        const [limit, r] = b;
        if (typeof limit !== 'number' || Number.isNaN(limit) || !(limit > prev)) {
            throw new DataError(code, `${path}[${i}] upper limit ${limit} must be a number > ${prev}`);
        }
        if (typeof r !== 'number' || Number.isNaN(r) || r < 0 || r > 1) {
            throw new DataError(code, `${path}[${i}] rate ${r} must be a decimal in [0, 1]`);
        }
        prev = limit;
    });
    if (brackets[brackets.length - 1][0] !== Infinity) {
        throw new DataError(code, `last row of '${path}' must have upper limit Infinity`);
    }
}

function validateSpecials(d, code) {
    const special = arr(d, 'special', code);
    for (const s of special) {
        if (!s || typeof s.name !== 'string') throw new DataError(code, `special entry without a name`);
        if (!ALLOWED_SPECIALS.includes(s.name)) {
            throw new DataError(code, `unknown special '${s.name}': the engine implements only ${ALLOWED_SPECIALS.join(' | ')}; a new special needs a Director ruling`);
        }
        if (typeof s.how !== 'string') throw new DataError(code, `special '${s.name}' has no 'how' text`);
        if (!s.params || typeof s.params !== 'object' || Array.isArray(s.params)) throw new DataError(code, `special '${s.name}' has no 'params' object`);
        if (s.name === 'QC deduction for workers') workerDeductionParams({ special: [s] }, code);
    }
    return special;
}

const hasSpecial = (d, name) => Array.isArray(d.special) && d.special.some(s => s.name === name);

/**
 * Read the numeric parameters of the QC deduction for workers from the
 * structured `params: {rate, cap}`. The prose in `how` is documentation only
 * and is never read. A missing or invalid param throws, so no rate is ever
 * hard-coded here.
 */
function workerDeductionParams(d, code) {
    const s = d.special.find(x => x.name === 'QC deduction for workers');
    const p = s.params;
    if (!p || typeof p.rate !== 'number' || typeof p.cap !== 'number') {
        throw new DataError(code, `special 'QC deduction for workers': params must be {rate: number, cap: number}`);
    }
    if (!(p.rate > 0 && p.rate < 1) || !(p.cap > 0) || !Number.isFinite(p.cap)) {
        throw new DataError(code, `special 'QC deduction for workers': bad rate ${p.rate} or cap ${p.cap}`);
    }
    return { rate: p.rate, cap: p.cap };
}

function validateJurisdiction(d, code, { federal = false } = {}) {
    if (!d || typeof d !== 'object') throw new DataError(code, 'module did not load (no default export)');
    req(d, 'code', code);
    req(d, 'name', code);
    if (req(d, 'year', code) !== YEAR) throw new DataError(code, `year must be ${YEAR}`);
    checkKeys(d, TOP_LEVEL_KEYS, code, '');
    checkKeys(req(d, 'credits', code), CREDIT_KEYS, code, 'credits.');
    // Fields that are data, not arithmetic, must still be present.
    arr(d, 'sources', code);
    arr(d, 'flags', code);
    nullable(d, 'costOfLiving', code);
    req(d, 'salesTax', code);
    for (const k of ['gst', 'pst', 'hst', 'qst']) numOrNull(d, `salesTax.${k}`, code, { min: 0, max: 1 });
    nullable(d, 'salesTax.note', code);
    const ppe = req(d, 'credits.cppQppEiCredit', code);
    if (typeof ppe !== 'boolean') throw new DataError(code, `credits.cppQppEiCredit must be true or false`);
    validateBrackets(req(d, 'brackets', code), code);
    rate(d, 'credits.creditRate', code);
    num(d, 'credits.basicPersonalAmount', code);
    const po = nullable(d, 'credits.bpaPhaseOut', code);
    if (po !== null) {
        num(d, 'credits.bpaPhaseOut.start', code);
        num(d, 'credits.bpaPhaseOut.end', code);
        num(d, 'credits.bpaPhaseOut.minAmount', code);
        if (!(po.end > po.start)) throw new DataError(code, `bpaPhaseOut.end must exceed start`);
    }
    const cea = nullable(d, 'credits.canadaEmploymentAmount', code);
    if (cea !== null) num(d, 'credits.canadaEmploymentAmount', code);
    const pc = arr(d, 'credits.payrollCredits', code);
    for (const item of pc) {
        if (!PAYROLL_CREDIT_ITEMS.includes(item)) throw new DataError(code, `unknown payroll credit item '${item}'`);
    }
    if (ppe !== pc.length > 0) throw new DataError(code, `credits.cppQppEiCredit (${ppe}) contradicts credits.payrollCredits (${JSON.stringify(pc)})`);
    if (federal) {
        const pcq = req(d, 'credits.payrollCreditsQuebecResident', code);
        if (!Array.isArray(pcq)) throw new DataError(code, `credits.payrollCreditsQuebecResident must be an array`);
        for (const item of pcq) {
            if (!PAYROLL_CREDIT_ITEMS.includes(item)) throw new DataError(code, `unknown payroll credit item '${item}'`);
        }
        rate(d, 'abatement.quebec', code);
    }
    const other = arr(d, 'credits.other', code);
    other.forEach((o, i) => {
        if (!o || typeof o.name !== 'string') throw new DataError(code, `credits.other[${i}] needs a name`);
        num(o, 'amount', `${code} credits.other[${i}]`);
    });

    const surtax = nullable(d, 'surtax', code);
    if (surtax !== null) {
        if (!SURTAX_BASES.includes(req(d, 'surtax.base', code))) throw new DataError(code, `surtax.base must be one of ${SURTAX_BASES}`);
        const tiers = req(d, 'surtax.tiers', code);
        if (!Array.isArray(tiers) || tiers.length === 0) throw new DataError(code, `surtax.tiers must be a non-empty array`);
        tiers.forEach((t, i) => { num(t, 'threshold', `${code} surtax.tiers[${i}]`); rate(t, 'rate', `${code} surtax.tiers[${i}]`); });
    }
    const tr = nullable(d, 'taxReduction', code);
    if (tr !== null) {
        if (!TAX_REDUCTION_KINDS.includes(req(d, 'taxReduction.kind', code))) throw new DataError(code, `taxReduction.kind must be one of ${TAX_REDUCTION_KINDS}`);
        num(d, 'taxReduction.basicAmount', code);
    }
    const lir = nullable(d, 'lowIncomeReduction', code);
    if (lir !== null) {
        const kind = req(d, 'lowIncomeReduction.kind', code);
        if (!LOW_INCOME_KINDS.includes(kind)) throw new DataError(code, `lowIncomeReduction.kind must be one of ${LOW_INCOME_KINDS}`);
        req(d, 'lowIncomeReduction.name', code);
        num(d, 'lowIncomeReduction.baseAmount', code);
        num(d, 'lowIncomeReduction.phaseOutStart', code);
        rate(d, 'lowIncomeReduction.phaseOutRate', code);
        const er = nullable(d, 'lowIncomeReduction.earningsRate', code);
        if (kind === 'lift' || er !== null) rate(d, 'lowIncomeReduction.earningsRate', code);
    }
    const hp = nullable(d, 'healthPremium', code);
    if (hp !== null) {
        req(d, 'healthPremium.name', code);
        const tiers = req(d, 'healthPremium.tiers', code);
        if (!Array.isArray(tiers) || tiers.length === 0) throw new DataError(code, `healthPremium.tiers must be a non-empty array`);
        tiers.forEach((t, i) => {
            const p = `${code} healthPremium.tiers[${i}]`;
            num(t, 'from', p);
            const to = nullable(t, 'to', p);
            if (to !== null && to !== Infinity) num(t, 'to', p);
            num(t, 'base', p);
            rate(t, 'rate', p);
            const mx = nullable(t, 'max', p);
            if (mx !== null) num(t, 'max', p);
        });
    }
    validateSpecials(d, code);
    if (hasSpecial(d, 'QC deduction for workers')) workerDeductionParams(d, code);
}

function validatePayroll(p) {
    const code = 'payroll';
    if (!p || typeof p !== 'object') throw new DataError(code, 'module did not load');
    if (req(p, 'year', code) !== YEAR) throw new DataError(code, `year must be ${YEAR}`);
    if (req(p, 'code', code) !== 'payroll') throw new DataError(code, `code must be 'payroll'`);
    req(p, 'name', code);
    arr(p, 'sources', code);
    arr(p, 'flags', code);
    for (const plan of ['cpp', 'qpp']) {
        const r = rate(p, `${plan}.rate`, code);
        const b = rate(p, `${plan}.baseRate`, code);
        const e = rate(p, `${plan}.enhancedRate`, code);
        if (Math.abs(b + e - r) > 1e-9) throw new DataError(code, `${plan}.baseRate + enhancedRate != rate`);
        num(p, `${plan}.basicExemption`, code);
        num(p, `${plan}.ympe`, code);
        const mx = num(p, `${plan}.maxContribution`, code);
        const mb = num(p, `${plan}.maxBaseContribution`, code);
        // Consistency: both caps must equal their rate x (ympe - basicExemption) to the cent.
        const span = p[plan].ympe - p[plan].basicExemption;
        if (Math.abs(r * span - mx) > 0.01) throw new DataError(code, `${plan}.maxContribution ${mx} != rate x (ympe - basicExemption) ${(r * span).toFixed(2)}`);
        if (Math.abs(b * span - mb) > 0.01) throw new DataError(code, `${plan}.maxBaseContribution ${mb} != baseRate x (ympe - basicExemption) ${(b * span).toFixed(2)}`);
        rate(p, `${plan}2.rate`, code);
        num(p, `${plan}2.yampe`, code);
        num(p, `${plan}2.max`, code);
        if (!(p[`${plan}2`].yampe > p[plan].ympe)) throw new DataError(code, `${plan}2.yampe must exceed ${plan}.ympe`);
    }
    for (const ei of ['ei', 'eiQuebec']) {
        rate(p, `${ei}.rate`, code);
        num(p, `${ei}.mie`, code);
        num(p, `${ei}.max`, code);
    }
    rate(p, 'qpip.employeeRate', code);
    num(p, 'qpip.mie', code);
    num(p, 'qpip.max', code);
    validateSpecials(p, code);
}

// ---------------------------------------------------------------------------
// Pure arithmetic
// ---------------------------------------------------------------------------

/** Per-bracket breakdown of tax on `income`. */
function bracketBreakdown(income, brackets) {
    const rows = [];
    let prev = 0;
    let total = 0;
    for (const [limit, r] of brackets) {
        const inBracket = Math.max(0, Math.min(income, limit) - prev);
        const tax = inBracket * r;
        total += tax;
        rows.push({ from: prev, to: limit, rate: r, taxableInBracket: inBracket, tax });
        prev = limit;
    }
    return { rows, total };
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

function bpaFor(credits, netIncome) {
    const bpa = credits.basicPersonalAmount;
    const po = credits.bpaPhaseOut;
    if (!po) return bpa;
    const frac = clamp((netIncome - po.start) / (po.end - po.start), 0, 1);
    return bpa - (bpa - po.minAmount) * frac;
}

function healthPremiumFor(hp, taxableIncome) {
    if (!hp) return 0;
    let premium = 0;
    for (const t of hp.tiers) {
        const upper = t.to === null || t.to === undefined ? Infinity : t.to;
        if (taxableIncome > t.from && taxableIncome <= upper) {
            premium = t.base + t.rate * (taxableIncome - t.from);
            if (t.max !== null && t.max !== undefined) premium = Math.min(premium, t.max);
        }
    }
    return Math.max(0, premium);
}

/** Payroll contributions for one person (annual, one employer). */
function computePayroll(p, income, quebec) {
    const plan = quebec ? p.qpp : p.cpp;
    const plan2 = quebec ? p.qpp2 : p.cpp2;
    const pensionable = Math.max(0, Math.min(income, plan.ympe) - plan.basicExemption);
    const total = Math.min(plan.rate * pensionable, plan.maxContribution);
    // Split by rate so base + enhanced == total even when the cap binds.
    const base = total * plan.baseRate / plan.rate;
    const enhanced = total - base;
    const second = Math.min(plan2.rate * Math.max(0, Math.min(income, plan2.yampe) - plan.ympe), plan2.max);
    const eiData = quebec ? p.eiQuebec : p.ei;
    const ei = Math.min(eiData.rate * Math.min(income, eiData.mie), eiData.max);
    const qpip = quebec ? Math.min(p.qpip.employeeRate * Math.min(income, p.qpip.mie), p.qpip.max) : 0;
    return {
        plan: quebec ? 'QPP' : 'CPP',
        pension: { total, base, enhanced, pensionableEarnings: pensionable, rate: plan.rate, baseRate: plan.baseRate, enhancedRate: plan.enhancedRate },
        pension2: { total: second, rate: plan2.rate, earnings: Math.max(0, Math.min(income, plan2.yampe) - plan.ympe) },
        ei: { total: ei, rate: eiData.rate, insurableEarnings: Math.min(income, eiData.mie), quebecRate: quebec },
        qpip: { total: qpip, rate: quebec ? p.qpip.employeeRate : 0 },
        total: total + second + ei + qpip
    };
}

const PAYROLL_CREDIT_LABEL = {
    cppBase: 'CPP base contributions',
    qppBase: 'QPP base contributions',
    ei: 'EI premiums',
    eiQuebec: 'EI premiums (Quebec rate)',
    qpip: 'QPIP premiums'
};

function payrollCreditAmount(item, pay) {
    switch (item) {
        case 'cppBase': return pay.plan === 'CPP' ? pay.pension.base : 0;
        case 'qppBase': return pay.plan === 'QPP' ? pay.pension.base : 0;
        case 'ei': return pay.ei.quebecRate ? 0 : pay.ei.total;
        case 'eiQuebec': return pay.ei.quebecRate ? pay.ei.total : 0;
        case 'qpip': return pay.qpip.total;
        default: throw new Error(`unknown payroll credit item ${item}`);
    }
}

/**
 * One jurisdiction's tax, in the order of operations at the top of this file.
 * ctx: { income, netIncome, taxableIncome, pay, payrollCredits, quebecResident, federal, fedAbatement }
 */
function computeJurisdiction(d, ctx) {
    const c = d.credits;
    const { rows, total: bracketTax } = bracketBreakdown(ctx.taxableIncome, d.brackets);

    // Non-refundable credits (amount x credit rate).
    const creditsDetail = [];
    const add = (name, amount) => creditsDetail.push({ name, amount, rate: c.creditRate, credit: amount * c.creditRate });
    add('Basic personal amount', bpaFor(c, ctx.netIncome));
    for (const item of ctx.payrollCredits) {
        const amt = payrollCreditAmount(item, ctx.pay);
        if (amt > 0) add(PAYROLL_CREDIT_LABEL[item], amt);
    }
    // Any jurisdiction with canadaEmploymentAmount credits min(employment income, amount).
    // (yukonCanadaEmploymentCredit is documentation of this rule; it adds nothing more.)
    if (c.canadaEmploymentAmount !== null) add('Canada employment amount', Math.min(ctx.income, c.canadaEmploymentAmount));
    for (const o of c.other) add(o.name, o.amount);
    const creditsTotal = creditsDetail.reduce((s, x) => s + x.credit, 0);
    const afterCredits = Math.max(0, bracketTax - creditsTotal);

    // Surtax on tax after credits.
    let surtax = 0;
    if (d.surtax) {
        for (const t of d.surtax.tiers) surtax += t.rate * Math.max(0, afterCredits - t.threshold);
    }
    const afterSurtax = afterCredits + surtax;

    // Tax reduction / low-income reduction, floor 0.
    const reductions = [];
    let remaining = afterSurtax;
    if (d.taxReduction) {
        const tr = d.taxReduction;
        // ON Tax Reduction: max(0, 2 x basicAmount - tax after credits and surtax).
        const potential = Math.max(0, 2 * tr.basicAmount - afterSurtax);
        const applied = Math.min(remaining, potential);
        remaining -= applied;
        reductions.push({ name: tr.name || 'Tax reduction', kind: tr.kind, potential, amount: applied });
    }
    if (d.lowIncomeReduction) {
        const l = d.lowIncomeReduction;
        let potential;
        if (l.kind === 'baseMinusIncomeRate') {
            potential = l.baseAmount - l.phaseOutRate * Math.max(0, ctx.netIncome - l.phaseOutStart);
        } else { // 'lift'
            potential = Math.min(l.baseAmount, l.earningsRate * ctx.income) - l.phaseOutRate * Math.max(0, ctx.netIncome - l.phaseOutStart);
        }
        potential = Math.max(0, potential);
        const applied = Math.min(remaining, potential);
        remaining -= applied;
        reductions.push({ name: l.name || 'Low-income reduction', kind: l.kind, potential, amount: applied });
    }
    const reductionsTotal = afterSurtax - remaining;

    // Federal only: Quebec abatement on basic federal tax.
    let abatement = 0;
    if (ctx.federal && ctx.quebecResident) {
        abatement = remaining * d.abatement.quebec;
        remaining -= abatement;
    }

    const healthPremium = healthPremiumFor(d.healthPremium, ctx.taxableIncome);
    const net = remaining + healthPremium;

    return {
        code: d.code,
        name: d.name,
        netIncome: ctx.netIncome,
        taxableIncome: ctx.taxableIncome,
        bracketTax,
        brackets: rows,
        creditRate: c.creditRate,
        creditsDetail,
        creditsTotal,
        afterCredits,
        surtax,
        afterSurtax,
        reductions,
        reductionsTotal,
        abatement,
        healthPremiumName: d.healthPremium ? d.healthPremium.name : null,
        healthPremium,
        net
    };
}

// ---------------------------------------------------------------------------
// Public class
// ---------------------------------------------------------------------------

export class TaxCalculator {
    /**
     * @param {object} [data] - { fed, payroll, provinces: {code: module}, provinceCodes: [...] };
     *   defaults to js/data/index.js. Tests pass a modified copy.
     */
    constructor(data = defaultData) {
        this.data = data;
        this.year = YEAR;
    }

    /** Validate the federal, payroll and one province module; throws on any problem. */
    _load(province) {
        const { fed, payroll, provinces, provinceCodes } = this.data;
        if (typeof province !== 'string' || !provinceCodes.includes(province)) {
            throw new Error(`unknown province/territory '${province}'; expected one of ${provinceCodes.join(', ')}`);
        }
        const prov = provinces[province];
        validateJurisdiction(fed, 'fed', { federal: true });
        validatePayroll(payroll);
        validateJurisdiction(prov, province);
        if (prov.code !== province) throw new DataError(province, `code field is '${prov.code}'`);
        return { fed, payroll, prov };
    }

    /** Income tax + payroll for one set of inputs, without marginal rates. */
    _compute({ employmentIncome, province, otherDeductions = 0 }) {
        if (typeof employmentIncome !== 'number' || !Number.isFinite(employmentIncome) || employmentIncome < 0) {
            throw new Error(`employmentIncome must be a finite number >= 0, got ${employmentIncome}`);
        }
        if (typeof otherDeductions !== 'number' || !Number.isFinite(otherDeductions) || otherDeductions < 0) {
            throw new Error(`otherDeductions must be a finite number >= 0, got ${otherDeductions}`);
        }
        const { fed, payroll, prov } = this._load(province);
        const income = employmentIncome;
        const quebec = province === 'qc';
        const pay = computePayroll(payroll, income, quebec);

        // Deductions from income: enhanced first-tier pension + second-tier pension + other.
        const pensionEnhanced = pay.pension.enhanced;
        const pension2 = pay.pension2.total;
        const other = Math.min(otherDeductions, income);
        const federalDeductions = pensionEnhanced + pension2 + other;
        const fedNet = Math.max(0, income - federalDeductions);

        // Provincial net income: same as federal unless a special says otherwise.
        let provDeductions = federalDeductions;
        let workerDeduction = 0;
        if (hasSpecial(prov, 'QC deduction for workers')) {
            const { rate: r, cap } = workerDeductionParams(prov, province);
            workerDeduction = Math.min(r * income, cap);
        }
        if (hasSpecial(prov, 'QC deduction for enhanced QPP contributions') && !quebec) {
            throw new DataError(province, `special 'QC deduction for enhanced QPP contributions' only applies with QPP (province qc)`);
        }
        // 'QC deduction for enhanced QPP contributions': qppEnhanced + qpp2, which is exactly the generic
        // pension deduction above (pensionEnhanced + pension2 with QPP data); it is not added twice.
        provDeductions = federalDeductions + workerDeduction;
        const provNet = Math.max(0, income - provDeductions);

        const federal = computeJurisdiction(fed, {
            income, netIncome: fedNet, taxableIncome: fedNet, pay,
            payrollCredits: quebec ? fed.credits.payrollCreditsQuebecResident : fed.credits.payrollCredits,
            quebecResident: quebec, federal: true
        });
        const provincial = computeJurisdiction(prov, {
            income, netIncome: provNet, taxableIncome: provNet, pay,
            payrollCredits: prov.credits.payrollCredits,
            quebecResident: quebec, federal: false
        });

        const incomeTax = federal.net + provincial.net;
        const totalDeductions = incomeTax + pay.total;
        const planKey = quebec ? 'qpp' : 'cpp';
        return {
            input: { employmentIncome: income, province, provinceName: prov.name, otherDeductions, year: YEAR },
            federal,
            provincial,
            payroll: {
                plan: pay.plan,
                [planKey]: pay.pension.total,
                [planKey + '2']: pay.pension2.total,
                ei: pay.ei.total,
                qpip: pay.qpip.total,
                total: pay.total,
                detail: pay
            },
            deductionsFromIncome: {
                [planKey + 'Enhanced']: pensionEnhanced,
                [planKey + '2']: pension2,
                other,
                qcWorkerDeduction: workerDeduction,
                federalTotal: federalDeductions,
                provincialTotal: provDeductions
            },
            totals: {
                incomeTax,
                payroll: pay.total,
                totalDeductions,
                takeHome: income - totalDeductions,
                effectiveRate: income > 0 ? totalDeductions / income : 0,
                effectiveIncomeTaxRate: income > 0 ? incomeTax / income : 0
            }
        };
    }

    /**
     * Full calculation with marginal rates.
     * @param {{employmentIncome:number, province:string, otherDeductions?:number}} input
     */
    calculate(input) {
        const r = this._compute(input);
        const up = this._compute({ ...input, employmentIncome: input.employmentIncome + 1 });
        r.federal.marginalRate = up.federal.net - r.federal.net;
        r.provincial.marginalRate = up.provincial.net - r.provincial.net;
        r.totals.marginalRate = up.totals.incomeTax - r.totals.incomeTax;
        r.totals.marginalRateIncomeTax = r.totals.marginalRate;
        r.totals.marginalRateIncludingPayroll = up.totals.totalDeductions - r.totals.totalDeductions;
        r.payroll.marginalRate = up.payroll.total - r.payroll.total;
        return r;
    }

    /** Same salary in each of the 13 provinces/territories. Throws if any module is missing. */
    compareAll({ employmentIncome, otherDeductions = 0 }) {
        return this.data.provinceCodes.map(code => {
            const r = this.calculate({ employmentIncome, province: code, otherDeductions });
            return {
                province: code,
                name: r.input.provinceName,
                federalTax: r.federal.net,
                provincialTax: r.provincial.net,
                incomeTax: r.totals.incomeTax,
                payroll: r.totals.payroll,
                totalDeductions: r.totals.totalDeductions,
                takeHome: r.totals.takeHome,
                effectiveRate: r.totals.effectiveRate,
                marginalRate: r.totals.marginalRate,
                marginalRateIncludingPayroll: r.totals.marginalRateIncludingPayroll,
                salesTax: this.data.provinces[code].salesTax ?? null
            };
        });
    }

    /**
     * Per-bracket breakdown for the tax-math tabs.
     * @param {string} jurisdiction - 'fed' or a province code
     * @param {number} taxableIncome
     */
    getBracketBreakdown(jurisdiction, taxableIncome) {
        const d = jurisdiction === 'fed' ? this.data.fed : this.data.provinces[jurisdiction];
        if (!d) throw new Error(`unknown jurisdiction '${jurisdiction}'`);
        validateBrackets(d.brackets, jurisdiction);
        const { rows, total } = bracketBreakdown(taxableIncome, d.brackets);
        return { jurisdiction, name: d.name, taxableIncome, rows, total };
    }

    /** [{code, name}] for the 13 provinces/territories in display order. */
    listProvinces() {
        return this.data.provinceCodes.map(code => {
            const d = this.data.provinces[code];
            if (!d) throw new DataError(code, 'module not loaded');
            return { code, name: d.name };
        });
    }

    /** Raw data module (for sources, flags, salesTax in the UI). */
    getJurisdictionData(code) {
        return code === 'fed' ? this.data.fed : code === 'payroll' ? this.data.payroll : this.data.provinces[code];
    }
}

export default TaxCalculator;
