import { forwardRef, useId, type ComponentType } from 'react'
import type { ChartStyle, DesignStyle, LayoutId } from '../state/types'
import type { LayoutProps } from './parts'
import { Split } from './layouts/Split'
import { Hero } from './layouts/Hero'
import { TradingCard } from './layouts/TradingCard'
import { Minimal } from './layouts/Minimal'
import { Poster } from './layouts/Poster'

export const LAYOUTS: { id: LayoutId; name: string; component: ComponentType<LayoutProps> }[] = [
  { id: 'split', name: 'Split', component: Split },
  { id: 'hero', name: 'Hero', component: Hero },
  { id: 'card', name: 'Trading card', component: TradingCard },
  { id: 'poster', name: 'Poster', component: Poster },
  { id: 'minimal', name: 'Minimal', component: Minimal },
]

interface Props {
  chart: ChartStyle
  design: DesignStyle
  className?: string
  title?: string
}

/** The whole design as one SVG at its true output size. Preview and every export render from this. */
export const DesignSvg = forwardRef<SVGSVGElement, Props>(function DesignSvg({ chart, design, className, title }, ref) {
  const uid = 'd' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const Layout = (LAYOUTS.find((l) => l.id === design.layout) ?? LAYOUTS[0]).component
  const { w, h } = design.size
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className={className}
      role="img"
      aria-label={title ?? `${design.title} radar chart`}
    >
      <Layout chart={chart} design={design} uid={uid} />
    </svg>
  )
})
