const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v

export interface PlayerOptions {
  emoji: string
  primary: string
  accent: string
  /** 256×256 PNG data URL with alpha-clipped circle, or null. */
  photoBase64?: string | null
}

/**
 * Round avatar fixed in the lower quarter of the screen (Section 5.2).
 * Renders the child's circular photo when available; falls back to an emoji
 * placeholder until Phase 3's photo upload completes.
 */
export class Player {
  x = 0
  y = 0
  /** target x driven by touch taps, eased toward smoothly */
  targetX = 0
  radius = 44
  emoji: string
  primary: string
  accent: string
  private photo: HTMLImageElement | null = null
  private photoReady = false

  constructor(opts: PlayerOptions) {
    this.emoji = opts.emoji
    this.primary = opts.primary
    this.accent = opts.accent
    if (opts.photoBase64) this.setPhoto(opts.photoBase64)
  }

  setPhoto(dataUrl: string | null): void {
    if (!dataUrl) {
      this.photo = null
      this.photoReady = false
      return
    }
    const img = new Image()
    img.onload = () => {
      if (this.photo === img) this.photoReady = true
    }
    img.src = dataUrl
    this.photo = img
    this.photoReady = false
  }

  /**
   * Section 5.3 movement formula.
   *  - gyro: continuous tilt → x += tilt * sensitivity * dt
   *  - touch: discrete steps land in targetX, x eases toward it
   */
  update(
    dt: number,
    canvasWidth: number,
    tilt: number,
    sensitivity: number,
  ): void {
    const minX = this.radius
    const maxX = canvasWidth - this.radius
    this.x += tilt * sensitivity * dt
    this.x += (this.targetX - this.x) * Math.min(1, dt * 12)
    this.x = clamp(this.x, minX, maxX)
    this.targetX = clamp(this.targetX, minX, maxX)
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2)
    ctx.fillStyle = this.accent
    ctx.globalAlpha = 0.35
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = this.primary
    ctx.fill()

    if (this.photo && this.photoReady) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius - 1, 0, Math.PI * 2)
      ctx.clip()
      const d = (this.radius - 1) * 2
      ctx.drawImage(this.photo, this.x - this.radius + 1, this.y - this.radius + 1, d, d)
      ctx.restore()
    } else {
      ctx.font = `${Math.floor(this.radius * 1.2)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(this.emoji, this.x, this.y + 2)
    }

    ctx.lineWidth = 4
    ctx.strokeStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}
