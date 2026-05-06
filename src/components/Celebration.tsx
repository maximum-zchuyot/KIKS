import { useEffect, useRef } from 'react'
import type { ProfileSettings } from '../types'

interface Props {
  profile: ProfileSettings
  photoBase64: string | null
  nextLevelId: number
  onSkip: () => void
  durationMs?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
  size: number
  color: string
  life: number
  maxLife: number
}

/**
 * Full-screen celebration screen between levels (TZ §4.4):
 *  - profile gradient background
 *  - canvas-based confetti burst from the centre
 *  - bouncing photo (or emoji placeholder) of the child
 *  - "Молодец, NAME!" + "Уровень N!" headline
 *  - auto-dismiss after `durationMs` (default 3000), tap anywhere to skip
 */
export function Celebration({
  profile,
  photoBase64,
  nextLevelId,
  onSkip,
  durationMs = 3000,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const t = window.setTimeout(onSkip, durationMs)
    return () => window.clearTimeout(t)
  }, [onSkip, durationMs])

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

    const colors = [profile.primary, profile.secondary, profile.accent, '#ffffff']
    const cx = w / 2
    const cy = h * 0.45
    const particles: Particle[] = Array.from({ length: 110 }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 220 + Math.random() * 520
      const life = 1.4 + Math.random() * 1.2
      return {
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 220,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 10,
        size: 5 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)] ?? '#ffffff',
        life,
        maxLife: life,
      }
    })

    let raf = 0
    let lastTs = performance.now()
    let stopped = false

    const tick = (ts: number) => {
      if (stopped) return
      const dt = Math.min((ts - lastTs) / 1000, 0.05)
      lastTs = ts

      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        if (p.life <= 0) continue
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 900 * dt
        p.rot += p.vrot * dt
        p.life -= dt

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.min(1, p.life / 0.5)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size, -p.size * 0.45, p.size * 2, p.size * 0.9)
        ctx.restore()
      }
      ctx.globalAlpha = 1

      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)

    return () => {
      stopped = true
      window.cancelAnimationFrame(raf)
    }
  }, [profile])

  return (
    <div
      onPointerDown={onSkip}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 overflow-hidden text-center text-white"
      style={{
        background: `linear-gradient(180deg, ${profile.bgFrom} 0%, ${profile.bgTo} 100%)`,
      }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0"
      />

      <div className="relative z-10 flex flex-col items-center gap-5 px-6">
        <div className="kiks-bob grid h-52 w-52 place-items-center overflow-hidden rounded-full bg-white/20 shadow-2xl shadow-black/50 ring-4 ring-white/80">
          {photoBase64 ? (
            <img
              src={photoBase64}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden="true" className="text-8xl">
              {profile.emoji}
            </span>
          )}
        </div>

        <h2 className="kiks-pop text-5xl font-black tracking-tight drop-shadow-md sm:text-6xl">
          Молодец, {profile.displayName}!
        </h2>
        <p className="text-2xl font-extrabold text-white/90">
          Уровень {nextLevelId}!
        </p>
      </div>
    </div>
  )
}
