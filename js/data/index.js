/**
 * Data index: imports every jurisdiction module and the payroll module.
 * Numbers only live in the per-jurisdiction modules; js/taxCalculator.js owns
 * all arithmetic. DOM-free, importable in Node.
 */
import fed from './fed.js';
import payroll from './payroll.js';
import nl from './nl.js';
import pe from './pe.js';
import ns from './ns.js';
import nb from './nb.js';
import qc from './qc.js';
import on from './on.js';
import mb from './mb.js';
import sk from './sk.js';
import ab from './ab.js';
import bc from './bc.js';
import yt from './yt.js';
import nt from './nt.js';
import nu from './nu.js';

/** The 13 province/territory codes, west-to-east order is not implied; this is the display order. */
export const PROVINCE_CODES = ['nl', 'pe', 'ns', 'nb', 'qc', 'on', 'mb', 'sk', 'ab', 'bc', 'yt', 'nt', 'nu'];

export const provinces = { nl, pe, ns, nb, qc, on, mb, sk, ab, bc, yt, nt, nu };

export { fed, payroll };

export default { fed, payroll, provinces, provinceCodes: PROVINCE_CODES };
