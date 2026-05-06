import { PROFILES } from '../types'
import type { ProfileId } from '../types'

type Props = {
  onSelect: (profile: ProfileId) => void
}

const order: ProfileId[] = ['atai', 'emily']

const cardGradient: Record<ProfileId, string> = {
  atai: 'from-amber-400 via-orange-500 to-rose-500',
  emily: 'from-pink-400 via-fuchsia-500 to-violet-500',
}

export function ProfileSelect({ onSelect }: Props) {
  return (
    <main className="flex h-full w-full flex-col items-center justify-center gap-8 bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 p-6 text-white">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Кто играет?
        </h1>
        <p className="mt-2 text-base text-slate-300">Выбери свой профиль</p>
      </header>

      <div className="flex w-full max-w-md flex-col gap-5">
        {order.map((id) => {
          const p = PROFILES[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`group relative flex h-32 w-full items-center justify-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br ${cardGradient[id]} shadow-2xl shadow-black/40 ring-1 ring-white/20 transition-transform active:scale-[0.97]`}
            >
              <span
                aria-hidden="true"
                className="text-6xl drop-shadow-lg sm:text-7xl"
              >
                {p.emoji}
              </span>
              <span className="text-3xl font-extrabold tracking-tight drop-shadow-md sm:text-4xl">
                {p.displayName}
              </span>
            </button>
          )
        })}
      </div>
    </main>
  )
}
