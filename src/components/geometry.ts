import type { Look } from '../data/looks'
import type { Crop } from '../store'

export type Frame = { x: number; y: number; w: number; h: number }

/**
 * Position the photo so the cropped face centre lands in the middle of the frame.
 * `k` is how much tighter this frame type shows the face than the crop editor's oval.
 * The result always covers the frame, so no empty edges show through.
 */
export function placePhoto(frame: Frame, aspect: number, crop: Crop, k = 1) {
  let h = frame.h * crop.zoom * k
  let w = h * aspect
  if (w < frame.w) {
    w = frame.w
    h = w / aspect
  }
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const x = clamp(frame.x + frame.w / 2 - crop.u * w, frame.x + frame.w - w, frame.x)
  const y = clamp(frame.y + frame.h / 2 - crop.v * h, frame.y + frame.h - h, frame.y)
  return { x, y, width: w, height: h }
}

export const VIEWBOX: Record<Look['type'], [number, number]> = {
  drape: [700, 660],
  grid: [525, 768],
  backdrop: [1430, 850],
  season: [1200, 800],
}

export const figureAspect = (look: Look) => VIEWBOX[look.type][0] / VIEWBOX[look.type][1]
