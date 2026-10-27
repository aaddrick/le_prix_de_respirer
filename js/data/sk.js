// Saskatchewan, tax year 2026. Numbers only; the engine owns all arithmetic.
// Out of scope (single filer, employment income only): SK labour-sponsored credit (max 875). SK BPA includes the legislated extra $500/yr on top of indexation (19,491 in 2025).
export default {
  code: 'sk',
  name: 'Saskatchewan',
  year: 2026,
  brackets: [[54532, 0.105], [155805, 0.125], [Infinity, 0.145]],
  credits: {
    creditRate: 0.105,
    basicPersonalAmount: 20381,
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
  salesTax: { gst: 0.05, pst: 0.06, hst: 0, qst: 0, note: 'GST 5% + Saskatchewan PST 6%.' },
  costOfLiving: null,
  special: [],
  sources: [
    { fields: ['brackets', 'credits.creditRate', 'credits.basicPersonalAmount'], url: 'https://www.saskatchewan.ca/residents/taxes-and-investments/personal-income-tax/2026-personal-income-tax-structure', title: 'Government of Saskatchewan, 2026 personal income tax structure: 10.5% to 54,532; 12.5% to 155,805 (next 101,273); 14.5% above; BPA 20,381; credits multiplied by 10.5%; no low-income credit listed', retrieved: '2026-10-27' },
    { fields: ['brackets', 'credits.creditRate', 'credits.basicPersonalAmount'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', title: 'CRA T4127 122nd Edition: SK A 0/54,532/155,805, V 10.5/12.5/14.5%, BPA 20,381; claim code 1 K1P 2,140.01 = 0.105 x 20,381', retrieved: '2026-10-27' },
    { fields: ['brackets'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html', title: 'CRA T4127 123rd Edition (Jul 1, 2026): no change for Saskatchewan', retrieved: '2026-10-27' },
    { fields: ['credits.basicPersonalAmount'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/td1sk/td1sk-fill-26e.pdf', title: 'CRA TD1SK 2026 line 1: BPA 20,381', retrieved: '2026-10-27' },
    { fields: ['salesTax'], url: 'https://www.saskatchewan.ca/business/taxes-licensing-and-reporting/provincial-taxes-policies-and-bulletins/provincial-sales-tax', title: 'Government of Saskatchewan, Provincial Sales Tax: 6%', retrieved: '2026-10-27' },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA GST/HST calculator and rates: GST 5%, SK PST 6%', retrieved: '2026-10-27' }
  ],
  flags: []
};
