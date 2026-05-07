import { useEffect, useRef } from 'react'
import type { ProfileSettings } from '../types'

interface Props {
  profile: ProfileSettings
  photoBase64: string | null
  nextLevelId: number
  onSkip: () => void
}

const DURATION_MS = 4000
const SPRITES = ['❤️', '🌸', '✨', '🌷']
const PARTICLE_COUNT = 22

interface Sparkle {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
  scale: number
  sprite: string
}

/**
 * Эмили's level-transition skit:
 *   - her photo fills the screen and boings rhythmically
 *   - hearts / flowers / sparkles drift upward around her
 *   - "Молодец, Эмили!" + "Уровень N!" panel at the bottom
 *
 * Auto-advances after 4 s, tap anywhere skips early.
 */
export function CelebrationEmily({
  profile,
  photoBase64,
  nextLevelId,
  onSkip,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const t = window.setTimeout(onSkip, DURATION_MS)
    return () => window.clearTimeout(t)
  }, [onSkip])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
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

    const sparkles: Sparkle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: h + Math.random() * h * 0.5,
      vx: (Math.random() - 0.5) * 30,
      vy: -50 - Math.random() * 70,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 1.4,
      scale: 0.7 + Math.random() * 0.8,
      sprite: SPRITES[Math.floor(Math.random() * SPRITES.length)] ?? '❤️',
    }))

    let raf = 0
    let lastTs = performance.now()
    let stopped = false
    const tick = (ts: number) => {
      if (stopped) return
      const dt = Math.min((ts - lastTs) / 1000, 0.05)
      lastTs = ts

      ctx.clearRect(0, 0, w, h)
      for (const s of sparkles) {
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.rot += s.vrot * dt
        if (s.y < -40) {
          s.y = h + 20
          s.x = Math.random() * w
        }
        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.rot)
        ctx.scale(s.scale, s.scale)
        ctx.font = '34px "Segoe UI Emoji","Apple Color Emoji",sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(s.sprite, 0, 0)
        ctx.restore()
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)

    return () => {
      stopped = true
      window.cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      onPointerDown={onSkip}
      role="presentation"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden text-center text-white"
      style={{
        background: `linear-gradient(180deg, ${profile.bgFrom} 0%, ${profile.bgTo} 100%)`,
      }}
    >
      <div className="kiks-bounce-big absolute inset-0 z-0 grid place-items-center">
        {photoBase64 ? (
          <img
            src={photoBase64}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="text-[14rem] drop-shadow-2xl"
          >
            {profile.emoji}
          </span>
        )}
      </div>

      {/* readability scrim along the bottom for the headline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/3 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-20"
      />

      <div className="absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-2 px-6">
        <h2 className="kiks-pop rounded-full bg-black/35 px-6 py-3 text-4xl font-black tracking-tight drop-shadow-md sm:text-5xl">
          Молодец, {profile.displayName}!
        </h2>
        <p className="rounded-full bg-black/35 px-4 py-1 text-lg font-extrabold text-white/95">
          Уровень {nextLevelId}!
        </p>
      </div>
    </div>
  )
}
