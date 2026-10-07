import type { ReactElement } from 'react'
import type { LayoutId } from '../state/types'

// Wireframe pictograms for the layout picker. Cheaper than live mini-renders, which re-rendered
// five full designs on every edit, and they read more clearly at this size.

const radar = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3
    const k = [1, 0.7, 0.85, 0.6, 0.9, 0.75][i]
    return `${(cx + r * k * Math.cos(a)).toFixed(1)},${(cy + r * k * Math.sin(a)).toFixed(1)}`
  }).join(' ')

const hex = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')

function Chart({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <polygon points={hex(cx, cy, r)} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={1} />
      <polygon points={radar(cx, cy, r)} fill="var(--magenta)" fillOpacity={0.55} stroke="var(--magenta)" strokeWidth={1.2} />
    </g>
  )
}

const Pic = ({ x, y, w, h, rx = 0 }: { x: number; y: number; w: number; h: number; rx?: number }) => (
  <rect x={x} y={y} width={w} height={h} rx={rx} fill="var(--cyan)" fillOpacity={0.55} />
)
const Bar = ({ x, y, w, h = 5 }: { x: number; y: number; w: number; h?: number }) => (
  <rect x={x} y={y} width={w} height={h} rx={1} fill="currentColor" />
)

const ICONS: Record<LayoutId, ReactElement> = {
  split: (
    <>
      <Pic x={0} y={0} w={60} h={26} />
      <rect x={0} y={26} width={60} height={2} fill="var(--yellow)" />
      <Bar x={7} y={33} w={38} />
      <Bar x={7} y={41} w={24} h={2.5} />
      <Chart cx={30} cy={58} r={10} />
    </>
  ),
  hero: (
    <>
      <Pic x={0} y={0} w={60} h={50} />
      <rect x={0} y={24} width={60} height={51} fill="var(--well)" opacity={0.85} />
      <Bar x={7} y={30} w={40} />
      <Bar x={7} y={38} w={24} h={2.5} />
      <Chart cx={30} cy={56} r={11} />
    </>
  ),
  card: (
    <>
      <rect x={1} y={1} width={58} height={73} rx={4} fill="none" stroke="var(--yellow)" strokeWidth={3} />
      <Bar x={7} y={7} w={30} />
      <circle cx={50} cy={10} r={5} fill="var(--yellow)" />
      <Pic x={7} y={18} w={46} h={24} rx={2} />
      <Chart cx={30} cy={57} r={10} />
    </>
  ),
  poster: (
    <>
      <Bar x={5} y={5} w={50} h={9} />
      <circle cx={19} cy={30} r={11} fill="var(--cyan)" fillOpacity={0.55} stroke="var(--yellow)" strokeWidth={1.5} />
      <Bar x={35} y={25} w={18} h={2.5} />
      <Bar x={35} y={31} w={12} h={2.5} />
      <Chart cx={30} cy={57} r={11} />
    </>
  ),
  minimal: (
    <>
      <Bar x={7} y={7} w={32} />
      <Bar x={7} y={15} w={20} h={2.5} />
      <Chart cx={30} cy={45} r={18} />
    </>
  ),
}

export function LayoutIcon({ id }: { id: LayoutId }) {
  return (
    <svg viewBox="0 0 60 75" className="layout-icon" aria-hidden="true">
      <rect width="60" height="75" fill="var(--panel)" />
      {ICONS[id]}
    </svg>
  )
}
