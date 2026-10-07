# Spider Graph Studio

Build a radar (spider) chart, turn it into a stat card with a picture, a name and your own colours, and download it as PNG, JPG, SVG or PDF. Everything runs in the browser, so it hosts as a static site on GitHub Pages.

## Develop

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # vitest
npm run build    # static site in dist/
```

## Deploy to GitHub Pages

1. Push this repo to GitHub with `main` as the default branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which tests, builds and publishes `dist/`.

`vite.config.ts` uses `base: './'`, so the site works at `https://<user>.github.io/<repo>/` with no extra configuration.

## How it works

- The whole design is one SVG, rendered by React at its true output size (`src/design/DesignCanvas.tsx`). The preview scales it down. Every export reads from that same SVG:
  - **SVG:** the node is serialised with its fonts and images inlined (`src/export/serializeSvg.ts`).
  - **PNG/JPG:** the standalone SVG is drawn onto a canvas at 1–4× (`src/export/raster.ts`).
  - **PDF:** vector output via jsPDF and svg2pdf, with fonts embedded (`src/export/pdf.ts`). These libraries load only when someone exports a PDF.
- Fonts are self-hosted TTFs in `public/fonts`, so exports embed the exact faces. Display fonts come from the upstream [google/fonts](https://github.com/google/fonts) repo. Inter, Space Grotesk and Playfair Display are static instances from the Google Fonts API, because the repo only ships them as variable fonts. The manga faces (Dela Gothic One, Rampart One, Reggae One, Potta One, Mochiy Pop One, Hachi Maru Pop) are subset with `pyftsubset` to Latin, kana and common symbols, so embedding them in exports stays light. All are licensed under SIL OFL or Apache 2.0.
- Work autosaves to IndexedDB. **Download → Save project file** writes a `.spider.json` (picture included) that can be opened again later.
- Pictures can be uploaded, dropped in, or linked by URL. A URL only works when the host allows cross-origin requests; otherwise the app explains how to upload the picture instead.

## Adding things

- **Chart template:** add an entry to `PRESETS` in `src/state/presets.ts`.
- **Colour palette:** add an entry to `PALETTES` in the same file.
- **Layout:** add a component in `src/design/layouts/`, register it in `LAYOUTS` (`src/design/DesignCanvas.tsx`), add an icon in `src/design/LayoutIcon.tsx`, and add its id to `LayoutId` and the schema in `src/state/projectFile.ts`.
- **Font:** drop a static TTF in `public/fonts` and register it in `FONTS` (`src/design/fonts.ts`).
