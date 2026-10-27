// Prince Edward Island, tax year 2026. Numbers only; DOM-free.
// Data builder: DATA-B. Retrieved 2026-10-27.
// D11: top bracket rate is the ANNUAL 2026-return value (20% above 200,000), not the July payroll catch-up (21%). See flags.
// No surtax: none appears in the 2026 T4127 PE entries or Table 8.2.
const R = '2026-10-27';
const T4127_JUL_HTML = 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html';

export default {
  code: 'pe',
  name: 'Prince Edward Island',
  year: 2026,
  brackets: [
    [33928, 0.095],
    [65820, 0.1347],
    [106890, 0.166],
    [142520, 0.1762],
    [200000, 0.19],
    [Infinity, 0.20],
  ],
  credits: {
    creditRate: 0.095,
    basicPersonalAmount: 15000,
    bpaPhaseOut: null,
    cppQppEiCredit: true,
    payrollCredits: ['cppBase', 'ei'],
    other: [],
  },
  surtax: null,
  taxReduction: null,
  lowIncomeReduction: {
    kind: 'baseMinusIncomeRate',
    name: 'Prince Edward Island low-income tax reduction',
    baseAmount: 350,         // basic reduction (single filer)
    phaseOutStart: 23000,    // adjusted family income threshold
    phaseOutRate: 0.05,
    earningsRate: null,
    note: 'reduction = max(0, 350 - 0.05*max(0, adjusted income - 23000)); applied after credits, cannot exceed tax. 2025 form values were 350 / 22,650 / 5%.',
  },
  healthPremium: null,
  salesTax: { gst: 0.05, pst: 0, hst: 0.15, qst: 0, note: '15% HST (5% federal + 10% provincial) since 2016-10-01 (CRA GST/HST rate table).' },
  costOfLiving: null,
  special: [],
  sources: [
    { fields: ['brackets', 'credits.creditRate'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html', title: 'CRA: income tax rates 2026 return, PEI table (6 brackets, 20% over 200,000)', retrieved: R },
    { fields: ['brackets', 'credits.creditRate', 'credits.basicPersonalAmount'], url: T4127_JUL_HTML, title: 'CRA T4127 123rd ed. (July 1, 2026) changes + Table 8.1: PE 9.5%..19%, new top bracket above 200,000 at 20% for 2026 and prorated 21% for the remaining six months; Option 2 rates (not prorated) top 20%, KP 8,464', retrieved: R },
    { fields: ['credits.basicPersonalAmount'], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html', title: 'CRA T4127 122nd ed. changes: PE BPA 14,650 -> 15,000 effective Jan 1 2026; Table 8.2 PE basic amount 15,000', retrieved: R },
    { fields: ['brackets'], url: 'https://assets.kpmg.com/content/dam/kpmgsites/ca/pdf/services/tax/personal-tables/ca-federal-and-provincial-territorial-income-tax-rates-and-brackets-for-2026.pdf.coredownload.inline.pdf', title: 'KPMG 2026 rates (secondary): PEI 20% rate on income above 200,000 effective Jan 1 2026', retrieved: R },
    { fields: ['lowIncomeReduction'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-c/5002-c-fill-25e.pdf', title: 'CRA Form PE428 (2025): basic reduction 350, 5%, base amount 22,650 (2025 values)', retrieved: R },
    { fields: ['lowIncomeReduction'], url: 'https://www.ey.com/en_gl/technical/tax-alerts/canada-prince-edward-island-budget-2026-updated', title: 'EY PEI Budget 2026 (secondary): low-income reduction clawed back above 23,000, 5% of provincial tax between 23,001 and 30,000', retrieved: R },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA: GST/HST rates by province (PE 15%)', retrieved: R },
  ],
  flags: [
    { field: 'brackets', status: 'PROVISIONAL', note: 'D11 mid-year change. ANNUAL 2026-return top rate = 20% above 200,000 (CRA 2026 rates page; T4127 123rd ed. "20%" for 2026; Option 2 rate table 20%/KP 8,464). The July 1 2026 payroll catch-up rate is a prorated 21% above 200,000 (T4127 123rd ed. Table 8.1, KP 10,464); arithmetic (19% H1 + 21% H2)/2 = 20%. The 6th bracket depends on PEI Bill 23 (first reading 2026-04-17; EY says effective 2026-01-01, some firm summaries said 2027 before a budget appendix correction). CRA treats it as law for 2026. No official PEI page was readable (princeedwardisland.ca blocked the fetch).' },
    { field: 'credits.basicPersonalAmount', status: 'PROVISIONAL', note: 'BPA 15,000 effective Jan 1 2026 per T4127 122nd/123rd ed.; the PE budget measure is subject to Bill 23 passage and no PEI official page was readable.' },
    { field: 'lowIncomeReduction', status: 'PROVISIONAL', note: 'Base 350 and rate 5% are the 2025 PE428 values; threshold 23,000 is from EY (secondary) and the TransCanada table, and is consistent with a 350/0.05 = 7,000 clawback band ending at 30,000. The PEI site states the threshold was raised Jan 1 2026 without a number in the text retrieved. Not confirmed from an official 2026 source. Age (250) and dependant add-ons are out of scope (D9).' },
  ],
};
