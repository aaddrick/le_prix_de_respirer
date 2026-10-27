// Nunavut, tax year 2026. Numbers only; the engine owns all arithmetic.
// gov.nu.ca rate page not fetched; values rest on CRA publications.
export default {
  code: 'nu',
  name: 'Nunavut',
  year: 2026,
  brackets: [[55801, 0.04], [111602, 0.07], [181439, 0.09], [Infinity, 0.115]],
  credits: {
    creditRate: 0.04,
    basicPersonalAmount: 19659,
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
  salesTax: { gst: 0.05, pst: 0, hst: 0, qst: 0, note: 'GST 5% only; Nunavut has no territorial sales tax.' },
  costOfLiving: null,
  special: [],
  sources: [
    { fields: ['brackets', 'credits.creditRate', 'credits.basicPersonalAmount'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', title: 'CRA T4127 122nd Edition: NU A 0/55,801/111,602/181,439, V 4/7/9/11.5%, BPA 19,659; claim code 1 K1P 786.36 = 0.04 x 19,659', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html', title: 'CRA T4127 123rd Edition (Jul 1, 2026): no change for Nunavut; Table 8.1 CSV unchanged', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html', title: 'CRA, Personal income tax rates 2026: NU 4% to 55,801; 7% to 111,602; 9% to 181,439; 11.5% above', retrieved: '2026-10-27' },
    { fields: ['credits.basicPersonalAmount'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/td1nu/td1nu-fill-26e.pdf', title: 'CRA TD1NU 2026 line 1: BPA 19,659', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://taxnews.ey.com/news/2026-1151-canada-nunavut-budget-2026', title: 'EY: Nunavut Budget 2026: no personal income tax rate changes (secondary, corroborates)', retrieved: '2026-10-27' },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA GST/HST calculator and rates: NU GST 5%, PST 0%', retrieved: '2026-10-27' }
  ],
  flags: [
    { field: 'brackets', status: 'UNVERIFIED', note: 'Informational: the gov.nu.ca rate page was not read; values rest on CRA T4127 / TD1 / CRA rates page (official) plus an EY budget summary, with no territorial-government confirmation.' }
  ]
};
