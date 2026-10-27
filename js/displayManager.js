/**
 * Display Manager Module
 * Writes every result to the page. Every number shown comes from the
 * TaxCalculator result (notes/engine.md) or from the data module the engine
 * hands back through getJurisdictionData(); none is typed into the HTML.
 * Ids are listed in notes/ui-ids.md.
 */

const moneyFormat = new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0
});

/** Whole-dollar currency. Non-finite values show as '-'. */
export function formatCurrency(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
    // Avoid "-$0" for tiny negative float noise.
    const v = Math.abs(value) < 0.5 ? 0 : value;
    return moneyFormat.format(v);
}

/** A computed share or marginal rate, as a percentage with fixed decimals. */
export function formatPercent(rate, digits = 2) {
    if (typeof rate !== 'number' || !Number.isFinite(rate)) return '-';
    const p = rate * 100;
    return `${(Math.abs(p) < 0.005 ? 0 : p).toFixed(digits)}%`;
}

/** A statutory rate from the data (e.g. 0.0505, 0.0043): 2 to 3 decimals, no float noise. */
export function formatRate(rate) {
    if (typeof rate !== 'number' || !Number.isFinite(rate)) return '-';
    let s = (rate * 100).toFixed(3);
    if (s.endsWith('0')) s = s.slice(0, -1);
    return `${s}%`;
}

/** Signed whole-dollar difference: "+$1,234", "−$1,234", "$0". */
export function formatSignedCurrency(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
    if (Math.abs(value) < 0.5) return formatCurrency(0);
    return `${value > 0 ? '+' : '−'}${formatCurrency(Math.abs(value))}`;
}

/** Signed difference of two rates, in percentage points. */
export function formatPoints(diff, digits = 2) {
    if (typeof diff !== 'number' || !Number.isFinite(diff)) return '-';
    const p = diff * 100;
    if (Math.abs(p) < 0.005) return `0.${'0'.repeat(digits)} pts`;
    return `${p > 0 ? '+' : '−'}${Math.abs(p).toFixed(digits)} pts`;
}

const PENSION_DEDUCTION_LABELS = {
    cppEnhanced: 'Enhanced CPP contributions (first additional)',
    qppEnhanced: 'Enhanced QPP contributions (first additional)',
    cpp2: 'CPP2 contributions (second additional)',
    qpp2: 'QPP2 contributions (second additional)'
};

// ----------------------------------------------------------------------
// Source links (UI-3). Everything here reads the `sources` arrays of the
// data modules; no URL is typed into the page except EXTRA_VERIFY_LINKS.
// ----------------------------------------------------------------------

/** Hosts that are not government or statute pages; labelled "secondary". */
const SECONDARY_HOSTS = [
    ['kpmg.com', 'KPMG'], ['ey.com', 'EY'], ['rcgt.com', 'RCGT'],
    ['transcanadawealthmanagement.com', 'TransCanada Wealth'], ['usherbrooke.ca', 'U Sherbrooke']
];

const HOST_LABELS = [
    ['revenuquebec.ca', 'Revenu Québec'], ['cdn-contenu.quebec.ca', 'Québec Finance'], ['quebec.ca', 'Québec Finance'],
    ['finances.gouv.qc.ca', 'Québec Finance'], ['rqap.gouv.qc.ca', 'RQAP'], ['retraitequebec.gouv.qc.ca', 'Retraite Québec'],
    ['legisquebec.gouv.qc.ca', 'Québec statute'], ['gov.bc.ca', 'BC gov'], ['alberta.ca', 'Alberta gov'],
    ['saskatchewan.ca', 'SK gov'], ['manitoba.ca', 'MB gov'], ['gov.mb.ca', 'MB gov'], ['ontario.ca', 'ON gov'],
    ['gnb.ca', 'NB gov'], ['novascotia.ca', 'NS gov'], ['princeedwardisland.ca', 'PEI gov'],
    ['assembly.nl.ca', 'NL statute'], ['gov.nl.ca', 'NL gov'], ['gov.nu.ca', 'NU gov'],
    ['fin.gov.nt.ca', 'NT gov'], ['gov.nt.ca', 'NT gov'], ['yukon.ca', 'Yukon gov']
];

function parseUrl(url) {
    try {
        const u = new URL(url);
        return (u.protocol === 'https:' || u.protocol === 'http:') ? u : null;
    } catch { return null; }
}

function hostMatches(host, suffix) {
    return host === suffix || host.endsWith(`.${suffix}`);
}

/** {safe, label, official, title} for one data `sources` entry; safe is null for a bad URL. */
export function describeSource(src) {
    const u = parseUrl(src.url);
    const title = src.title || String(src.url || '');
    if (!u) return { safe: null, label: title, official: false, title };
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    const sec = SECONDARY_HOSTS.find(([h]) => hostMatches(host, h));
    if (sec) return { safe: u.href, label: sec[1], official: false, title };
    let label;
    if (hostMatches(host, 'canada.ca')) {
        const ed = path.includes('t4127-jan') ? ' Jan' : path.includes('t4127-jul') ? ' Jul' : '';
        if (path.includes('t4127')) label = `CRA T4127${ed}${path.endsWith('.csv') ? ' table' : ''}`;
        else if (path.includes('t4032')) label = 'CRA T4032';
        else if (/\/td1[a-z]{0,2}-/.test(path) || path.includes('/pbg/td1')) label = 'CRA TD1';
        else if (path.includes('/pbg/')) label = 'CRA provincial form';
        else if (path.includes('tax-rates-brackets')) label = 'CRA rates';
        else if (path.includes('adjustment-personal-income')) label = 'CRA indexation';
        else if (path.includes('gst-hst')) label = 'CRA GST/HST';
        else if (path.includes('cpp')) label = 'CRA CPP';
        else if (path.includes('employment-insurance') || path.includes('/ei/') || path.includes('ei-premium')) label = 'CRA EI';
        else label = 'CRA';
    } else {
        const m = HOST_LABELS.find(([h]) => hostMatches(host, h));
        label = m ? m[1] : host.replace(/^www2?\./, '');
    }
    return { safe: u.href, label, official: true, title };
}

/** Sources of a data module whose `fields` start with any prefix (deduplicated by URL; official first). */
export function pickSources(jData, prefixes) {
    const all = (jData && Array.isArray(jData.sources)) ? jData.sources : [];
    const seen = new Set();
    const picked = [];
    all.forEach(src => {
        if (!Array.isArray(src.fields)) return;
        if (!src.fields.some(f => prefixes.some(p => String(f) === p || String(f).startsWith(p)))) return;
        const d = describeSource(src);
        const key = d.safe || d.label;
        if (seen.has(key)) return;
        seen.add(key);
        picked.push(d);
    });
    return picked.sort((a, b) => Number(b.official) - Number(a.official));
}

function linkElement(d, text) {
    const a = document.createElement('a');
    a.href = d.safe;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = d.official ? 'src-link' : 'src-link src-secondary';
    a.textContent = text || (d.official ? d.label : `${d.label} (secondary)`);
    a.title = `${d.official ? 'Official source' : 'Secondary source, not an official page'}: ${d.title}`;
    return a;
}

/**
 * A compact "Source:" span of links for the fields under `prefixes`.
 * Returns null when no source covers them. At most `max` links; official
 * ones come first, and a secondary link is labelled "(secondary)".
 */
export function sourceLinks(jData, prefixes, max = 3) {
    const picked = pickSources(jData, prefixes).filter(d => d.safe).slice(0, max);
    if (picked.length === 0) return null;
    const span = document.createElement('span');
    span.className = 'src-links';
    span.append('Source: ');
    picked.forEach((d, i) => {
        if (i > 0) span.append(', ');
        span.appendChild(linkElement(d));
    });
    return span;
}

/** Same links merged from several (data module, prefixes) pairs. */
export function sourceLinksFrom(pairs, max = 3) {
    const seen = new Set();
    const picked = [];
    pairs.forEach(([jData, prefixes]) => pickSources(jData, prefixes).forEach(d => {
        const key = d.safe || d.label;
        if (d.safe && !seen.has(key)) { seen.add(key); picked.push(d); }
    }));
    picked.sort((a, b) => Number(b.official) - Number(a.official));
    if (picked.length === 0) return null;
    const span = document.createElement('span');
    span.className = 'src-links';
    span.append('Source: ');
    picked.slice(0, max).forEach((d, i) => {
        if (i > 0) span.append(', ');
        span.appendChild(linkElement(d));
    });
    return span;
}

/**
 * Extra official landing pages for the Verify section (notes/legal.md, section 4),
 * keyed by data code. Where the data holds no government page for a
 * jurisdiction, these are the province's own finance pages. Some of these
 * sites refuse automated requests but open in a browser.
 */
const EXTRA_VERIFY_LINKS = {
    fed: [
        ['CRA: tax rates, current and previous years', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html'],
        ['CRA: payroll deductions formulas (T4127)', 'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas.html'],
        ['CRA: TD1 personal tax credits returns', 'https://www.canada.ca/en/revenue-agency/services/forms-publications/td1-personal-tax-credits-returns.html']
    ],
    payroll: [
        ['Service Canada: Canada Pension Plan', 'https://www.canada.ca/en/services/benefits/publicpensions/cpp.html'],
        ['Service Canada: Employment Insurance', 'https://www.canada.ca/en/services/benefits/ei.html']
    ],
    qc: [
        ['Revenu Québec', 'https://www.revenuquebec.ca/en/'],
        ['Ministère des Finances du Québec', 'https://www.finances.gouv.qc.ca/en/'],
        ['Retraite Québec (QPP)', 'https://www.retraitequebec.gouv.qc.ca/en/'],
        ['QPIP contribution rates', 'https://www.rqap.gouv.qc.ca/en/employers/contribution-rates']
    ],
    on: [['Ontario: taxes and benefits', 'https://www.ontario.ca/page/taxes-and-benefits']],
    nb: [['New Brunswick Finance: taxes', 'https://www2.gnb.ca/content/gnb/en/departments/finance/taxes.html']],
    ns: [['Nova Scotia Finance: taxation', 'https://www.novascotia.ca/finance/en/home/taxation/default.aspx']],
    pe: [['Prince Edward Island: taxes', 'https://www.princeedwardisland.ca/en/topic/taxes']],
    nt: [['Northwest Territories Finance: taxation', 'https://www.fin.gov.nt.ca/en/services/taxation']],
    yt: [['Government of Yukon (home page; the personal income tax page moved)', 'https://yukon.ca/en']],
    nu: [['Nunavut Finance', 'https://www.gov.nu.ca/en/finance']]
};

/** A short link text from a data source title: the part before the first colon, capped. */
function shortTitle(title) {
    const parts = String(title || '').split(/\s\(|:/).map(x => x.trim()).filter(Boolean);
    // "CRA: income tax rates ..." has a short first part; keep the second too.
    let t = parts[0] || '';
    if (t.length < 14 && parts[1]) t = `${t}: ${parts[1]}`;
    return t.length > 70 ? `${t.slice(0, 67)}...` : t;
}

export class DisplayManager {
    constructor() {
        this.elements = this.initializeElements();
        this.provinceRows = [];
        this.provinceData = {};
        this.provinceMarks = {};
        this.sort = { key: 'takeHome', dir: -1 };
        this.bindSortHeaders();
    }

    /**
     * One literal lookup per id so a grep of js/ lists every id this module
     * needs (docs/learnings/test-methodology-and-coverage.md, structural checks).
     */
    initializeElements() {
        const elements = {
            'app-error': document.getElementById('app-error'),
            'math-switch': document.getElementById('math-switch'),
            'out-a-label': document.getElementById('out-a-label'),
            'out-b-label': document.getElementById('out-b-label'),
            'out-a-take-home': document.getElementById('out-a-take-home'),
            'out-b-take-home': document.getElementById('out-b-take-home'),
            'out-a-take-home-month': document.getElementById('out-a-take-home-month'),
            'out-b-take-home-month': document.getElementById('out-b-take-home-month'),
            'out-b-headline': document.getElementById('out-b-headline'),
            'out-diff-headline': document.getElementById('out-diff-headline'),
            'out-diff-take-home': document.getElementById('out-diff-take-home'),
            'out-diff-take-home-month': document.getElementById('out-diff-take-home-month'),
            'out-diff-sentence': document.getElementById('out-diff-sentence'),
            'out-bars': document.getElementById('out-bars'),
            'out-legend-provincial': document.getElementById('out-legend-provincial'),
            'out-th-a': document.getElementById('out-th-a'),
            'out-th-b': document.getElementById('out-th-b'),
            'out-th-diff': document.getElementById('out-th-diff'),
            'out-table-body': document.getElementById('out-table-body'),
            'provinces-title': document.getElementById('provinces-title'),
            'provinces-table': document.getElementById('provinces-table'),
            'provinces-table-body': document.getElementById('provinces-table-body'),
            'sales-tax-body': document.getElementById('sales-tax-body'),
            'verify-list': document.getElementById('verify-list'),
            'footer-as-of': document.getElementById('footer-as-of'),
            'payroll-math-title': document.getElementById('payroll-math-title'),
            'payroll-flags': document.getElementById('payroll-flags'),
            'payroll-steps': document.getElementById('payroll-steps'),
            'payroll-total': document.getElementById('payroll-total'),
            'payroll-marginal-rate': document.getElementById('payroll-marginal-rate'),
            'payroll-sources': document.getElementById('payroll-sources'),
            'fed-math-title': document.getElementById('fed-math-title'),
            'fed-flags': document.getElementById('fed-flags'),
            'fed-steps': document.getElementById('fed-steps'),
            'fed-deductions-table': document.getElementById('fed-deductions-table'),
            'fed-deductions-total': document.getElementById('fed-deductions-total'),
            'fed-bracket-table': document.getElementById('fed-bracket-table'),
            'fed-bracket-total-income': document.getElementById('fed-bracket-total-income'),
            'fed-bracket-total-tax': document.getElementById('fed-bracket-total-tax'),
            'fed-credits-table': document.getElementById('fed-credits-table'),
            'fed-credits-total': document.getElementById('fed-credits-total'),
            'fed-extras': document.getElementById('fed-extras'),
            'fed-net-tax': document.getElementById('fed-net-tax'),
            'fed-marginal-rate': document.getElementById('fed-marginal-rate'),
            'fed-sources': document.getElementById('fed-sources'),
            'prov-math-title': document.getElementById('prov-math-title'),
            'prov-flags': document.getElementById('prov-flags'),
            'prov-steps': document.getElementById('prov-steps'),
            'prov-deductions-table': document.getElementById('prov-deductions-table'),
            'prov-deductions-total': document.getElementById('prov-deductions-total'),
            'prov-bracket-table': document.getElementById('prov-bracket-table'),
            'prov-bracket-total-income': document.getElementById('prov-bracket-total-income'),
            'prov-bracket-total-tax': document.getElementById('prov-bracket-total-tax'),
            'prov-credits-table': document.getElementById('prov-credits-table'),
            'prov-credits-total': document.getElementById('prov-credits-total'),
            'prov-extras': document.getElementById('prov-extras'),
            'prov-net-tax': document.getElementById('prov-net-tax'),
            'prov-marginal-rate': document.getElementById('prov-marginal-rate'),
            'prov-sources': document.getElementById('prov-sources')
        };
        Object.entries(elements).forEach(([id, e]) => {
            if (!e) console.warn(`DisplayManager: missing #${id}`);
        });
        return elements;
    }

    el(id) {
        return this.elements[id] || null;
    }

    setText(id, text) {
        const e = this.el(id);
        if (e) e.textContent = text;
    }

    setHidden(id, hidden) {
        const e = this.el(id);
        if (e) e.classList.toggle('hidden', hidden);
    }

    // Kept for callers that used the old method names.
    formatCurrency(value) { return formatCurrency(value); }
    formatPercentage(rate) { return formatPercent(rate); }

    // ------------------------------------------------------------------
    // Errors
    // ------------------------------------------------------------------

    showError(message) {
        this.setText('app-error', message);
        this.setHidden('app-error', false);
    }

    clearError() {
        this.setText('app-error', '');
        this.setHidden('app-error', true);
    }

    // ------------------------------------------------------------------
    // Entry point
    // ------------------------------------------------------------------

    /**
     * @param {object} s
     * @param {object} s.ra - calculate() for Scenario A
     * @param {object|null} s.rb - calculate() for Scenario B, null when not comparing
     * @param {object} s.dataA - {prov} data module for A's province
     * @param {object|null} s.dataB - {prov} data module for B's province
     * @param {object[]} s.rows - compareAll() at A's salary and deductions
     * @param {object} s.salesData - {code: data module} for the sales-tax table
     * @param {'a'|'b'} s.mathScenario - which scenario the math tabs explain
     * @param {{fed: object, prov: object, payroll: object}} s.mathData - data modules for that scenario
     */
    updateAll({ ra, rb, dataA, dataB, rows, salesData, mathScenario, mathData }) {
        this.clearError();
        this.updateOutput(ra, rb, dataA, dataB);
        this.updateProvinces(rows, ra, rb, salesData);
        const mr = mathScenario === 'b' && rb ? rb : ra;
        const tag = rb ? `Scenario ${mathScenario === 'b' && rb ? 'B' : 'A'}: ` : '';
        this.updateJurisdictionMath('fed', mr.federal, mr, mathData.fed, mathData, tag);
        this.updateJurisdictionMath('prov', mr.provincial, mr, mathData.prov, mathData, tag);
        this.updatePayrollMath(mr, mathData.payroll, tag);
        this.renderVerify(rows, salesData, mathData);
    }

    /** Show the A/B switch only on the math tabs, and only when comparing. */
    setMathSwitchVisible(visible) {
        this.setHidden('math-switch', !visible);
    }

    // ------------------------------------------------------------------
    // Output tab
    // ------------------------------------------------------------------

    scenarioLabel(letter, r) {
        return `${letter}: ${r.input.provinceName}, ${formatCurrency(r.input.employmentIncome)}`;
    }

    updateOutput(ra, rb, dataA, dataB) {
        const comparing = Boolean(rb);

        // Headline
        this.setText('out-a-label', this.scenarioLabel('A', ra));
        this.setText('out-a-take-home', formatCurrency(ra.totals.takeHome));
        this.setText('out-a-take-home-month', formatCurrency(ra.totals.takeHome / 12));
        this.setHidden('out-b-headline', !comparing);
        this.setHidden('out-diff-headline', !comparing);
        if (comparing) {
            const diff = rb.totals.takeHome - ra.totals.takeHome;
            this.setText('out-b-label', this.scenarioLabel('B', rb));
            this.setText('out-b-take-home', formatCurrency(rb.totals.takeHome));
            this.setText('out-b-take-home-month', formatCurrency(rb.totals.takeHome / 12));
            this.setText('out-diff-take-home', formatSignedCurrency(diff));
            this.setText('out-diff-take-home-month', formatSignedCurrency(diff / 12));
            const e = this.el('out-diff-take-home');
            if (e) {
                e.classList.toggle('diff-positive', diff >= 0.5);
                e.classList.toggle('diff-negative', diff <= -0.5);
            }
            let sentence;
            if (Math.abs(diff) < 0.5) {
                sentence = 'Both scenarios leave you the same take-home pay.';
            } else {
                const better = diff > 0 ? 'B' : 'A';
                sentence = `Scenario ${better} leaves you ${formatCurrency(Math.abs(diff))} more a year `
                    + `(${formatCurrency(Math.abs(diff) / 12)} a month) after income tax and payroll contributions.`;
            }
            this.setText('out-diff-sentence', sentence);
        } else {
            this.setText('out-diff-sentence',
                `You keep ${formatPercent(ra.input.employmentIncome > 0 ? ra.totals.takeHome / ra.input.employmentIncome : 1, 1)} `
                + 'of your salary. Turn on Scenario B in Setup to compare another salary or province.');
        }

        // Bars
        const bars = this.el('out-bars');
        if (bars) {
            bars.replaceChildren(this.barRow('A', ra), ...(comparing ? [this.barRow('B', rb)] : []));
        }
        const provNames = comparing && rb.input.province !== ra.input.province
            ? `${ra.input.provinceName} / ${rb.input.provinceName} tax`
            : `${ra.input.provinceName} tax`;
        this.setText('out-legend-provincial', provNames);

        // Table
        this.setText('out-th-a', this.scenarioLabel('A', ra));
        this.setText('out-th-b', comparing ? this.scenarioLabel('B', rb) : 'B');
        this.setHidden('out-th-b', !comparing);
        this.setHidden('out-th-diff', !comparing);
        this.renderCompareTable(ra, rb, dataA, dataB);
    }

    barRow(letter, r) {
        const income = r.input.employmentIncome;
        const share = v => (income > 0 ? Math.max(0, v / income) : 0);
        const parts = [
            ['bar-take-home', 'Take-home', income > 0 ? share(r.totals.takeHome) : 1],
            ['bar-federal', 'Federal tax', share(r.federal.net)],
            ['bar-provincial', `${r.input.provinceName} tax`, share(r.provincial.net)],
            ['bar-payroll', 'Payroll contributions', share(r.payroll.total)]
        ];
        const row = document.createElement('div');
        row.className = 'bar-row';
        const label = document.createElement('div');
        label.className = 'bar-row-label';
        label.textContent = this.scenarioLabel(letter, r);
        const container = document.createElement('div');
        container.className = 'tax-bar-container';
        parts.forEach(([cls, title, s]) => {
            const seg = document.createElement('div');
            seg.className = `tax-bar ${cls}`;
            seg.style.width = `${s * 100}%`;
            seg.title = `${title}: ${formatPercent(s, 1)}`;
            seg.textContent = s >= 0.09 ? `${(s * 100).toFixed(0)}%` : '';
            container.appendChild(seg);
        });
        row.append(label, container);
        return row;
    }

    /**
     * Side-by-side table. Each row: [label, valueA, valueB, kind]. kind sets
     * formatting: 'money' (difference signed), 'rate' (difference in points),
     * 'heading' (section row). Optional rows (surtax, reductions, abatement,
     * health premium, QPIP) appear only when non-zero in A or B.
     */
    renderCompareTable(ra, rb, dataA, dataB) {
        const comparing = Boolean(rb);
        const fedData = dataA && dataA.fed;
        const payrollData = dataA && dataA.payroll;
        // Provincial source links: A's province, and B's when it differs.
        const provSrc = prefixes => () => {
            const pairs = [[dataA && dataA.prov, prefixes]];
            if (comparing && dataB && dataB.prov && dataB.prov !== (dataA && dataA.prov)) pairs.push([dataB.prov, prefixes]);
            return sourceLinksFrom(pairs, 4);
        };
        const rows = [];
        const both = f => [f(ra), comparing ? f(rb) : null];
        const nonZero = ([a, b]) => Math.abs(a || 0) >= 0.5 || Math.abs(b || 0) >= 0.5;
        const money = (label, f, opts = {}) => {
            const v = both(f);
            if (opts.optional && !nonZero(v)) return;
            rows.push({ label, a: v[0], b: v[1], kind: 'money', ...opts });
        };
        const rate = (label, f) => {
            const v = both(f);
            rows.push({ label, a: v[0], b: v[1], kind: 'rate' });
        };
        const heading = label => rows.push({ label, kind: 'heading' });

        heading('Income');
        money('Employment income', r => r.input.employmentIncome);
        money('Other deductions (e.g. RRSP)', r => r.input.otherDeductions, { optional: true });

        heading('Federal tax');
        const fedSrc = () => sourceLinks(fedData, ['brackets', 'credits']);
        // "after credits" repeats "Federal tax" when nothing else is applied (no Quebec abatement).
        const fedSame = [ra, rb].filter(Boolean).every(r => Math.abs(r.federal.afterCredits - r.federal.net) < 0.005);
        if (!fedSame) money('Federal tax after credits', r => r.federal.afterCredits, { src: fedSrc });
        money('Quebec abatement', r => -r.federal.abatement, { optional: true, src: () => sourceLinks(fedData, ['abatement']) });
        money('Federal tax', r => r.federal.net, { strong: true, cls: 'row-federal', src: fedSrc });

        heading('Provincial or territorial tax');
        money('Provincial tax after credits', r => r.provincial.afterCredits, { src: provSrc(['brackets', 'credits']) });
        money('Surtax', r => r.provincial.surtax, { optional: true, src: provSrc(['surtax']) });
        const reductionNames = [...new Set([ra, rb].filter(Boolean).flatMap(r => r.provincial.reductions.map(x => x.name)))];
        reductionNames.forEach(name => {
            money(name, r => {
                const x = r.provincial.reductions.find(y => y.name === name);
                return x ? -x.amount : 0;
            }, { optional: true, src: provSrc(['lowIncomeReduction', 'taxReduction']) });
        });
        const premiumNames = [...new Set([ra, rb].filter(Boolean).map(r => r.provincial.healthPremiumName).filter(Boolean))];
        if (premiumNames.length) {
            money(premiumNames.join(' / '), r => r.provincial.healthPremium, { optional: true, src: provSrc(['healthPremium']) });
        }
        money('Provincial tax (incl. the lines above)', r => r.provincial.net, { strong: true, cls: 'row-provincial', src: provSrc(['brackets', 'credits']) });

        heading('Payroll contributions');
        const planLabel = comparing && ra.payroll.plan !== rb.payroll.plan ? 'CPP / QPP' : ra.payroll.plan;
        money(`${planLabel} contributions`, r => (r.payroll.plan === 'QPP' ? r.payroll.qpp : r.payroll.cpp), { src: () => sourceLinks(payrollData, ['cpp', 'qpp'], 2) });
        money(`${planLabel === 'CPP / QPP' ? 'CPP2 / QPP2' : `${planLabel}2`} contributions`,
            r => (r.payroll.plan === 'QPP' ? r.payroll.qpp2 : r.payroll.cpp2), { optional: true, src: () => sourceLinks(payrollData, ['cpp2', 'qpp2'], 2) });
        money('EI premiums', r => r.payroll.ei, { src: () => sourceLinks(payrollData, ['ei'], 2) });
        money('QPIP premiums (Quebec)', r => r.payroll.qpip, { optional: true, src: () => sourceLinks(payrollData, ['qpip'], 2) });
        money('Total payroll', r => r.payroll.total, { strong: true, cls: 'row-payroll' });

        heading('Bottom line');
        money('Income tax + payroll', r => r.totals.totalDeductions, { strong: true });
        money('Take-home pay (year)', r => r.totals.takeHome, { strong: true, cls: 'row-take-home', better: 'higher' });
        money('Take-home pay (month)', r => r.totals.takeHome / 12, { better: 'higher' });
        rate('Effective rate (tax + payroll)', r => r.totals.effectiveRate);
        rate('Effective rate (income tax only)', r => r.totals.effectiveIncomeTaxRate);
        rate('Marginal rate (income tax)', r => r.totals.marginalRateIncomeTax);
        rate('Marginal rate (tax + payroll)', r => r.totals.marginalRateIncludingPayroll);

        const tbody = this.el('out-table-body');
        if (!tbody) return;
        tbody.replaceChildren(...rows.map(row => {
            const tr = document.createElement('tr');
            if (row.kind === 'heading') {
                tr.className = 'section-row';
                const th = document.createElement('th');
                th.scope = 'rowgroup';
                th.colSpan = comparing ? 4 : 2;
                th.textContent = row.label;
                tr.appendChild(th);
                return tr;
            }
            if (row.strong) tr.classList.add('strong-row');
            if (row.cls) tr.classList.add(row.cls);
            const fmt = row.kind === 'rate' ? v => formatPercent(v) : v => (v <= -0.5 ? formatSignedCurrency(v) : formatCurrency(v));
            const cells = [row.label, fmt(row.a)];
            if (comparing) {
                cells.push(fmt(row.b));
                const d = row.b - row.a;
                cells.push(row.kind === 'rate' ? formatPoints(d) : formatSignedCurrency(d));
            }
            cells.forEach((text, i) => {
                const td = document.createElement(i === 0 ? 'th' : 'td');
                if (i === 0) td.scope = 'row';
                td.textContent = text;
                if (i === 0 && row.src) {
                    const link = row.src();
                    if (link) td.appendChild(link);
                }
                if (i === 3 && row.better === 'higher') {
                    const d = row.b - row.a;
                    td.classList.toggle('diff-positive', d >= 0.5);
                    td.classList.toggle('diff-negative', d <= -0.5);
                }
                tr.appendChild(td);
            });
            return tr;
        }));
    }

    // ------------------------------------------------------------------
    // All provinces tab
    // ------------------------------------------------------------------

    bindSortHeaders() {
        const table = this.el('provinces-table');
        if (!table) return;
        table.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-sort]');
            if (!button) return;
            const key = button.dataset.sort;
            if (this.sort.key === key) {
                this.sort.dir = -this.sort.dir;
            } else {
                this.sort = { key, dir: key === 'name' ? 1 : -1 };
            }
            this.renderProvinceRows();
        });
    }

    updateProvinces(rows, ra, rb, salesData) {
        this.provinceRows = rows;
        this.provinceData = salesData || {};
        this.provinceMarks = { [ra.input.province]: ['A'] };
        if (rb) {
            (this.provinceMarks[rb.input.province] ||= []).push('B');
        }
        const ded = ra.input.otherDeductions > 0 ? ` with ${formatCurrency(ra.input.otherDeductions)} of deductions` : '';
        this.setText('provinces-title',
            `All 13 provinces and territories at ${formatCurrency(ra.input.employmentIncome)}${ded} (Scenario A), ${ra.input.year}`);
        this.renderProvinceRows();
        this.renderSalesTax(rows, salesData);
    }

    renderProvinceRows() {
        const tbody = this.el('provinces-table-body');
        if (!tbody) return;
        const { key, dir } = this.sort;
        const sorted = [...this.provinceRows].sort((x, y) => {
            const a = x[key];
            const b = y[key];
            const c = typeof a === 'string' ? a.localeCompare(b) : a - b;
            return c * dir;
        });
        tbody.replaceChildren(...sorted.map(r => {
            const tr = document.createElement('tr');
            const marks = this.provinceMarks[r.province];
            if (marks) tr.className = 'active-bracket';
            const name = marks ? `${r.name} (${marks.join(', ')})` : r.name;
            [name, formatCurrency(r.incomeTax), formatCurrency(r.payroll), formatCurrency(r.takeHome),
                formatPercent(r.effectiveRate), formatPercent(r.marginalRate)].forEach((text, i) => {
                const td = document.createElement(i === 0 ? 'th' : 'td');
                if (i === 0) td.scope = 'row';
                td.textContent = text;
                if (i === 0 && this.provinceData[r.province]) {
                    const link = sourceLinks(this.provinceData[r.province], ['brackets'], 2);
                    if (link) td.appendChild(link);
                }
                tr.appendChild(td);
            });
            return tr;
        }));
        const table = this.el('provinces-table');
        if (table) {
            table.querySelectorAll('thead th').forEach(th => {
                const b = th.querySelector('button[data-sort]');
                if (b && b.dataset.sort === key) {
                    th.setAttribute('aria-sort', dir > 0 ? 'ascending' : 'descending');
                } else {
                    th.removeAttribute('aria-sort');
                }
            });
        }
    }

    renderSalesTax(rows, salesData) {
        const tbody = this.el('sales-tax-body');
        if (!tbody) return;
        tbody.replaceChildren(...rows.map(r => {
            const st = r.salesTax;
            const tr = document.createElement('tr');
            const mod = salesData && salesData[r.province];
            const pct = v => (typeof v === 'number' && v > 0 ? formatRate(v) : '-');
            let cells;
            if (!st) {
                cells = [r.name, '-', '-', '-', '-', { text: 'No sales-tax data', title: '' }];
            } else {
                const provincial = (st.qst || 0) > 0 ? `QST ${formatRate(st.qst)}` : pct(st.pst);
                const combined = (st.hst || 0) > 0 ? st.hst : (st.gst || 0) + (st.pst || 0) + (st.qst || 0);
                const src = mod && Array.isArray(mod.sources)
                    ? mod.sources.find(s => Array.isArray(s.fields) && s.fields.some(f => String(f).startsWith('salesTax')))
                    : null;
                const basis = (st.hst || 0) > 0 ? 'HST'
                    : (st.qst || 0) > 0 ? 'GST + QST'
                        : (st.pst || 0) > 0 ? 'GST + PST' : 'GST only';
                const asOf = src && src.retrieved ? `, as of ${src.retrieved}` : '';
                cells = [r.name, (st.hst || 0) > 0 ? 'in HST' : pct(st.gst), provincial, pct(st.hst),
                    formatRate(combined), { text: `${basis}${asOf}`, title: st.note || '' }];
            }
            cells.forEach((text, i) => {
                const td = document.createElement(i === 0 ? 'th' : 'td');
                if (i === 0) td.scope = 'row';
                if (i === 5) {
                    // Short label + as-of; the full data note is the tooltip.
                    // UI-3 adds the per-row source link after the label (span.source-slot).
                    td.className = 'note-cell';
                    td.textContent = text.text;
                    if (text.title) td.title = text.title;
                    const slot = document.createElement('span');
                    slot.className = 'source-slot';
                    const link = mod ? sourceLinks(mod, ['salesTax'], 2) : null;
                    if (link) slot.appendChild(link);
                    td.appendChild(slot);
                } else {
                    td.textContent = text;
                }
                tr.appendChild(td);
            });
            return tr;
        }));
    }

    // ------------------------------------------------------------------
    // Federal / provincial tax-math tabs
    // ------------------------------------------------------------------

    /**
     * @param {'fed'|'prov'} prefix
     * @param {object} j - JurisdictionResult
     * @param {object} r - full result
     * @param {object} jData - the jurisdiction's data module
     * @param {object} data - all data modules ({fed, prov, payroll})
     */
    updateJurisdictionMath(prefix, j, r, jData, data, tag = '') {
        const isFed = prefix === 'fed';
        const year = r.input.year;
        const taxLabel = isFed ? 'Federal tax' : `${j.name} tax`;

        this.setText(`${prefix}-math-title`, isFed
            ? `${tag}Federal tax math, ${year}`
            : `${tag}${j.name} tax math, ${year}`);

        this.renderFlags(`${prefix}-flags`, jData, j.name);
        this.renderSources(`${prefix}-sources`, jData);

        // Deductions from income
        const d = r.deductionsFromIncome;
        const dedRows = Object.keys(PENSION_DEDUCTION_LABELS)
            .filter(k => k in d)
            .map(k => [PENSION_DEDUCTION_LABELS[k], d[k], sourceLinks(data.payroll, [k.replace(/Enhanced$/, '')])]);
        dedRows.push(['Other deductions (e.g. RRSP)', d.other, null]);
        if (!isFed && r.input.province === 'qc') {
            dedRows.push(['Deduction for workers (Quebec return only)', d.qcWorkerDeduction, sourceLinks(jData, ['special'])]);
        }
        const dedTotal = isFed ? d.federalTotal : d.provincialTotal;
        this.fillTable(`${prefix}-deductions-table`, dedRows.map(([label, v, link]) => [[label, link], formatCurrency(v)]));
        this.setText(`${prefix}-deductions-total`, formatCurrency(dedTotal));

        // Brackets
        let activeIndex = -1;
        j.brackets.forEach((b, i) => { if (b.taxableInBracket > 0) activeIndex = i; });
        this.fillTable(`${prefix}-bracket-table`, j.brackets.map(b => [
            formatCurrency(b.from),
            Number.isFinite(b.to) ? formatCurrency(b.to) : 'and up',
            [formatRate(b.rate), sourceLinks(jData, ['brackets'])],
            formatCurrency(b.taxableInBracket),
            formatCurrency(b.tax)
        ]), activeIndex);
        this.setText(`${prefix}-bracket-total-income`, formatCurrency(j.taxableIncome));
        this.setText(`${prefix}-bracket-total-tax`, formatCurrency(j.bracketTax));

        // Credits
        this.fillTable(`${prefix}-credits-table`, j.creditsDetail.map(c => [
            [c.name, this.creditSource(c.name, jData, data)],
            formatCurrency(c.amount), formatRate(c.rate), formatCurrency(c.credit)
        ]));
        this.setText(`${prefix}-credits-total`, formatCurrency(j.creditsTotal));

        // Steps
        const steps = [];
        steps.push(this.step(
            { label: 'Employment income', value: formatCurrency(r.input.employmentIncome), cls: 'calc-gross-income' },
            '−',
            { label: 'Deductions from income', value: formatCurrency(dedTotal), cls: 'calc-adjustments' },
            { label: 'Net income', value: formatCurrency(j.netIncome), cls: 'calc-result' }
        ));
        const topRate = activeIndex >= 0 ? formatRate(j.brackets[activeIndex].rate) : formatRate(j.brackets[0].rate);
        steps.push(this.step(
            { label: 'Taxable income', value: formatCurrency(j.taxableIncome), cls: 'calc-result' },
            '×',
            { label: 'Brackets (top rate reached)', value: topRate, cls: 'calc-tax-rate' },
            { label: 'Tax on brackets', value: formatCurrency(j.bracketTax), cls: 'calc-pre-credit-tax' },
            'Each slice of income is taxed at its own bracket rate; see the bracket table below.'
        ));

        // Optional steps, in the engine's order of operations (notes/engine.md).
        // A step whose amount rounds to $0 is left out (no "-$0" rows).
        const shows = v => Math.abs(v) >= 0.5;
        const optional = [];
        if (jData && jData.surtax && shows(j.surtax)) {
            optional.push({ op: '+', label: 'Surtax', value: j.surtax, after: j.afterSurtax });
        }
        const applied = j.reductions.filter(x => shows(x.amount));
        if (applied.length > 0) {
            const label = applied.length === 1 ? applied[0].name : 'Tax reductions';
            optional.push({ op: '−', label, value: j.reductionsTotal, after: j.afterSurtax - j.reductionsTotal });
        }
        if (isFed && r.input.province === 'qc' && shows(j.abatement)) {
            const abRate = data.fed && data.fed.abatement ? ` (${formatRate(data.fed.abatement.quebec)})` : '';
            optional.push({ op: '−', label: `Quebec abatement${abRate}`, value: j.abatement,
                after: j.afterSurtax - j.reductionsTotal - j.abatement });
        }
        if (j.healthPremiumName && shows(j.healthPremium)) {
            optional.push({ op: '+', label: j.healthPremiumName, value: j.healthPremium, after: j.net });
        }

        const creditsBox = { label: `Credits at ${formatRate(j.creditRate)}`, value: formatCurrency(j.creditsTotal), cls: 'calc-credits' };
        const afterCreditsLabel = optional.length ? 'Tax after credits' : taxLabel;
        const afterCreditsValue = optional.length ? j.afterCredits : j.net;
        steps.push(this.step(
            { label: 'Tax on brackets', value: formatCurrency(j.bracketTax), cls: 'calc-pre-credit-tax' },
            '−',
            creditsBox,
            { label: afterCreditsLabel, value: formatCurrency(afterCreditsValue), cls: optional.length ? 'calc-result' : 'calc-total-tax' },
            j.bracketTax < j.creditsTotal ? 'Credits can only bring tax down to $0; they are not refundable.' : ''
        ));

        let prevLabel = 'Tax after credits';
        let prevValue = j.afterCredits;
        optional.forEach((o, i) => {
            const last = i === optional.length - 1;
            const after = last ? j.net : o.after;
            const afterLabel = last ? taxLabel : `After ${o.label.toLowerCase()}`;
            steps.push(this.step(
                { label: prevLabel, value: formatCurrency(prevValue), cls: 'calc-result' },
                o.op,
                { label: o.label, value: formatCurrency(o.value), cls: o.op === '+' ? 'calc-pre-credit-tax' : 'calc-credits' },
                { label: afterLabel, value: formatCurrency(after), cls: last ? 'calc-total-tax' : 'calc-result' }
            ));
            prevLabel = afterLabel;
            prevValue = after;
        });

        const stepsEl = this.el(`${prefix}-steps`);
        if (stepsEl) stepsEl.replaceChildren(...steps);

        this.renderExtras(`${prefix}-extras`, j, jData, r, isFed, data);

        this.setText(`${prefix}-net-tax`, formatCurrency(j.net));
        this.setText(`${prefix}-marginal-rate`, formatPercent(j.marginalRate));
    }

    /** Source link for one credit row: payroll credits cite the payroll module, the rest the jurisdiction. */
    creditSource(name, jData, data) {
        const m = name.match(/\b(CPP|QPP|EI|QPIP)\b/);
        if (m) return sourceLinks(data.payroll, [m[1].toLowerCase()]);
        return sourceLinks(jData, ['credits']);
    }

    /** Surtax tiers, reductions and health premium tables, only where the jurisdiction has them. */
    renderExtras(id, j, jData, r, isFed, data) {
        const host = this.el(id);
        if (!host) return;
        const blocks = [];

        if (jData && jData.surtax && Array.isArray(jData.surtax.tiers)) {
            blocks.push(this.tableBlock(
                `${j.name} surtax`,
                ['Tax after credits above', 'Surtax rate'],
                jData.surtax.tiers.map(t => [formatCurrency(t.threshold), [formatRate(t.rate), sourceLinks(jData, ['surtax'])]]),
                ['Surtax', formatCurrency(j.surtax)],
                'Each tier applies to the part of tax after credits above its threshold; the tiers add up.'
            ));
        }

        const reductionRows = j.reductions.filter(x => Math.abs(x.potential) >= 0.5 || Math.abs(x.amount) >= 0.5);
        if (reductionRows.length > 0) {
            blocks.push(this.tableBlock(
                'Tax reductions',
                ['Reduction', 'Before cap', 'Applied'],
                reductionRows.map(x => [[x.name, sourceLinks(jData, ['lowIncomeReduction', 'taxReduction'])], formatCurrency(x.potential), formatCurrency(x.amount)]),
                ['Total applied', '', formatCurrency(j.reductionsTotal)],
                'Reductions together cannot exceed the tax left after credits and surtax.'
            ));
        }

        if (isFed && r.input.province === 'qc' && data.fed && data.fed.abatement) {
            blocks.push(this.tableBlock(
                'Quebec abatement',
                ['Abatement rate', 'Abatement'],
                [[[formatRate(data.fed.abatement.quebec), sourceLinks(data.fed, ['abatement'])], formatCurrency(j.abatement)]],
                null,
                'Quebec residents get this refundable reduction of federal tax because Quebec runs some programs the federal government funds elsewhere.'
            ));
        }

        if (j.healthPremiumName && jData && jData.healthPremium && Array.isArray(jData.healthPremium.tiers)) {
            blocks.push(this.tableBlock(
                j.healthPremiumName,
                ['Taxable income from', 'To', 'Premium'],
                jData.healthPremium.tiers.map(t => [
                    [formatCurrency(t.from), sourceLinks(jData, ['healthPremium'])],
                    t.to === null || !Number.isFinite(t.to) ? 'and up' : formatCurrency(t.to),
                    t.rate > 0
                        ? `${formatCurrency(t.base)} + ${formatRate(t.rate)} over ${formatCurrency(t.from)}, max ${formatCurrency(t.max)}`
                        : formatCurrency(t.base)
                ]),
                [`Your premium (taxable income ${formatCurrency(j.taxableIncome)})`, '', formatCurrency(j.healthPremium)],
                'Added after credits and reductions; credits do not reduce it.'
            ));
        }

        host.replaceChildren(...blocks);
    }

    // ------------------------------------------------------------------
    // Payroll tab
    // ------------------------------------------------------------------

    updatePayrollMath(r, pData, tag = '') {
        const p = r.payroll;
        const det = p.detail;
        const isQpp = p.plan === 'QPP';
        const pk = isQpp ? 'qpp' : 'cpp';
        const p2k = isQpp ? 'qpp2' : 'cpp2';
        const eik = det.ei.quebecRate ? 'eiQuebec' : 'ei';
        const pd = pData || {};
        const pension = pd[pk] || {};
        const pension2 = pd[p2k] || {};
        const ei = pd[eik] || {};
        const qpip = pd.qpip || {};

        this.setText('payroll-math-title', `${tag}Payroll math, ${r.input.year}: ${p.plan} plan`);
        this.renderFlags('payroll-flags', pData, 'payroll');
        this.renderSources('payroll-sources', pData);

        const steps = [];
        steps.push(this.step(
            { label: 'Pensionable earnings', value: formatCurrency(det.pension.pensionableEarnings), cls: 'calc-gross-income' },
            '×',
            { label: `${p.plan} rate`, value: formatRate(det.pension.rate), cls: 'calc-tax-rate' },
            { label: `${p.plan} contributions`, value: formatCurrency(det.pension.total), cls: 'calc-total-tax' },
            `Salary up to the maximum pensionable earnings (${formatCurrency(pension.ympe)}) minus the `
            + `${formatCurrency(pension.basicExemption)} basic exemption; maximum ${formatCurrency(pension.maxContribution)}. `
            + `Base ${formatRate(det.pension.baseRate)} = ${formatCurrency(det.pension.base)} (claimed as a credit); `
            + `enhanced ${formatRate(det.pension.enhancedRate)} = ${formatCurrency(det.pension.enhanced)} (deducted from income).`,
            sourceLinks(pd, [pk])
        ));
        steps.push(this.step(
            { label: 'Earnings between the two ceilings', value: formatCurrency(det.pension2.earnings), cls: 'calc-gross-income' },
            '×',
            { label: `${p.plan}2 rate`, value: formatRate(det.pension2.rate), cls: 'calc-tax-rate' },
            { label: `${p.plan}2 contributions`, value: formatCurrency(det.pension2.total), cls: 'calc-total-tax' },
            `Salary between ${formatCurrency(pension.ympe)} and ${formatCurrency(pension2.yampe)}; `
            + `maximum ${formatCurrency(pension2.max)}. Deducted from income.`,
            sourceLinks(pd, [p2k])
        ));
        steps.push(this.step(
            { label: 'Insurable earnings', value: formatCurrency(det.ei.insurableEarnings), cls: 'calc-gross-income' },
            '×',
            { label: det.ei.quebecRate ? 'EI rate (Quebec)' : 'EI rate', value: formatRate(det.ei.rate), cls: 'calc-tax-rate' },
            { label: 'EI premiums', value: formatCurrency(det.ei.total), cls: 'calc-total-tax' },
            `Salary up to the maximum insurable earnings (${formatCurrency(ei.mie)}); maximum ${formatCurrency(ei.max)}.`
            + (det.ei.quebecRate ? ' Quebec has a lower EI rate because QPIP pays parental benefits instead.' : ''),
            sourceLinks(pd, [eik])
        ));
        if (isQpp) {
            const insurable = Math.min(r.input.employmentIncome, qpip.mie);
            steps.push(this.step(
                { label: 'QPIP insurable earnings', value: formatCurrency(insurable), cls: 'calc-gross-income' },
                '×',
                { label: 'QPIP rate', value: formatRate(det.qpip.rate), cls: 'calc-tax-rate' },
                { label: 'QPIP premiums', value: formatCurrency(det.qpip.total), cls: 'calc-total-tax' },
                `Quebec Parental Insurance Plan: salary up to ${formatCurrency(qpip.mie)}; maximum ${formatCurrency(qpip.max)}.`,
                sourceLinks(pd, ['qpip'])
            ));
        } else {
            const note = document.createElement('p');
            note.className = 'note-text';
            note.textContent = 'QPIP (Quebec Parental Insurance Plan) applies to Quebec residents only: $0 here.';
            steps.push(note);
        }

        const host = this.el('payroll-steps');
        if (host) host.replaceChildren(...steps);

        this.setText('payroll-total', formatCurrency(p.total));
        this.setText('payroll-marginal-rate', formatPercent(p.marginalRate));
    }

    // ------------------------------------------------------------------
    // Shared builders
    // ------------------------------------------------------------------

    /** One calc-step row: [a] op [b] = [c], with an optional note below. */
    step(a, op, b, c, note = '', src = null) {
        const wrap = document.createElement('div');
        wrap.className = 'calc-step';
        const row = document.createElement('div');
        row.className = 'calc-step-mobile';
        row.append(this.box(a), this.operator(op), this.box(b), this.operator('='), this.box(c));
        wrap.appendChild(row);
        if (note || src) {
            const p = document.createElement('p');
            p.className = 'calc-step-note';
            p.textContent = note;
            if (src) p.append(' ', src);
            wrap.appendChild(p);
        }
        return wrap;
    }

    box({ label, value, cls }) {
        const box = document.createElement('div');
        box.className = `calc-box ${cls || ''}`.trim();
        const l = document.createElement('div');
        l.className = 'calc-box-label';
        l.textContent = label;
        const v = document.createElement('div');
        v.className = 'calc-box-value';
        v.textContent = value;
        box.append(l, v);
        return box;
    }

    operator(symbol) {
        const o = document.createElement('div');
        o.className = 'calc-operator';
        o.textContent = symbol;
        return o;
    }

    /** Replace a tbody's rows. activeIndex highlights one row. */
    fillTable(tbodyId, rows, activeIndex = -1) {
        const tbody = this.el(tbodyId);
        if (!tbody) return;
        tbody.replaceChildren(...rows.map((cells, i) => {
            const tr = document.createElement('tr');
            if (i === activeIndex) tr.className = 'active-bracket';
            cells.forEach(cell => {
                const td = document.createElement('td');
                if (Array.isArray(cell)) {
                    td.textContent = cell[0];
                    if (cell[1]) td.appendChild(cell[1]);
                } else {
                    td.textContent = cell;
                }
                tr.appendChild(td);
            });
            return tr;
        }));
    }

    /** A titled bracket-table card with an optional total row and note. */
    tableBlock(title, headers, rows, totalRow, note) {
        const container = document.createElement('div');
        container.className = 'bracket-table-container';
        const h = document.createElement('h3');
        h.textContent = title;
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        const table = document.createElement('table');
        table.className = 'bracket-table';
        const thead = document.createElement('thead');
        const htr = document.createElement('tr');
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            htr.appendChild(th);
        });
        thead.appendChild(htr);
        const tbody = document.createElement('tbody');
        rows.forEach(cells => {
            const tr = document.createElement('tr');
            cells.forEach(cell => {
                const td = document.createElement('td');
                if (Array.isArray(cell)) {
                    td.textContent = cell[0];
                    if (cell[1]) td.appendChild(cell[1]);
                } else {
                    td.textContent = cell;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.append(thead, tbody);
        if (totalRow) {
            const tfoot = document.createElement('tfoot');
            const tr = document.createElement('tr');
            tr.className = 'total-row';
            totalRow.forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
            tfoot.appendChild(tr);
            table.appendChild(tfoot);
        }
        wrapper.appendChild(table);
        container.append(h, wrapper);
        if (note) {
            const p = document.createElement('p');
            p.className = 'calc-step-note table-note';
            p.textContent = note;
            container.appendChild(p);
        }
        return container;
    }

    /** PROVISIONAL / UNVERIFIED flags from a data module; hidden when there are none. */
    renderFlags(id, jData, name) {
        const host = this.el(id);
        if (!host) return;
        const flags = (jData && Array.isArray(jData.flags)) ? jData.flags : [];
        if (flags.length === 0) {
            host.replaceChildren();
            host.classList.add('hidden');
            return;
        }
        const title = document.createElement('p');
        title.className = 'flag-title';
        title.textContent = `Not yet confirmed: ${flags.length} ${name} value${flags.length === 1 ? ' is' : 's are'} `
            + 'provisional, unverified, or differ between official sources (CONFLICT). The calculation uses the values shown; open each item for details.';
        const items = flags.map(f => {
            const d = document.createElement('details');
            d.className = 'flag-item';
            const s = document.createElement('summary');
            const badge = document.createElement('span');
            badge.className = `flag-badge flag-${String(f.status).toLowerCase()}`;
            badge.textContent = f.status;
            const field = document.createElement('code');
            field.textContent = f.field;
            s.append(badge, ' ', field);
            const note = document.createElement('p');
            note.textContent = f.note || '';
            d.append(s, note);
            return d;
        });
        host.replaceChildren(title, ...items);
        host.classList.remove('hidden');
    }

    /** Full source list from a data module (http/https only): title, official or secondary, fields covered. */
    renderSources(id, jData) {
        const host = this.el(id);
        if (!host) return;
        const sources = (jData && Array.isArray(jData.sources)) ? jData.sources : [];
        host.replaceChildren(...sources.map(src => {
            const li = document.createElement('li');
            const d = describeSource(src);
            if (d.safe) {
                li.appendChild(linkElement(d, src.title || d.safe));
                const kind = document.createElement('span');
                kind.className = d.official ? 'src-kind' : 'src-kind src-secondary-tag';
                kind.textContent = d.official ? 'official' : 'secondary, not an official page';
                li.append(' ', kind);
            } else {
                li.append(src.title || String(src.url || ''));
            }
            if (Array.isArray(src.fields) && src.fields.length) li.append(` Covers: ${src.fields.join(', ')}.`);
            if (src.retrieved) li.append(` (retrieved ${src.retrieved})`);
            return li;
        }));
    }

    /** Newest `retrieved` date across the data modules shown, e.g. "2026-10-27". */
    latestRetrieved(modules) {
        let latest = '';
        modules.forEach(m => (m && Array.isArray(m.sources) ? m.sources : []).forEach(s => {
            if (typeof s.retrieved === 'string' && s.retrieved > latest) latest = s.retrieved;
        }));
        return latest;
    }

    /**
     * "Verify these numbers": per jurisdiction, the official pages the data
     * cites (deduplicated), then a few extra official landing pages, then any
     * secondary sources in a separate, labelled line. Also fills the footer as-of date.
     */
    renderVerify(rows, salesData, mathData) {
        const groups = [
            { code: 'fed', name: 'Federal (CRA)', mod: mathData.fed },
            { code: 'payroll', name: 'CPP, QPP, EI and QPIP', mod: mathData.payroll },
            ...rows.map(r => ({ code: r.province, name: r.name, mod: salesData && salesData[r.province] }))
        ];
        const asOf = this.latestRetrieved(groups.map(g => g.mod));
        this.setText('footer-as-of', asOf || 'the date of the last data check');

        const host = this.el('verify-list');
        if (!host) return;
        host.replaceChildren(...groups.map(g => {
            const card = document.createElement('div');
            card.className = 'verify-item';
            const h = document.createElement('h4');
            h.textContent = g.name;
            const ul = document.createElement('ul');
            ul.className = 'verify-links';
            const sources = (g.mod && Array.isArray(g.mod.sources)) ? g.mod.sources : [];
            const seen = new Set();
            const official = [];
            const secondary = [];
            sources.forEach(src => {
                const d = describeSource(src);
                if (!d.safe || seen.has(d.safe)) return;
                seen.add(d.safe);
                (d.official ? official : secondary).push(d);
            });
            official.forEach(d => {
                const li = document.createElement('li');
                li.appendChild(linkElement(d, shortTitle(d.title) || d.label));
                ul.appendChild(li);
            });
            (EXTRA_VERIFY_LINKS[g.code] || []).forEach(([text, url]) => {
                const u = parseUrl(url);
                if (!u || seen.has(u.href)) return;
                seen.add(u.href);
                const li = document.createElement('li');
                li.appendChild(linkElement({ safe: u.href, official: true, label: text, title: text }, text));
                ul.appendChild(li);
            });
            card.append(h, ul);
            if (secondary.length) {
                const p = document.createElement('p');
                p.className = 'verify-secondary';
                p.append('Cross-checks, not official pages: ');
                secondary.forEach((d, i) => {
                    if (i > 0) p.append(', ');
                    p.appendChild(linkElement(d, d.label));
                });
                card.appendChild(p);
            }
            return card;
        }));
    }
}
