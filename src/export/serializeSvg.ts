import { inlineImages } from '../images/previewUrl'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** A standalone SVG document string: the design node with images and @font-face rules inlined. */
export function serializeSvg(svg: SVGSVGElement, fontCss: string): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.removeAttribute('class')
  inlineImages(clone)
  clone.setAttribute('xmlns', SVG_NS)
  const style = document.createElementNS(SVG_NS, 'style')
  style.textContent = fontCss
  const defs = document.createElementNS(SVG_NS, 'defs')
  defs.appendChild(style)
  clone.insertBefore(defs, clone.firstChild)
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone)
}
