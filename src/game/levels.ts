export type TokenType = 'basic' | 'bonus' | 'special'

export interface LevelConfig {
  id: number
  spawnIntervalMs: number
  /** pixels per second */
  fallSpeed: number
  tokenTypes: TokenType[]
  /** Use Number.POSITIVE_INFINITY for endless mode (Section 6, level 3). */
  tokensToComplete: number
  /** Optional spawn weights summing to 1. Falls back to uniform. */
  weights?: Partial<Record<TokenType, number>>
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    spawnIntervalMs: 1000,
    fallSpeed: 200,
    tokenTypes: ['basic'],
    tokensToComplete: 20,
  },
  {
    id: 2,
    spawnIntervalMs: 700,
    fallSpeed: 350,
    tokenTypes: ['basic', 'bonus'],
    tokensToComplete: 20,
    weights: { basic: 0.8, bonus: 0.2 },
  },
  {
    id: 3,
    spawnIntervalMs: 500,
    fallSpeed: 500,
    tokenTypes: ['basic', 'bonus', 'special'],
    tokensToComplete: Number.POSITIVE_INFINITY,
    weights: { basic: 0.7, bonus: 0.25, special: 0.05 },
  },
]
