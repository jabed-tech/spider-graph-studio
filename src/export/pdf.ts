import type { ChartStyle, DesignStyle } from '../state/types'
import { designFonts, fontBase64 } from './fonts'
import { inlineImages } from '../images/previewUrl'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * svg2pdf mispositions an <image> inside a <pattern>, so for the PDF each picture shape
 * (filled with an image pattern on screen) becomes a clipPath of that shape around the image.
 */
function imagePatternsToClips(root: SVGSVGElement) {
  root.querySelectorAll<SVGElement>('[fill^="url(#"]').forEach((shape, i) => {
    const id = shape.getAttribute('fill')!.slice(5, -1)
    const image = root.querySelector(`pattern[id="${id}"] > image`)
    if (!image) return
    const clip = document.createElementNS(SVG_NS, 'clipPath')
    clip.id = `${id}-pdfclip${i}`
    const outline = shape.cloneNode() as SVGElement
    outline.removeAttribute('fill')
    clip.appendChild(outline)
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('clip-path', `url(#${clip.id})`)
    g.appendChild(image.cloneNode())
    shape.replaceWith(clip, g)
  })
}

/** Opacity at position t along piecewise-linear [offset, opacity] stops (0 before the first stop). */
export function fadeOpacity(stops: [number, number][], t: number): number {
  if (t <= stops[0][0]) return stops[0][1]
  for (let i = 1; i < stops.length; i++) {
    const [o1, a1] = stops[i]
    const [o0, a0] = stops[i - 1]
    if (t <= o1) return a0 + ((a1 - a0) * (t - o0)) / (o1 - o0 || 1)
  }
  return stops[stops.length - 1][1]
}

/**
 * svg2pdf can't apply masks, so a picture that fades out (data-fade) is drawn in full and then
 * covered by stacked copies of the background marked data-bg-layer.
 * - The solid/gradient fill: each copy runs from its start to the far edge (one edge per step, so
 *   no seams) with the opacity that brings the composite up to the target: 1 - (1 - T_i) / (1 - T_{i-1}).
 * - The texture: svg2pdf ignores group opacity on pattern fills, so stacked copies would darken it.
 *   One copy is drawn instead, starting where the fade passes halfway.
 */
function fadesToBackgroundLayers(root: SVGSVGElement, w: number, h: number) {
  const [fill, ...texture] = [...root.querySelectorAll<SVGElement>('[data-bg-layer]')]
  let n = 0
  root.querySelectorAll<SVGGElement>('g[data-fade]').forEach((group) => {
    const { axis, stops } = JSON.parse(group.dataset.fade!) as { axis: 'x' | 'y'; stops: [number, number][] }
    group.removeAttribute('mask')
    const len = axis === 'x' ? w : h
    const cover = document.createElementNS(SVG_NS, 'g')

    const addLayers = (layers: SVGElement[], steps: number, opacityFor: (target: number, prev: number) => number) => {
      if (!layers.length) return
      let prev = 0
      for (let i = 0; i < steps; i++) {
        const target = Math.min(0.999, fadeOpacity(stops, (i + 0.5) / steps))
        if (target <= prev + 1e-4) continue
        const a = opacityFor(target, prev)
        prev = target
        const start = (i / steps) * len
        const clip = document.createElementNS(SVG_NS, 'clipPath')
        clip.id = `pdf-fade-${n++}`
        const r = document.createElementNS(SVG_NS, 'rect')
        r.setAttribute(axis, String(start))
        r.setAttribute(axis === 'x' ? 'y' : 'x', '0')
        r.setAttribute(axis === 'x' ? 'width' : 'height', String(len - start))
        r.setAttribute(axis === 'x' ? 'height' : 'width', String(axis === 'x' ? h : w))
        clip.appendChild(r)
        const layer = document.createElementNS(SVG_NS, 'g')
        layer.setAttribute('clip-path', `url(#${clip.id})`)
        layer.setAttribute('opacity', a.toFixed(4))
        layers.forEach((bg) => layer.appendChild(bg.cloneNode(true)))
        cover.append(clip, layer)
      }
    }
    addLayers(fill ? [fill] : [], 160, (t, p) => 1 - (1 - t) / (1 - p))
    if (texture.length) {
      let half = 0
      while (half < 1 && fadeOpacity(stops, half) < 0.5) half += 0.005
      const start = half * len
      const clip = document.createElementNS(SVG_NS, 'clipPath')
      clip.id = `pdf-fade-${n++}`
      const r = document.createElementNS(SVG_NS, 'rect')
      r.setAttribute(axis, String(start))
      r.setAttribute(axis === 'x' ? 'y' : 'x', '0')
      r.setAttribute(axis === 'x' ? 'width' : 'height', String(len - start))
      r.setAttribute(axis === 'x' ? 'height' : 'width', String(axis === 'x' ? h : w))
      clip.appendChild(r)
      const layer = document.createElementNS(SVG_NS, 'g')
      layer.setAttribute('clip-path', `url(#${clip.id})`)
      texture.forEach((bg) => layer.appendChild(bg.cloneNode(true)))
      cover.append(clip, layer)
    }
    group.after(cover)
  })
}

/** Vector PDF of the design. jsPDF and svg2pdf are loaded only when someone exports a PDF. */
export async function exportPdf(svg: SVGSVGElement, design: DesignStyle, chart: ChartStyle): Promise<Blob> {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([import('jspdf'), import('svg2pdf.js')])
  const { w, h } = design.size
  const doc = new jsPDF({ unit: 'px', format: [w, h], orientation: w > h ? 'landscape' : 'portrait', hotfixes: ['px_scaling'], compress: true })

  for (const f of designFonts(design, chart)) {
    doc.addFileToVFS(f.file, await fontBase64(f))
    doc.addFont(f.file, f.family, 'normal')
  }

  // svg2pdf reads computed styles, so render from a clone attached (off-screen) to the document.
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden'
  const clone = svg.cloneNode(true) as SVGSVGElement
  inlineImages(clone)
  imagePatternsToClips(clone)
  fadesToBackgroundLayers(clone, w, h)
  host.appendChild(clone)
  document.body.appendChild(host)
  try {
    await svg2pdf(clone, doc, { x: 0, y: 0, width: w, height: h })
  } finally {
    host.remove()
  }
  return doc.output('blob')
}
