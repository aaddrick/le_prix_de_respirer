// British Columbia, tax year 2026. ANNUAL values used on the 2026 T1/BC428 return, not the July payroll catch-up values.
// Numbers only; the engine owns all arithmetic.
export default {
  code: 'bc',
  name: 'British Columbia',
  year: 2026,
  brackets: [[50363, 0.056], [100728, 0.077], [115648, 0.105], [140430, 0.1229], [190405, 0.147], [265545, 0.168], [Infinity, 0.205]],
  credits: {
    creditRate: 0.056,
    basicPersonalAmount: 13216,
    bpaPhaseOut: null,
    canadaEmploymentAmount: null,
    cppQppEiCredit: true,
    payrollCredits: ['cppBase', 'ei'],
    other: []
  },
  surtax: null,
  healthPremium: null,
  taxReduction: null,
  lowIncomeReduction: {
    kind: 'baseMinusIncomeRate',
    name: 'BC tax reduction credit',
    baseAmount: 690,
    phaseOutStart: 25570,
    phaseOutRate: 0.0356,
    earningsRate: null,
    note: 'Reduction = min(BC tax after credits, 690 - (net income - 25,570) x 3.56%), floor 0; nil above 44,952. Annual 2026 amount per Budget 2026 (Bill 2).'
  },
  salesTax: { gst: 0.05, pst: 0.07, hst: 0, qst: 0, note: 'GST 5% + BC PST 7% (general rate).' },
  costOfLiving: null,
  special: [],
  sources: [
    { fields: ['brackets'], url: 'https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/tax-rates', title: 'Government of BC, personal income tax rates: 2026 lowest rate 5.60% to 50,363; 7.70% to 100,728; 10.50% to 115,648; 12.29% to 140,430; 14.70% to 190,405; 16.80% to 265,545; 20.50% above', retrieved: '2026-10-27' },
    { fields: ['brackets', 'credits.creditRate'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html', title: 'CRA T4127 123rd Edition (Jul 1, 2026), BC changes and Option 2 (annual) formulas: lowest rate 5.06% -> 5.60% for 2026; Option 2 K1P = 0.056 x TCP; TCP default 13,216; reduction 690 with thresholds 25,570 / 44,952 at 3.56%', retrieved: '2026-10-27' },
    { fields: ['credits.basicPersonalAmount', 'lowIncomeReduction'], url: 'https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/credits/basic', title: 'Government of BC, basic tax credits: 2026 BPA 13,216; tax reduction credit base 690, threshold 25,570, rate 3.56%, max net income 44,952 (2025: 562 / 25,020 / 40,807)', retrieved: '2026-10-27' },
    { fields: ['credits.basicPersonalAmount'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/td1bc/td1bc-fill-26e.pdf', title: 'CRA TD1BC 2026 line 1: BPA 13,216', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html', title: 'CRA, Personal income tax rates 2026: BC 5.6% to 50,363 and the same upper brackets', retrieved: '2026-10-27' },
    { fields: ['salesTax'], url: 'https://www2.gov.bc.ca/gov/content/taxes/sales-taxes/pst', title: 'Government of BC, PST: general rate 7% (page updated 2026-09-21; no rate change)', retrieved: '2026-10-27' },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA GST/HST calculator and rates: BC GST 5%, PST 7%', retrieved: '2026-10-27' }
  ],
  flags: [
    { field: 'brackets[0][1] and credits.creditRate', status: 'PROVISIONAL', note: 'Mid-year change. ANNUAL 2026 value used = 5.60% (BC gov tax-rates page; CRA T4127 123rd Ed. text "lowest personal tax rate is increased from 5.06% to 5.60%" and Option 2 K1P = 0.056 x TCP). NOT used: January payroll value 5.06% (T4127 122nd Ed.) and July-December payroll catch-up value 6.14% (T4127 123rd Ed. Table 8.1, V1 = 0.0614, KP2 = 786). Status PROVISIONAL only because the budget law (Bill 2, Budget Measures Implementation Act, 2026) royal assent date was not seen.' },
  ]
};
