export interface Pt { x: number; y: number }

export interface RadarFrame {
  cx: number
  cy: number
  radius: number
  min: number
  max: number
  /** Upper bound on the normalised value; 1 keeps every point inside the outer ring. */
  cap?: number
}

/** Angle of axis i out of n, starting at 12 o'clock and running clockwise. */
export function angleFor(i: number, n: number): number {
  return -Math.PI / 2 + (i * 2 * Math.PI) / n
}

export function polar(cx: number, cy: number, r: number, angle: number): Pt {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

/** Map a value onto 0..1 within [min, max], clamped to [0, cap]. A cap above 1 lets values overshoot the ring. */
export function normalize(value: number, min: number, max: number, cap = 1): number {
  if (max <= min) return 0
  return Math.min(cap, Math.max(0, (value - min) / (max - min)))
}

export function radarPoints(values: number[], f: RadarFrame): Pt[] {
  return values.map((v, i) => polar(f.cx, f.cy, f.radius * normalize(v, f.min, f.max, f.cap), angleFor(i, values.length)))
}

export function ringPoints(n: number, r: number, cx: number, cy: number): Pt[] {
  return Array.from({ length: n }, (_, i) => polar(cx, cy, r, angleFor(i, n)))
}

export type Anchor = 'start' | 'middle' | 'end'
export type Baseline = 'top' | 'middle' | 'bottom'

/** Text alignment for a label sitting just outside the chart at `angle`. */
export function labelAnchor(angle: number): { anchor: Anchor; baseline: Baseline } {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const anchor: Anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end'
  const baseline: Baseline = s < -0.5 ? 'bottom' : s > 0.5 ? 'top' : 'middle'
  return { anchor, baseline }
}

const r2 = (n: number) => Math.round(n * 100) / 100

export function toPath(pts: Pt[]): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${r2(p.x)} ${r2(p.y)}`).join('') + 'Z'
}

export interface Box { x: number; y: number; w: number; h: number }

/** Distance from (cx, cy) along `angle` to the edge of `b` shrunk by `inset` on every side. */
export function rayToBounds(cx: number, cy: number, angle: number, b: Box, inset: number): number {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  let t = Infinity
  if (dx > 1e-9) t = Math.min(t, (b.x + b.w - inset - cx) / dx)
  if (dx < -1e-9) t = Math.min(t, (b.x + inset - cx) / dx)
  if (dy > 1e-9) t = Math.min(t, (b.y + b.h - inset - cy) / dy)
  if (dy < -1e-9) t = Math.min(t, (b.y + inset - cy) / dy)
  return Math.max(0, t)
}

/** A comic "POW" starburst: `spikes` outer points alternating with inner ones. */
export function starburst(cx: number, cy: number, outer: number, inner: number, spikes = 12): Pt[] {
  return Array.from({ length: spikes * 2 }, (_, i) =>
    polar(cx, cy, i % 2 ? inner : outer, -Math.PI / 2 + (i * Math.PI) / spikes),
  )
}
