import { describe, it, expect } from 'vitest'
import { serializeSvg } from '../src/export/serializeSvg'
import { slug } from '../src/export/download'

describe('serializeSvg', () => {
  it('produces a standalone document with inlined fonts and images intact', () => {
    document.body.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="stage" viewBox="0 0 10 10" width="10" height="10">' +
      '<image href="blob:http://x/1" data-src="data:image/png;base64,AAAA" width="10" height="10"/><text font-family="sgs-bangers">Hi</text></svg>'
    const svg = document.querySelector('svg') as SVGSVGElement
    const out = serializeSvg(svg, "@font-face{font-family:'sgs-bangers';src:url(data:font/ttf;base64,QQ==)}")
    expect(out.startsWith('<?xml')).toBe(true)
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(out).toContain('data:font/ttf;base64,QQ==')
    expect(out).toContain('data:image/png;base64,AAAA')
    expect(out).not.toContain('blob:')
    expect(out).not.toContain('data-src')
    expect(out).not.toContain('class="stage"')
    // the live node is untouched
    expect(svg.querySelector('style')).toBeNull()
  })
})

describe('slug', () => {
  it('makes safe file names', () => {
    expect(slug('The Masked Marvel!')).toBe('the-masked-marvel')
    expect(slug('***')).toBe('spider-graph')
  })
})

import { fadeOpacity } from '../src/export/pdf'

describe('fadeOpacity', () => {
  const stops: [number, number][] = [[0.2, 0], [0.5, 0.9], [1, 1]]
  it('interpolates between stops and clamps at the ends', () => {
    expect(fadeOpacity(stops, 0)).toBe(0)
    expect(fadeOpacity(stops, 0.35)).toBeCloseTo(0.45)
    expect(fadeOpacity(stops, 0.75)).toBeCloseTo(0.95)
    expect(fadeOpacity(stops, 1.2)).toBe(1)
  })
})
