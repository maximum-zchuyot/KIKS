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
  /**
   * Horizontal speed (css px / second) per degree of tilt **above the
   * deadzone**. The TZ values (8 / 5) turned out to be way too low on real
   * phones — at a comfortable 15° hold the player barely moved. Calibrated by
   * testing: at 30° tilt Atay traverses a 400 px screen in ~0.5 s.
   */
  sensitivity: number
  /** Tilt magnitude (deg) below which input is ignored to avoid drift. */
  tiltDeadzone: number
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
    sensitivity: 38,
    tiltDeadzone: 4,
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
    sensitivity: 24,
    tiltDeadzone: 5,
    moveStep: 80,
  },
}
