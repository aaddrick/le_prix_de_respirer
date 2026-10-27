// Yukon, tax year 2026. Numbers only; the engine owns all arithmetic.
export default {
  code: 'yt',
  name: 'Yukon',
  year: 2026,
  brackets: [[58523, 0.064], [117045, 0.09], [181440, 0.109], [500000, 0.128], [Infinity, 0.15]],
  credits: {
    creditRate: 0.064,
    // Yukon BPA mirrors the federal BPAF: 16,452 at net income <= 181,440, falling linearly to 14,829 at >= 258,482.
    basicPersonalAmount: 16452,
    bpaPhaseOut: { start: 181440, end: 258482, minAmount: 14829 },
    // Yukon Canada employment credit (T4127 K4P): see `special`.
    canadaEmploymentAmount: 1501,
    cppQppEiCredit: true,
    payrollCredits: ['cppBase', 'ei'],
    other: []
  },
  surtax: null,
  healthPremium: null,
  taxReduction: null,
  lowIncomeReduction: null,
  salesTax: { gst: 0.05, pst: 0, hst: 0, qst: 0, note: 'GST 5% only; Yukon has no territorial sales tax.' },
  costOfLiving: null,
  special: [
    {
      name: 'yukonCanadaEmploymentCredit',
      description: 'Yukon has its own non-refundable Canada employment credit: 6.4% (Yukon lowest rate) x min(employment income, 1,501). The PLAN schema lists credits.canadaEmploymentAmount as federal-only, so this is a use of that field outside the schema. T4127 factor K4P = lesser of (0.064 x A) and (0.064 x CEA), CEA = 1,501 (Table 8.2).',
      how: 'In the Yukon calculation add to non-refundable credits: credits.creditRate * min(employmentIncome, credits.canadaEmploymentAmount). Do not apply it to any other jurisdiction that has canadaEmploymentAmount null.'
    }
  ],
  sources: [
    { fields: ['brackets', 'credits.creditRate'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', title: 'CRA T4127 122nd Edition: YT A 0/58,523/117,045/181,440/500,000, V 6.4/9/10.9/12.8/15%, claim code 1 K1P 1,052.93 = 0.064 x 16,452', retrieved: '2026-10-27' },
    { fields: ['brackets', 'credits.canadaEmploymentAmount'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html', title: 'CRA T4127 123rd Edition (Jul 1, 2026): no change for Yukon; Table 8.1 CSV YT thresholds unchanged, Table 8.2 CSV YT CEA 1,501', retrieved: '2026-10-27' },
    { fields: ['credits.basicPersonalAmount', 'credits.bpaPhaseOut'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', title: 'CRA T4127 122nd Ed., BPAYT = BPAF: 16,452 at NI <= 181,440; 16,452 - (NI - 181,440) x (1,623 / 77,042) between; 14,829 at NI >= 258,482', retrieved: '2026-10-27' },
    { fields: ['credits.basicPersonalAmount', 'credits.bpaPhaseOut'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/td1yt/td1yt-fill-26e.pdf', title: 'CRA TD1YT 2026 line 1: BPA 16,452, reduced when net income exceeds 181,440', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html', title: 'CRA, Personal income tax rates 2026: YT 6.4% to 58,523; 9% to 117,045; 10.9% to 181,440; 12.8% to 500,000; 15% above', retrieved: '2026-10-27' },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA GST/HST calculator and rates: YT GST 5%, PST 0%', retrieved: '2026-10-27' }
  ],
  flags: [
    { field: 'credits.bpaPhaseOut', status: 'PROVISIONAL', note: 'Federal-mirroring phase-out is taken from T4127 (BPAYT = BPAF) and TD1YT; the yukon.ca rate page returned HTTP 403 and was not read, so no Yukon-government page confirms it directly. Federal fed.js phase-out values must match (181,440 / 258,482 / 14,829).' }
  ]
};
