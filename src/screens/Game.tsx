import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameEngine } from '../game/GameEngine'
import { LEVELS } from '../game/levels'
import { ensureOrientationPermission } from '../game/controls'
import { PROFILES } from '../types'
import type { ProfileId } from '../types'
import { loadProfile, updateProfile } from '../lib/storage'
import { CelebrationAtai } from '../components/CelebrationAtai'
import { CelebrationEmily } from '../components/CelebrationEmily'

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
  const [levelIndex, setLevelIndex] = useState(0)
  const [transitionToId, setTransitionToId] = useState<number | null>(null)
  const [debug, setDebug] = useState({ gamma: 0, hasGyro: false })

  const profile = PROFILES[profileId]
  const stored = useMemo(() => loadProfile(profileId), [profileId])

  const liveScoreRef = useRef(0)
  const pendingNextIndexRef = useRef<number | null>(null)

  const applyPendingTransition = useCallback(() => {
    const next = pendingNextIndexRef.current
    if (next === null) return
    pendingNextIndexRef.current = null
    const engine = engineRef.current
    if (engine) engine.loadLevel(next)
    setLevelIndex(next)
    setCollected(0)
    setTransitionToId(null)
  }, [])

  useEffect(() => {
    if (!started || !canvasRef.current) return

    const engine = new GameEngine({
      canvas: canvasRef.current,
      profileId,
      photoBase64: stored.photoBase64,
      levels: LEVELS,
      startLevelIndex: 0,
      onScore: (_delta, total, totalScore) => {
        setCollected(total)
        setScore(totalScore)
        liveScoreRef.current = totalScore
      },
      onLevelComplete: (levelId, hasNext) => {
        updateProfile(profileId, {
          totalScore: stored.totalScore + liveScoreRef.current,
          highestLevelReached: Math.max(stored.highestLevelReached, levelId),
          lastPlayedAt: Date.now(),
        })
        if (!hasNext) return
        const nextIndex = engine.getCurrentLevelIndex() + 1
        const nextId = LEVELS[nextIndex]?.id ?? null
        if (nextId === null) return
        pendingNextIndexRef.current = nextIndex
        setTransitionToId(nextId)
        // The Celebration components own their own duration + auto-skip;
        // they call onSkip when done (or on tap), which advances the engine.
      },
    })
    engineRef.current = engine

    const debugTimer = window.setInterval(() => {
      setDebug(engine.getDebug())
    }, 200)

    engine.start()
    return () => {
      window.clearInterval(debugTimer)
      pendingNextIndexRef.current = null
      engine.stop()
      engineRef.current = null
    }
  }, [started, profileId, stored])

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

  const currentLevel = LEVELS[levelIndex] ?? LEVELS[0]
  const targetLabel = Number.isFinite(currentLevel.tokensToComplete)
    ? `/${currentLevel.tokensToComplete}`
    : ' ∞'

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
          aria-label="Выйти из игры"
          className="pointer-events-auto rounded-full bg-black/40 px-4 py-2 text-sm font-semibold backdrop-blur active:scale-95"
        >
          ← Назад
        </button>
        <div className="flex flex-col items-center gap-1">
          <div
            key={`level-${currentLevel.id}`}
            className="kiks-pop rounded-full bg-black/40 px-4 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur"
          >
            Уровень {currentLevel.id}
          </div>
          <div className="rounded-full bg-black/40 px-5 py-2 text-base font-extrabold tabular-nums backdrop-blur sm:text-lg">
            {profile.emoji} {collected}
            {targetLabel} · {score} ★
          </div>
        </div>
        <div className="w-16" aria-hidden="true" />
      </div>

      {started && transitionToId === null && (
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
            Наклоняй телефон или тапай слева/справа, чтобы ловить.
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

      {transitionToId !== null &&
        (profileId === 'atai' ? (
          <CelebrationAtai
            profile={profile}
            photoBase64={stored.photoBase64}
            nextLevelId={transitionToId}
            onSkip={applyPendingTransition}
          />
        ) : (
          <CelebrationEmily
            profile={profile}
            photoBase64={stored.photoBase64}
            nextLevelId={transitionToId}
            onSkip={applyPendingTransition}
          />
        ))}
    </div>
  )
}
