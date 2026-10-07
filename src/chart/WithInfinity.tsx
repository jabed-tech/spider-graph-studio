import { fontById } from '../design/fonts'
import { INFINITY_FONT_ID } from './valueScale'

const infinityFamily = fontById(INFINITY_FONT_ID).family

/** Text with any ∞ drawn in a font guaranteed to contain it (a PDF can't fall back to another font). */
export function WithInfinity({ text }: { text: string }) {
  if (!text.includes('∞')) return <>{text}</>
  return (
    <>
      {text.split('∞').map((part, i) => (
        <tspan key={i}>
          {i > 0 && <tspan fontFamily={infinityFamily}>∞</tspan>}
          {part}
        </tspan>
      ))}
    </>
  )
}
