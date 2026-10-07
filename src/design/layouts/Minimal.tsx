import { Background, blockHeight, subtitleFamily, ChartIn, Footer, ImageBox, TextBlock, titleFamily, type LayoutProps, type Rect } from '../parts'

/** The chart is the hero; an optional round avatar sits beside the title. */
export function Minimal({ chart, design, uid }: LayoutProps) {
  const { w: W, h: H } = design.size
  const pad = Math.min(W, H) * 0.07
  const tf = titleFamily(design)
  const sf = subtitleFamily(design)

  const titleMax = Math.min(W * 0.09, H * 0.075)
  const subMax = titleMax * 0.42
  const avatar = design.image ? titleMax * 1.9 : 0
  const tx = pad + (avatar ? avatar + pad * 0.4 : 0)
  const tw = W - tx - pad
  const th = blockHeight(design.title, tf, tw, titleMax, 2, 0.95)
  const sh = blockHeight(design.subtitle, sf, tw, subMax, 2, 1.2)
  const headH = Math.max(th + sh, avatar)
  const footH = design.footer.trim() ? subMax * 1.6 : 0
  const chartRect: Rect = { x: pad, y: pad + headH + pad * 0.3, w: W - pad * 2, h: H - pad * 2.3 - headH - footH }

  return (
    <g>
      <Background design={design} uid={uid} w={W} h={H} />
      {design.image && (
        <>
          <ImageBox image={design.image} box={{ x: pad, y: pad, w: avatar, h: avatar }} uid={uid} name="avatar" shape="circle" fallback={null} />
          <circle cx={pad + avatar / 2} cy={pad + avatar / 2} r={avatar / 2} fill="none" stroke={design.accent} strokeWidth={Math.max(3, avatar * 0.04)} />
        </>
      )}
      {/* Drawn before the text so over-the-top spikes pass behind it. */}
      <ChartIn r={chartRect} chart={chart} design={design} surface={design.bg} scale={0.9} />
      <TextBlock text={design.title} family={tf} x={tx} y={pad + (headH - th - sh) / 2} maxW={tw} maxSize={titleMax} lineHeight={0.95} fill={design.titleColor} />
      <TextBlock text={design.subtitle} family={sf} x={tx} y={pad + (headH - th - sh) / 2 + th} maxW={tw} maxSize={subMax} lineHeight={1.2} minSize={12} fill={design.subtitleColor} />
      <Footer design={design} x={pad} y={H - pad - subMax * 0.9} maxW={W - pad * 2} size={subMax * 0.8} />
    </g>
  )
}
