// Nova Scotia, tax year 2026. Numbers only; DOM-free.
// Data builder: DATA-B. Retrieved 2026-10-27.
const R = '2026-10-27';
const T4127_JUL_RATES = 'https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jul/rates-income-thresholds-constants-26e.csv';
const T4127_JUL_OTHER = 'https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jul/other-rates-amounts-26e.csv';

export default {
  code: 'ns',
  name: 'Nova Scotia',
  year: 2026,
  brackets: [
    [30995, 0.0879],
    [61991, 0.1495],
    [97417, 0.1667],
    [157124, 0.175],
    [Infinity, 0.21],
  ],
  credits: {
    creditRate: 0.0879,
    basicPersonalAmount: 11932,   // flat for all incomes in 2026 (T4127 removed the income-tested BPANS formula)
    bpaPhaseOut: null,
    cppQppEiCredit: true,
    payrollCredits: ['cppBase', 'ei'],
    other: [],
  },
  surtax: null,
  taxReduction: null,
  lowIncomeReduction: {
    kind: 'baseMinusIncomeRate',
    name: 'Nova Scotia low-income tax reduction',
    baseAmount: 300,
    phaseOutStart: 15000,
    phaseOutRate: 0.05,
    earningsRate: null,
    note: 'reduction = max(0, 300 - 0.05*max(0, adjusted family income - 15000)); single filer. Applied after credits, cannot exceed tax.',
  },
  healthPremium: null,
  salesTax: { gst: 0.05, pst: 0, hst: 0.14, qst: 0, note: '14% HST (5% federal + 9% provincial) since 2025-04-01, down from 15% (CRA GST/HST rate table).' },
  costOfLiving: null,
  special: [],
  sources: [
    { fields: ['brackets', 'credits.creditRate'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html', title: 'CRA: income tax rates 2026 return, Nova Scotia table', retrieved: R },
    { fields: ['brackets', 'credits.creditRate'], url: T4127_JUL_RATES, title: 'CRA T4127 123rd ed. Table 8.1: NS A/V/KP (no NS change listed for July 2026)', retrieved: R },
    { fields: ['credits.basicPersonalAmount'], url: T4127_JUL_OTHER, title: 'CRA T4127 123rd ed. Table 8.2: NS basic amount 11,932, index rate 0.016', retrieved: R },
    { fields: ['credits.basicPersonalAmount'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', title: 'CRA T4127 122nd ed. changes: NS BPANS formula removed for all employees for 2026', retrieved: R },
    { fields: ['lowIncomeReduction'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-c/5003-c-fill-25e.pdf', title: 'CRA Form NS428 (2025): basic reduction 300, base amount 15,000, rate 5%', retrieved: R },
    { fields: ['lowIncomeReduction'], url: 'https://transcanadawealthmanagement.com/2026-tax-brackets/', title: 'TransCanada Wealth 2026 brackets (secondary): NS clawback band 15,221 to 21,000, consistent with 300/0.05', retrieved: R },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA: GST/HST rates by province (NS 14% from 2025-04-01)', retrieved: R },
  ],
  flags: [
    { field: 'lowIncomeReduction', status: 'PROVISIONAL', note: 'Values 300 / 15,000 / 5% are the 2025 NS428 values. NS amounts of this reduction were not indexed in the 2025 form and no 2026 NS428 or Nova Scotia Finance page was reachable. The secondary TransCanada 2026 table (clawback ending at 21,000) is consistent with unchanged values.' },
    { field: 'credits.basicPersonalAmount', status: 'PROVISIONAL', note: 'T4127 Table 8.2 (official) gives 11,932 (2025 11,744 x 1.016). 2026 is the first year NS indexes brackets and credits (index 1.6%, per KPMG 2026 table). Not cross-checked against the 2026 TD1NS or Nova Scotia legislation.' },
  ],
};
