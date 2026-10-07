import { z } from 'zod'
import { AXIS_LIMITS, type Project } from './types'
import { withTextDefaults } from './presets'

const color = z.string().max(32)

const schema = z.object({
  version: z.literal(1),
  chart: z.object({
    axes: z
      .array(z.object({ id: z.string(), label: z.string().max(60), value: z.number() }))
      .min(AXIS_LIMITS.min)
      .max(AXIS_LIMITS.max),
    min: z.number(),
    max: z.number(),
    rings: z.number().int().min(1).max(10),
    gridShape: z.enum(['polygon', 'circle']),
    color,
    fillOpacity: z.number().min(0).max(1),
    strokeWidth: z.number().min(0).max(20),
    showValues: z.boolean(),
    showPoints: z.boolean(),
    overflow: z.boolean().default(false),
    overflowBurst: z.boolean().default(true),
  }),
  design: z.object({
    layout: z.enum(['split', 'hero', 'card', 'minimal', 'poster']),
    size: z.object({ w: z.number().int().min(200).max(4000), h: z.number().int().min(200).max(4000) }),
    bg: color,
    bg2: color,
    gradient: z.boolean(),
    pattern: z.enum(['none', 'halftone', 'lines']),
    ink: color,
    accent: color,
    titleColor: color.optional(),
    subtitleColor: color.optional(),
    labelColor: color.optional(),
    footerColor: color.optional(),
    title: z.string().max(200),
    subtitle: z.string().max(300),
    footer: z.string().max(300),
    titleFont: z.string(),
    subtitleFont: z.string().optional(),
    bodyFont: z.string(),
    footerFont: z.string().optional(),
    image: z
      .object({
        src: z.string().startsWith('data:image/'),
        focusX: z.number().min(0).max(1),
        focusY: z.number().min(0).max(1),
        zoom: z.number().min(1).max(5),
      })
      .nullable(),
  }),
})

export const serializeProject = (p: Project) => JSON.stringify(p)

export function parseProject(text: string): Project {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("This file isn't a valid project file. Choose a .json file saved from Spider Graph Studio.")
  }
  const result = schema.safeParse(data)
  if (!result.success) {
    const issue = result.error.issues[0]
    throw new Error(`This file isn't a valid project file (${issue.path.join('.') || 'root'}: ${issue.message}).`)
  }
  const { chart, design } = result.data
  return { version: 1, chart: chart as Project['chart'], design: withTextDefaults(design) }
}
