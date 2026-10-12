/** Abstract voices. Kits map these to concrete sounds, so one pattern plays on any kit. */
export type Voice = 'low' | 'back' | 'tick' | 'open' | 'ride' | 'tomHi' | 'tomLo' | 'accent' | 'shaker' | 'bell'

/** Step grid string per voice: 'X' accent, 'x' normal, 'g' ghost, '.' rest. */
export type Track = Partial<Record<Voice, string>>

export interface Pattern {
  id: string
  name: string
  /** Steps per bar. Must divide 48 (4, 6, 8, 12, 16, 24, 48). */
  steps: number
  /** Steps per beat, for grid grouping (4 = 16ths in 4/4, 3 = 12/8). */
  stepsPerBeat: number
  tracks: Track
  suggestedBpm?: number
  /** Whether swing applies (only for even subdivisions). */
  swingable?: boolean
}

export interface Hit { voice: Voice; velocity: number }

export interface Layer {
  id: string
  pattern: Pattern
  volume: number // 0..1
  mute: boolean
  solo: boolean
}

export interface Section { name: string; bars: number; patternIds: string[]; note: string }
export interface Arrangement { id: string; name: string; bpm: number; sections: Section[] }

export interface KitVoice {
  kind: 'membrane' | 'noise' | 'metal'
  pitch?: number // Hz
  decay: number // seconds
  tone?: number // filter cutoff Hz for noise / harmonicity for metal
  pitchDecay?: number
  gain?: number
}
export interface Kit { id: string; name: string; blurb: string; voices: Record<Voice, KitVoice> }
