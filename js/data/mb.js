// Manitoba, tax year 2026. Numbers only; the engine owns all arithmetic.
export default {
  code: 'mb',
  name: 'Manitoba',
  year: 2026,
  brackets: [[47000, 0.108], [100000, 0.1275], [Infinity, 0.174]],
  credits: {
    creditRate: 0.108,
    basicPersonalAmount: 15780,
    // BPAMB = 15780 - (NI - 200000) * (15780 / 200000) between 200000 and 400000; 0 at or above 400000 (linear to minAmount)
    bpaPhaseOut: { start: 200000, end: 400000, minAmount: 0 },
    canadaEmploymentAmount: null,
    cppQppEiCredit: true,
    payrollCredits: ['cppBase', 'ei'],
    other: []
  },
  surtax: null,
  healthPremium: null,
  taxReduction: null,
  lowIncomeReduction: null,
  salesTax: { gst: 0.05, pst: 0.07, hst: 0, qst: 0, note: 'GST 5% + Manitoba RST 7% (general rate).' },
  costOfLiving: null,
  special: [],
  sources: [
    { fields: ['brackets', 'credits.creditRate'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', title: 'CRA T4127 122nd Edition (Jan 1, 2026), Manitoba: A 0/47,000/100,000, V 10.80%/12.75%/17.40%, K1P = 0.108 x TCP (claim code table 8.12: 1,704.24 / 15,780)', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html', title: 'CRA T4127 123rd Edition (Jul 1, 2026): no change for Manitoba; Table 8.1 CSV (rates-income-thresholds-constants-26e.csv) MB A 0/47,000/100,000', retrieved: '2026-10-27' },
    { fields: ['credits.basicPersonalAmount', 'credits.bpaPhaseOut'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/td1mb/td1mb-fill-26e.pdf', title: 'CRA TD1MB 2026 line 1: BPA 15,780; net income over 200,000 reduces it; 0 at 400,000 or more', retrieved: '2026-10-27' },
    { fields: ['credits.bpaPhaseOut'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', title: 'CRA T4127 122nd Ed., BPAMB formula: 15,780 - (NI - 200,000) x (15,780 / 200,000)', retrieved: '2026-10-27' },
    { fields: ['brackets', 'credits.basicPersonalAmount'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4032-payroll-deductions-tables/t4032mb-jan/t4032mb-january-general-information.html', title: 'CRA T4032MB Jan 2026: Manitoba BPA and bracket thresholds not indexed for 2025 and later; max BPAMB 2026 stays 15,780', retrieved: '2026-10-27' },
    { fields: ['brackets', 'credits.basicPersonalAmount'], url: 'https://www.ey.com/en_gl/technical/tax-alerts/canada-manitoba-budget-2026', title: 'EY: Manitoba Budget 2026 (tabled 2026-03-24): no PIT rate change, indexation paused for 2026 (secondary, corroborates)', retrieved: '2026-10-27' },
    { fields: ['salesTax'], url: 'https://www.manitoba.ca/finance/taxation/taxes/retail.html', title: 'Manitoba Finance, Retail Sales Tax: general rate 7%', retrieved: '2026-10-27' },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA GST/HST calculator and rates: GST 5%, MB PST 7%', retrieved: '2026-10-27' }
  ],
  flags: [
    { field: 'brackets', status: 'CONFLICT', note: 'Two official CRA sources disagree. Used 47,000 / 100,000 (T4127 122nd and 123rd ed. Table 8.1, T4032MB, TD1MB, and the Manitoba 2026 budget summaries, which say Manitoba thresholds are not indexed): https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html. The CRA 2026 return rates page lists 47,564 / 101,200 (exactly 47,000 / 100,000 x 1.012): https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html. No Manitoba government page or statute text with the figures could be read (Income Tax Act C.C.S.M. c. I10 link redirects to an index; gov.mb.ca finance pages carry no figures). Effect of choosing the other pair is at most about 67 dollars a year (about 11 between 47,000 and 47,564, plus about 56 above 100,000).' },
    { field: 'credits.other', status: 'PROVISIONAL', note: 'Only the basic personal amount and payroll credits are modelled (D9). MB labour-sponsored funds credit (max 1,800) and refundable credits (Family Tax Benefit, Renters Affordability) are out of scope.' }
  ]
};
