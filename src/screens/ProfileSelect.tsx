export type Profile = 'Атай' | 'Эмили'

type Props = {
  onSelect: (profile: Profile) => void
}

const profiles: { name: Profile; emoji: string; gradient: string }[] = [
  {
    name: 'Атай',
    emoji: '🦁',
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
  },
  {
    name: 'Эмили',
    emoji: '🦄',
    gradient: 'from-pink-400 via-fuchsia-500 to-violet-500',
  },
]

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
        {profiles.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => onSelect(p.name)}
            className={`group relative flex h-32 w-full items-center justify-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br ${p.gradient} shadow-2xl shadow-black/40 ring-1 ring-white/20 transition-transform active:scale-[0.97]`}
          >
            <span
              aria-hidden="true"
              className="text-6xl drop-shadow-lg sm:text-7xl"
            >
              {p.emoji}
            </span>
            <span className="text-3xl font-extrabold tracking-tight drop-shadow-md sm:text-4xl">
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </main>
  )
}
