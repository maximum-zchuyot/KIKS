import { useEffect, useRef, useState } from 'react'
import type { ProfileSettings } from '../types'
import { pickCelebrationClip, playClip } from '../lib/audio'

interface Props {
  profile: ProfileSettings
  photoBase64: string | null
  nextLevelId: number
  onSkip: () => void
}

const DURATION_MS = 5000
const FEEDING_MS = 1800
const COIN_COUNT = 14
const COIN_FLIGHT_MS = 1100

interface Coin {
  start: number
  startX: number
  startY: number
  endX: number
  endY: number
  controlX: number
  controlY: number
  spin: number
}

/**
 * Атай's level-transition skit:
 *   1. small Атай avatar lives at the bottom
 *   2. coins arc out of him toward an inert trampoline above
 *   3. once enough coins land, the trampoline "powers on" and 3 kids hop on it
 *
 * Auto-advances after 5 s, tap anywhere skips early.
 */
export function CelebrationAtai({
  profile,
  photoBase64,
  nextLevelId,
  onSkip,
}: Props) {
  const [phase, setPhase] = useState<'feeding' | 'bouncing'>('feeding')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const trampolineRef = useRef<HTMLDivElement>(null)
  const sourceRef = useRef<HTMLDivElement>(null)
  // StrictMode double-invokes effects in dev; this ref guarantees the voice
  // clip is picked + played at most once per real mount, so we don't
  // simultaneously stack two recordings or burn through lastPlayedKey twice.
  const audioFiredRef = useRef(false)

  // phase + auto-skip timers + parent voice clip
  useEffect(() => {
    const phaseTimer = window.setTimeout(() => setPhase('bouncing'), FEEDING_MS)
    const endTimer = window.setTimeout(onSkip, DURATION_MS)
    if (!audioFiredRef.current) {
      audioFiredRef.current = true
      const clip = pickCelebrationClip(profile.id)
      if (clip) void playClip(clip)
    }
    return () => {
      window.clearTimeout(phaseTimer)
      window.clearTimeout(endTimer)
    }
  }, [onSkip, profile.id])

  // coin canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const trampoline = trampolineRef.current
    const source = sourceRef.current
    if (!canvas || !trampoline || !source) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const sourceRect = source.getBoundingClientRect()
    const trampolineRect = trampoline.getBoundingClientRect()
    const startX = sourceRect.left + sourceRect.width / 2
    const startY = sourceRect.top + sourceRect.height / 2 - 12
    const targetX = trampolineRect.left + trampolineRect.width / 2
    const targetY = trampolineRect.top + trampolineRect.height * 0.45

    const t0 = performance.now()
    const coins: Coin[] = Array.from({ length: COIN_COUNT }, (_, i) => {
      const jitter = (Math.random() - 0.5) * trampolineRect.width * 0.6
      const ex = targetX + jitter
      const ey = targetY + (Math.random() - 0.5) * 12
      // control point pulls the arc up over the midpoint
      const cx = (startX + ex) / 2 + (Math.random() - 0.5) * 80
      const cy = Math.min(startY, ey) - 220 - Math.random() * 80
      return {
        start: t0 + (i / COIN_COUNT) * FEEDING_MS * 0.85,
        startX,
        startY,
        endX: ex,
        endY: ey,
        controlX: cx,
        controlY: cy,
        spin: (Math.random() - 0.5) * 6,
      }
    })

    let raf = 0
    let stopped = false
    const tick = (now: number) => {
      if (stopped) return
      ctx.clearRect(0, 0, w, h)
      ctx.font = '32px "Segoe UI Emoji","Apple Color Emoji",sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      let liveCoins = 0
      for (const c of coins) {
        const elapsed = now - c.start
        if (elapsed < 0) continue
        const t = Math.min(1, elapsed / COIN_FLIGHT_MS)
        if (t >= 1) continue
        liveCoins += 1
        const mt = 1 - t
        const x =
          mt * mt * c.startX +
          2 * mt * t * c.controlX +
          t * t * c.endX
        const y =
          mt * mt * c.startY +
          2 * mt * t * c.controlY +
          t * t * c.endY
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(c.spin * t)
        const fade = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1
        ctx.globalAlpha = fade
        ctx.fillText('🪙', 0, 0)
        ctx.restore()
      }
      ctx.globalAlpha = 1

      // stop once everyone has landed and we've passed the feeding window
      if (liveCoins > 0 || now - t0 < FEEDING_MS) {
        raf = window.requestAnimationFrame(tick)
      }
    }
    raf = window.requestAnimationFrame(tick)

    return () => {
      stopped = true
      window.cancelAnimationFrame(raf)
    }
  }, [])

  const bouncing = phase === 'bouncing'

  return (
    <div
      role="presentation"
      className="absolute inset-0 z-30 flex flex-col items-center overflow-hidden text-center text-white"
      style={{
        background: `linear-gradient(180deg, ${profile.bgFrom} 0%, ${profile.bgTo} 100%)`,
      }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-20"
      />

      <div className="relative z-10 mt-8 px-6">
        <h2 className="kiks-pop text-4xl font-black tracking-tight drop-shadow-md sm:text-5xl">
          Молодец, {profile.displayName}!
        </h2>
        <p className="mt-1 text-lg font-extrabold text-white/90">
          Уровень {nextLevelId}!
        </p>
      </div>

      {/* trampoline scene — kids on top, mat below */}
      <div className="relative z-10 mt-10 flex w-full max-w-md flex-col items-center">
        <div className="flex h-24 items-end justify-center gap-3 text-5xl">
          <span className={bouncing ? 'kiks-jump-1' : ''} aria-hidden="true">
            👦
          </span>
          <span className={bouncing ? 'kiks-jump-2' : ''} aria-hidden="true">
            🧒
          </span>
          <span className={bouncing ? 'kiks-jump-3' : ''} aria-hidden="true">
            👧
          </span>
        </div>
        <div ref={trampolineRef} className="relative mt-1 h-24 w-72 sm:w-80">
          <svg
            viewBox="0 0 320 110"
            className={`h-full w-full transition-[filter] duration-300 ${
              bouncing ? '' : 'opacity-70 grayscale'
            }`}
            aria-hidden="true"
          >
            {/* legs */}
            <rect x="36" y="62" width="10" height="42" rx="3" fill="#1f2937" />
            <rect x="274" y="62" width="10" height="42" rx="3" fill="#1f2937" />
            {/* mat */}
            <g
              className={bouncing ? 'kiks-tramp' : ''}
              style={{ transformOrigin: '160px 60px' }}
            >
              <ellipse
                cx="160"
                cy="60"
                rx="130"
                ry="22"
                fill={profile.primary}
                stroke={profile.accent}
                strokeWidth="6"
              />
              <ellipse
                cx="160"
                cy="56"
                rx="118"
                ry="14"
                fill="rgba(255,255,255,0.18)"
              />
            </g>
            {/* springs */}
            {Array.from({ length: 9 }).map((_, i) => {
              const x = 50 + i * 28
              return (
                <line
                  key={i}
                  x1={x}
                  y1="56"
                  x2={x}
                  y2="72"
                  stroke="#cbd5e1"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )
            })}
            {/* glow when active */}
            {bouncing && (
              <ellipse
                cx="160"
                cy="60"
                rx="138"
                ry="26"
                fill="none"
                stroke={profile.accent}
                strokeWidth="2"
                opacity="0.7"
              />
            )}
          </svg>
        </div>
      </div>

      {/* small Атай avatar — the source of the coins */}
      <div className="relative z-10 mt-auto mb-8 flex flex-col items-center gap-2">
        <div
          ref={sourceRef}
          className="kiks-hover grid h-24 w-24 place-items-center overflow-hidden rounded-full ring-4 ring-white/80 shadow-xl shadow-black/40"
          style={{ background: profile.primary }}
        >
          {photoBase64 ? (
            <img
              src={photoBase64}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden="true" className="text-5xl">
              {profile.emoji}
            </span>
          )}
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-white/70">
          собрал {COIN_COUNT} монет
        </p>
      </div>
    </div>
  )
}
