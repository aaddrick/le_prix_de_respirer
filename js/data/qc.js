// Quebec provincial income tax, tax year 2026 (TP-1). DOM-free data module (schema: PLAN_canada.md D8/D10).
// Data only; the engine owns all arithmetic. Quebec has its own return, so the federal 16.5% abatement is in fed.js.
const R = '2026-10-27';
export default {
  code: 'qc',
  name: 'Quebec',
  year: 2026,
  // Thresholds: Ministere des Finances du Quebec, Parameters of the personal income tax system for 2026 (indexation 2.05%).
  brackets: [
    [54345, 0.14],
    [108680, 0.19],
    [132245, 0.24],
    [Infinity, 0.2575],
  ],
  credits: {
    creditRate: 0.14,
    basicPersonalAmount: 18952,
    bpaPhaseOut: null,
    canadaEmploymentAmount: null, // no Quebec equivalent (the federal CEA is federal only)
    // Quebec gives NO separate credit for QPP base, EI or QPIP: they are already built into the basic personal amount.
    // The enhanced QPP part is a DEDUCTION, described in special.
    cppQppEiCredit: false,
    payrollCredits: [],
    other: [],
  },
  surtax: null,
  healthPremium: null, // see flags: no employee health contribution in 2026 for employment income
  taxReduction: null,
  lowIncomeReduction: null,
  salesTax: { gst: 0.05, pst: null, hst: null, qst: 0.09975, note: 'GST 5% plus QST 9.975% (QST is charged on the price excluding GST); combined 14.975% when computed in one step.' },
  costOfLiving: null,
  special: [
    {
      name: 'QC deduction for workers',
      description: 'Quebec allows a deduction in computing net income equal to 6% of work income (employment income here), capped at 1,450 for 2026 (1,420 in 2025). It reduces taxable income before the Quebec brackets and the 14% basic credit apply.',
      how: 'workerDeduction = min(0.06 * employmentIncome, 1450); qcTaxableIncome = employmentIncome - workerDeduction - qppEnhancedDeduction - otherDeductions. Not applied federally.',
    },
    {
      name: 'QC deduction for enhanced QPP contributions',
      description: 'Quebec deducts from net income the employee QPP contributions tied to the enhanced plan: the first additional contribution (1% of pensionable earnings between the 3,500 exemption and the YMPE 74,600, max 711.00) plus the whole second additional (QPP2) contribution (4% between 74,600 and 85,000, max 416.00). The base 5.30% contribution gets no credit or deduction in Quebec (it is in the basic personal amount). EI and QPIP premiums get no Quebec credit or deduction for an employee.',
      how: 'qppEnhancedDeduction = payroll.qpp.enhancedRate * (min(income, ympe) - basicExemption, floored at 0) + qpp2 contribution (as computed by payroll.js). It is a deduction for the Quebec return and, as for CPP, also a federal deduction (qppEnhanced, qpp2).',
    },
  ],
  sources: [
    {
      fields: ['brackets[].upperLimit', 'credits.basicPersonalAmount', 'special[0]'],
      url: 'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTEN_IncomeTax2026.pdf',
      title: 'Ministere des Finances du Quebec: Parameters of the personal income tax system for 2026 (Nov 2025): indexing 2.05%; bracket maxima 54,345 / 108,680 / 132,245; BPA 18,952; maximum deduction for workers 1,450',
      retrieved: R,
    },
    {
      fields: ['brackets[].rate', 'credits.creditRate', 'credits.basicPersonalAmount', 'special[0]'],
      url: 'https://www.rcgt.com/contentassets/5142f7cf936d42d7aa7666314c21ccd1/individual-taxation---quebec---2026.pdf',
      title: 'Raymond Chabot Grant Thornton, Quebec 2026 tax tables, updated 2026-04-30 (SECONDARY: rates 14/19/24/25.75%, credit rate 14%, BPA 18,952, deduction for workers max 1,450); marginal rates in its table agree with the data here',
      retrieved: R,
    },
    {
      fields: ['brackets[].rate', 'credits.creditRate'],
      url: 'https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/income-tax-rates/',
      title: 'Revenu Quebec: income tax rates (direct fetch returned HTTP 403; the 14/19/24/25.75% rates were read through search-result text for Revenu Quebec and the bracket page, and the RCGT table)',
      retrieved: R,
    },
    {
      fields: ['credits.cppQppEiCredit', 'credits.payrollCredits', 'special[1]'],
      url: 'https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/how-to-complete-your-income-tax-return/line-by-line-help/350-to-398-1-non-refundable-tax-credits/line-350/',
      title: 'Revenu Quebec TP-1 guide, line 350: "The basic personal amount ... takes into account contributions to the Quebec Pension Plan and the health services fund, and premiums under QPIP and EI" (archived 2024 text); lines 98/98.2/248: QPP deduction via Schedule U Part B',
      retrieved: R,
    },
    {
      fields: ['credits.cppQppEiCredit', 'credits.payrollCredits', 'special[1]'],
      url: 'https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/cotisations-rrq-rqap-et-assurance-emploi/',
      title: 'Universite de Sherbrooke CFFP, fiche on RRQ/RQAP/EI contributions (SECONDARY, 2025 params): no Quebec credit for base RRQ/RQAP/EI; deduction for the enhanced RRQ part',
      retrieved: R,
    },
    {
      fields: ['salesTax.gst', 'salesTax.qst'],
      url: 'https://www.revenuquebec.ca/en/businesses/consumption-taxes/gsthst-and-qst/basic-rules-for-applying-the-gsthst-and-qst/tables-of-gst-and-qst-rates/',
      title: 'Revenu Quebec: Tables of GST and QST rates (GST 5%, QST 9.975% since 2013-01-01; confirmed via search-result text, direct fetch 403)',
      retrieved: R,
    },
    {
      fields: ['special[1]'],
      url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html',
      title: 'CRA T4127 122nd ed.: QPP rates and amounts (first additional 0.0100, second 0.04, YAMPE 85,000) used for the deduction sizes',
      retrieved: R,
    },
  ],
  flags: [
    {
      field: 'brackets[].rate, credits.creditRate',
      status: 'PROVISIONAL',
      note: 'Revenu Quebec rate pages returned 403. The 2026 rates (14/19/24/25.75%) and the 14% credit rate are unchanged from 2025 per Revenu Quebec search text and the RCGT table, and the official Finances Quebec parameters document confirms thresholds and indexation but does not print the rates.',
    },
    {
      field: 'special[0] workerDeduction rate 6%',
      status: 'PROVISIONAL',
      note: 'Official Finances Quebec publication confirms only the 2026 maximum (1,450). The 6% of work income rate is long-standing Quebec law (Taxation Act s.346) and was not re-fetched from an official 2026 page.',
    },
    {
      field: 'special[1] QPP enhanced deduction / no credit for base QPP, EI, QPIP',
      status: 'PROVISIONAL',
      note: 'Official pages seen: Revenu Quebec line 98/98.2/248 (deduction through Schedule U Part B) and line 350 (BPA already accounts for contributions; 2024 text). The Schedule U Part B arithmetic itself was not readable; exact deduction amounts follow the Sherbrooke fiche ("partie bonifiee") and T4127 first/second additional rates. Max first additional = 0.01 x (74,600 - 3,500) = 711.00.',
    },
    {
      field: 'healthPremium',
      status: 'PROVISIONAL',
      note: 'Quebec has no health contribution on employment income in 2026: the flat 2016-2017 "contribution sante" was abolished (2017). Individuals file Schedule F for a Health Services Fund contribution (TP-1 line 446), which applies to non-employment income (investment, business, etc.); it is $0 for an employee with employment income only (D9). Employers pay the HSF on wages. Revenu Quebec line 446 text read from an archived page (2024 return); no 2026 official text was read.',
    },
    {
      field: 'taxReduction / lowIncomeReduction',
      status: 'UNVERIFIED',
      note: 'None modelled. Quebec 2026 low-income measures are refundable credits (solidarity tax credit, work premium) or social benefits, out of scope under D9 (credits do not reduce tax below zero here).',
    },
  ],
};
