import { useEffect, useState } from 'react'
import { ProfileSelect } from './screens/ProfileSelect'
import { PhotoUpload } from './screens/PhotoUpload'
import { Game } from './screens/Game'
import { ParentSettings } from './screens/ParentSettings'
import type { ProfileId } from './types'
import { loadProfile, setLastProfile } from './lib/storage'

type Stage = 'select' | 'photo' | 'game' | 'parent-settings'

interface ActiveSession {
  profileId: ProfileId
  stage: Exclude<Stage, 'parent-settings'>
}

function initialStageFor(id: ProfileId): Exclude<Stage, 'parent-settings'> {
  return loadProfile(id).photoBase64 ? 'game' : 'photo'
}

function App() {
  const [session, setSession] = useState<ActiveSession | null>(null)
  const [parentSettings, setParentSettings] = useState(false)

  useEffect(() => {
    if (session) setLastProfile(session.profileId)
    else setLastProfile(null)
  }, [session])

  if (parentSettings) {
    return <ParentSettings onBack={() => setParentSettings(false)} />
  }

  if (!session) {
    return (
      <ProfileSelect
        onSelect={(profileId) =>
          setSession({ profileId, stage: initialStageFor(profileId) })
        }
        onOpenParentSettings={() => setParentSettings(true)}
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
