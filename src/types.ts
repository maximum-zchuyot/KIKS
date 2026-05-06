export type ProfileId = 'atai' | 'emily'

export interface ProfileSettings {
  id: ProfileId
  displayName: string
  emoji: string
  primary: string
  secondary: string
  accent: string
  bgFrom: string
  bgTo: string
  /** gyroscope tilt multiplier (Section 5.3) */
  sensitivity: number
  /** touch step in css px (Section 5.3) */
  moveStep: number
}

export const PROFILES: Record<ProfileId, ProfileSettings> = {
  atai: {
    id: 'atai',
    displayName: 'Атай',
    emoji: '🦁',
    primary: '#4A90E2',
    secondary: '#7ED321',
    accent: '#F5A623',
    bgFrom: '#1a2540',
    bgTo: '#4A90E2',
    sensitivity: 8,
    moveStep: 60,
  },
  emily: {
    id: 'emily',
    displayName: 'Эмили',
    emoji: '🦄',
    primary: '#FF8AB1',
    secondary: '#C490E2',
    accent: '#FFD93D',
    bgFrom: '#FFE5F0',
    bgTo: '#C490E2',
    sensitivity: 5,
    moveStep: 80,
  },
}
