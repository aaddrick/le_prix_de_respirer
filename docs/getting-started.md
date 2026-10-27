# Getting started

There is nothing to install. Serve the folder over HTTP:

```bash
python3 -m http.server 8000
```

| URL | What it is |
|---|---|
| `http://localhost:8000` | The calculator (`index.html`) |
| `http://localhost:8000/example.html` | Each module used on its own, one button per example |

**It has to be HTTP.** Browsers block ES module imports from `file://`.
`index.html` still renders its markup, so the page looks fine, but no script
runs and every figure stays at zero. The console shows a CORS error.

Edit a file and refresh. No compile step happens in between.

The only network dependency is the Inter font from Google Fonts. Offline, the
page falls back to system fonts and still works.

Next: [Architecture](architecture.md) for how the pieces connect, or
[Tax rules](tax-rules.md) to change the numbers.
