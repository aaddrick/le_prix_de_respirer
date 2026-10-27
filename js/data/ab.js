// Alberta, tax year 2026. Numbers only; the engine owns all arithmetic.
export default {
  code: 'ab',
  name: 'Alberta',
  year: 2026,
  brackets: [[61200, 0.08], [154259, 0.10], [185111, 0.12], [246813, 0.13], [370220, 0.14], [Infinity, 0.15]],
  credits: {
    creditRate: 0.08,
    basicPersonalAmount: 22769,
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
  salesTax: { gst: 0.05, pst: 0, hst: 0, qst: 0, note: 'GST 5% only; Alberta has no provincial sales tax.' },
  costOfLiving: null,
  special: [],
  sources: [
    { fields: ['brackets', 'credits.creditRate', 'credits.basicPersonalAmount'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', title: 'CRA T4127 122nd Edition: AB A 0/61,200/154,259/185,111/246,813/370,220, V 8/10/12/13/14/15%, K1P = 0.08 x TCP, BPA 22,769', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html', title: 'CRA T4127 123rd Edition (Jul 1, 2026): no change for Alberta; Table 8.1 CSV unchanged', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://www.alberta.ca/personal-income-tax', title: 'Alberta.ca, Personal income tax: 2026 brackets 8% to 61,200; 10% to 154,259; 12% to 185,111; 13% to 246,813; 14% to 370,220; 15% above; thresholds and credits up 2%', retrieved: '2026-10-27' },
    { fields: ['credits.basicPersonalAmount'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/td1ab/td1ab-fill-26e.pdf', title: 'CRA TD1AB 2026 line 1: BPA 22,769', retrieved: '2026-10-27' },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA GST/HST calculator and rates: AB GST 5%, PST 0%', retrieved: '2026-10-27' }
  ],
  flags: [
    { field: 'credits.other', status: 'PROVISIONAL', note: 'Alberta supplemental non-refundable credit (T4127 122nd Ed., factor K5P = 0.25 x ((K1P + K2P) - 4,896), floor 0; equivalent to 2% of eligible credits above 61,200 = 60,000 x 1.02) is NOT modelled and is $0 here (the calculator takes only employment income, province and other deductions), because the basic personal amount plus CPP/EI credit amounts are far below 61,200. Same treatment as the federal top-up credit. Source: T4127 122nd Ed. AB section (K5P). The alberta.ca page does not mention this credit.' }
  ]
};
