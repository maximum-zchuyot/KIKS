import { useEffect, useState } from 'react'
import { ProfileSelect } from './screens/ProfileSelect'
import { PhotoUpload } from './screens/PhotoUpload'
import { Game } from './screens/Game'
import type { ProfileId } from './types'
import { loadProfile, setLastProfile } from './lib/storage'

type Stage = 'select' | 'photo' | 'game'

interface ActiveSession {
  profileId: ProfileId
  stage: Stage
}

function initialStageFor(id: ProfileId): Stage {
  return loadProfile(id).photoBase64 ? 'game' : 'photo'
}

function App() {
  const [session, setSession] = useState<ActiveSession | null>(null)

  useEffect(() => {
    if (session) setLastProfile(session.profileId)
    else setLastProfile(null)
  }, [session])

  if (!session) {
    return (
      <ProfileSelect
        onSelect={(profileId) =>
          setSession({ profileId, stage: initialStageFor(profileId) })
        }
      />
    )
  }

  if (session.stage === 'photo') {
    return (
      <PhotoUpload
        profileId={session.profileId}
        onDone={() => setSession({ ...session, stage: 'game' })}
        onBack={() => setSession(null)}
      />
    )
  }

  return (
    <Game
      profileId={session.profileId}
      onExit={() => setSession(null)}
    />
  )
}

export default App
