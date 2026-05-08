import { useEffect } from 'react'
import type { ProfileSettings } from '../types'

interface Props {
  profile: ProfileSettings
  photoBase64: string | null
  totalScore: number
  onDone: () => void
}

const DURATION_MS = 8000

/**
 * "Игра закончена — победа!" screen, fired after 3 minutes on level 3.
 * The active child climbs into a rocket and lifts off into a starry night
 * sky; auto-returns to the profile-select screen after ~8 s. Touch is
 * intentionally not bound to the skip path — kids can sit through this.
 */
export function GameWon({ profile, photoBase64, totalScore, onDone }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDone, DURATION_MS)
    return () => window.clearTimeout(t)
  }, [onDone])

  return (
    <div
      role="presentation"
      className="absolute inset-0 z-40 overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-purple-950 text-center text-white"
    >
      {/* Twinkling sky props — same vocabulary as Эмили's launch phase. */}
      <div className="pointer-events-none absolute inset-0">
        <span className="kiks-twinkle absolute text-4xl" style={{ top: '6%', left: '8%' }} aria-hidden="true">⭐</span>
        <span className="kiks-twinkle absolute text-3xl" style={{ top: '12%', left: '70%', animationDelay: '0.3s' }} aria-hidden="true">🌟</span>
        <span className="kiks-twinkle absolute text-3xl" style={{ top: '20%', left: '28%', animationDelay: '0.6s' }} aria-hidden="true">✨</span>
        <span className="kiks-twinkle absolute text-3xl" style={{ top: '26%', left: '85%', animationDelay: '0.9s' }} aria-hidden="true">⭐</span>
        <span className="kiks-twinkle absolute text-2xl" style={{ top: '36%', left: '52%', animationDelay: '1.2s' }} aria-hidden="true">🌟</span>
        <span className="kiks-twinkle absolute text-3xl" style={{ top: '44%', left: '14%', animationDelay: '1.5s' }} aria-hidden="true">✨</span>
        <span className="kiks-spin absolute text-6xl" style={{ top: '5%', right: '8%' }} aria-hidden="true">☀️</span>
        <span className="kiks-twinkle absolute text-5xl" style={{ top: '32%', left: '4%', animationDelay: '0.4s' }} aria-hidden="true">🌙</span>
      </div>

      {/* Headline */}
      <div className="relative z-10 mt-12 px-6">
        <h1 className="kiks-pop text-5xl font-black tracking-tight drop-shadow-md sm:text-6xl">
          🏆 Победа!
        </h1>
        <p className="kiks-pop mt-3 text-2xl font-extrabold sm:text-3xl">
          Молодец, {profile.displayName}!
        </p>
        {totalScore > 0 && (
          <p className="mt-1 text-lg font-bold text-white/85 tabular-nums">
            ★ {totalScore} очков
          </p>
        )}
      </div>

      {/* Rocket with the child's photo in the porthole. Anchored bottom-centre,
          translates 130 vh up over 7 s with a cubic-bezier "launch" curve. */}
      <div
        className="kiks-rocket-up absolute bottom-0 left-1/2 z-20 flex flex-col items-center"
        style={{ transform: 'translateX(-50%)' }}
      >
        <div
          className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-white/15 ring-4 ring-white/85 shadow-2xl shadow-black/50"
          style={{ background: profile.primary }}
        >
          {photoBase64 ? (
            <img
              src={photoBase64}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden="true" className="text-5xl">
              {profile.emoji}
            </span>
          )}
        </div>
        <div className="text-9xl drop-shadow-2xl" aria-hidden="true">
          🚀
        </div>
      </div>

      {/* Subtle ground glow at lift-off so the rocket has somewhere to leave from. */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 z-10 h-32 w-72 -translate-x-1/2 rounded-full opacity-70 blur-2xl"
        style={{ background: profile.accent }}
      />
    </div>
  )
}
