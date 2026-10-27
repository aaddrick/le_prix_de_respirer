// Newfoundland and Labrador, tax year 2026. Numbers only; DOM-free.
// Data builder: DATA-B. Retrieved 2026-10-27.
// D11: BPA is the ANNUAL 2026-return value (13,094), not the July payroll catch-up (15,000). See flags.
const R = '2026-10-27';
const T4127_JUL_HTML = 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html';
const T4127_JUL_RATES = 'https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jul/rates-income-thresholds-constants-26e.csv';

export default {
  code: 'nl',
  name: 'Newfoundland and Labrador',
  year: 2026,
  brackets: [
    [44678, 0.087],
    [89354, 0.145],
    [159528, 0.158],
    [223340, 0.178],
    [285319, 0.198],
    [570638, 0.208],
    [1141275, 0.213],
    [Infinity, 0.218],
  ],
  credits: {
    creditRate: 0.087,
    basicPersonalAmount: 13094,
    bpaPhaseOut: null,
    canadaEmploymentAmount: null,
    cppQppEiCredit: true,
    payrollCredits: ['cppBase', 'ei'],
    other: [],
  },
  surtax: null,
  taxReduction: null,
  lowIncomeReduction: {
    kind: 'baseMinusIncomeRate',
    name: 'Newfoundland and Labrador low-income tax reduction',
    baseAmount: 842,         // basic reduction, 2026 (Reg. 18/26 s.3(b)(i)); spouse/dependant add-on 563 not used (D9)
    phaseOutStart: 24191,    // adjusted family income threshold, single filer with no spouse/eligible dependant
    phaseOutRate: 0.16,
    earningsRate: null,
    note: 'reduction = max(0, 842 - 0.16*max(0, adjusted income - 24191)); applied last, cannot exceed tax otherwise payable (Income Tax Act, 2000 s.21.1(5)).',
  },
  healthPremium: null,
  salesTax: { gst: 0.05, pst: 0, hst: 0.15, qst: 0, note: '15% HST (5% federal + 10% provincial) since 2016-07-01 (CRA GST/HST rate table).' },
  costOfLiving: null,
  special: [],
  sources: [
    { fields: ['brackets', 'credits.creditRate'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html', title: 'CRA: income tax rates 2026 return, Newfoundland and Labrador table', retrieved: R },
    { fields: ['brackets', 'credits.creditRate'], url: T4127_JUL_RATES, title: 'CRA T4127 123rd ed. Table 8.1: NL A/V/KP (8 brackets, lowest rate 8.70%)', retrieved: R },
    { fields: ['credits.basicPersonalAmount'], url: T4127_JUL_HTML, title: 'CRA T4127 123rd ed. changes: NL BPA 11,188 -> 13,094 effective Jan 1 2026; prorated 15,000 only for payrolls from July', retrieved: R },
    { fields: ['credits.basicPersonalAmount'], url: 'https://assembly.nl.ca/Legislation/sr/statutes/i01-1.htm', title: 'NL Income Tax Act, 2000 s.9(1)(c): $13,094, s.9(5): not adjusted before the 2027 taxation year', retrieved: R },
    { fields: ['lowIncomeReduction.baseAmount'], url: 'https://assembly.nl.ca/Legislation/sr/Regulations/rc260018.htm', title: 'NL Reg. 18/26 Low Income Tax Reduction Regulations for the 2025 and 2026 Taxation Years: 2026 amounts $842 and $563 (2025: $997 and $557)', retrieved: R },
    { fields: ['lowIncomeReduction.phaseOutRate', 'lowIncomeReduction.phaseOutStart'], url: 'https://assembly.nl.ca/Legislation/sr/statutes/i01-1.htm', title: 'NL Income Tax Act, 2000 s.21.1: reduction rate 16% of adjusted income above threshold; applied last', retrieved: R },
    { fields: ['lowIncomeReduction.phaseOutStart', 'lowIncomeReduction.phaseOutRate'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-c/5001-c-fill-25e.pdf', title: 'CRA Form NL428 (2025): basic reduction 997, 16%, single threshold 23,928 (2025 values; 23,928 x 1.011 = 24,191)', retrieved: R },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA: GST/HST rates by province (NL 15%)', retrieved: R },
    { fields: ['lowIncomeReduction.phaseOutRate'], url: 'https://assembly.nl.ca/Legislation/sr/statutes/i01-1.htm', title: 'NL Income Tax Act, 2000 s.21.1(2) (official): reduction is 16% of adjusted income over the threshold; confirmed 2026-10-27 in the browser. Base 842 for 2026 is in Reg. 18/26 (official version, NLR 18/26, filed 2026-05-14)', retrieved: R },
  ],
  flags: [
    { field: 'credits.basicPersonalAmount', status: 'PROVISIONAL', note: 'D11 mid-year change. ANNUAL value used on the 2026 return = 13,094 (T4127 123rd ed. changes section "BPA increases from $11,188 to $13,094 effective January 1, 2026"; NL Income Tax Act, 2000 s.9(1)(c) and 9(5)). The July 1 2026 payroll catch-up value is a prorated 15,000 (T4127 123rd ed. same section; Table 8.2 and K1P default TCP 15,000), arithmetic: (11,188 + 15,000)/2 = 13,094. NL Budget 2026 states the BPA goes to 15,000 (https://www.gov.nl.ca/budget/2026/what-you-need-to-know/a-plan-for-lower-taxes/), applying in full from 2027. Statute text was read from a consolidated page that may predate the 2026 amending Act; PROVISIONAL until the 2026 NL428 is published.' },
    { field: 'lowIncomeReduction.phaseOutStart', status: 'PROVISIONAL', note: '24,191 is 2025 NL428 threshold 23,928 indexed by the 2026 NL factor 1.011 (T4127 Table 8.2 index rate 0.011), and matches the secondary TransCanada figure. No official 2026 NL428 / NL Department of Finance statement was reachable. Statute s.21.1 shows an unindexed base of 18,547 (indexed per s.6.1) for the same threshold.' },
  ],
};
