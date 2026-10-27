// Northwest Territories, tax year 2026. Numbers only; the engine owns all arithmetic.
// Out of scope (single filer, employment income only): NWT Cost of Living Offset (refundable). gov.nt.ca rate page not fetched; values rest on CRA publications.
export default {
  code: 'nt',
  name: 'Northwest Territories',
  year: 2026,
  brackets: [[53003, 0.059], [106009, 0.086], [172346, 0.122], [Infinity, 0.1405]],
  credits: {
    creditRate: 0.059,
    basicPersonalAmount: 18198,
    bpaPhaseOut: null,
    canadaEmploymentAmount: null,
    cppQppEiCredit: true,
    payrollCredits: ['cppBase', 'ei'],
    other: []
  },
  surtax: null,
  healthPremium: null,
  taxReduction: null,
  lowIncomeReduction: null,
  salesTax: { gst: 0.05, pst: 0, hst: 0, qst: 0, note: 'GST 5% only; NWT has no territorial sales tax.' },
  costOfLiving: null,
  special: [],
  sources: [
    { fields: ['brackets', 'credits.creditRate', 'credits.basicPersonalAmount'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', title: 'CRA T4127 122nd Edition: NT A 0/53,003/106,009/172,346, V 5.9/8.6/12.2/14.05%, BPA 18,198; claim code 1 K1P 1,073.68 = 0.059 x 18,198', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html', title: 'CRA T4127 123rd Edition (Jul 1, 2026): no change for Northwest Territories; Table 8.1 CSV unchanged', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html', title: 'CRA, Personal income tax rates 2026: NT 5.9% to 53,003; 8.6% to 106,009; 12.2% to 172,346; 14.05% above', retrieved: '2026-10-27' },
    { fields: ['credits.basicPersonalAmount'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/td1nt/td1nt-fill-26e.pdf', title: 'CRA TD1NT 2026 line 1: BPA 18,198', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://taxnews.ey.com/news/2026-0390-canada-northwest-territories-budget-2026-discussed', title: 'EY: NWT Budget 2026 (2026-02-05): no personal income tax rate changes (secondary, corroborates)', retrieved: '2026-10-27' },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA GST/HST calculator and rates: NT GST 5%, PST 0%', retrieved: '2026-10-27' }
  ],
  flags: [
    { field: 'brackets', status: 'UNVERIFIED', note: 'Informational: the gov.nt.ca rate page was not read; values rest on CRA T4127 / TD1 / CRA rates page (official) plus an EY budget summary, with no territorial-government confirmation.' }
  ]
};
