import { PROFILES } from '../types'
import type { ProfileId, ProfileSettings } from '../types'
import { createControls } from './controls'
import type { ControlsAPI } from './controls'
import { Player } from './Player'
import { Token } from './Token'
import type { LevelConfig, TokenType } from './levels'
import { THEMES } from './themes'
import type { Theme } from './themes'
import { createBackground } from './Background'
import type { Background } from './Background'

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
  /** 256×256 PNG data URL or null — drawn inside the player's circle. */
  photoBase64: string | null
  levels: LevelConfig[]
  startLevelIndex: number
  onScore: (delta: number, totalCollectedThisLevel: number, totalScore: number) => void
  onLevelComplete: (levelId: number, hasNext: boolean) => void
  /** Fires once after the player has spent {@link LEVEL3_WIN_DURATION_MS}
   *  on the endless level 3 — that's the win condition. */
  onGameWon: (totalScore: number) => void
}

const PARTICLE_LIFE = 0.55
const MAGNET_DURATION_MS = 3000

/** Level 3 (endless) auto-wins after this many ms — TZ §6 + the 3-минуты ask. */
const LEVEL3_WIN_DURATION_MS = 180_000
const LEVEL3_INDEX = 2

export class GameEngine {
  private cfg: GameEngineConfig
  private ctx: CanvasRenderingContext2D
  private profile: ProfileSettings
  private theme: Theme
  private player: Player
  private controls: ControlsAPI
  private background: Background

  private rafId = 0
  private running = false
  private lastTs = 0
  private spawnAcc = 0

  private tokens: Token[] = []
  private particles: Particle[] = []

  private levelIndex: number
  private collected = 0
  private score = 0
  private completed = false
  private magnetUntilTs = 0
  /** Wall-time spent on level 3, in ms. Capped by LEVEL3_WIN_DURATION_MS. */
  private level3ElapsedMs = 0
  private gameWonFired = false

  private width = 0
  private height = 0

  constructor(cfg: GameEngineConfig) {
    this.cfg = cfg
    const ctx = cfg.canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context unavailable')
    this.ctx = ctx
    this.profile = PROFILES[cfg.profileId]
    this.theme = THEMES[cfg.profileId]
    this.background = createBackground(this.theme.background)
    this.levelIndex = Math.max(
      0,
      Math.min(cfg.levels.length - 1, cfg.startLevelIndex),
    )

    this.player = new Player({
      emoji: this.profile.emoji,
      primary: this.profile.primary,
      accent: this.profile.accent,
      photoBase64: cfg.photoBase64,
    })
    this.controls = createControls(cfg.canvas, (tap) => {
      // Younger profiles can grab a token by tapping it directly (TZ helper):
      // hit-test first, fall through to the standard left/right move tap when
      // nothing is under the finger.
      if (this.profile.tapToCollect && !this.completed) {
        const hit = this.findTokenAt(tap.x, tap.y, 40)
        if (hit) {
          this.tokens = this.tokens.filter((t) => t !== hit)
          this.collect(hit, performance.now())
          return
        }
      }
      const step =
        tap.side === 'left' ? -this.profile.moveStep : this.profile.moveStep
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

  /** Switch to a different level index, resetting per-level state but keeping
   *  the running player position and total score. */
  loadLevel(index: number): void {
    if (index < 0 || index >= this.cfg.levels.length) return
    this.levelIndex = index
    this.collected = 0
    this.spawnAcc = 0
    this.tokens = []
    this.particles = []
    this.completed = false
    this.magnetUntilTs = 0
    if (index === LEVEL3_INDEX) this.level3ElapsedMs = 0
  }

  getCurrentLevelIndex(): number {
    return this.levelIndex
  }

  getDebug(): { gamma: number; hasGyro: boolean } {
    return {
      gamma: this.controls.getGamma(),
      hasGyro: this.controls.hasGyro(),
    }
  }

  private get currentLevel(): LevelConfig {
    return this.cfg.levels[this.levelIndex] ?? this.cfg.levels[0]
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
    this.background.resize(w, h)
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
    this.update(dt, ts)
    this.render()
    if (this.running) this.rafId = requestAnimationFrame(this.tick)
  }

  private update(dt: number, nowTs: number): void {
    this.background.update(dt)

    const level = this.currentLevel

    // Level 3 win timer — ticks only while we're actually on level 3 and the
    // win hasn't already fired. Stops spawning so the screen drains naturally.
    if (this.levelIndex === LEVEL3_INDEX && !this.gameWonFired) {
      this.level3ElapsedMs += dt * 1000
      if (this.level3ElapsedMs >= LEVEL3_WIN_DURATION_MS) {
        this.gameWonFired = true
        this.completed = true
        this.cfg.onGameWon(this.score)
      }
    }

    if (!this.completed) {
      this.spawnAcc += dt * 1000
      while (this.spawnAcc >= level.spawnIntervalMs) {
        this.spawnAcc -= level.spawnIntervalMs
        this.spawnToken(level)
      }
    }

    this.player.magnetActive = this.magnetUntilTs > nowTs
    this.player.update(
      dt,
      this.width,
      this.controls.getGamma(),
      this.profile.sensitivity,
      this.profile.tiltDeadzone,
    )

    const magnetTo = this.player.magnetActive
      ? { x: this.player.x, y: this.player.y }
      : undefined
    for (const t of this.tokens) t.update(dt, magnetTo)

    if (!this.completed) {
      const remaining: Token[] = []
      for (const t of this.tokens) {
        if (t.collidesWith(this.player)) {
          this.collect(t, nowTs)
        } else if (!t.isOffscreen(this.width, this.height)) {
          remaining.push(t)
        }
      }
      this.tokens = remaining
    } else {
      this.tokens = this.tokens.filter((t) => !t.isOffscreen(this.width, this.height))
    }

    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 320 * dt
      p.life -= dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)
  }

  private collect(t: Token, nowTs: number): void {
    this.collected += 1
    this.score += t.value
    this.spawnParticles(t.x, t.y, this.profile.accent)
    if (t.type === 'special') {
      this.magnetUntilTs = nowTs + MAGNET_DURATION_MS
    }
    this.cfg.onScore(t.value, this.collected, this.score)

    const target = this.currentLevel.tokensToComplete
    if (
      !this.completed &&
      Number.isFinite(target) &&
      this.collected >= target
    ) {
      this.completed = true
      const hasNext = this.levelIndex < this.cfg.levels.length - 1
      this.cfg.onLevelComplete(this.currentLevel.id, hasNext)
    }
  }

  private spawnToken(level: LevelConfig): void {
    const margin = 40
    const x = margin + Math.random() * Math.max(0, this.width - margin * 2)
    const type = pickWeighted(level.tokenTypes, level.weights)
    const speedMul = this.profile.fallSpeedMultiplier ?? 1
    this.tokens.push(
      new Token({
        x,
        y: -32,
        type,
        fallSpeed: level.fallSpeed * speedMul,
        sprite: this.theme.tokenSprite[type],
      }),
    )
  }

  private findTokenAt(x: number, y: number, slop: number): Token | undefined {
    let bestDistSq = Infinity
    let best: Token | undefined
    for (const t of this.tokens) {
      const dx = t.x - x
      const dy = t.y - y
      const d2 = dx * dx + dy * dy
      const r = t.radius + slop
      if (d2 <= r * r && d2 < bestDistSq) {
        bestDistSq = d2
        best = t
      }
    }
    return best
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

    this.background.draw(ctx)

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
