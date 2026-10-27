# Getting started

There is nothing to install. Serve the folder over HTTP:

```bash
python3 -m http.server 8000
```

| URL | What it is |
|---|---|
| `http://localhost:8000` | The calculator (`index.html`) |
| `http://localhost:8000/example.html` | A few Canadian scenarios run through the calculator module, one button each |

**It has to be HTTP.** Browsers block ES module imports from `file://`.
`index.html` still renders its markup, so the page looks fine, but no script
runs and every figure stays at zero. The console shows a CORS error.

Edit a file and refresh. No compile step happens in between.

There is no network dependency. The fonts are files in `fonts/`, loaded by the
`@font-face` rules in `styles.css`, and the page makes no third-party
requests. Serve the repo root, so `fonts/` sits next to `index.html`.

To check a calculation without a browser, use the Node check in
[testing.md](testing.md).

Next: [Architecture](architecture.md) for how the pieces connect, or
[Tax rules](tax-rules.md) to change the numbers.
