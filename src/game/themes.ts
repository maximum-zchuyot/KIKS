import type { ProfileId } from '../types'
import type { TokenType } from './levels'

export type BackgroundKind = 'stars' | 'clouds'

export interface Theme {
  /** sprite drawn on each token type (Section 7.3 — emoji over canvas) */
  tokenSprite: Record<TokenType, string>
  background: BackgroundKind
}

export const THEMES: Record<ProfileId, Theme> = {
  atai: {
    tokenSprite: {
      basic: '🪙',
      bonus: '⭐',
      special: '🚀',
    },
    background: 'stars',
  },
  emily: {
    tokenSprite: {
      basic: '❤️',
      bonus: '🌸',
      special: '🌈',
    },
    background: 'clouds',
  },
}
