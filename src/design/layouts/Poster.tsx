import { Background, subtitleFamily, ChartIn, fitLines, Footer, ImageBox, Monogram, TextBlock, titleFamily, type LayoutProps, type Rect } from '../parts'

/** Giant one-line name across the top, round portrait with an offset ink ring, chart beside or below. */
export function Poster({ chart, design, uid }: LayoutProps) {
  const { w: W, h: H } = design.size
  const pad = Math.min(W, H) * 0.06
  const side = W / H >= 1.2
  const tf = titleFamily(design)
  const sf = subtitleFamily(design)

  const { size: titleSize } = fitLines(design.title || ' ', tf, W - pad * 2, H * 0.22, 1, 24)
  const titleH = titleSize * 0.85
  const top = pad + titleH + pad * 0.6
  const subMax = Math.min(W, H) * 0.035
  const footH = design.footer.trim() ? subMax * 1.6 : 0

  const d = side ? Math.min(H - top - pad - footH, W * 0.3) : Math.min(W * 0.4, (H - top) * 0.36)
  const circle: Rect = { x: pad, y: top, w: d, h: d }
  const off = d * 0.05
  const subRect: Rect = side
    ? { x: pad, y: top + d + pad * 0.4, w: d, h: subMax * 3 }
    : { x: pad + d + pad * 0.8, y: top + d * 0.2, w: W - d - pad * 2.8, h: d }
  const chartRect: Rect = side
    ? { x: pad * 2 + d, y: top, w: W - d - pad * 3, h: H - top - pad - footH }
    : { x: pad, y: top + d + pad * 0.4, w: W - pad * 2, h: H - top - d - pad * 1.4 - footH }

  return (
    <g>
      <Background design={design} uid={uid} w={W} h={H} />
      <circle cx={circle.x + d / 2 + off} cy={circle.y + d / 2 + off} r={d / 2} fill={design.ink} />
      <ImageBox image={design.image} box={circle} uid={uid} name="poster" shape="circle" fallback={<Monogram box={circle} design={design} shape="circle" />} />
      <circle cx={circle.x + d / 2} cy={circle.y + d / 2} r={d / 2} fill="none" stroke={design.accent} strokeWidth={Math.max(4, d * 0.03)} />
      {/* Drawn before the text so over-the-top spikes pass behind it. */}
      <ChartIn r={chartRect} chart={chart} design={design} surface={design.bg} />
      <TextBlock text={design.title} family={tf} x={pad} y={pad} maxW={W - pad * 2} maxSize={H * 0.22} maxLines={1} minSize={24} fill={design.titleColor} />
      <TextBlock text={design.subtitle} family={sf} x={subRect.x} y={subRect.y} maxW={subRect.w} maxSize={subMax * (side ? 1 : 1.3)} maxLines={side ? 2 : 4} lineHeight={1.2} minSize={12} fill={design.subtitleColor} />
      <Footer design={design} x={pad} y={H - pad - subMax * 0.9} maxW={W - pad * 2} size={subMax * 0.8} />
    </g>
  )
}
