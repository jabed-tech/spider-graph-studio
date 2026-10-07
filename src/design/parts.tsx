import { useEffect, useState, type ReactNode } from 'react'
import type { ChartStyle, DesignImage, DesignStyle } from '../state/types'
import { RadarChart, wrapLabel } from '../chart/RadarChart'
import { WithInfinity } from '../chart/WithInfinity'
import { angleFor, labelAnchor } from '../chart/geometry'
import { fontById } from './fonts'
import { bestOn } from './color'
import { previewUrl } from '../images/previewUrl'

export interface Rect { x: number; y: number; w: number; h: number }

export interface LayoutProps {
  chart: ChartStyle
  design: DesignStyle
  /** Unique prefix for <defs> ids, so several designs (e.g. layout thumbnails) can share a page. */
  uid: string
}

export const titleFamily = (d: DesignStyle) => fontById(d.titleFont).family
export const bodyFamily = (d: DesignStyle) => fontById(d.bodyFont).family
export const subtitleFamily = (d: DesignStyle) => fontById(d.subtitleFont).family
export const footerFamily = (d: DesignStyle) => fontById(d.footerFont).family

/* ---------- text measurement ---------- */

let ctx: CanvasRenderingContext2D | null = null
export function measure(text: string, family: string, size: number): number {
  ctx ??= document.createElement('canvas').getContext('2d')
  if (!ctx) return text.length * size * 0.6
  ctx.font = `${size}px '${family}'`
  return ctx.measureText(text).width
}

/** Largest size (<= maxSize) at which `text` fits `maxW` in at most `maxLines` lines. */
export function fitLines(text: string, family: string, maxW: number, maxSize: number, maxLines = 2, minSize = 18) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return { lines: [] as string[], size: maxSize }
  for (let size = maxSize; size >= minSize; size -= 2) {
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w
      if (measure(next, family, size) <= maxW || !cur) cur = next
      else { lines.push(cur); cur = w }
    }
    lines.push(cur)
    if (lines.length <= maxLines && lines.every((l) => measure(l, family, size) <= maxW)) return { lines, size }
  }
  return { lines: [text], size: minSize }
}

interface TextBlockProps {
  text: string
  family: string
  x: number
  y: number // top of the block
  maxW: number
  maxSize: number
  maxLines?: number
  fill: string
  anchor?: 'start' | 'middle' | 'end'
  lineHeight?: number
  opacity?: number
  minSize?: number
}

/** Fitted multi-line text whose top edge sits at `y`. Returns its height through `blockHeight`. */
export function TextBlock(p: TextBlockProps) {
  const { lines, size } = fitLines(p.text, p.family, p.maxW, p.maxSize, p.maxLines, p.minSize)
  const lh = size * (p.lineHeight ?? 1)
  return (
    <text fontFamily={p.family} fontSize={size} fill={p.fill} textAnchor={p.anchor ?? 'start'} fillOpacity={p.opacity}>
      {lines.map((l, i) => (
        <tspan key={i} x={p.x} y={p.y + size * 0.8 + i * lh}><WithInfinity text={l} /></tspan>
      ))}
    </text>
  )
}

export function blockHeight(text: string, family: string, maxW: number, maxSize: number, maxLines = 2, lineHeight = 1, minSize = 18) {
  if (!text.trim()) return 0
  const { lines, size } = fitLines(text, family, maxW, maxSize, maxLines, minSize)
  return size * 0.8 + (lines.length - 1) * size * lineHeight + size * 0.25
}

/* ---------- background ---------- */

export function Background({ design, uid, w, h, x = 0, y = 0, rx = 0 }: { design: DesignStyle; uid: string; w: number; h: number; x?: number; y?: number; rx?: number }) {
  const unit = Math.max(w, h) / 90
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={design.bg} />
          <stop offset="1" stopColor={design.bg2} />
        </linearGradient>
        <pattern id={`${uid}-halftone`} width={unit * 1.6} height={unit * 1.6} patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
          <circle cx={unit * 0.8} cy={unit * 0.8} r={unit * 0.28} fill={design.ink} fillOpacity={0.12} />
        </pattern>
        <pattern id={`${uid}-lines`} width={unit * 1.4} height={unit * 1.4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={unit * 0.25} height={unit * 1.4} fill={design.ink} fillOpacity={0.08} />
        </pattern>
      </defs>
      {/* data-bg-layer: the PDF exporter re-stacks these to fade a picture into the background. */}
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={design.gradient ? `url(#${uid}-bg)` : design.bg} data-bg-layer="" />
      {design.pattern !== 'none' && (
        <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#${uid}-${design.pattern})`} data-bg-layer="" />
      )}
    </g>
  )
}

/* ---------- image ---------- */

const sizeCache = new Map<string, { w: number; h: number }>()

export function useImageSize(src: string | undefined) {
  const [size, setSize] = useState(() => (src ? sizeCache.get(src) : undefined))
  useEffect(() => {
    if (!src) return setSize(undefined)
    const cached = sizeCache.get(src)
    if (cached) return setSize(cached)
    const img = new Image()
    img.onload = () => {
      const s = { w: img.naturalWidth, h: img.naturalHeight }
      sizeCache.set(src, s)
      setSize(s)
    }
    img.src = src
  }, [src])
  return size
}

type Shape = 'rect' | 'circle'

/**
 * An image cropped to `box` like CSS object-fit: cover, honouring focus point and zoom.
 * The shape is filled with a pattern holding the image rather than clipping it, which keeps
 * rounded and circular crops identical across the preview, SVG/PNG export and svg2pdf.
 */
export function ImageBox({ image, box, uid, name, shape = 'rect', rx = 0, fallback }: {
  image: DesignImage | null
  box: Rect
  uid: string
  name: string
  shape?: Shape
  rx?: number
  fallback: ReactNode
}) {
  const nat = useImageSize(image?.src)
  if (!image || !nat) return <g>{fallback}</g>

  const patId = `${uid}-img-${name}`
  const scale = Math.max(box.w / nat.w, box.h / nat.h) * image.zoom
  const dw = nat.w * scale
  const dh = nat.h * scale
  const fill = `url(#${patId})`
  const drag = { 'data-drag-image': '', 'data-slack': `${box.w - dw},${box.h - dh}` }
  return (
    <g>
      <defs>
        {/* Tile starts at the origin and covers the box, so the image uses absolute coordinates. */}
        <pattern id={patId} patternUnits="userSpaceOnUse" x={0} y={0} width={box.x + box.w} height={box.y + box.h}>
          <image
            href={previewUrl(image.src)}
            data-src={image.src}
            x={box.x + (box.w - dw) * image.focusX}
            y={box.y + (box.h - dh) * image.focusY}
            width={dw}
            height={dh}
            preserveAspectRatio="none"
          />
        </pattern>
      </defs>
      {/* data-drag-* lets the stage turn pointer drags on the picture into focus/zoom changes. */}
      {shape === 'circle'
        ? <circle cx={box.x + box.w / 2} cy={box.y + box.h / 2} r={Math.min(box.w, box.h) / 2} fill={fill} {...drag} />
        : <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={rx} fill={fill} {...drag} />}
    </g>
  )
}

/** Stand-in when no picture is set: a monogram built from the title's initials. */
export function Monogram({ box, design, shape = 'rect', rx = 0 }: { box: Rect; design: DesignStyle; shape?: Shape; rx?: number }) {
  const initials =
    design.title.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w) && !/^(the|of|and|a)$/i.test(w)).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const size = Math.min(box.w, box.h) * 0.42
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  return (
    <g>
      {shape === 'circle'
        ? <circle cx={cx} cy={cy} r={Math.min(box.w, box.h) / 2} fill={design.accent} />
        : <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={rx} fill={design.accent} />}
      <text x={cx} y={cy + size * 0.35} textAnchor="middle" fontFamily={titleFamily(design)} fontSize={size} fill={design.bg}>
        {initials}
      </text>
    </g>
  )
}

/* ---------- chart placement ---------- */

/** Radar centred in `r`, sized so labels have room on every side. */
/** Largest radius at which every measured label block stays inside `r`. Mirrors RadarChart's label placement. */
export function fitRadius(chart: ChartStyle, r: Rect, size: number, family: string): number {
  const n = chart.axes.length
  const gap = size * 0.9
  const lineH = size * 1.15
  let R = Math.min(r.w, r.h) / 2
  chart.axes.forEach((a, i) => {
    const angle = angleFor(i, n)
    const c = Math.abs(Math.cos(angle))
    const s = Math.abs(Math.sin(angle))
    const lines = wrapLabel(a.label)
    const lw = Math.max(...lines.map((l) => measure(l, family, size)))
    const bh = size * 1.05 + (lines.length + (chart.showValues ? 1 : 0) - 1) * lineH
    const { anchor, baseline } = labelAnchor(angle)
    const xExtent = anchor === 'middle' ? lw / 2 : lw
    if (c > 1e-6) R = Math.min(R, (r.w / 2 - xExtent) / c - gap)
    const yExtent = baseline === 'middle' ? bh / 2 : bh
    if (s > 1e-6) R = Math.min(R, (r.h / 2 - yExtent) / s - gap)
  })
  return Math.max(40, R)
}

export function ChartIn({ r, chart, design, surface, scale = 1 }: { r: Rect; chart: ChartStyle; design: DesignStyle; surface: string; scale?: number }) {
  const size = Math.max(14, Math.min(44, Math.min(r.w, r.h) * 0.042 * scale))
  const radius = fitRadius(chart, r, size, bodyFamily(design))
  return (
    <RadarChart
      chart={chart}
      cx={r.x + r.w / 2}
      cy={r.y + r.h / 2}
      radius={radius}
      ink={design.ink}
      labelColor={design.labelColor}
      surface={surface}
      fontFamily={bodyFamily(design)}
      fontSize={size}
      burst={{
        bounds: { x: 0, y: 0, w: design.size.w, h: design.size.h },
        fill: design.accent,
        textColor: bestOn(design.accent, [design.ink, design.bg, '#FFFFFF', '#000000']),
        family: titleFamily(design),
      }}
    />
  )
}

export function Footer({ design, x, y, maxW, anchor = 'start', fill, size }: { design: DesignStyle; x: number; y: number; maxW: number; anchor?: 'start' | 'middle' | 'end'; fill?: string; size: number }) {
  if (!design.footer.trim()) return null
  return (
    <TextBlock text={design.footer} family={footerFamily(design)} x={x} y={y} maxW={maxW} maxSize={size} maxLines={1} minSize={10} fill={fill ?? design.footerColor} anchor={anchor} />
  )
}
