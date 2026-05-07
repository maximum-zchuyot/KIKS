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

function isValidPhoto(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('data:image/')
}

function sanitizeProfile(name: ProfileId, raw: unknown): Profile {
  const base = emptyProfile(name)
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Record<string, unknown>
  return {
    name,
    photoBase64: isValidPhoto(r.photoBase64) ? r.photoBase64 : null,
    totalScore: typeof r.totalScore === 'number' && Number.isFinite(r.totalScore)
      ? r.totalScore
      : 0,
    highestLevelReached:
      typeof r.highestLevelReached === 'number' && Number.isFinite(r.highestLevelReached)
        ? r.highestLevelReached
        : 0,
    lastPlayedAt: typeof r.lastPlayedAt === 'number' && Number.isFinite(r.lastPlayedAt)
      ? r.lastPlayedAt
      : 0,
  }
}

export function loadProfiles(): Profiles {
  try {
    const raw = localStorage.getItem(KEY_PROFILES)
    if (!raw) return emptyProfiles()
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      atai: sanitizeProfile('atai', parsed.atai),
      emily: sanitizeProfile('emily', parsed.emily),
    }
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
