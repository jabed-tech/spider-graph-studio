import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { redo, undo, useHistory, useProject, useStudio } from './state/store'
import { DesignSvg } from './design/DesignCanvas'
import { usePictureDrag } from './design/usePictureDrag'
import { loadFonts } from './design/fonts'
import { DataPanel } from './panels/DataPanel'
import { DesignPanel } from './panels/DesignPanel'
import { ExportPanel } from './panels/ExportPanel'

type Tab = 'data' | 'design' | 'export'
const TABS: { id: Tab; label: string }[] = [
  { id: 'data', label: 'Stats' },
  { id: 'design', label: 'Design' },
  { id: 'export', label: 'Download' },
]

function useFitScale(w: number, h: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.4)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const r = el.getBoundingClientRect()
      const room = 16 // keeps the frame's offset shadow inside the stage
      const next = Math.max(0.05, Math.min((r.width - room) / w, (r.height - room) / h))
      // Ignore sub-pixel jitter so a scrollbar appearing can't make the stage oscillate.
      setScale((prev) => (Math.abs(prev - next) * Math.max(w, h) < 1 ? prev : next))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w, h])
  return { ref, scale }
}

type Theme = 'light' | 'dark'

const readTheme = (): Theme => {
  try {
    const saved = localStorage.getItem('sgs-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* storage blocked: fall back to the system setting */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  const toggle = () =>
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('sgs-theme', next) } catch { /* not persisted; still applies */ }
      return next
    })
  return { theme, toggle }
}

export default function App() {
  const { chart, design } = useProject()
  const reset = useStudio((s) => s.reset)
  const { canUndo, canRedo } = useHistory()
  const [tab, setTab] = useState<Tab>('data')
  const [confirmReset, setConfirmReset] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const { ref: stageRef, scale } = useFitScale(design.size.w, design.size.h)
  const { theme, toggle: toggleTheme } = useTheme()
  const [, setFontsLoaded] = useState(0)
  usePictureDrag(svgRef)

  // Fonts load on demand; re-render once they arrive so titles are fitted with real metrics.
  useEffect(() => {
    let live = true
    loadFonts([design.titleFont, design.subtitleFont, design.bodyFont, design.footerFont, 'inter-bold']).then(
      () => live && setFontsLoaded((n) => n + 1),
      () => undefined,
    )
    return () => { live = false }
  }, [design.titleFont, design.subtitleFont, design.bodyFont, design.footerFont])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      // Let text fields keep their own native undo.
      if (t.matches('input[type=text], input[type=url], input[type=number], textarea')) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!confirmReset) return
    const t = setTimeout(() => setConfirmReset(false), 3000)
    return () => clearTimeout(t)
  }, [confirmReset])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <polygon points="16,2 29,11 24,28 8,28 3,11" fill="var(--yellow)" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="16,9 23,14 20,23 11,22 9,14" fill="var(--magenta)" />
          </svg>
          <h1>Spider Graph Studio</h1>
        </div>
        <div className="top-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>
            )}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button type="button" className="btn small ghost" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">Undo</button>
          <button type="button" className="btn small ghost" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">Redo</button>
          <button
            type="button"
            className={`btn small ${confirmReset ? 'danger' : 'ghost'}`}
            onClick={() => {
              if (confirmReset) { reset(); setConfirmReset(false) } else setConfirmReset(true)
            }}
          >
            {confirmReset ? 'Click again to start over' : 'Start over'}
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="stage" aria-label="Preview">
          <div className="stage-fit" ref={stageRef}>
            <div className="stage-frame" style={{ width: design.size.w * scale, height: design.size.h * scale }}>
              <DesignSvg ref={svgRef} chart={chart} design={design} className="stage-svg" />
            </div>
          </div>
          <p className="stage-meta">{design.size.w} × {design.size.h} px, shown at {Math.round(scale * 100)}%</p>
        </section>

        <aside className="panel">
          <nav className="tabs" role="tablist" aria-label="Editor">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="panel-body"
                className={tab === t.id ? 'on' : ''}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="panel-body" id="panel-body" role="tabpanel" aria-labelledby={`tab-${tab}`}>
            {tab === 'data' && <DataPanel />}
            {tab === 'design' && <DesignPanel />}
            {tab === 'export' && <ExportPanel svgRef={svgRef} />}
          </div>
        </aside>
      </main>
    </div>
  )
}
