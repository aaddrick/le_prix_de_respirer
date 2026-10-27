// Federal (Canada) income tax, tax year 2026. DOM-free data module.
// Data only; the engine owns all arithmetic.
const R = '2026-10-27';
export default {
  code: 'fed',
  name: 'Canada (federal)',
  year: 2026,
  // Upper limits are the CRA 2026 thresholds (indexation factor 2.0%).
  brackets: [
    [58523, 0.14],
    [117045, 0.205],
    [181440, 0.26],
    [258482, 0.29],
    [Infinity, 0.33],
  ],
  credits: {
    creditRate: 0.14, // lowest federal rate for 2026 (full-year 14%; 2025 was the 14.5% blended rate)
    basicPersonalAmount: 16452,
    // BPA falls linearly from 16,452 at net income 181,440 to 14,829 at net income 258,482.
    bpaPhaseOut: { start: 181440, end: 258482, minAmount: 14829 },
    canadaEmploymentAmount: 1501, // applied as min(employment income, amount)
    cppQppEiCredit: true,
    // Payroll items credited federally for residents outside Quebec.
    payrollCredits: ['cppBase', 'ei'],
    // Extension field (outside the base schema): items credited federally for Quebec residents.
    payrollCreditsQuebecResident: ['qppBase', 'eiQuebec', 'qpip'],
    other: [],
  },
  surtax: null,
  healthPremium: null,
  taxReduction: null,
  lowIncomeReduction: null,
  abatement: { quebec: 0.165 },
  salesTax: { gst: 0.05, pst: null, hst: null, qst: null, note: 'Federal GST 5% (applies in every province and territory; HST provinces combine it with the provincial part).' },
  costOfLiving: null,
  special: [],
  sources: [
    {
      fields: ['brackets', 'credits.creditRate', 'credits.basicPersonalAmount', 'credits.bpaPhaseOut', 'credits.canadaEmploymentAmount'],
      url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/adjustment-personal-income-tax-benefit-amounts.html',
      title: 'CRA: Adjustment of personal income tax and benefit amounts (2026 indexation 2.0%; thresholds 58,523 / 117,045 / 181,440 / 258,482; BPA 16,452 to 14,829; CEA 1,501)',
      retrieved: R,
    },
    {
      fields: ['brackets', 'credits.creditRate', 'credits.basicPersonalAmount', 'credits.bpaPhaseOut', 'credits.canadaEmploymentAmount', 'abatement.quebec', 'credits.payrollCredits', 'credits.payrollCreditsQuebecResident'],
      url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html',
      title: 'CRA T4127 Payroll Deductions Formulas, 122nd ed. effective 2026-01-01 (A=0/58,523/117,045/181,440/258,482; R=14/20.5/26/29/33%; K=0/3,804/10,241/15,685/26,024; lowest rate 14%; BPAF 16,452/14,829; CEA 1,501; Quebec abatement 16.5%)',
      retrieved: R,
    },
    {
      fields: ['salesTax.gst'],
      url: 'https://www.revenuquebec.ca/en/businesses/consumption-taxes/gsthst-and-qst/basic-rules-for-applying-the-gsthst-and-qst/tables-of-gst-and-qst-rates/',
      title: 'Revenu Quebec: Tables of GST and QST rates (GST 5% since 2008; confirmed in a browser by an independent verifier)',
      retrieved: R,
    },
  ],
  flags: [
    {
      field: 'topUpTaxCredit',
      status: 'UNVERIFIED',
      note: 'OUT OF SCOPE (D9/D10): the federal top-up tax credit (2025-2030) is NOT modelled and is $0 under D9, because credits never exceed the first bracket threshold. Do not add it to credits.other.',
    },
    {
      field: 'credits.payrollCreditsQuebecResident',
      status: 'PROVISIONAL',
      note: 'Extension field outside the base schema. Federal credit for a Quebec resident uses QPP base (5.30% rate, max 3,768.30 per T4127 K2 note), the Quebec EI rate and QPIP, per T4127 Quebec T1 treatment and Universite de Sherbrooke CFFP; the engine owner must confirm.',
    },
  ],
};
