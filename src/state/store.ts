import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { temporal } from 'zundo'
import { useStore as useZustand } from 'zustand'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import { AXIS_LIMITS, type Axis, type ChartStyle, type DesignStyle, type Project } from './types'
import { defaultChart, defaultProject, paletteDesign, presetAxes, uid, withTextDefaults, type Palette, type Preset } from './presets'

interface StudioState {
  project: Project
  setChart: (patch: Partial<ChartStyle>) => void
  setDesign: (patch: Partial<DesignStyle>) => void
  setAxis: (id: string, patch: Partial<Axis>) => void
  addAxis: () => void
  removeAxis: (id: string) => void
  reorderAxis: (fromId: string, toId: string) => void
  applyPreset: (p: Preset) => void
  applyPalette: (p: Palette) => void
  replaceProject: (p: Project) => void
  reset: () => void
}

// IndexedDB instead of localStorage: uploaded images easily exceed localStorage's ~5 MB quota.
const idbStorage: StateStorage = {
  getItem: async (name) => (await idbGet<string>(name)) ?? null,
  setItem: (name, value) => idbSet(name, value),
  removeItem: (name) => idbDel(name),
}

/** Collapse bursts of updates (slider drags, typing) into one undo step. */
function burst<T extends (...args: never[]) => void>(fn: T, ms = 400): T {
  let timer: ReturnType<typeof setTimeout> | undefined
  return ((...args: Parameters<T>) => {
    if (!timer) fn(...args)
    clearTimeout(timer)
    timer = setTimeout(() => (timer = undefined), ms)
  }) as T
}

export const useStudio = create<StudioState>()(
  persist(
    temporal(
      (set) => {
        const chart = (fn: (c: ChartStyle) => Partial<ChartStyle>) =>
          set((s) => ({ project: { ...s.project, chart: { ...s.project.chart, ...fn(s.project.chart) } } }))
        return {
          project: defaultProject(),
          setChart: (patch) => chart(() => patch),
          setDesign: (patch) =>
            set((s) => ({ project: { ...s.project, design: { ...s.project.design, ...patch } } })),
          setAxis: (id, patch) => chart((c) => ({ axes: c.axes.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
          addAxis: () =>
            chart((c) =>
              c.axes.length >= AXIS_LIMITS.max
                ? {}
                : { axes: [...c.axes, { id: uid(), label: `Stat ${c.axes.length + 1}`, value: (c.min + c.max) / 2 }] },
            ),
          removeAxis: (id) =>
            chart((c) => (c.axes.length <= AXIS_LIMITS.min ? {} : { axes: c.axes.filter((a) => a.id !== id) })),
          reorderAxis: (fromId, toId) =>
            chart((c) => {
              const from = c.axes.findIndex((a) => a.id === fromId)
              const to = c.axes.findIndex((a) => a.id === toId)
              if (from < 0 || to < 0 || from === to) return {}
              const axes = [...c.axes]
              axes.splice(to, 0, ...axes.splice(from, 1))
              return { axes }
            }),
          applyPreset: (p) => chart(() => ({ axes: presetAxes(p), min: p.min, max: p.max })),
          applyPalette: (p) =>
            set((s) => ({
              project: {
                ...s.project,
                chart: { ...s.project.chart, color: p.chart },
                design: { ...s.project.design, ...paletteDesign(p) },
              },
            })),
          replaceProject: (project) => set({ project }),
          reset: () => set({ project: defaultProject() }),
        }
      },
      {
        partialize: (s) => ({ project: s.project }),
        equality: (a, b) => a.project === b.project,
        limit: 100,
        handleSet: (handleSet) => burst(handleSet),
      },
    ),
    {
      name: 'spider-graph-studio',
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ project: s.project }),
      // Fill in fields added since the project was saved, so older autosaves keep working.
      merge: (persisted, current) => {
        const p = (persisted as { project?: Partial<Project> } | undefined)?.project
        if (!p) return current
        return {
          ...current,
          project: {
            version: 1,
            chart: { ...defaultChart(), ...p.chart },
            design: withTextDefaults(p.design ?? {}),
          },
        }
      },
    },
  ),
)

export const useProject = () => useStudio((s) => s.project)

export const useHistory = () => ({
  canUndo: useZustand(useStudio.temporal, (t) => t.pastStates.length > 0),
  canRedo: useZustand(useStudio.temporal, (t) => t.futureStates.length > 0),
})

export const undo = () => useStudio.temporal.getState().undo()
export const redo = () => useStudio.temporal.getState().redo()
