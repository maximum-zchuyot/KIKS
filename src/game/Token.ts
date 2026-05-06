import type { TokenType } from './levels'
import type { Player } from './Player'

const VALUES: Record<TokenType, number> = {
  basic: 1,
  bonus: 3,
  special: 1,
}

export interface TokenOptions {
  x: number
  y: number
  type: TokenType
  fallSpeed: number
  sprite: string
}

const MAGNET_SPEED = 900

export class Token {
  x: number
  y: number
  vx = 0
  vy: number
  radius = 28
  type: TokenType
  sprite: string
  spin = (Math.random() - 0.5) * 2
  age = 0

  constructor(opts: TokenOptions) {
    this.x = opts.x
    this.y = opts.y
    this.type = opts.type
    this.sprite = opts.sprite
    this.vy = opts.fallSpeed
  }

  get value(): number {
    return VALUES[this.type]
  }

  /** When `magnetTo` is set, the token is pulled toward that point at a fixed speed. */
  update(dt: number, magnetTo?: { x: number; y: number }): void {
    if (magnetTo) {
      const dx = magnetTo.x - this.x
      const dy = magnetTo.y - this.y
      const dist = Math.hypot(dx, dy) || 1
      this.vx = (dx / dist) * MAGNET_SPEED
      this.vy = (dy / dist) * MAGNET_SPEED
    }
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.age += dt
  }

  isOffscreen(canvasHeight: number): boolean {
    return this.y - this.radius > canvasHeight
  }

  collidesWith(p: Player): boolean {
    const dx = this.x - p.x
    const dy = this.y - p.y
    const r = this.radius + p.radius - 6
    return dx * dx + dy * dy <= r * r
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(Math.sin(this.age * 2) * 0.15 * this.spin)
    ctx.font = `${this.radius * 1.7}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.sprite, 0, 2)
    ctx.restore()
  }
}
