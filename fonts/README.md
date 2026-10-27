# Fonts

Self-hosted so the page makes no third-party requests. `styles.css` loads them
with relative `@font-face` URLs (`fonts/<file>.woff2`). Both families are under
the SIL Open Font License 1.1, and neither declares a Reserved Font Name. Each
licence text sits beside the files. Monospace text uses the system stack
(`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`), so no monospace
font ships here (IBM Plex is left out: it carries a Reserved Font Name and the files would be subsets). Only the weights the page uses are shipped: Anton 400, Work
Sans 400 and 600.

The woff2 files are byte-identical copies of the ones in the author's site
(aaddrick.com, `public/fonts/`, "Broadside Night" design system), copied
2026-10-27. They are Latin subsets of 233 mapped characters each (counted with
fontTools). Accented letters such as é and the minus sign (U+2212) are
included. Arrows (← →) are not, so they fall back to a system font.

| File | Family, weight | Licence | sha256 |
|---|---|---|---|
| anton-400.woff2 | Anton 400 (v2.116) | OFL-Anton.txt | f9ad420bf51c2930fc2a49d44209d202cb18acb2d8b82853a01023e69eab6885 |
| work-sans-400.woff2 | Work Sans 400 (v2.012) | OFL-WorkSans.txt | 996d2f01acc82f075e4de4980849bc80c64fb3756054b5265977636a978728f4 |
| work-sans-600.woff2 | Work Sans 600 (v2.012) | OFL-WorkSans.txt | a10cc9ed2a0326e9c1c6f0bfeffb4e4545349611f620d8e355d4ee054700acdb |

## Licence texts

Fetched 2026-10-27 from the upstream repository:

| File | Source URL | sha256 |
|---|---|---|
| OFL-Anton.txt | https://raw.githubusercontent.com/google/fonts/main/ofl/anton/OFL.txt | ee67e6ee22790b7929f1a3769ca2801d565c64b5a9096942c1adf5596de9c9e4 |
| OFL-WorkSans.txt | https://raw.githubusercontent.com/google/fonts/main/ofl/worksans/OFL.txt | 749aca05078664ce682dce1b1b10096ac397cb088c1a6df4e1bb56f0092a9272 |
