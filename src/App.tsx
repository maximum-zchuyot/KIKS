import { useState } from 'react'
import { ProfileSelect, type Profile } from './screens/ProfileSelect'

function App() {
  const [profile, setProfile] = useState<Profile | null>(null)

  if (!profile) {
    return <ProfileSelect onSelect={setProfile} />
  }

  return (
    <main className="flex h-full w-full flex-col items-center justify-center gap-6 bg-slate-900 p-6 text-center text-white">
      <h1 className="text-3xl font-bold">Привет, {profile}!</h1>
      <p className="text-base text-slate-300">
        Phase 1 готова. Игры появятся в следующих фазах.
      </p>
      <button
        type="button"
        onClick={() => setProfile(null)}
        className="mt-4 rounded-full bg-white/10 px-6 py-3 text-base font-medium text-white active:scale-95"
      >
        ← Сменить профиль
      </button>
    </main>
  )
}

export default App
