import type { Axis, ChartStyle, DesignStyle, Project } from './types'

export const uid = () => Math.random().toString(36).slice(2, 9)

export interface Preset { id: string; name: string; min: number; max: number; axes: [string, number][] }

export const PRESETS: Preset[] = [
  { id: 'hero', name: 'Superhero power stats', min: 0, max: 100,
    axes: [['Intelligence', 88], ['Strength', 72], ['Speed', 64], ['Durability', 80], ['Power', 76], ['Combat', 94]] },
  { id: 'rpg', name: 'RPG character', min: 0, max: 20,
    axes: [['STR', 14], ['DEX', 17], ['CON', 12], ['INT', 10], ['WIS', 13], ['CHA', 16]] },
  { id: 'football', name: 'Football player', min: 0, max: 99,
    axes: [['Pace', 91], ['Shooting', 84], ['Passing', 78], ['Dribbling', 88], ['Defending', 41], ['Physical', 74]] },
  { id: 'bigfive', name: 'Big Five personality', min: 0, max: 10,
    axes: [['Openness', 8], ['Conscientiousness', 6], ['Extraversion', 4], ['Agreeableness', 7], ['Neuroticism', 3]] },
  { id: 'dev', name: 'Developer skills', min: 0, max: 5,
    axes: [['Frontend', 4], ['Backend', 3], ['DevOps', 2], ['Design', 3], ['Testing', 4], ['Data', 2], ['Communication', 5]] },
  { id: 'food', name: 'Food review', min: 0, max: 10,
    axes: [['Taste', 9], ['Texture', 7], ['Presentation', 8], ['Value', 6], ['Portion', 7]] },
]

export const presetAxes = (p: Preset): Axis[] => p.axes.map(([label, value]) => ({ id: uid(), label, value }))

export interface Palette { id: string; name: string; bg: string; bg2: string; ink: string; accent: string; chart: string }

export const PALETTES: Palette[] = [
  { id: 'night', name: 'Night patrol', bg: '#14183D', bg2: '#3A1858', ink: '#FFFFFF', accent: '#FFC93C', chart: '#E5246B' },
  { id: 'pop', name: 'Pop yellow', bg: '#FFC93C', bg2: '#FF9F1C', ink: '#1A1C3A', accent: '#E5246B', chart: '#17A3D8' },
  { id: 'villain', name: 'Villain', bg: '#2A0B3D', bg2: '#0B0A22', ink: '#ECFFE0', accent: '#7CFF4F', chart: '#7CFF4F' },
  { id: 'mint', name: 'Mint', bg: '#DDF4EA', bg2: '#B8E6D5', ink: '#0F3D3E', accent: '#FF6B4A', chart: '#0F8B8D' },
  { id: 'paper', name: 'Clean paper', bg: '#FFFFFF', bg2: '#EEF1F6', ink: '#1A1C3A', accent: '#E5246B', chart: '#1A1C3A' },
  { id: 'crimson', name: 'Crimson', bg: '#B3122E', bg2: '#5E0718', ink: '#FFF4E6', accent: '#FFD166', chart: '#FFD166' },
]

export function defaultChart(): ChartStyle {
  const p = PRESETS[0]
  return {
    axes: presetAxes(p), min: p.min, max: p.max, rings: 4, gridShape: 'polygon',
    color: PALETTES[0].chart, fillOpacity: 0.45, strokeWidth: 4, showValues: true, showPoints: true, overflow: false, overflowBurst: true,
  }
}

export function defaultDesign(): DesignStyle {
  const pal = PALETTES[0]
  return {
    layout: 'split', size: { w: 1080, h: 1350 },
    bg: pal.bg, bg2: pal.bg2, gradient: true, pattern: 'halftone',
    ink: pal.ink, accent: pal.accent,
    titleColor: pal.ink, subtitleColor: pal.accent, labelColor: pal.ink, footerColor: pal.ink,
    title: 'The Masked Marvel', subtitle: 'Power ranking, issue #1', footer: '',
    titleFont: 'bangers', subtitleFont: 'inter-bold', bodyFont: 'inter-bold', footerFont: 'inter-bold', image: null,
  }
}

export const defaultProject = (): Project => ({ version: 1, chart: defaultChart(), design: defaultDesign() })

/** Palette colours for every part of the design, text included. */
export const paletteDesign = (p: Palette): Partial<DesignStyle> => ({
  bg: p.bg, bg2: p.bg2, ink: p.ink, accent: p.accent,
  titleColor: p.ink, subtitleColor: p.accent, labelColor: p.ink, footerColor: p.ink,
})

/**
 * Fill in per-text colours and fonts for designs saved before they existed, matching how those
 * designs used to look (name/labels/footer in ink, subtitle in accent, one shared body font).
 */
export function withTextDefaults(d: Partial<DesignStyle>): DesignStyle {
  const base = { ...defaultDesign(), ...d }
  return {
    ...base,
    titleColor: d.titleColor ?? base.ink,
    subtitleColor: d.subtitleColor ?? base.accent,
    labelColor: d.labelColor ?? base.ink,
    footerColor: d.footerColor ?? base.ink,
    subtitleFont: d.subtitleFont ?? base.bodyFont,
    footerFont: d.footerFont ?? base.bodyFont,
  }
}
