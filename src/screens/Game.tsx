import { useEffect, useMemo, useRef, useState } from 'react'
import { GameEngine } from '../game/GameEngine'
import { LEVELS } from '../game/levels'
import { ensureOrientationPermission } from '../game/controls'
import { PROFILES } from '../types'
import type { ProfileId } from '../types'
import { loadProfile, updateProfile } from '../lib/storage'

type Props = {
  profileId: ProfileId
  onExit: () => void
}

export function Game({ profileId, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [started, setStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [collected, setCollected] = useState(0)
  const [done, setDone] = useState(false)
  const [debug, setDebug] = useState({ gamma: 0, hasGyro: false })

  const profile = PROFILES[profileId]
  const level = LEVELS[0]
  const stored = useMemo(() => loadProfile(profileId), [profileId])

  useEffect(() => {
    if (!started || !canvasRef.current) return
    const engine = new GameEngine({
      canvas: canvasRef.current,
      profileId,
      photoBase64: stored.photoBase64,
      level,
      onScore: (_delta, total, totalScore) => {
        setCollected(total)
        setScore(totalScore)
      },
      onComplete: () => {
        setDone(true)
        updateProfile(profileId, {
          totalScore: stored.totalScore + level.tokensToComplete,
          highestLevelReached: Math.max(stored.highestLevelReached, level.id),
          lastPlayedAt: Date.now(),
        })
      },
    })
    engineRef.current = engine
    engine.start()
    const debugTimer = window.setInterval(() => {
      setDebug(engine.getDebug())
    }, 200)
    return () => {
      window.clearInterval(debugTimer)
      engine.stop()
      engineRef.current = null
    }
  }, [started, profileId, level, stored])

  const handleStart = async () => {
    await ensureOrientationPermission()
    try {
      const so = screen.orientation as ScreenOrientation & {
        lock?: (o: 'portrait') => Promise<void>
      }
      void so.lock?.('portrait').catch(() => {})
    } catch {
      // not supported
    }
    setStarted(true)
  }

  const target = level.tokensToComplete
  const targetLabel = Number.isFinite(target) ? `/${target}` : ''

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none select-none"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 text-white">
        <button
          type="button"
          onClick={onExit}
          className="pointer-events-auto rounded-full bg-black/40 px-4 py-2 text-sm font-semibold backdrop-blur active:scale-95"
        >
          ← Назад
        </button>
        <div className="rounded-full bg-black/40 px-5 py-2 text-base font-extrabold tabular-nums backdrop-blur sm:text-lg">
          {profile.emoji} {collected}
          {targetLabel} · {score} ★
        </div>
        <div className="w-16" aria-hidden="true" />
      </div>

      {started && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center text-white">
          <div
            className={`rounded-full px-3 py-1 text-xs font-mono tabular-nums backdrop-blur ${
              debug.hasGyro ? 'bg-emerald-600/60' : 'bg-rose-600/70'
            }`}
          >
            {debug.hasGyro
              ? `gyro γ ${debug.gamma.toFixed(1)}°`
              : 'gyro: нет событий'}
          </div>
        </div>
      )}

      {!started && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center text-white"
          style={{
            background: `linear-gradient(180deg, ${profile.bgFrom} 0%, ${profile.bgTo} 100%)`,
          }}
        >
          <div className="text-7xl">{profile.emoji}</div>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Привет, {profile.displayName}!
          </h2>
          <p className="max-w-xs text-base text-white/90">
            Наклоняй телефон или тапай слева/справа, чтобы ловить монетки.
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="rounded-full bg-white px-10 py-5 text-2xl font-extrabold text-slate-900 shadow-2xl shadow-black/40 active:scale-95"
          >
            Поехали!
          </button>
        </div>
      )}

      {done && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/65 p-8 text-center text-white backdrop-blur-sm">
          <div className="animate-bounce text-7xl">🎉</div>
          <h2 className="text-5xl font-black tracking-tight">Молодец!</h2>
          <p className="text-xl">
            Уровень {level.id} пройден · {score} ★
          </p>
          <button
            type="button"
            onClick={onExit}
            className="rounded-full bg-white px-8 py-4 text-xl font-extrabold text-slate-900 shadow-xl active:scale-95"
          >
            На главную
          </button>
        </div>
      )}
    </div>
  )
}
