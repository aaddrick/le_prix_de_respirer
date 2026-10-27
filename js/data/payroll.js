// Payroll contributions, tax year 2026 (CPP/CPP2, QPP/QPP2, EI incl. Quebec rate, QPIP). DOM-free data module.
// Data only; the engine owns all arithmetic. Base share is credited, enhanced first-tier share is a deduction,
// CPP2/QPP2 is wholly a deduction (enhanced-first-tier split). maxBaseContribution = base rate x (YMPE - basic exemption).
const R = '2026-10-27';
export default {
  code: 'payroll',
  name: 'Payroll contributions (CPP/QPP, EI, QPIP)',
  year: 2026,
  cpp: { rate: 0.0595, baseRate: 0.0495, enhancedRate: 0.01, basicExemption: 3500, ympe: 74600, maxContribution: 4230.45, maxBaseContribution: 3519.45 },
  cpp2: { rate: 0.04, yampe: 85000, max: 416.00 },
  qpp: { rate: 0.063, baseRate: 0.053, enhancedRate: 0.01, basicExemption: 3500, ympe: 74600, maxContribution: 4479.30, maxBaseContribution: 3768.30 },
  qpp2: { rate: 0.04, yampe: 85000, max: 416.00 },
  ei: { rate: 0.0163, mie: 68900, max: 1123.07 },
  eiQuebec: { rate: 0.0130, mie: 68900, max: 895.70 },
  qpip: { employeeRate: 0.0043, mie: 103000, max: 442.90 },
  special: [],
  sources: [
    {
      fields: ['cpp.rate', 'cpp.basicExemption', 'cpp.ympe', 'cpp.maxContribution'],
      url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html',
      title: 'CRA: CPP contribution rates, maximums and exemptions (2026: YMPE 74,600; exemption 3,500; 5.95%; max 4,230.45)',
      retrieved: R,
    },
    {
      fields: ['cpp.rate', 'cpp.baseRate', 'cpp.enhancedRate', 'cpp.maxContribution', 'cpp.maxBaseContribution', 'qpp.rate', 'qpp.baseRate', 'qpp.enhancedRate', 'qpp.basicExemption', 'qpp.ympe', 'qpp.maxContribution', 'qpp.maxBaseContribution', 'ei', 'eiQuebec'],
      url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html',
      title: 'CRA T4127 122nd ed. Jan 2026: CPP total 0.0595 / base 0.0495 / first additional 0.0100; QPP 0.0630 / base 0.0530; max base 3,519.45 (QC 3,768.30); max total 4,230.45 (QC 4,479.30); EI 0.0163 max 1,123.07, Quebec 0.0130 max 895.70',
      retrieved: R,
    },
    {
      fields: ['cpp.rate', 'cpp.basicExemption', 'cpp.ympe', 'qpp.rate', 'qpp.basicExemption', 'qpp.ympe', 'qpp.maxContribution'],
      url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jan/cpp-qpp-ttl-01-26e.csv',
      title: 'T4127-JAN Table 8.3 CPP/QPP 2026 contribution rates and amounts (YMPE 74,600; exemption 3,500; CPP 0.0595 / 4,230.45; QPP 0.063 / 4,479.30)',
      retrieved: R,
    },
    {
      fields: ['cpp2', 'qpp2'],
      url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jan/cpp-qpp-scnd-addntl-01-26e.csv',
      title: 'T4127-JAN second additional CPP/QPP table 2026 (YAMPE 85,000; 4%; max 416.00; same for CPP and QPP)',
      retrieved: R,
    },
    {
      fields: ['ei', 'eiQuebec'],
      url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei/ei-premium-rates-maximums.html',
      title: 'CRA: EI premium rates and maximums 2026 (MIE 68,900; 1.63% / 1.30% Quebec; max 1,123.07 / 895.70)',
      retrieved: R,
    },
    {
      fields: ['qpip'],
      url: 'https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jan/qpip-01-26e.csv',
      title: 'T4127-JAN Table 8.8 QPIP 2026 (max insurable earnings 103,000; employee 0.0043; max 442.90)',
      retrieved: R,
    },
    {
      fields: ['qpp.rate', 'qpp.baseRate', 'qpp.enhancedRate', 'qpp.ympe', 'qpp.basicExemption', 'qpp.maxContribution', 'qpp2', 'qpip'],
      url: 'https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/employers-principal-changes-for-2026/',
      title: 'Revenu Quebec: Employers, principal changes for 2026 (corroboration: QPP 6.30% = 5.30% base + 1% first additional, 4,479.30; QPP2 4% to 85,000; QPIP 0.430%/103,000/442.90). Direct fetch returned HTTP 403; confirmed through search-result text only.',
      retrieved: R,
    },
  ],
  flags: [],
};
