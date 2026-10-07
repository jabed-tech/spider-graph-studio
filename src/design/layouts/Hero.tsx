import { Background, blockHeight, subtitleFamily, ChartIn, Footer, ImageBox, TextBlock, titleFamily, type LayoutProps, type Rect } from '../parts'

/** Full-bleed picture fading out into the background, with title and chart over the fade. */
export function Hero({ chart, design, uid }: LayoutProps) {
  const { w: W, h: H } = design.size
  const pad = Math.min(W, H) * 0.06
  const side = W / H >= 1.2
  const tf = titleFamily(design)
  const sf = subtitleFamily(design)

  const col: Rect = side
    ? { x: W * 0.48, y: pad, w: W * 0.52 - pad, h: H - pad * 2 }
    : { x: pad, y: H * 0.36, w: W - pad * 2, h: H * 0.64 - pad }
  const titleMax = Math.min(col.w * 0.14, H * 0.1)
  const subMax = titleMax * 0.36
  const th = blockHeight(design.title, tf, col.w, titleMax, 2, 0.95)
  const sh = blockHeight(design.subtitle, sf, col.w, subMax, 2, 1.2)
  const footH = design.footer.trim() ? subMax * 1.6 : 0
  const chartRect: Rect = { x: col.x, y: col.y + th + sh + pad * 0.2, w: col.w, h: col.h - th - sh - pad * 0.2 - footH }

  const fade = `${uid}-fade`
  const stops: [number, number][] = side ? [[0.3, 0], [0.5, 0.94], [1, 1]] : [[0.2, 0], [0.48, 0.94], [1, 1]]
  return (
    <g>
      <Background design={design} uid={uid} w={W} h={H} />
      <defs>
        {/* Luminance mask: white keeps the picture, black fades it out so the background (gradient, texture) shows through. */}
        <linearGradient id={`${fade}-g`} x1="0" y1="0" x2={side ? 1 : 0} y2={side ? 0 : 1}>
          {stops.map(([offset, opacity]) => {
            const v = Math.round(255 * (1 - opacity))
            return <stop key={offset} offset={offset} stopColor={`rgb(${v},${v},${v})`} />
          })}
        </linearGradient>
        <mask id={fade} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <rect width={W} height={H} fill={`url(#${fade}-g)`} />
        </mask>
      </defs>
      {/* svg2pdf can't do masks, so data-fade tells the PDF exporter to rebuild the fade from background layers. */}
      <g mask={`url(#${fade})`} data-fade={JSON.stringify({ axis: side ? 'x' : 'y', stops })}>
        <ImageBox image={design.image} box={{ x: 0, y: 0, w: side ? W * 0.62 : W, h: side ? H : H * 0.72 }} uid={uid} name="hero" fallback={null} />
      </g>
      {/* Drawn before the text so over-the-top spikes pass behind it. */}
      <ChartIn r={chartRect} chart={chart} design={design} surface={design.bg} />
      <TextBlock text={design.title} family={tf} x={col.x} y={col.y} maxW={col.w} maxSize={titleMax} lineHeight={0.95} fill={design.titleColor} />
      <TextBlock text={design.subtitle} family={sf} x={col.x} y={col.y + th} maxW={col.w} maxSize={subMax} lineHeight={1.2} minSize={12} fill={design.subtitleColor} />
      <Footer design={design} x={col.x} y={H - pad - subMax * 0.9} maxW={col.w} size={subMax * 0.8} />
    </g>
  )
}
