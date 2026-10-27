// Ontario, tax year 2026. Numbers only; the engine owns all arithmetic. DOM-free.
// Data builder: DATA-B. Retrieved 2026-10-27.
const R = '2026-10-27';
const CRA_RATES = 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html';
const T4127_JAN = 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';
const T4127_JUL_RATES = 'https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jul/rates-income-thresholds-constants-26e.csv';
const T4127_JUL_OTHER = 'https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jul/other-rates-amounts-26e.csv';

export default {
  code: 'on',
  name: 'Ontario',
  year: 2026,
  brackets: [
    [53891, 0.0505],
    [107785, 0.0915],
    [150000, 0.1116],
    [220000, 0.1216],
    [Infinity, 0.1316],
  ],
  credits: {
    creditRate: 0.0505,
    basicPersonalAmount: 12989,
    bpaPhaseOut: null,
    canadaEmploymentAmount: null,
    cppQppEiCredit: true,
    payrollCredits: ['cppBase', 'ei'],
    other: [],
  },
  surtax: {
    base: 'afterCredits',
    // Both tiers apply independently to basic Ontario tax after credits:
    // surtax = 0.20*max(0, T - 5818) + 0.36*max(0, T - 7446)   (T4127 V1)
    tiers: [
      { threshold: 5818, rate: 0.20 },
      { threshold: 7446, rate: 0.36 },
    ],
    note: 'Tiers are additive, not marginal replacements: at T above 7446 the surtax is 0.20*(T-5818) + 0.36*(T-7446) (T4127 V1).',
  },
  taxReduction: {
    kind: 'twiceBasicMinusTax',
    basicAmount: 300,
  },
  lowIncomeReduction: {
    kind: 'lift',
    name: 'Low-income Individuals and Families Tax (LIFT) credit',
    baseAmount: 875,        // maximum credit
    phaseOutStart: 32500,   // single-individual adjusted net income threshold
    phaseOutRate: 0.05,     // credit reduced by 5% of adjusted net income above threshold
    earningsRate: 0.0505,   // maximum credit = 5.05% of employment income (lines 10100 + 10400), capped at baseAmount
    note: 'credit = max(0, min(875, 0.0505*employment income) - 0.05*max(0, adjusted net income - 32500)). Single-person case only (no spouse or dependants). Non-refundable; amounts are the 2022-onward values on the Ontario LIFT page (see sources).',
  },
  healthPremium: {
    name: 'Ontario Health Premium',
    // premium = min(max, base + rate * (taxableIncome - from)) for from < taxableIncome <= to
    tiers: [
      { from: 0,      to: 20000,    base: 0,   rate: 0,    max: 0 },
      { from: 20000,  to: 25000,    base: 0,   rate: 0.06, max: 300 },
      { from: 25000,  to: 36000,    base: 300, rate: 0,    max: 300 },
      { from: 36000,  to: 38500,    base: 300, rate: 0.06, max: 450 },
      { from: 38500,  to: 48000,    base: 450, rate: 0,    max: 450 },
      { from: 48000,  to: 48600,    base: 450, rate: 0.25, max: 600 },
      { from: 48600,  to: 72000,    base: 600, rate: 0,    max: 600 },
      { from: 72000,  to: 72600,    base: 600, rate: 0.25, max: 750 },
      { from: 72600,  to: 200000,   base: 750, rate: 0,    max: 750 },
      { from: 200000, to: 200600,   base: 750, rate: 0.25, max: 900 },
      { from: 200600, to: Infinity, base: 900, rate: 0,    max: 900 },
    ],
  },
  salesTax: { gst: 0.05, pst: 0, hst: 0.13, qst: 0, note: '13% HST (5% federal + 8% provincial), unchanged since 2013-04-01 (CRA GST/HST rate table, as of 2025-04-01).' },
  costOfLiving: null,
  special: [],
  sources: [
    { fields: ['brackets', 'credits.creditRate'], url: CRA_RATES, title: 'CRA: Canadian income tax rates for individuals, 2026 return (Ontario table; lowest rate is the credit rate)', retrieved: R },
    { fields: ['brackets', 'credits.creditRate', 'credits.basicPersonalAmount', 'surtax', 'taxReduction'], url: T4127_JUL_RATES, title: 'CRA T4127 123rd ed. (eff. July 1, 2026) Table 8.1: ON A/V/KP', retrieved: R },
    { fields: ['credits.basicPersonalAmount', 'surtax', 'taxReduction.basicAmount'], url: T4127_JUL_OTHER, title: 'CRA T4127 123rd ed. Table 8.2: ON basic amount 12,989, S2 300, V1 5,818/20% and 7,446/36%; no ON change listed for July 2026', retrieved: R },
    { fields: ['surtax', 'taxReduction', 'healthPremium'], url: T4127_JAN, title: 'CRA T4127 122nd ed. (eff. Jan 1, 2026) Ch. 4 step 5, Ontario: V1 surtax, V2 Health Premium bands, S tax reduction 2*(300+Y)-(T4+V1)', retrieved: R },
    { fields: ['healthPremium'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-c/5006-c-fill-25e.pdf', title: 'CRA Form ON428 (2025): Ontario Health Premium chart, same bands as T4127 V2 (cross-check; also BPA 12,747 and basic reduction 294 for 2025, x1.019 = 12,989 and 300)', retrieved: R },
    { fields: ['lowIncomeReduction'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-a/5006-a-fill-25e.pdf', title: 'CRA Schedule ON428-A (2025): LIFT 5.05% of employment income, maximum $875, single threshold $32,500, 5% reduction rate', retrieved: R },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA: GST/HST rates by province (Ontario 13%)', retrieved: R },
    { fields: ['brackets', 'surtax'], url: 'https://assets.kpmg.com/content/dam/kpmgsites/ca/pdf/services/tax/personal-tables/ca-federal-and-provincial-territorial-income-tax-rates-and-brackets-for-2026.pdf.coredownload.inline.pdf', title: 'KPMG 2026 rates and brackets (secondary cross-check only: ON indexation 1.9%, surtax 5,818/7,446)', retrieved: R },
    { fields: ['lowIncomeReduction'], url: 'https://www.ontario.ca/page/low-income-workers-tax-credit', title: 'Ontario: Low-income Individuals and Families Tax (LIFT) credit, updated 2026-07-15: for 2022 onward, maximum 875 or 5.05% of employment income, reduced by 5% of adjusted net income over 32,500 (single)', retrieved: R },
  ],
  flags: [
    { field: 'taxReduction.basicAmount', status: 'PROVISIONAL', note: 'T4127 Table 8.2 gives S2 = 300 for 2026 (official). The 2026 ON428 form is not yet published; 2025 form shows 294 (294 x 1.019 = 299.6, consistent). Dependant add-on (554 per child, out of scope: no dependants) is not modelled.' },
    { field: 'healthPremium', status: 'PROVISIONAL', note: 'Bands are confirmed from T4127 122nd ed. (2026 payroll) and the 2025 ON428 chart; the Health Premium is not indexed. T4127 states the premium is not reduced by the Ontario tax reduction (engine order: premium added last).' },
  ],
};
