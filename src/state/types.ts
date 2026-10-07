export interface Axis { id: string; label: string; value: number }

export type GridShape = 'polygon' | 'circle'

export interface ChartStyle {
  axes: Axis[]
  min: number
  max: number
  rings: number
  gridShape: GridShape
  color: string
  fillOpacity: number
  strokeWidth: number
  showValues: boolean
  showPoints: boolean
  /** Let values above `max` burst past the outer ring, as far as the edge of the design. */
  overflow: boolean
  /** Mark an overflowing value with a comic POW bubble at the spike's tip. */
  overflowBurst: boolean
}

export type LayoutId = 'split' | 'hero' | 'card' | 'minimal' | 'poster'
export type Pattern = 'none' | 'halftone' | 'lines'

export interface DesignImage { src: string; focusX: number; focusY: number; zoom: number }

export interface DesignStyle {
  layout: LayoutId
  size: { w: number; h: number }
  bg: string
  bg2: string
  gradient: boolean
  pattern: Pattern
  /** Grid lines, outlines and comic shadows. */
  ink: string
  accent: string
  titleColor: string
  subtitleColor: string
  labelColor: string
  footerColor: string
  title: string
  subtitle: string
  footer: string
  titleFont: string
  subtitleFont: string
  /** Stat labels and values around the chart. */
  bodyFont: string
  footerFont: string
  image: DesignImage | null
}

export interface Project { version: 1; chart: ChartStyle; design: DesignStyle }

export const AXIS_LIMITS = { min: 3, max: 16 } as const
