import type { ChartStyle } from '../state/types'
import { formatValue, isInfinite } from './valueScale'
import { WithInfinity } from './WithInfinity'
import { angleFor, labelAnchor, polar, radarPoints, rayToBounds, ringPoints, starburst, toPath, type Box } from './geometry'

interface Props {
  chart: ChartStyle
  cx: number
  cy: number
  radius: number
  /** Grid lines and bubble outlines. */
  ink: string
  /** Stat labels and values. */
  labelColor: string
  /** Background behind the chart; used for the ring around each marker so overlaps stay legible. */
  surface: string
  fontFamily: string
  /** Label size in px; defaults to a size proportional to the radius. */
  fontSize?: number
  /** Canvas bounds that overflowing spikes stop at, and how their POW bubble is drawn. */
  burst?: { bounds: Box; fill: string; textColor: string; family: string }
}

/** Break a label into at most two lines so long axis names don't run off the canvas. */
export function wrapLabel(label: string, maxChars = 14): string[] {
  if (label.length <= maxChars) return [label]
  const words = label.split(/\s+/)
  if (words.length === 1) return [label]
  let best = 1
  let bestDiff = Infinity
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

const fmt = formatValue
export function RadarChart({ chart, cx, cy, radius, ink, labelColor, surface, fontFamily, fontSize, burst }: Props) {
  const n = chart.axes.length
  const size = fontSize ?? Math.max(14, Math.round(radius * 0.085))
  const valueSize = Math.round(size * 0.82)
  const lineH = size * 1.15
  const rings = Array.from({ length: chart.rings }, (_, i) => (radius * (i + 1)) / chart.rings)
  const dot = Math.max(5, chart.strokeWidth * 1.4)
  const over = chart.axes.map((a) => chart.overflow && a.value > chart.max)
  const showBurst = Boolean(burst && chart.overflowBurst)
  const burstR = size * 2.8
  const raw = radarPoints(chart.axes.map((a) => a.value), { cx, cy, radius, min: chart.min, max: chart.max, cap: chart.overflow ? Infinity : 1 })
  // An overflowing spike may leave the chart (passing under the title, over the picture) but stops
  // at the canvas edge, leaving room for its bubble. An infinite one runs right off the page instead,
  // and its bubble is stamped on the edge where it exits.
  const inset = showBurst ? burstR * 1.05 : chart.strokeWidth * 2 + 4
  const edgeAt = (i: number) => (burst ? Math.max(radius * 1.08, rayToBounds(cx, cy, angleFor(i, n), burst.bounds, inset)) : radius)
  const pts = raw.map((p, i) => {
    if (!over[i] || !burst) return p
    const angle = angleFor(i, n)
    if (isInfinite(chart.axes[i].value)) {
      const { w, h } = burst.bounds
      return polar(cx, cy, rayToBounds(cx, cy, angle, burst.bounds, 0) + Math.hypot(w, h), angle)
    }
    const limit = edgeAt(i)
    return Math.hypot(p.x - cx, p.y - cy) > limit ? polar(cx, cy, limit, angle) : p
  })
  const burstAt = (i: number) => (isInfinite(chart.axes[i].value) ? polar(cx, cy, edgeAt(i), angleFor(i, n)) : pts[i])
  const shown = (v: number) => (chart.overflow ? v : Math.min(chart.max, v))

  return (
    <g>
      <g fill="none" stroke={ink}>
        {rings.map((r, i) => {
          const outer = i === rings.length - 1
          const common = { strokeOpacity: outer ? 0.4 : 0.16, strokeWidth: outer ? 2 : 1.5 }
          return chart.gridShape === 'circle'
            ? <circle key={i} cx={cx} cy={cy} r={r} {...common} />
            : <path key={i} d={toPath(ringPoints(n, r, cx, cy))} {...common} />
        })}
        {chart.axes.map((a, i) => {
          const p = polar(cx, cy, radius, angleFor(i, n))
          return <line key={a.id} x1={cx} y1={cy} x2={p.x} y2={p.y} strokeOpacity={0.16} strokeWidth={1.5} />
        })}
      </g>

      <path
        d={toPath(pts)}
        fill={chart.color}
        fillOpacity={chart.fillOpacity}
        stroke={chart.color}
        strokeWidth={chart.strokeWidth}
        strokeLinejoin="round"
      />

      {chart.showPoints &&
        pts.map((p, i) =>
          over[i] && showBurst ? null : <circle key={chart.axes[i].id} cx={p.x} cy={p.y} r={dot} fill={chart.color} stroke={surface} strokeWidth={2} />,
        )}

      {/* Bubbles sit under the labels so axis names always stay readable. */}
      {showBurst && burst && chart.axes.map((a, i) => (over[i] ? <Pow key={a.id} x={burstAt(i).x} y={burstAt(i).y} r={burstR} text={`${fmt(chart.axes[i].value)}!`} ink={ink} tilt={i % 2 ? 9 : -9} {...burst} /> : null))}

      <g fill={labelColor} fontFamily={fontFamily}>
        {chart.axes.map((a, i) => {
          const angle = angleFor(i, n)
          const at = polar(cx, cy, radius + size * 0.9, angle)
          const { anchor, baseline } = labelAnchor(angle)
          const lines = wrapLabel(a.label)
          // With a bubble, an overflowing stat's value lives in the bubble instead.
          const withValue = chart.showValues && !(over[i] && showBurst)
          const rows = lines.length + (withValue ? 1 : 0)
          const blockH = (rows - 1) * lineH
          // Compute the first baseline explicitly; dominant-baseline is unreliable in PDF export.
          const first =
            baseline === 'bottom' ? at.y - blockH : baseline === 'top' ? at.y + size * 0.8 : at.y - blockH / 2 + size * 0.35
          return (
            <text key={a.id} x={at.x} y={first} textAnchor={anchor} fontSize={size}>
              {lines.map((l, j) => (
                <tspan key={j} x={at.x} y={first + j * lineH}>{l}</tspan>
              ))}
              {withValue && (
                <tspan x={at.x} y={first + lines.length * lineH} fontSize={valueSize} fillOpacity={0.72}>
                  <WithInfinity text={fmt(shown(a.value))} />
                </tspan>
              )}
            </text>
          )
        })}
      </g>
    </g>
  )
}

/** Comic starburst marking a value that broke the scale. */
function Pow({ x, y, r, text, ink, tilt, fill, textColor, family }: {
  x: number; y: number; r: number; text: string; ink: string; tilt: number; fill: string; textColor: string; family: string
}) {
  const fontSize = Math.min(r * 0.62, (r * 1.45) / Math.max(2, text.length * 0.58))
  const off = r * 0.09
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <path d={toPath(starburst(x + off, y + off, r, r * 0.68, 11))} fill={ink} />
      <path d={toPath(starburst(x, y, r, r * 0.68, 11))} fill={fill} stroke={ink} strokeWidth={Math.max(2, r * 0.06)} strokeLinejoin="round" />
      <text x={x} y={y + fontSize * 0.36} textAnchor="middle" fontFamily={family} fontSize={fontSize} fill={textColor}><WithInfinity text={text} /></text>
    </g>
  )
}
