export type TapSide = 'left' | 'right'

export interface TapEvent {
  side: TapSide
  /** css px relative to the canvas top-left */
  x: number
  y: number
}

export interface ControlsAPI {
  getGamma: () => number
  hasGyro: () => boolean
  destroy: () => void
}

/**
 * Section 5.3: gyroscope (DeviceOrientation.gamma) and touch (left/right half-tap)
 * run in parallel — both always feed into the player. Engine receives the tap
 * coordinates too, so a profile can choose to hit-test tokens on tap (e.g. let
 * a 3-year-old grab a heart by touching it directly).
 */
export function createControls(
  canvas: HTMLCanvasElement,
  onTap: (event: TapEvent) => void,
): ControlsAPI {
  const state = { gamma: 0, gyroSeen: false }

  const onOrientation = (e: DeviceOrientationEvent) => {
    const g = e.gamma
    if (typeof g === 'number' && Number.isFinite(g)) {
      state.gamma = g
      state.gyroSeen = true
    }
  }

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    const rect = canvas.getBoundingClientRect()
    const x = t.clientX - rect.left
    const y = t.clientY - rect.top
    const side: TapSide = x < rect.width / 2 ? 'left' : 'right'
    onTap({ side, x, y })
  }

  window.addEventListener('deviceorientation', onOrientation)
  canvas.addEventListener('touchstart', onTouchStart, { passive: true })

  return {
    getGamma: () => state.gamma,
    hasGyro: () => state.gyroSeen,
    destroy: () => {
      window.removeEventListener('deviceorientation', onOrientation)
      canvas.removeEventListener('touchstart', onTouchStart)
    },
  }
}

/**
 * iOS 13+ requires explicit permission for DeviceOrientationEvent, granted only
 * via a user gesture. No-op on Android / desktop. Safe to call eagerly.
 */
export async function ensureOrientationPermission(): Promise<void> {
  const ctor = window.DeviceOrientationEvent as unknown as
    | { requestPermission?: () => Promise<'granted' | 'denied'> }
    | undefined
  if (ctor && typeof ctor.requestPermission === 'function') {
    try {
      await ctor.requestPermission()
    } catch {
      // permission denied — touch still works
    }
  }
}
