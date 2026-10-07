import { describe, it, expect } from 'vitest'
import { serializeProject, parseProject } from '../src/state/projectFile'
import { defaultProject } from '../src/state/presets'

describe('project file', () => {
  it('round-trips a project', () => {
    const p = defaultProject()
    p.design.image = { src: 'data:image/png;base64,AAAA', focusX: 0.3, focusY: 0.6, zoom: 1.2 }
    expect(parseProject(serializeProject(p))).toEqual(p)
  })
  it('rejects text that is not JSON', () => {
    expect(() => parseProject('nope')).toThrow(/isn't a valid project file/)
  })
  it('rejects JSON with the wrong shape', () => {
    expect(() => parseProject('{"version":1,"chart":{}}')).toThrow(/isn't a valid project file/)
  })
  it('rejects fewer than 3 axes', () => {
    const p = defaultProject()
    p.chart.axes = p.chart.axes.slice(0, 2)
    expect(() => parseProject(serializeProject(p))).toThrow()
  })
})

describe('older project files', () => {
  it('get per-text colours and fonts that match how they used to look', () => {
    const p = defaultProject()
    const legacy = JSON.parse(serializeProject(p))
    for (const k of ['titleColor', 'subtitleColor', 'labelColor', 'footerColor', 'subtitleFont', 'footerFont']) delete legacy.design[k]
    legacy.design.ink = '#111111'
    legacy.design.accent = '#FF0000'
    legacy.design.bodyFont = 'anton'
    const d = parseProject(JSON.stringify(legacy)).design
    expect([d.titleColor, d.subtitleColor, d.labelColor, d.footerColor]).toEqual(['#111111', '#FF0000', '#111111', '#111111'])
    expect([d.subtitleFont, d.footerFont]).toEqual(['anton', 'anton'])
  })
})
