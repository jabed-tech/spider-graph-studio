import { useEffect, type RefObject } from 'react'
import { useStudio } from '../state/store'
import type { DesignImage } from '../state/types'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const MIN_ZOOM = 1
const MAX_ZOOM = 4

/**
 * Direct manipulation of the picture on the stage: drag to move it within its frame, wheel or
 * pinch to zoom. Picture shapes carry `data-drag-image` and `data-slack` ("box − drawn size" per
 * axis), which converts a pointer movement into a change of focus point.
 */
export function usePictureDrag(svgRef: RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const getImage = () => useStudio.getState().project.design.image
    const setImage = (image: DesignImage) => useStudio.getState().setDesign({ image })
    const pointers = new Map<number, { x: number; y: number }>()
    let drag: { image: DesignImage; x: number; y: number; slackX: number; slackY: number; unit: number } | null = null
    let pinch: { zoom: number; dist: number } | null = null

    const pictureAt = (t: EventTarget | null) => (t instanceof Element ? t.closest<SVGElement>('[data-drag-image]') : null)
    const unitsPerPx = () => useStudio.getState().project.design.size.w / svg.getBoundingClientRect().width
    const spread = () => {
      const [a, b] = [...pointers.values()]
      return Math.hypot(a.x - b.x, a.y - b.y)
    }

    const startDrag = (target: SVGElement, x: number, y: number) => {
      const image = getImage()
      if (!image) return
      const [slackX, slackY] = (target.dataset.slack ?? '0,0').split(',').map(Number)
      drag = { image, x, y, slackX, slackY, unit: unitsPerPx() }
    }

    const onDown = (e: PointerEvent) => {
      const target = pictureAt(e.target)
      if (!target || !getImage()) return
      e.preventDefault()
      try {
        svg.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already gone (or synthetic); dragging still works without capture */
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      svg.classList.add('moving-picture')
      if (pointers.size === 1) startDrag(target, e.clientX, e.clientY)
      else if (pointers.size === 2) {
        drag = null
        pinch = { zoom: getImage()!.zoom, dist: spread() }
      }
    }

    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const image = getImage()
      if (!image) return
      if (pinch && pointers.size >= 2) {
        setImage({ ...image, zoom: clamp((pinch.zoom * spread()) / Math.max(1, pinch.dist), MIN_ZOOM, MAX_ZOOM) })
      } else if (drag) {
        // Moving the image right by d shifts focus by d / slack (slack is negative when the image overhangs).
        const dx = (e.clientX - drag.x) * drag.unit
        const dy = (e.clientY - drag.y) * drag.unit
        setImage({
          ...image,
          focusX: Math.abs(drag.slackX) > 0.5 ? clamp(drag.image.focusX + dx / drag.slackX, 0, 1) : image.focusX,
          focusY: Math.abs(drag.slackY) > 0.5 ? clamp(drag.image.focusY + dy / drag.slackY, 0, 1) : image.focusY,
        })
      }
    }

    const onUp = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return
      pinch = null
      drag = null
      if (pointers.size === 0) svg.classList.remove('moving-picture')
      else {
        // One finger left after a pinch: carry on dragging from where it is now.
        const target = svg.querySelector<SVGElement>('[data-drag-image]')
        const [p] = [...pointers.values()]
        if (target) startDrag(target, p.x, p.y)
      }
    }

    const onWheel = (e: WheelEvent) => {
      const image = getImage()
      if (!image || !pictureAt(e.target)) return
      e.preventDefault()
      setImage({ ...image, zoom: clamp(image.zoom * Math.exp(-e.deltaY * 0.0015), MIN_ZOOM, MAX_ZOOM) })
    }

    svg.addEventListener('pointerdown', onDown)
    svg.addEventListener('pointermove', onMove)
    svg.addEventListener('pointerup', onUp)
    svg.addEventListener('pointercancel', onUp)
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      svg.removeEventListener('pointerdown', onDown)
      svg.removeEventListener('pointermove', onMove)
      svg.removeEventListener('pointerup', onUp)
      svg.removeEventListener('pointercancel', onUp)
      svg.removeEventListener('wheel', onWheel)
    }
  }, [svgRef])
}
