import type { ProfileId } from '../types'

export interface Profile {
  name: ProfileId
  /** 256×256 PNG data URL with circular alpha mask, or null if not set */
  photoBase64: string | null
  totalScore: number
  highestLevelReached: number
  lastPlayedAt: number
}

export type Profiles = Record<ProfileId, Profile>

const KEY_PROFILES = 'profiles'
const KEY_LAST = 'lastProfile'

const ALL_IDS: ProfileId[] = ['atai', 'emily']

function emptyProfile(name: ProfileId): Profile {
  return {
    name,
    photoBase64: null,
    totalScore: 0,
    highestLevelReached: 0,
    lastPlayedAt: 0,
  }
}

function emptyProfiles(): Profiles {
  return { atai: emptyProfile('atai'), emily: emptyProfile('emily') }
}

export function loadProfiles(): Profiles {
  try {
    const raw = localStorage.getItem(KEY_PROFILES)
    if (!raw) return emptyProfiles()
    const parsed = JSON.parse(raw) as Partial<Profiles>
    const result = emptyProfiles()
    for (const id of ALL_IDS) {
      const p = parsed[id]
      if (p && typeof p === 'object') result[id] = { ...result[id], ...p, name: id }
    }
    return result
  } catch {
    return emptyProfiles()
  }
}

export function loadProfile(id: ProfileId): Profile {
  return loadProfiles()[id]
}

export function saveProfile(profile: Profile): void {
  const all = loadProfiles()
  all[profile.name] = profile
  localStorage.setItem(KEY_PROFILES, JSON.stringify(all))
}

export function updateProfile(
  id: ProfileId,
  patch: Partial<Omit<Profile, 'name'>>,
): Profile {
  const all = loadProfiles()
  all[id] = { ...all[id], ...patch, name: id }
  localStorage.setItem(KEY_PROFILES, JSON.stringify(all))
  return all[id]
}

export function resetProfile(id: ProfileId): Profile {
  return updateProfile(id, {
    photoBase64: null,
    totalScore: 0,
    highestLevelReached: 0,
    lastPlayedAt: 0,
  })
}

export function getLastProfile(): ProfileId | null {
  const v = localStorage.getItem(KEY_LAST)
  return v === 'atai' || v === 'emily' ? v : null
}

export function setLastProfile(id: ProfileId | null): void {
  if (id) localStorage.setItem(KEY_LAST, id)
  else localStorage.removeItem(KEY_LAST)
}
