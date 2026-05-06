import { PROFILES } from '../types'
import type { ProfileId, ProfileSettings } from '../types'
import { createControls } from './controls'
import type { ControlsAPI } from './controls'
import { Player } from './Player'
import { Token } from './Token'
import type { LevelConfig, TokenType } from './levels'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
}

export interface GameEngineConfig {
  canvas: HTMLCanvasElement
  profileId: ProfileId
  level: LevelConfig
  onScore: (delta: number, totalCollected: number, totalScore: number) => void
  onComplete: () => void
}

const PARTICLE_LIFE = 0.55

export class GameEngine {
  private cfg: GameEngineConfig
  private ctx: CanvasRenderingContext2D
  private profile: ProfileSettings
  private player: Player
  private controls: ControlsAPI

  private rafId = 0
  private running = false
  private lastTs = 0
  private spawnAcc = 0

  private tokens: Token[] = []
  private particles: Particle[] = []

  private collected = 0
  private score = 0
  private completed = false

  private width = 0
  private height = 0

  constructor(cfg: GameEngineConfig) {
    this.cfg = cfg
    const ctx = cfg.canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context unavailable')
    this.ctx = ctx
    this.profile = PROFILES[cfg.profileId]
    this.player = new Player({
      emoji: this.profile.emoji,
      primary: this.profile.primary,
      accent: this.profile.accent,
    })
    this.controls = createControls(cfg.canvas, (side) => {
      const step = side === 'left' ? -this.profile.moveStep : this.profile.moveStep
      this.player.targetX += step
    })

    this.handleResize()
    window.addEventListener('resize', this.handleResize)
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTs = performance.now()
    this.rafId = requestAnimationFrame(this.tick)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
    this.controls.destroy()
    window.removeEventListener('resize', this.handleResize)
  }

  private handleResize = (): void => {
    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    const canvas = this.cfg.canvas
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.width = w
    this.height = h
    this.player.y = h * 0.78
    if (this.player.x === 0) {
      this.player.x = w / 2
      this.player.targetX = w / 2
    }
  }

  private tick = (ts: number): void => {
    if (!this.running) return
    const dt = Math.min((ts - this.lastTs) / 1000, 0.1)
    this.lastTs = ts
    this.update(dt)
    this.render()
    if (this.running) this.rafId = requestAnimationFrame(this.tick)
  }

  private update(dt: number): void {
    if (!this.completed) {
      this.spawnAcc += dt * 1000
      while (this.spawnAcc >= this.cfg.level.spawnIntervalMs) {
        this.spawnAcc -= this.cfg.level.spawnIntervalMs
        this.spawnToken()
      }
    }

    this.player.update(
      dt,
      this.width,
      this.controls.getGamma(),
      this.profile.sensitivity,
    )

    for (const t of this.tokens) t.update(dt)

    if (!this.completed) {
      const remaining: Token[] = []
      for (const t of this.tokens) {
        if (t.collidesWith(this.player)) {
          this.collect(t)
        } else if (!t.isOffscreen(this.height)) {
          remaining.push(t)
        }
      }
      this.tokens = remaining
    } else {
      this.tokens = this.tokens.filter((t) => !t.isOffscreen(this.height))
    }

    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 320 * dt
      p.life -= dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)
  }

  private collect(t: Token): void {
    this.collected += 1
    this.score += t.value
    this.spawnParticles(t.x, t.y, this.profile.accent)
    this.cfg.onScore(t.value, this.collected, this.score)
    if (
      !this.completed &&
      this.collected >= this.cfg.level.tokensToComplete
    ) {
      this.completed = true
      this.cfg.onComplete()
    }
  }

  private spawnToken(): void {
    const margin = 40
    const x = margin + Math.random() * Math.max(0, this.width - margin * 2)
    const type = pickWeighted(
      this.cfg.level.tokenTypes,
      this.cfg.level.weights,
    )
    this.tokens.push(
      new Token({
        x,
        y: -32,
        type,
        fallSpeed: this.cfg.level.fallSpeed,
      }),
    )
  }

  private spawnParticles(x: number, y: number, color: string): void {
    const n = 4 + Math.floor(Math.random() * 3)
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 120 + Math.random() * 140
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        life: PARTICLE_LIFE,
        maxLife: PARTICLE_LIFE,
        color,
      })
    }
  }

  private render(): void {
    const ctx = this.ctx
    const w = this.width
    const h = this.height

    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, this.profile.bgFrom)
    grad.addColorStop(1, this.profile.bgTo)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    for (const t of this.tokens) t.draw(ctx)
    this.player.draw(ctx)

    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.maxLife)
      ctx.globalAlpha = a
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

function pickWeighted(
  types: TokenType[],
  weights?: Partial<Record<TokenType, number>>,
): TokenType {
  if (!weights || types.length === 1) {
    return types[Math.floor(Math.random() * types.length)] ?? 'basic'
  }
  let total = 0
  for (const t of types) total += weights[t] ?? 0
  if (total <= 0) {
    return types[Math.floor(Math.random() * types.length)] ?? 'basic'
  }
  let r = Math.random() * total
  for (const t of types) {
    r -= weights[t] ?? 0
    if (r <= 0) return t
  }
  return types[types.length - 1] ?? 'basic'
}
