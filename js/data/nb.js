// New Brunswick, tax year 2026. Numbers only; DOM-free.
// Data builder: DATA-B. Retrieved 2026-10-27.
const R = '2026-10-27';
const T4127_JUL_RATES = 'https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jul/rates-income-thresholds-constants-26e.csv';
const T4127_JUL_OTHER = 'https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jul/other-rates-amounts-26e.csv';

export default {
  code: 'nb',
  name: 'New Brunswick',
  year: 2026,
  brackets: [
    [52333, 0.094],
    [104666, 0.14],
    [193861, 0.16],
    [Infinity, 0.195],
  ],
  credits: {
    creditRate: 0.094,
    basicPersonalAmount: 13664,
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
    name: 'New Brunswick low-income tax reduction',
    baseAmount: 818,         // basic reduction, single filer: 2025 value 802 x 1.02 (see flags)
    phaseOutStart: 22358,    // adjusted family income threshold: 2025 value 21,920 x 1.02
    phaseOutRate: 0.03,
    earningsRate: null,
    note: 'reduction = max(0, 818 - 0.03*max(0, adjusted family income - 22358)); single filer. Applied after credits, cannot exceed tax.',
  },
  healthPremium: null,
  salesTax: { gst: 0.05, pst: 0, hst: 0.15, qst: 0, note: '15% HST (5% federal + 10% provincial) since 2016-10-01 (CRA GST/HST rate table).' },
  costOfLiving: null,
  special: [],
  sources: [
    { fields: ['brackets', 'credits.creditRate'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html', title: 'CRA: income tax rates 2026 return, New Brunswick table', retrieved: R },
    { fields: ['brackets', 'credits.creditRate'], url: T4127_JUL_RATES, title: 'CRA T4127 123rd ed. Table 8.1: NB A/V/KP (no NB change listed for July 2026)', retrieved: R },
    { fields: ['credits.basicPersonalAmount'], url: T4127_JUL_OTHER, title: 'CRA T4127 123rd ed. Table 8.2: NB basic amount 13,664, index rate 0.02', retrieved: R },
    { fields: ['lowIncomeReduction'], url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5004-c/5004-c-fill-25e.pdf', title: 'CRA Form NB428 (2025): basic reduction 802, base amount 21,920, rate 3% (2025 values)', retrieved: R },
    { fields: ['lowIncomeReduction', 'brackets'], url: 'https://assets.kpmg.com/content/dam/kpmgsites/ca/pdf/services/tax/personal-tables/ca-federal-and-provincial-territorial-income-tax-rates-and-brackets-for-2026.pdf.coredownload.inline.pdf', title: 'KPMG 2026 rates (secondary): NB indexation factor 2.0% for 2026', retrieved: R },
    { fields: ['lowIncomeReduction'], url: 'https://transcanadawealthmanagement.com/2026-tax-brackets/', title: 'TransCanada Wealth 2026 brackets (secondary): NB clawback from 22,358 to 49,592 at 3%', retrieved: R },
    { fields: ['salesTax'], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html', title: 'CRA: GST/HST rates by province (NB 15%)', retrieved: R },
  ],
  flags: [
    { field: 'lowIncomeReduction', status: 'PROVISIONAL', note: 'No 2026 NB428 or New Brunswick Finance source was reachable. 818 = 802 (2025 NB428 basic reduction) x 1.02 and 22,358 = 21,920 x 1.02 (NB uses the federal 2.0% factor, T4127 Table 8.2 index rate 0.020). The secondary TransCanada band (22,358 to 49,592 at 3%) matches the threshold but implies a base of about 817; the 1-dollar difference is unresolved.' },
  ],
};
