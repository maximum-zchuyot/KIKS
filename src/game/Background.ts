import type { BackgroundKind } from './themes'

export interface Background {
  resize(w: number, h: number): void
  update(dt: number): void
  draw(ctx: CanvasRenderingContext2D): void
}

export function createBackground(kind: BackgroundKind): Background {
  return kind === 'stars' ? new StarsBackground() : new CloudsBackground()
}

interface Star {
  x: number
  y: number
  r: number
  phase: number
  speed: number
}

class StarsBackground implements Background {
  private stars: Star[] = []
  private w = 0
  private h = 0

  resize(w: number, h: number): void {
    this.w = w
    this.h = h
    const target = Math.max(40, Math.min(140, Math.floor((w * h) / 9000)))
    if (this.stars.length === 0) {
      this.stars = Array.from({ length: target }, () => this.randomStar())
    }
  }

  private randomStar(): Star {
    return {
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      r: 0.7 + Math.random() * 1.7,
      phase: Math.random() * Math.PI * 2,
      speed: 6 + Math.random() * 16,
    }
  }

  update(dt: number): void {
    for (const s of this.stars) {
      s.phase += dt * 2.2
      s.y += s.speed * dt
      if (s.y > this.h + 4) {
        s.y = -4
        s.x = Math.random() * this.w
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.fillStyle = '#ffffff'
    for (const s of this.stars) {
      ctx.globalAlpha = 0.35 + Math.abs(Math.sin(s.phase)) * 0.55
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
}

interface Cloud {
  x: number
  y: number
  scale: number
  vx: number
}

class CloudsBackground implements Background {
  private clouds: Cloud[] = []
  private w = 0
  private h = 0

  resize(w: number, h: number): void {
    this.w = w
    this.h = h
    if (this.clouds.length === 0) {
      const count = 7
      this.clouds = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: 60 + (i * (h - 220)) / count + Math.random() * 30,
        scale: 0.7 + Math.random() * 0.7,
        vx: 6 + Math.random() * 14,
      }))
    }
  }

  update(dt: number): void {
    for (const c of this.clouds) {
      c.x += c.vx * dt
      const margin = 90 * c.scale
      if (c.x - margin > this.w) {
        c.x = -margin
        c.y = 60 + Math.random() * Math.max(120, this.h - 280)
        c.scale = 0.7 + Math.random() * 0.7
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    for (const c of this.clouds) {
      const r = 26 * c.scale
      ctx.globalAlpha = 0.85
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(c.x - r * 1.3, c.y, r * 0.85, 0, Math.PI * 2)
      ctx.arc(c.x - r * 0.3, c.y - r * 0.3, r, 0, Math.PI * 2)
      ctx.arc(c.x + r * 0.7, c.y - r * 0.2, r * 0.9, 0, Math.PI * 2)
      ctx.arc(c.x + r * 1.5, c.y, r * 0.7, 0, Math.PI * 2)
      ctx.arc(c.x + r * 0.3, c.y + r * 0.3, r * 0.95, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
}
