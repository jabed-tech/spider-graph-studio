/** Largest score shown as a number; anything above it displays as ∞. */
export const MAX_FINITE = 99999
/** Stored value for "infinite". A plain number, so project files stay valid JSON. */
export const INFINITE = 1_000_000

/** The over-the-top slider runs 0..SLIDER_TOP; its top notch is ∞, one below is MAX_FINITE. */
export const SLIDER_TOP = 1000
/** Share of the track given to the normal min..max scale, so everyday edits stay precise. */
const LINEAR_END = 700

export interface ValueScale { min: number; max: number; step: number }

export const isInfinite = (v: number) => v > MAX_FINITE

export function formatValue(v: number): string {
  if (isInfinite(v)) return '∞'
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

/** Parse what someone typed into a score box: a number, "∞" or "inf(inity)". */
export function parseValue(text: string): number | null {
  const t = text.trim().toLowerCase()
  if (!t) return null
  if (t === '∞' || t === 'inf' || t === 'infinity') return INFINITE
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

const snap = (v: number, step: number) => Math.round(v / step) * step

/** Slider notch → score. Linear over min..max, then exponential up to MAX_FINITE, then ∞. */
export function fromSlider(pos: number, { min, max, step }: ValueScale): number {
  if (pos >= SLIDER_TOP) return INFINITE
  if (pos <= LINEAR_END) return snap(min + ((max - min) * pos) / LINEAR_END, step)
  if (pos >= SLIDER_TOP - 1 || max >= MAX_FINITE) return MAX_FINITE
  const base = max - min
  const t = (pos - LINEAR_END) / (SLIDER_TOP - 1 - LINEAR_END)
  const v = min + base * ((MAX_FINITE - min) / base) ** t
  return Math.min(MAX_FINITE, Math.round(v))
}

/** Score → nearest slider notch (inverse of fromSlider). */
export function toSlider(v: number, { min, max }: ValueScale): number {
  if (isInfinite(v)) return SLIDER_TOP
  if (v <= min) return 0
  if (v <= max) return Math.round((LINEAR_END * (v - min)) / (max - min))
  if (v >= MAX_FINITE || max >= MAX_FINITE) return SLIDER_TOP - 1
  const base = max - min
  const t = Math.log((v - min) / base) / Math.log((MAX_FINITE - min) / base)
  return Math.min(SLIDER_TOP - 2, Math.round(LINEAR_END + t * (SLIDER_TOP - 1 - LINEAR_END)))
}

/** Font for the ∞ glyph: not every design font has it, and a PDF can't fall back to another font. */
export const INFINITY_FONT_ID = 'inter-bold'
