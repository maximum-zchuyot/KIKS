import type { TokenType } from './levels'
import type { Player } from './Player'

const SPRITES: Record<TokenType, string> = {
  basic: '🪙',
  bonus: '⭐',
  special: '🌈',
}

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
}

export class Token {
  x: number
  y: number
  radius = 28
  type: TokenType
  fallSpeed: number
  spin = (Math.random() - 0.5) * 2
  age = 0

  constructor(opts: TokenOptions) {
    this.x = opts.x
    this.y = opts.y
    this.type = opts.type
    this.fallSpeed = opts.fallSpeed
  }

  get value(): number {
    return VALUES[this.type]
  }

  update(dt: number): void {
    this.y += this.fallSpeed * dt
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
    ctx.fillText(SPRITES[this.type], 0, 2)
    ctx.restore()
  }
}
