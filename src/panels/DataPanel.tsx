import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { useStudio, useProject } from '../state/store'
import { PRESETS } from '../state/presets'
import { AXIS_LIMITS, type Axis, type ChartStyle } from '../state/types'
import { Field, Section, Toggle } from '../ui/controls'
import { useEffect, useState } from 'react'
import { INFINITE, SLIDER_TOP, formatValue, fromSlider, parseValue, toSlider } from '../chart/valueScale'

export function DataPanel() {
  const { chart, design } = useProject()
  const s = useStudio()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) s.reorderAxis(String(active.id), String(over.id))
  }

  return (
    <>
      <Section title="What are you rating?">
        <Field label="Name">
          {(id) => <input id={id} type="text" value={design.title} maxLength={200} onChange={(e) => s.setDesign({ title: e.target.value })} />}
        </Field>
        <Field label="Start from a template" hint="Replaces the stats below. Your colours and text stay as they are.">
          {(id) => (
            <select
              id={id}
              value=""
              onChange={(e) => {
                const p = PRESETS.find((x) => x.id === e.target.value)
                if (p) s.applyPreset(p)
              }}
            >
              <option value="" disabled>Choose a template</option>
              {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </Field>
      </Section>

      <Section title="Scale">
        <div className="row-3">
          <Field label="Lowest">
            {(id) => (
              <input id={id} type="number" value={chart.min}
                onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v < chart.max) s.setChart({ min: v }) }} />
            )}
          </Field>
          <Field label="Highest">
            {(id) => (
              <input id={id} type="number" value={chart.max}
                onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v > chart.min) s.setChart({ max: v }) }} />
            )}
          </Field>
          <Field label="Rings">
            {(id) => (
              <input id={id} type="number" min={1} max={10} value={chart.rings}
                onChange={(e) => { const v = Math.round(Number(e.target.value)); if (v >= 1 && v <= 10) s.setChart({ rings: v }) }} />
            )}
          </Field>
        </div>
        <Toggle label="Let scores break the chart" checked={chart.overflow} onChange={(overflow) => s.setChart({ overflow })} />
        {chart.overflow && (
          <Toggle label="Show POW bubble" checked={chart.overflowBurst} onChange={(overflowBurst) => s.setChart({ overflowBurst })} />
        )}
        <p className="hint">
          {chart.overflow
            ? `Type any score above ${chart.max} and its spike shoots out of the chart, behind your text. Slide all the way right (or type ∞) for infinity.`
            : `Scores stop at ${chart.max}. Turn this on for over-the-top stats.`}
        </p>
      </Section>

      <Section
        title={`Stats (${chart.axes.length})`}
        aside={
          <button type="button" className="btn small" onClick={s.addAxis} disabled={chart.axes.length >= AXIS_LIMITS.max}>
            Add stat
          </button>
        }
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={onDragEnd}>
          <SortableContext items={chart.axes.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <ol className="axes">
              {chart.axes.map((a, i) => <AxisRow key={a.id} axis={a} index={i} chart={chart} />)}
            </ol>
          </SortableContext>
        </DndContext>
        <p className="hint">Drag the handle to reorder. A chart needs {AXIS_LIMITS.min} to {AXIS_LIMITS.max} stats.</p>
      </Section>
    </>
  )
}

function AxisRow({ axis: a, index, chart }: { axis: Axis; index: number; chart: ChartStyle }) {
  const setAxis = useStudio((st) => st.setAxis)
  const removeAxis = useStudio((st) => st.removeAxis)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: a.id })
  const range = chart.max - chart.min
  const step = range <= 20 ? 0.5 : 1
  const scale = { min: chart.min, max: chart.max, step }
  const top = chart.overflow ? INFINITE : chart.max
  const broken = chart.overflow && a.value > chart.max

  return (
    <li
      ref={setNodeRef}
      className={`axis ${isDragging ? 'dragging' : ''} ${broken ? 'broken' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div className="axis-top">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="grip"
          aria-label={`Reorder ${a.label}`}
          {...attributes}
          {...listeners}
        >
          <svg viewBox="0 0 10 16" aria-hidden="true">
            {[3, 8, 13].map((y) => [3, 7].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.4} />))}
          </svg>
        </button>
        <input
          type="text"
          aria-label={`Stat ${index + 1} name`}
          value={a.label}
          maxLength={60}
          onChange={(e) => setAxis(a.id, { label: e.target.value })}
        />
        <ValueInput
          label={`${a.label} value`}
          value={a.value}
          onCommit={(v) => setAxis(a.id, { value: Math.min(top, Math.max(chart.min, v)) })}
        />
        <button
          type="button"
          className="icon danger"
          aria-label={`Remove ${a.label}`}
          disabled={chart.axes.length <= AXIS_LIMITS.min}
          onClick={() => removeAxis(a.id)}
        >
          ×
        </button>
      </div>
      {chart.overflow ? (
        // Over-the-top slider: the normal scale, then a stretch growing to 99999, then ∞ at the very end.
        <input
          type="range"
          aria-label={`${a.label} value slider`}
          aria-valuetext={formatValue(a.value)}
          min={0}
          max={SLIDER_TOP}
          step={1}
          value={toSlider(a.value, scale)}
          onChange={(e) => setAxis(a.id, { value: fromSlider(Number(e.target.value), scale) })}
        />
      ) : (
        <input
          type="range"
          aria-label={`${a.label} value slider`}
          min={chart.min}
          max={chart.max}
          step={step}
          value={Math.min(chart.max, Math.max(chart.min, a.value))}
          onChange={(e) => setAxis(a.id, { value: Number(e.target.value) })}
        />
      )}
    </li>
  )
}

/** Score box that shows ∞ for huge values and accepts typed numbers, "∞" or "inf". */
function ValueInput({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(formatValue(value))
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (!editing) setDraft(formatValue(value))
  }, [value, editing])
  return (
    <input
      type="text"
      inputMode="decimal"
      className="axis-num"
      aria-label={label}
      value={draft}
      onFocus={() => setEditing(true)}
      onChange={(e) => {
        setDraft(e.target.value)
        const v = parseValue(e.target.value)
        if (v !== null) onCommit(v)
      }}
      onBlur={() => {
        setEditing(false)
        setDraft(formatValue(value))
      }}
    />
  )
}
