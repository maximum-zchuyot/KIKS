import type { ProfileId } from '../types'
import type { Parent } from './phrases'
import { CELEBRATION_INDICES, PARENT_ORDER, START_INDEX } from './phrases'
import { loadVoices, voiceKey } from './storage'

interface ClipRef {
  key: string
  audio: string
}

/**
 * Last clip key we played, persisted across the page lifetime so that the
 * picker can avoid repeating the same recording back-to-back. Reset on tab
 * reload — that's fine for the kid-game cadence.
 */
let lastPlayedKey: string | null = null

/**
 * Singleton handle on the currently-playing clip. We only ever want one voice
 * line audible at a time — React.StrictMode (dev) double-invokes effects, and
 * a tap-skip into a fresh celebration could otherwise stack audio elements.
 */
let currentAudio: HTMLAudioElement | null = null

function stopCurrentAudio(): void {
  if (!currentAudio) return
  const a = currentAudio
  currentAudio = null
  try {
    a.onended = null
    a.onerror = null
    a.pause()
    a.src = ''
  } catch {
    // ignore — element may already be detached
  }
}

/** Play a base64 audio data URL. Replaces any clip already playing.
 *  Resolves on end / error / autoplay-block. */
export function playClip(dataUrl: string): Promise<void> {
  return new Promise((resolve) => {
    stopCurrentAudio()
    try {
      const audio = new Audio(dataUrl)
      currentAudio = audio
      audio.preload = 'auto'
      const finish = () => {
        if (currentAudio === audio) currentAudio = null
        resolve()
      }
      audio.onended = finish
      audio.onerror = finish
      audio.play().catch(finish)
    } catch {
      resolve()
    }
  })
}

function collectClips(profileId: ProfileId, indices: number[]): ClipRef[] {
  const voices = loadVoices()
  const clips: ClipRef[] = []
  for (const parent of PARENT_ORDER as Parent[]) {
    for (const i of indices) {
      const key = voiceKey(parent, profileId, i)
      const audio = voices[key]
      if (audio) clips.push({ key, audio })
    }
  }
  return clips
}

function pickAvoidingLast(clips: ClipRef[]): ClipRef | null {
  if (clips.length === 0) return null
  if (clips.length === 1) return clips[0] ?? null
  const fresh = clips.filter((c) => c.key !== lastPlayedKey)
  const pool = fresh.length > 0 ? fresh : clips
  return pool[Math.floor(Math.random() * pool.length)] ?? null
}

/** Pick a celebration clip (any non-start phrase, mom or dad — whatever was
 *  recorded). Avoids picking the same clip twice in a row when possible. */
export function pickCelebrationClip(profileId: ProfileId): string | null {
  const clips = collectClips(profileId, CELEBRATION_INDICES)
  const chosen = pickAvoidingLast(clips)
  if (chosen) lastPlayedKey = chosen.key
  return chosen?.audio ?? null
}

/** Pick a "Поехали!" clip for the game-start screen. */
export function pickStartClip(profileId: ProfileId): string | null {
  const clips = collectClips(profileId, [START_INDEX])
  const chosen = pickAvoidingLast(clips)
  if (chosen) lastPlayedKey = chosen.key
  return chosen?.audio ?? null
}

/** True if anything was recorded for this profile (used for UI cues). */
export function hasAnyVoice(profileId: ProfileId): boolean {
  const voices = loadVoices()
  for (const parent of PARENT_ORDER as Parent[]) {
    for (let i = 0; i <= START_INDEX; i++) {
      if (voices[voiceKey(parent, profileId, i)]) return true
    }
  }
  return false
}

/** Best MIME type for MediaRecorder on the current browser; '' = default. */
export function pickRecorderMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/webm',
  ]
  if (typeof MediaRecorder === 'undefined') return ''
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c
  }
  return ''
}
