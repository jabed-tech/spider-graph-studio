import { formatValue } from '../../chart/valueScale'
import { bestOn } from '../color'
import { Background, bodyFamily, subtitleFamily, ChartIn, Footer, ImageBox, Monogram, TextBlock, titleFamily, type LayoutProps, type Rect } from '../parts'


/** Collectible card: accent frame, name bar with average badge, picture window, chart. */
export function TradingCard({ chart, design, uid }: LayoutProps) {
  const { w: W, h: H } = design.size
  const m = Math.min(W, H) * 0.035
  const inner: Rect = { x: m, y: m, w: W - m * 2, h: H - m * 2 }
  const pad = Math.min(inner.w, inner.h) * 0.05
  const side = W / H >= 1.2
  const tf = titleFamily(design)
  const bf = bodyFamily(design)
  const sf = subtitleFamily(design)
  const onAccent = bestOn(design.accent, [design.ink, design.bg, '#FFFFFF', '#000000'])

  const avg = chart.axes.reduce((s, a) => s + a.value, 0) / chart.axes.length
  const badgeR = Math.min(inner.w, inner.h) * 0.075
  const headH = badgeR * 2
  const head: Rect = { x: inner.x + pad, y: inner.y + pad, w: inner.w - pad * 2 - badgeR * 2 - pad * 0.5, h: headH }
  const titleMax = headH * 0.78
  const subMax = Math.max(14, titleMax * 0.4)
  const body: Rect = { x: inner.x + pad, y: head.y + headH + pad * 0.7, w: inner.w - pad * 2, h: inner.y + inner.h - (head.y + headH + pad * 0.7) - pad }

  const footH = design.footer.trim() ? subMax * 1.6 : 0
  const img: Rect = side ? { x: body.x, y: body.y, w: body.w * 0.46, h: body.h - footH } : { x: body.x, y: body.y, w: body.w, h: body.h * 0.44 }
  const chartRect: Rect = side
    ? { x: img.x + img.w + pad, y: body.y + subMax * 1.6, w: body.w - img.w - pad, h: body.h - subMax * 1.6 - footH }
    : { x: body.x, y: img.y + img.h + subMax * 2, w: body.w, h: body.h - img.h - subMax * 2 - footH }
  const rx = pad * 0.5

  return (
    <g>
      <rect width={W} height={H} fill={design.accent} />
      <Background design={design} uid={uid} x={inner.x} y={inner.y} w={inner.w} h={inner.h} rx={m} />
      <ImageBox image={design.image} box={img} uid={uid} name="card" rx={rx} fallback={<Monogram box={img} design={design} rx={rx} />} />
      <rect x={img.x} y={img.y} width={img.w} height={img.h} rx={rx} fill="none" stroke={design.accent} strokeWidth={Math.max(3, pad * 0.1)} />
      {/* Drawn before the text so over-the-top spikes pass behind it. */}
      <ChartIn r={chartRect} chart={chart} design={design} surface={design.bg} />
      <TextBlock text={design.title} family={tf} x={head.x} y={head.y + (headH - titleMax) / 2} maxW={head.w} maxSize={titleMax} maxLines={1} fill={design.titleColor} />
      <circle cx={inner.x + inner.w - pad - badgeR} cy={head.y + badgeR} r={badgeR} fill={design.accent} />
      <text x={inner.x + inner.w - pad - badgeR} y={head.y + badgeR + badgeR * 0.22} textAnchor="middle" fontFamily={tf} fontSize={badgeR * 0.85} fill={onAccent}>
        {formatValue(Math.round(avg * 10) / 10)}
      </text>
      <text x={inner.x + inner.w - pad - badgeR} y={head.y + badgeR + badgeR * 0.62} textAnchor="middle" fontFamily={bf} fontSize={badgeR * 0.26} fill={onAccent} fillOpacity={0.8}>
        Avg
      </text>
      <TextBlock
        text={design.subtitle}
        family={sf}
        x={side ? chartRect.x : body.x + body.w / 2}
        y={side ? body.y : img.y + img.h + subMax * 0.5}
        maxW={side ? chartRect.w : body.w}
        maxSize={subMax}
        maxLines={1}
        minSize={12}
        anchor={side ? 'start' : 'middle'}
        fill={design.subtitleColor}
      />
      <Footer design={design} x={body.x + body.w / 2} y={inner.y + inner.h - pad - subMax * 0.9} maxW={body.w} anchor="middle" size={subMax * 0.8} />
    </g>
  )
}
