import { useState } from 'react'
import { ProfileSelect } from './screens/ProfileSelect'
import { Game } from './screens/Game'
import type { ProfileId } from './types'

function App() {
  const [profile, setProfile] = useState<ProfileId | null>(null)

  if (!profile) {
    return <ProfileSelect onSelect={setProfile} />
  }

  return <Game profileId={profile} onExit={() => setProfile(null)} />
}

export default App
