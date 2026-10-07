# Spider Graph Studio: plan

## Context
`C:\Users\jabed\Claude\spider-graph` is empty, so this is a new project. The goal is a static web app, hosted on GitHub Pages, where anyone can:
1. Build a radar (spider) chart quickly, with custom axes and scales or a preset template.
2. Turn the chart into a designed graphic: a character picture, a name and subtitle, and their own colours and fonts, all within a layout template.
3. Download the result as **PNG, JPG, SVG or PDF** in social-media sizes.

Decisions already made with the user:
- **Stack:** Vite + React + TypeScript.
- **Data:** custom axes and stats plus preset templates. One subject per chart in v1.
- **Images:** upload a file or paste a URL. A URL that blocks CORS shows a warning and suggests uploading instead.
- **Saving:** autosave in the browser, plus `.json` project export and import.
- **Design step:** layout templates with tweaks. No free-form canvas.
- **Export:** social size presets, SVG and PDF. PNG and JPG are kept because the original request asked for them.

Constraints from GitHub Pages: no backend and no secrets. Everything runs in the browser, including fonts and image processing.

## Core architecture: one SVG drives everything
The whole design (background, image, text and chart) renders as **one React-built `<svg>`** at the true output size (e.g. 1080×1350). The preview scales it down with CSS. Each export reads from that same SVG:
- **SVG:** serialise the node. Inline the fonts as base64 `@font-face`, and turn images into data URLs so the file is self-contained.
- **PNG/JPG:** draw that self-contained SVG onto a `<canvas>` at 1×, 2× or 3× and call `toBlob`. PNG can have a transparent background.
- **PDF:** `jspdf` + `svg2pdf.js` produce a vector PDF at the design's aspect ratio. The curated fonts are registered with jsPDF as TTF files.

Why this approach: the preview always matches the exports, all formats come from a single source, and there's no DOM-screenshot library and none of its quirks. (The rejected alternatives were html-to-image and a Konva canvas.)

## Project structure
```
spider-graph/
  index.html, vite.config.ts (base: './'), package.json, tsconfig.json
  .github/workflows/deploy.yml        # build + actions/deploy-pages
  public/fonts/*.ttf                  # curated fonts (6–8), used by preview, SVG embed, PDF
  src/
    main.tsx, App.tsx                 # shell: header, left panel tabs, canvas stage
    state/
      types.ts                        # Project, Axis, ChartStyle, DesignStyle, Layout
      store.ts                        # zustand + persist (IndexedDB via idb-keyval) + zundo undo/redo
      presets.ts                      # axis templates
      projectFile.ts                  # export/import .json (zod-validated, images embedded)
    chart/
      geometry.ts                     # pure: polar points, ring polygons, label anchors
      RadarChart.tsx                  # SVG <g> radar: grid (polygon|circle), axes, area, points, labels
    design/
      layouts/{Split,Hero,TradingCard,Minimal,Poster}.tsx   # each: (project, size) => <svg> content
      DesignCanvas.tsx                # picks the layout, renders root <svg>, scale-to-fit stage
      sizes.ts                        # 1080², 1080×1350, 1080×1920, 1920×1080, custom
    export/
      fonts.ts                        # fetch TTF -> base64 (cached), @font-face css string
      serializeSvg.ts                 # clone node, inline fonts/images -> standalone SVG string
      raster.ts                       # svg -> canvas -> PNG/JPG blob at scale
      pdf.ts                          # lazy-import jspdf + svg2pdf, register fonts
      download.ts
    images/
      loadImage.ts                    # file/URL -> downscaled (max 2000px) data URL; CORS error surfacing
    panels/
      DataPanel.tsx                   # title, axes list (add/remove/drag-reorder/rename), value sliders+inputs, scale min/max, presets
      DesignPanel.tsx                 # layout picker (thumbnails), size, palette, fonts, text fields, image upload/URL, crop focus/zoom
      ExportPanel.tsx                 # format, scale, transparent bg, filename, download
    ui/                               # small shared controls (ColorField, Slider, Segmented, Tabs)
    styles/                           # CSS variables / theme
  tests/  (vitest)
```

## Data model (summary)
```ts
Project {
  version: 1
  chart: { axes: {id,label,value}[]; min; max; rings; gridShape:'polygon'|'circle';
           fill; fillOpacity; stroke; strokeWidth; showValues; showPoints }
  design: { layout: LayoutId; size:{w,h}; background:{type:'solid'|'gradient', colors};
            accent; textColor; title; subtitle; footer;
            titleFont; bodyFont; image?: {src: dataURL; focusX; focusY; zoom} }
}
```
Presets: Superhero power stats, RPG (STR/DEX/CON/INT/WIS/CHA), Football player, Big Five personality, Dev skills and Food/review. Choosing a preset swaps the axes but keeps the styling.

## UI and visual design
I'll use the **frontend-design** skill while building, plus the **dataviz** skill for the chart defaults. The app is a desktop-first editor: a slim header, a tabbed control panel on the left (Data / Design / Export) and a large centred stage on the right showing the scaled live design. On mobile the stage sits on top and the panels move into a bottom sheet. There will be a distinctive editorial / comic-friendly look rather than generic Tailwind defaults (set during implementation). Undo and redo use Ctrl+Z / Ctrl+Shift+Z. I'll ship sensible default palettes and let users change any colour.

## Edge cases
- **Image URL blocked by CORS:** show an inline message ("This site blocks embedding; download and upload it instead") and leave the design unchanged.
- **Large uploads:** downscale before storing. Storage is IndexedDB, not localStorage, so the 5 MB limit doesn't apply.
- **Imported project file is invalid:** zod validation, then a friendly error.
- **Axis count:** limited to 3–16. Values are clamped to min and max.
- **Long labels:** wrap or truncate in the chart's label layout.

## Execution steps
1. Write the spec to `docs/superpowers/specs/2026-10-07-spider-graph-studio-design.md` and run `git init`.
2. Scaffold Vite + React + TS. Add dependencies: zustand, zundo, idb-keyval, zod, jspdf, svg2pdf.js, @dnd-kit (axis reorder), vitest. Set up the deploy workflow.
3. Write `geometry.ts` and `RadarChart.tsx` test-first (TDD) on the geometry.
4. Build the store with persistence and undo, then `DataPanel` and presets.
5. Build the layouts, `DesignCanvas` and `DesignPanel`, including image loading and cropping.
6. Build the export pipeline: SVG, then raster, then PDF. Include the font embedding.
7. Add project file export and import.
8. Responsive polish, empty states, keyboard shortcuts.

## Verification
- `npm run test`: vitest covers the geometry, project serialise/parse round-trips and the standalone SVG output (fonts and images inlined).
- `npm run build && npm run preview`, then drive the app in Chrome with claude-in-chrome:
  - Pick a preset, edit the axes and upload an image.
  - Try each layout and size.
  - Export PNG, JPG, SVG and PDF, and check that each opens and matches the preview, fonts included.
  - Reload to confirm autosave. Do a JSON export and import round-trip.
  - Check the mobile viewport.
- Check the build works under a sub-path, since that's how GitHub Pages serves it (`base: './'`).

## As built (deviations from the plan)
- **Layout picker** uses wireframe icons (`src/design/LayoutIcon.tsx`) instead of live mini-renders. Re-rendering five full designs on every edit wasn't worth it.
- **Axis reorder** uses up/down buttons instead of drag and drop, so `@dnd-kit` was dropped.
- **No transparent-background PNG option.** Every layout paints a full background, so the option would have done nothing.
- **Picture crops** fill the shape with an image `<pattern>` instead of a clip-path. For the PDF, `pdf.ts` converts these back to clip-paths because svg2pdf mispositions images inside patterns. It also rebuilds the Hero fade as stacked layers, because jsPDF can't vary opacity along a gradient.
- **Chart size** is fitted by measuring the real label widths (`fitRadius` in `src/design/parts.tsx`) instead of using a fixed margin.
- **No size transition on the stage frame.** Animating it re-rasterised the full-size SVG every frame and stalled painting.

## Round 2 additions (2026-10-07)
- **Over-the-top scores** (`chart.overflow`, `chart.overflowBurst`). Scores have no cap.
  - Anything above 99,999 is stored as `INFINITE` and shown as ∞. The slider maps notches to values non-linearly (`src/chart/valueScale.ts`): the first 70% of the track is the normal scale, then it grows exponentially to 99,999, and the last notch is ∞.
  - A finite overflowing spike stops at the canvas edge. An ∞ spike runs off the page, and its POW bubble is stamped where it exits.
  - Spikes and bubbles render below all text: in every layout the chart is drawn after the picture and before the text, and chart labels are drawn above the bubbles.
  - Any ∞ is drawn in Inter Bold, which is embedded whenever ∞ appears, because PDFs can't fall back to another font for missing glyphs.
  - Spike sharpness was tried and reverted at the user's request. Spikes run straight from the neighbouring stats.
- **Stats reordering** uses @dnd-kit sortable: a grip handle, plus keyboard support.
- **Picture** can be moved directly on the stage (`src/design/usePictureDrag.ts`): drag to pan, wheel or pinch to zoom.
- **Dark mode** for the app UI. It follows the system setting until the header toggle sets an explicit choice, which is stored in localStorage and applied before first paint.
- **Fonts:** 21 more faces, including 6 manga fonts subset to Latin, kana and symbols. Fonts load on demand.
- **Per-text style:** the name, subtitle, stat labels and footer each have their own font and colour. `withTextDefaults` migrates older autosaves and project files so they keep their previous look.
- **Fixes:**
  - Toggle checkboxes are anchored inside their label, so focusing one no longer scrolls the panel.
  - The POW wobble animation was removed, because a continuous animation on the full-size SVG stalled painting.
