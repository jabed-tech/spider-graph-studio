import { describe, it, expect } from 'vitest'
import { angleFor, normalize, radarPoints, ringPoints, labelAnchor, toPath } from '../src/chart/geometry'

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6)

describe('angleFor', () => {
  it('starts at 12 o\'clock and goes clockwise', () => {
    close(angleFor(0, 4), -Math.PI / 2)
    close(angleFor(1, 4), 0)
    close(angleFor(2, 4), Math.PI / 2)
  })
})

describe('normalize', () => {
  it('maps into 0..1 and clamps', () => {
    expect(normalize(5, 0, 10)).toBe(0.5)
    expect(normalize(-3, 0, 10)).toBe(0)
    expect(normalize(30, 0, 10)).toBe(1)
    expect(normalize(60, 50, 100)).toBeCloseTo(0.2)
  })
  it('handles a zero-width scale', () => {
    expect(normalize(5, 5, 5)).toBe(0)
  })
})

describe('radarPoints', () => {
  it('places full values on the outer radius', () => {
    const pts = radarPoints([10, 10, 10, 10], { cx: 100, cy: 100, radius: 50, min: 0, max: 10 })
    close(pts[0].x, 100); close(pts[0].y, 50)
    close(pts[1].x, 150); close(pts[1].y, 100)
    close(pts[2].x, 100); close(pts[2].y, 150)
    close(pts[3].x, 50); close(pts[3].y, 100)
  })
  it('places min values at the centre', () => {
    const pts = radarPoints([0, 0, 0], { cx: 10, cy: 20, radius: 50, min: 0, max: 10 })
    pts.forEach((p) => { close(p.x, 10); close(p.y, 20) })
  })
})

describe('ringPoints', () => {
  it('returns n vertices at radius r', () => {
    const pts = ringPoints(6, 30, 0, 0)
    expect(pts).toHaveLength(6)
    pts.forEach((p) => close(Math.hypot(p.x, p.y), 30))
  })
})

describe('labelAnchor', () => {
  it('centres top/bottom labels and pushes side labels outward', () => {
    expect(labelAnchor(angleFor(0, 4)).anchor).toBe('middle')
    expect(labelAnchor(angleFor(1, 4)).anchor).toBe('start')
    expect(labelAnchor(angleFor(3, 4)).anchor).toBe('end')
    expect(labelAnchor(angleFor(0, 4)).baseline).toBe('bottom')
    expect(labelAnchor(angleFor(2, 4)).baseline).toBe('top')
  })
})

describe('toPath', () => {
  it('builds a closed path', () => {
    expect(toPath([{ x: 0, y: 0 }, { x: 1, y: 2 }])).toBe('M0 0L1 2Z')
  })
})

import { rayToBounds, starburst } from '../src/chart/geometry'

describe('overflow', () => {
  it('normalize lets values past max through up to the cap', () => {
    expect(normalize(100, 0, 20, 10)).toBe(5)
    expect(normalize(500, 0, 20, 10)).toBe(10)
    expect(normalize(-5, 0, 20, 10)).toBe(0)
  })
  it('radarPoints honours the cap', () => {
    const [p] = radarPoints([40, 0, 0], { cx: 0, cy: 0, radius: 10, min: 0, max: 20, cap: 10 })
    close(p.y, -20)
  })
})

describe('rayToBounds', () => {
  const b = { x: 0, y: 0, w: 100, h: 200 }
  it('measures to the rectangle edge, minus an inset', () => {
    close(rayToBounds(50, 100, -Math.PI / 2, b, 0), 100)
    close(rayToBounds(50, 100, 0, b, 10), 40)
  })
  it('handles diagonals by hitting the nearer edge', () => {
    close(rayToBounds(50, 100, -Math.PI / 4, b, 0), 50 * Math.SQRT2)
  })
})

describe('starburst', () => {
  it('alternates outer and inner points', () => {
    const pts = starburst(0, 0, 10, 6, 8)
    expect(pts).toHaveLength(16)
    close(Math.hypot(pts[0].x, pts[0].y), 10)
    close(Math.hypot(pts[1].x, pts[1].y), 6)
  })
})
