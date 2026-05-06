import { useEffect, useRef, useState } from 'react'
import { PROFILES } from '../types'
import type { ProfileId } from '../types'
import { detectAndCrop, drawCircleCrop, loadImageFromFile } from '../lib/faceDetection'
import { updateProfile } from '../lib/storage'

type Stage = 'idle' | 'detecting' | 'manual' | 'saving'

interface Props {
  profileId: ProfileId
  onDone: () => void
  onBack: () => void
}

const FRAME = 320
const DETECT_TIMEOUT_MS = 2000

const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v

export function PhotoUpload({ profileId, onDone, onBack }: Props) {
  const profile = PROFILES[profileId]
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const transformRef = useRef({ x: 0, y: 0, s: 1 })
  const dragRef = useRef<
    | { kind: 'pan'; sx: number; sy: number; ix: number; iy: number }
    | { kind: 'pinch'; dist: number; scale: number }
    | null
  >(null)

  const draw = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y, s } = transformRef.current

    ctx.clearRect(0, 0, FRAME, FRAME)

    ctx.save()
    ctx.translate(FRAME / 2 + x, FRAME / 2 + y)
    ctx.scale(s, s)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, FRAME, FRAME)
    ctx.arc(FRAME / 2, FRAME / 2, FRAME / 2 - 6, 0, Math.PI * 2, true)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fill('evenodd')
    ctx.restore()

    ctx.beginPath()
    ctx.arc(FRAME / 2, FRAME / 2, FRAME / 2 - 6, 0, Math.PI * 2)
    ctx.lineWidth = 4
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
  }

  useEffect(() => {
    if (stage !== 'manual') return
    draw()
  }, [stage])

  const enterManual = (img: HTMLImageElement) => {
    imageRef.current = img
    const cover =
      FRAME / Math.min(img.naturalWidth || 1, img.naturalHeight || 1)
    transformRef.current = { x: 0, y: 0, s: cover }
    setStage('manual')
  }

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again later
    if (!file) return
    setError(null)
    setHint(null)
    setStage('detecting')

    let img: HTMLImageElement
    try {
      img = await loadImageFromFile(file)
    } catch {
      setStage('idle')
      setError('Не получилось прочитать фото. Попробуй другое.')
      return
    }

    let cropped: string | null = null
    try {
      cropped = await Promise.race<string | null>([
        detectAndCrop(img),
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), DETECT_TIMEOUT_MS),
        ),
      ])
    } catch {
      cropped = null
    }

    if (cropped) {
      updateProfile(profileId, { photoBase64: cropped })
      onDone()
      return
    }

    setHint('Лицо не нашлось — подвинь и подгони круг сам.')
    enterManual(img)
  }

  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const t = e.touches
    if (t.length === 1) {
      dragRef.current = {
        kind: 'pan',
        sx: t[0].clientX,
        sy: t[0].clientY,
        ix: transformRef.current.x,
        iy: transformRef.current.y,
      }
    } else if (t.length >= 2) {
      const dx = t[0].clientX - t[1].clientX
      const dy = t[0].clientY - t[1].clientY
      dragRef.current = {
        kind: 'pinch',
        dist: Math.hypot(dx, dy) || 1,
        scale: transformRef.current.s,
      }
    }
  }

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const drag = dragRef.current
    if (!drag) return
    const t = e.touches
    if (drag.kind === 'pan' && t.length === 1) {
      transformRef.current.x = drag.ix + (t[0].clientX - drag.sx)
      transformRef.current.y = drag.iy + (t[0].clientY - drag.sy)
      draw()
    } else if (drag.kind === 'pinch' && t.length >= 2) {
      const dx = t[0].clientX - t[1].clientX
      const dy = t[0].clientY - t[1].clientY
      const d = Math.hypot(dx, dy) || 1
      transformRef.current.s = clamp(
        (drag.scale * d) / drag.dist,
        0.2,
        6,
      )
      draw()
    }
  }

  const onTouchEnd = () => {
    dragRef.current = null
  }

  const handleZoomSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value)
    if (Number.isFinite(next)) {
      transformRef.current.s = next
      draw()
    }
  }

  const handleManualDone = () => {
    const img = imageRef.current
    if (!img) return
    setStage('saving')

    const { x, y, s } = transformRef.current
    const tmp = document.createElement('canvas')
    tmp.width = FRAME
    tmp.height = FRAME
    const tctx = tmp.getContext('2d')
    if (!tctx) return
    tctx.translate(FRAME / 2 + x, FRAME / 2 + y)
    tctx.scale(s, s)
    tctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)

    const dataUrl = drawCircleCrop(tmp, FRAME / 2, FRAME / 2, FRAME)
    updateProfile(profileId, { photoBase64: dataUrl })
    onDone()
  }

  return (
    <main
      className="flex h-full w-full flex-col items-center justify-center gap-6 p-6 text-center text-white"
      style={{
        background: `linear-gradient(180deg, ${profile.bgFrom} 0%, ${profile.bgTo} 100%)`,
      }}
    >
      <header>
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          Фото для {profile.displayName}
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Снимем себя или выберем из галереи — будет твой герой в игре.
        </p>
      </header>

      {stage === 'idle' && (
        <div className="flex w-full max-w-sm flex-col gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-white px-8 py-5 text-2xl font-extrabold text-slate-900 shadow-2xl shadow-black/40 active:scale-95"
          >
            📷 Выбрать фото
          </button>
          {error && (
            <p className="rounded-2xl bg-rose-700/70 px-4 py-2 text-sm">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onBack}
            className="rounded-full bg-black/30 px-6 py-3 text-base font-semibold backdrop-blur active:scale-95"
          >
            ← Назад
          </button>
        </div>
      )}

      {stage === 'detecting' && (
        <p className="text-xl font-semibold">Ищем лицо…</p>
      )}

      {stage === 'manual' && (
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          {hint && (
            <p className="rounded-full bg-black/35 px-4 py-2 text-sm">
              {hint}
            </p>
          )}
          <canvas
            ref={canvasRef}
            width={FRAME}
            height={FRAME}
            className="rounded-3xl bg-black/40 shadow-2xl shadow-black/40"
            style={{
              width: FRAME,
              height: FRAME,
              touchAction: 'none',
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
          />
          <input
            type="range"
            min={0.2}
            max={6}
            step={0.01}
            defaultValue={transformRef.current.s}
            onChange={handleZoomSlider}
            className="w-full accent-white"
            aria-label="Масштаб"
          />
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-full bg-black/30 px-4 py-3 text-base font-semibold backdrop-blur active:scale-95"
            >
              Другое фото
            </button>
            <button
              type="button"
              onClick={handleManualDone}
              className="flex-1 rounded-full bg-white px-4 py-3 text-base font-extrabold text-slate-900 shadow-xl active:scale-95"
            >
              Готово
            </button>
          </div>
        </div>
      )}

      {stage === 'saving' && (
        <p className="text-xl font-semibold">Сохраняем…</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </main>
  )
}
