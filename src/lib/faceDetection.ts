import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'

let detector: FaceDetector | null = null
let initPromise: Promise<FaceDetector> | null = null

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'

const TARGET = 256
/** Bounding-box outset to keep some forehead/chin in the crop. */
const PADDING = 0.3

async function getDetector(): Promise<FaceDetector> {
  if (detector) return detector
  if (!initPromise) {
    initPromise = (async () => {
      const fs = await FilesetResolver.forVisionTasks(WASM_URL)
      const fd = await FaceDetector.createFromOptions(fs, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: 'IMAGE',
      })
      detector = fd
      return fd
    })()
  }
  return initPromise
}

export async function detectAndCrop(
  image: HTMLImageElement,
): Promise<string | null> {
  const fd = await getDetector()
  const result = fd.detect(image)
  const det = result.detections[0]
  const bbox = det?.boundingBox
  if (!bbox) return null

  const cx = bbox.originX + bbox.width / 2
  const cy = bbox.originY + bbox.height / 2
  const size = Math.max(bbox.width, bbox.height) * (1 + PADDING)

  return drawCircleCrop(image, cx, cy, size)
}

/**
 * Draw a circular 256×256 PNG centered at (cx, cy) with the given source-px
 * size. Used by both auto-detect and the manual fallback editor.
 */
export function drawCircleCrop(
  image: HTMLImageElement | HTMLCanvasElement,
  cx: number,
  cy: number,
  size: number,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = TARGET
  canvas.height = TARGET
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  ctx.beginPath()
  ctx.arc(TARGET / 2, TARGET / 2, TARGET / 2, 0, Math.PI * 2)
  ctx.clip()

  ctx.drawImage(
    image,
    cx - size / 2,
    cy - size / 2,
    size,
    size,
    0,
    0,
    TARGET,
    TARGET,
  )
  return canvas.toDataURL('image/png')
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.decoding = 'async'
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('image decode failed'))
      i.src = url
    })
    return img
  } finally {
    // Hold off revoking until after we've drawn from it elsewhere — the caller
    // owns the image lifetime; revoke on unmount instead. For simplicity,
    // revoke on next tick: the <img> already has the decoded bitmap.
    queueMicrotask(() => URL.revokeObjectURL(url))
  }
}
