import { useId, useRef, useState } from 'react'
import { useStudio, useProject } from '../state/store'
import { PALETTES } from '../state/presets'
import { FONTS } from '../design/fonts'
import { SIZES } from '../design/sizes'
import { LAYOUTS } from '../design/DesignCanvas'
import { LayoutIcon } from '../design/LayoutIcon'
import { imageFromFile, imageFromUrl } from '../images/loadImage'
import { ColorField, Field, Section, Segmented, Slider, Toggle } from '../ui/controls'
import type { Pattern } from '../state/types'

const pct = (v: number) => `${Math.round(v * 100)}%`

export function DesignPanel() {
  const { chart, design } = useProject()
  const s = useStudio()

  return (
    <>
      <Section title="Layout">
        <div className="layouts">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`layout-thumb ${design.layout === l.id ? 'on' : ''}`}
              aria-pressed={design.layout === l.id}
              onClick={() => s.setDesign({ layout: l.id })}
            >
              <LayoutIcon id={l.id} />
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Size">
        <div className="chips">
          {SIZES.map((z) => (
            <button
              key={z.id}
              type="button"
              className={`chip ${design.size.w === z.w && design.size.h === z.h ? 'on' : ''}`}
              onClick={() => s.setDesign({ size: { w: z.w, h: z.h } })}
            >
              {z.label} <small>{z.w}×{z.h}</small>
            </button>
          ))}
        </div>
        <div className="row-2">
          <Field label="Width (px)">
            {(id) => <SizeInput id={id} value={design.size.w} onCommit={(w) => s.setDesign({ size: { ...design.size, w } })} />}
          </Field>
          <Field label="Height (px)">
            {(id) => <SizeInput id={id} value={design.size.h} onCommit={(h) => s.setDesign({ size: { ...design.size, h } })} />}
          </Field>
        </div>
      </Section>

      <PictureSection />

      <Section title="Text">
        <Field label="Subtitle">
          {(id) => <input id={id} type="text" value={design.subtitle} maxLength={300} onChange={(e) => s.setDesign({ subtitle: e.target.value })} />}
        </Field>
        <Field label="Footer" hint="Credits, a handle or a source. Leave empty to hide it.">
          {(id) => <input id={id} type="text" value={design.footer} maxLength={300} placeholder="@yourhandle" onChange={(e) => s.setDesign({ footer: e.target.value })} />}
        </Field>
        <div className="text-styles" role="group" aria-label="Fonts and colours for each piece of text">
          <TextStyleRow label="Name" font={design.titleFont} color={design.titleColor}
            onFont={(titleFont) => s.setDesign({ titleFont })} onColor={(titleColor) => s.setDesign({ titleColor })} />
          <TextStyleRow label="Subtitle" font={design.subtitleFont} color={design.subtitleColor}
            onFont={(subtitleFont) => s.setDesign({ subtitleFont })} onColor={(subtitleColor) => s.setDesign({ subtitleColor })} />
          <TextStyleRow label="Stat labels" font={design.bodyFont} color={design.labelColor}
            onFont={(bodyFont) => s.setDesign({ bodyFont })} onColor={(labelColor) => s.setDesign({ labelColor })} />
          <TextStyleRow label="Footer" font={design.footerFont} color={design.footerColor}
            onFont={(footerFont) => s.setDesign({ footerFont })} onColor={(footerColor) => s.setDesign({ footerColor })} />
        </div>
      </Section>

      <Section title="Colours">
        <p className="hint">A palette sets every colour, text included. Fine-tune text colours in the Text section.</p>
        <div className="palettes" role="list">
          {PALETTES.map((p) => (
            <button key={p.id} type="button" role="listitem" className="palette" onClick={() => s.applyPalette(p)} title={p.name} aria-label={`Use ${p.name} colours`}>
              <span style={{ background: `linear-gradient(135deg, ${p.bg}, ${p.bg2})` }}>
                <i style={{ background: p.chart }} />
                <i style={{ background: p.accent }} />
                <i style={{ background: p.ink }} />
              </span>
              {p.name}
            </button>
          ))}
        </div>
        <div className="colors">
          <ColorField label="Background" value={design.bg} onChange={(bg) => s.setDesign({ bg })} />
          <ColorField label="Gradient end" value={design.bg2} onChange={(bg2) => s.setDesign({ bg2 })} />
          <ColorField label="Grid and outlines" value={design.ink} onChange={(ink) => s.setDesign({ ink })} />
          <ColorField label="Accent" value={design.accent} onChange={(accent) => s.setDesign({ accent })} />
          <ColorField label="Chart" value={chart.color} onChange={(color) => s.setChart({ color })} />
        </div>
        <Toggle label="Gradient background" checked={design.gradient} onChange={(gradient) => s.setDesign({ gradient })} />
        <Field label="Texture">
          {() => (
            <Segmented<Pattern>
              label="Texture"
              value={design.pattern}
              onChange={(pattern) => s.setDesign({ pattern })}
              options={[{ value: 'none', label: 'None' }, { value: 'halftone', label: 'Halftone' }, { value: 'lines', label: 'Lines' }]}
            />
          )}
        </Field>
      </Section>

      <Section title="Chart">
        <Field label="Grid">
          {() => (
            <Segmented
              label="Grid shape"
              value={chart.gridShape}
              onChange={(gridShape) => s.setChart({ gridShape })}
              options={[{ value: 'polygon', label: 'Web' }, { value: 'circle', label: 'Rings' }]}
            />
          )}
        </Field>
        <Slider label="Fill strength" value={chart.fillOpacity} min={0} max={1} step={0.05} format={pct} onChange={(fillOpacity) => s.setChart({ fillOpacity })} />
        <Slider label="Line weight" value={chart.strokeWidth} min={0} max={12} step={0.5} onChange={(strokeWidth) => s.setChart({ strokeWidth })} />
        <Toggle label="Show values under labels" checked={chart.showValues} onChange={(showValues) => s.setChart({ showValues })} />
        <Toggle label="Show points" checked={chart.showPoints} onChange={(showPoints) => s.setChart({ showPoints })} />
      </Section>
    </>
  )
}

function SizeInput({ id, value, onCommit }: { id: string; value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const v = Math.round(Number(draft))
    if (v >= 200 && v <= 4000) onCommit(v)
    setDraft(null)
  }
  return (
    <input
      id={id}
      type="number"
      min={200}
      max={4000}
      value={draft ?? value}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
    />
  )
}

function PictureSection() {
  const { design } = useProject()
  const setDesign = useStudio((st) => st.setDesign)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const img = design.image

  const load = async (fn: () => Promise<string>) => {
    setBusy(true)
    setError('')
    try {
      const src = await fn()
      setDesign({ image: { src, focusX: 0.5, focusY: 0.3, zoom: 1 } })
      setUrl('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="Picture">
      <div
        className={`dropzone ${dragging ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files[0]
          if (f) load(() => imageFromFile(f))
        }}
      >
        {img ? <img src={img.src} alt="Current picture" /> : <div className="dz-empty" aria-hidden="true">＋</div>}
        <div className="dz-copy">
          <p>{img ? 'Drop a new image to replace it' : 'Drop an image here'}</p>
          <div className="dz-actions">
            <button type="button" className="btn small" onClick={() => fileRef.current?.click()} disabled={busy}>
              {img ? 'Replace picture' : 'Upload picture'}
            </button>
            {img && <button type="button" className="btn small ghost" onClick={() => setDesign({ image: null })}>Remove</button>}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) load(() => imageFromFile(f))
            e.target.value = ''
          }}
        />
      </div>
      <form
        className="url-row"
        onSubmit={(e) => {
          e.preventDefault()
          if (url.trim()) load(() => imageFromUrl(url))
        }}
      >
        <input type="url" aria-label="Image link" placeholder="Or paste an image link" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="submit" className="btn small" disabled={busy || !url.trim()}>{busy ? 'Loading' : 'Use link'}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {img && (
        <>
          <p className="hint">Drag the picture on the preview to move it. Scroll or pinch over it to zoom.</p>
          <Slider label="Zoom" value={img.zoom} min={1} max={4} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(zoom) => setDesign({ image: { ...img, zoom } })} />
          <Slider label="Horizontal position" value={img.focusX} min={0} max={1} step={0.01} format={pct} onChange={(focusX) => setDesign({ image: { ...img, focusX } })} />
          <Slider label="Vertical position" value={img.focusY} min={0} max={1} step={0.01} format={pct} onChange={(focusY) => setDesign({ image: { ...img, focusY } })} />
        </>
      )}
    </Section>
  )
}

function FontOptions() {
  return (
    <>
      <optgroup label="Display">
        {FONTS.filter((f) => f.kind === 'display').map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
      </optgroup>
      <optgroup label="Manga">
        {FONTS.filter((f) => f.kind === 'manga').map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
      </optgroup>
      <optgroup label="Text">
        {FONTS.filter((f) => f.kind === 'text').map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
      </optgroup>
    </>
  )
}

/** One piece of text: its font and its colour, side by side. */
function TextStyleRow({ label, font, color, onFont, onColor }: {
  label: string
  font: string
  color: string
  onFont: (id: string) => void
  onColor: (hex: string) => void
}) {
  const id = useId()
  return (
    <div className="text-style">
      <label htmlFor={`${id}-font`}>{label}</label>
      <select id={`${id}-font`} value={font} onChange={(e) => onFont(e.target.value)}>
        <FontOptions />
      </select>
      <input
        type="color"
        aria-label={`${label} colour`}
        title={`${label} colour ${color}`}
        value={color}
        onChange={(e) => onColor(e.target.value.toUpperCase())}
      />
    </div>
  )
}
