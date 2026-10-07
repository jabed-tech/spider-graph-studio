import { useRef, useState, type RefObject } from 'react'
import { useStudio, useProject } from '../state/store'
import { parseProject, serializeProject } from '../state/projectFile'
import { downloadBlob, slug } from '../export/download'
import { embeddedFontCss } from '../export/fonts'
import { serializeSvg } from '../export/serializeSvg'
import { rasterize } from '../export/raster'
import { exportPdf } from '../export/pdf'
import { Field, Section, Segmented } from '../ui/controls'

type Format = 'png' | 'jpg' | 'svg' | 'pdf'

const FORMATS: { value: Format; label: string; note: string }[] = [
  { value: 'png', label: 'PNG', note: 'Sharp image for social posts and chats.' },
  { value: 'jpg', label: 'JPG', note: 'Smaller file, ideal where PNG is too big.' },
  { value: 'svg', label: 'SVG', note: 'Vector file for design tools and the web. Fonts are embedded.' },
  { value: 'pdf', label: 'PDF', note: 'Vector document for printing and sharing.' },
]

export function ExportPanel({ svgRef }: { svgRef: RefObject<SVGSVGElement | null> }) {
  const project = useProject()
  const { design, chart } = project
  const replaceProject = useStudio((s) => s.replaceProject)
  const [format, setFormat] = useState<Format>('png')
  const [scale, setScale] = useState(2)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<{ kind: 'busy' | 'done' | 'error'; text: string } | null>(null)
  const openRef = useRef<HTMLInputElement>(null)

  const base = slug(name || design.title)
  const raster = format === 'png' || format === 'jpg'
  const fmt = FORMATS.find((f) => f.value === format)!

  const download = async () => {
    const svg = svgRef.current
    if (!svg) return
    setStatus({ kind: 'busy', text: `Preparing ${fmt.label}` })
    try {
      const { w, h } = design.size
      let blob: Blob
      if (format === 'pdf') {
        blob = await exportPdf(svg, design, chart)
      } else {
        const text = serializeSvg(svg, await embeddedFontCss(design, chart))
        blob = format === 'svg'
          ? new Blob([text], { type: 'image/svg+xml' })
          : await rasterize(text, w, h, scale, format === 'png' ? 'image/png' : 'image/jpeg')
      }
      const file = `${base}.${format}`
      downloadBlob(blob, file)
      setStatus({ kind: 'done', text: `Downloaded ${file}` })
    } catch (e) {
      setStatus({ kind: 'error', text: (e as Error).message || 'Export failed. Try again or pick another format.' })
    }
  }

  return (
    <>
      <Section title="Download">
        <Field label="Format" hint={fmt.note}>
          {() => <Segmented label="Format" value={format} onChange={setFormat} options={FORMATS} />}
        </Field>
        {raster && (
          <Field label="Resolution" hint={`${design.size.w * scale} × ${design.size.h * scale} px`}>
            {() => (
              <Segmented label="Resolution" value={scale} onChange={setScale} options={[1, 2, 3, 4].map((v) => ({ value: v, label: `${v}×` }))} />
            )}
          </Field>
        )}
        <Field label="File name">
          {(id) => (
            <div className="filename">
              <input id={id} type="text" value={name} placeholder={slug(design.title)} onChange={(e) => setName(e.target.value)} />
              <span>.{format}</span>
            </div>
          )}
        </Field>
        <button type="button" className="btn primary wide" onClick={download} disabled={status?.kind === 'busy'}>
          Download {fmt.label}
        </button>
        {status && (
          <p className={`status ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>{status.text}</p>
        )}
      </Section>

      <Section title="Project file">
        <p className="hint">
          Your work saves in this browser automatically. Save a project file to keep a copy, move it to another device or share it.
        </p>
        <div className="row-2">
          <button
            type="button"
            className="btn"
            onClick={() => downloadBlob(new Blob([serializeProject(project)], { type: 'application/json' }), `${base}.spider.json`)}
          >
            Save project file
          </button>
          <button type="button" className="btn" onClick={() => openRef.current?.click()}>Open project file</button>
        </div>
        <input
          ref={openRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              replaceProject(parseProject(await f.text()))
              setStatus({ kind: 'done', text: `Opened ${f.name}` })
            } catch (err) {
              setStatus({ kind: 'error', text: (err as Error).message })
            }
          }}
        />
      </Section>
    </>
  )
}
