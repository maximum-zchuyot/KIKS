import type { ProfileId } from '../types'

export type Parent = 'mom' | 'dad'

export interface ParentInfo {
  id: Parent
  displayName: string
  emoji: string
  /** Recommended tone hint shown next to phrases (TZ §9). */
  tone: string
}

export const PARENTS: Record<Parent, ParentInfo> = {
  mom: { id: 'mom', displayName: 'Мама', emoji: '👩', tone: 'тепло' },
  dad: { id: 'dad', displayName: 'Папа', emoji: '👨', tone: 'бодро' },
}

export const PARENT_ORDER: Parent[] = ['mom', 'dad']

export interface PhraseSpec {
  /** Stable index — doubles as the per-profile slot for storage keys. */
  index: number
  text: string
  /** Played on "Поехали!" (game start) instead of celebrations. */
  isStart?: boolean
}

/** Phrases from TZ §9, mapped 1-to-1 onto each profile's voice slots. */
export const PARENT_PHRASES: Record<ProfileId, PhraseSpec[]> = {
  atai: [
    { index: 0, text: 'Молодец, Атай!' },
    { index: 1, text: 'Вот это да!' },
    { index: 2, text: 'Так держать!' },
    { index: 3, text: 'Ты у меня лучший!' },
    { index: 4, text: 'Ого-го!' },
    { index: 5, text: 'Поехали!', isStart: true },
  ],
  emily: [
    { index: 0, text: 'Молодец, Эмили!' },
    { index: 1, text: 'Какая умничка!' },
    { index: 2, text: 'Ты у меня солнышко!' },
    { index: 3, text: 'Чемпионка!' },
    { index: 4, text: 'Браво!' },
    { index: 5, text: 'Поехали!', isStart: true },
  ],
}

/** Indices that are valid for celebration playback (everything except start). */
export const CELEBRATION_INDICES = [0, 1, 2, 3, 4]
export const START_INDEX = 5
