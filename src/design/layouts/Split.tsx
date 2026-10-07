import { Background, blockHeight, subtitleFamily, ChartIn, Footer, ImageBox, Monogram, TextBlock, titleFamily, type LayoutProps, type Rect } from '../parts'

/** Picture on one side (or top), accent rule, then title and chart. */
export function Split({ chart, design, uid }: LayoutProps) {
  const { w: W, h: H } = design.size
  const pad = Math.min(W, H) * 0.06
  const side = W / H >= 0.95
  const rule = Math.max(6, pad * 0.2)

  const img: Rect = side ? { x: 0, y: 0, w: W * 0.42, h: H } : { x: 0, y: 0, w: W, h: H * 0.36 }
  const col: Rect = side
    ? { x: img.w + rule + pad, y: pad, w: W - img.w - rule - pad * 2, h: H - pad * 2 }
    : { x: pad, y: img.h + rule + pad * 0.8, w: W - pad * 2, h: H - img.h - rule - pad * 1.8 }

  const tf = titleFamily(design)
  const sf = subtitleFamily(design)
  const titleMax = Math.min(col.w * 0.16, H * 0.1)
  const subMax = titleMax * 0.36
  const th = blockHeight(design.title, tf, col.w, titleMax, 2, 0.95)
  const sh = blockHeight(design.subtitle, sf, col.w, subMax, 2, 1.2)
  const footH = design.footer.trim() ? subMax * 1.6 : 0
  const chartRect: Rect = { x: col.x, y: col.y + th + sh + pad * 0.3, w: col.w, h: col.h - th - sh - pad * 0.3 - footH }

  return (
    <g>
      <Background design={design} uid={uid} w={W} h={H} />
      <ImageBox image={design.image} box={img} uid={uid} name="split" fallback={<Monogram box={img} design={design} />} />
      {side
        ? <rect x={img.w} y={0} width={rule} height={H} fill={design.accent} />
        : <rect x={0} y={img.h} width={W} height={rule} fill={design.accent} />}
      {/* Drawn before the text so over-the-top spikes pass behind it. */}
      <ChartIn r={chartRect} chart={chart} design={design} surface={design.bg} />
      <TextBlock text={design.title} family={tf} x={col.x} y={col.y} maxW={col.w} maxSize={titleMax} lineHeight={0.95} fill={design.titleColor} />
      <TextBlock text={design.subtitle} family={sf} x={col.x} y={col.y + th} maxW={col.w} maxSize={subMax} lineHeight={1.2} minSize={12} fill={design.subtitleColor} />
      <Footer design={design} x={col.x} y={H - pad - subMax * 0.9} maxW={col.w} size={subMax * 0.8} />
    </g>
  )
}
