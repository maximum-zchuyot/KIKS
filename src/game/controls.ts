export type TapSide = 'left' | 'right'

export interface ControlsAPI {
  getGamma: () => number
  destroy: () => void
}

/**
 * Section 5.3: gyroscope (DeviceOrientation.gamma) and touch (left/right half-tap)
 * run in parallel — both always feed into the player.
 */
export function createControls(
  canvas: HTMLCanvasElement,
  onTap: (side: TapSide) => void,
): ControlsAPI {
  const state = { gamma: 0 }

  const onOrientation = (e: DeviceOrientationEvent) => {
    const g = e.gamma
    if (typeof g === 'number' && Number.isFinite(g)) state.gamma = g
  }

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    const side: TapSide = t.clientX < window.innerWidth / 2 ? 'left' : 'right'
    onTap(side)
  }

  window.addEventListener('deviceorientation', onOrientation)
  canvas.addEventListener('touchstart', onTouchStart, { passive: true })

  return {
    getGamma: () => state.gamma,
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
