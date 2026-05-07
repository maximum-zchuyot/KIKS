import { useEffect, useRef, useState } from 'react'
import { PROFILES } from '../types'
import type { ProfileId } from '../types'
import { loadProfiles, resetProfile } from '../lib/storage'
import type { Profiles } from '../lib/storage'

type Props = {
  onSelect: (profile: ProfileId) => void
  onOpenParentSettings: () => void
}

const order: ProfileId[] = ['atai', 'emily']

const cardGradient: Record<ProfileId, string> = {
  atai: 'from-amber-400 via-orange-500 to-rose-500',
  emily: 'from-pink-400 via-fuchsia-500 to-violet-500',
}

const RESET_HOLD_MS = 800

export function ProfileSelect({ onSelect, onOpenParentSettings }: Props) {
  const [profiles, setProfiles] = useState<Profiles>(() => loadProfiles())
  const [resetMode, setResetMode] = useState(false)
  const holdTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const onStorage = () => setProfiles(loadProfiles())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const startGearHold = () => {
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current)
    holdTimerRef.current = window.setTimeout(() => {
      setResetMode(true)
      holdTimerRef.current = null
    }, RESET_HOLD_MS)
  }

  const cancelGearHold = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const handleReset = (id: ProfileId) => {
    const p = PROFILES[id]
    const ok = window.confirm(
      `Сбросить профиль ${p.displayName}? Фото и счёт удалятся.`,
    )
    if (!ok) return
    resetProfile(id)
    setProfiles(loadProfiles())
  }

  return (
    <main className="relative flex h-full w-full flex-col items-center justify-center gap-8 bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 p-6 text-white">
      <button
        type="button"
        aria-label="Настройки родителя"
        onPointerDown={startGearHold}
        onPointerUp={cancelGearHold}
        onPointerLeave={cancelGearHold}
        onPointerCancel={cancelGearHold}
        onClick={() => {
          if (resetMode) setResetMode(false)
        }}
        className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-lg backdrop-blur transition-colors ${
          resetMode ? 'bg-rose-600/80' : 'bg-white/10'
        }`}
      >
        ⚙️
      </button>

      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Кто играет?
        </h1>
        <p className="mt-2 text-base text-slate-300">
          {resetMode ? 'Тапни чтобы сбросить' : 'Выбери свой профиль'}
        </p>
      </header>

      <div className="flex w-full max-w-md flex-col gap-5">
        {order.map((id) => {
          const settings = PROFILES[id]
          const stored = profiles[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => (resetMode ? handleReset(id) : onSelect(id))}
              className={`group relative flex h-32 w-full items-center gap-5 overflow-hidden rounded-3xl bg-gradient-to-br ${cardGradient[id]} px-6 shadow-2xl shadow-black/40 ring-1 ring-white/20 transition-transform active:scale-[0.97] ${
                resetMode ? 'ring-2 ring-rose-300' : ''
              }`}
            >
              <div className="grid h-24 w-24 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-white/20 ring-2 ring-white/70">
                {stored.photoBase64 ? (
                  <img
                    src={stored.photoBase64}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span aria-hidden="true" className="text-5xl drop-shadow-lg">
                    {settings.emoji}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-3xl font-extrabold tracking-tight drop-shadow-md sm:text-4xl">
                  {settings.displayName}
                </span>
                {stored.totalScore > 0 && !resetMode && (
                  <span className="text-sm font-semibold text-white/80">
                    ★ {stored.totalScore}
                  </span>
                )}
                {resetMode && (
                  <span className="text-sm font-semibold text-white">
                    🗑️ Сбросить
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {!resetMode && (
        <button
          type="button"
          onClick={onOpenParentSettings}
          aria-label="Настройка родителя"
          className="rounded-full bg-white/10 px-5 py-3 text-sm font-bold text-white/90 backdrop-blur ring-1 ring-white/20 active:scale-95"
        >
          🎤 Настройка родителя
        </button>
      )}

      {!resetMode && (
        <p className="absolute bottom-3 left-3 text-[11px] text-white/40">
          ⚙️ удерживай для сброса
        </p>
      )}
    </main>
  )
}
