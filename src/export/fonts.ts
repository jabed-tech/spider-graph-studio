import { fontById, fontUrl, type FontDef } from '../design/fonts'
import type { ChartStyle, DesignStyle } from '../state/types'
import { INFINITY_FONT_ID, isInfinite } from '../chart/valueScale'

const cache = new Map<string, Promise<string>>()

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

/** The TTF for `f` as base64, fetched once per session. */
export function fontBase64(f: FontDef): Promise<string> {
  let p = cache.get(f.id)
  if (!p) {
    p = fetch(fontUrl(f)).then((r) => {
      if (!r.ok) throw new Error(`Couldn't load the ${f.label} font (${r.status}).`)
      return r.arrayBuffer()
    }).then(toBase64)
    p.catch(() => cache.delete(f.id))
    cache.set(f.id, p)
  }
  return p
}

/** Fonts an export must embed: every text style's face, plus the ∞ font wherever ∞ appears. */
export function designFonts(d: DesignStyle, c?: ChartStyle): FontDef[] {
  const ids = [d.titleFont, d.subtitleFont, d.bodyFont, d.footerFont]
  const infiniteStat = c?.overflow && c.axes.some((a) => isInfinite(a.value))
  if (infiniteStat || [d.title, d.subtitle, d.footer].some((t) => t.includes('∞'))) ids.push(INFINITY_FONT_ID)
  return [...new Map(ids.map((id) => [fontById(id).id, fontById(id)])).values()]
}

/** @font-face rules with the fonts inlined, so a downloaded SVG renders anywhere. */
export async function embeddedFontCss(d: DesignStyle, c?: ChartStyle): Promise<string> {
  const fonts = designFonts(d, c)
  const data = await Promise.all(fonts.map(fontBase64))
  return fonts
    .map((f, i) => `@font-face{font-family:'${f.family}';src:url(data:font/ttf;base64,${data[i]}) format('truetype');}`)
    .join('')
}
