import { describe, it, expect } from 'vitest'
import { formatValue, fromSlider, toSlider, parseValue, INFINITE, SLIDER_TOP, MAX_FINITE } from '../src/chart/valueScale'

describe('formatValue', () => {
  it('shows ∞ above 99999 and keeps normal numbers tidy', () => {
    expect(formatValue(100000)).toBe('∞')
    expect(formatValue(INFINITE)).toBe('∞')
    expect(formatValue(99999)).toBe('99999')
    expect(formatValue(12.5)).toBe('12.5')
    expect(formatValue(7)).toBe('7')
  })
})

describe('slider mapping (overflow on)', () => {
  const s = { min: 0, max: 20, step: 0.5 }
  it('top notch is ∞ and one below is 99999', () => {
    expect(fromSlider(SLIDER_TOP, s)).toBe(INFINITE)
    expect(fromSlider(SLIDER_TOP - 1, s)).toBe(MAX_FINITE)
  })
  it('the normal scale keeps a linear stretch of the track', () => {
    expect(fromSlider(0, s)).toBe(0)
    expect(fromSlider(toSlider(20, s), s)).toBe(20)
    expect(fromSlider(toSlider(10, s), s)).toBe(10)
  })
  it('grows smoothly past max', () => {
    const a = fromSlider(toSlider(20, s) + 50, s)
    const b = fromSlider(toSlider(20, s) + 150, s)
    expect(a).toBeGreaterThan(20)
    expect(b).toBeGreaterThan(a)
    expect(b).toBeLessThan(MAX_FINITE)
  })
  it('round-trips values to the same notch', () => {
    expect(toSlider(INFINITE, s)).toBe(SLIDER_TOP)
    expect(toSlider(MAX_FINITE, s)).toBe(SLIDER_TOP - 1)
    expect(toSlider(-5, s)).toBe(0)
  })
})

describe('parseValue', () => {
  it('accepts numbers, ∞ and inf', () => {
    expect(parseValue('42')).toBe(42)
    expect(parseValue('∞')).toBe(INFINITE)
    expect(parseValue('Inf')).toBe(INFINITE)
    expect(parseValue('infinity')).toBe(INFINITE)
    expect(parseValue('')).toBeNull()
    expect(parseValue('abc')).toBeNull()
  })
})
