import type { Kit, Voice } from './types'

export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
export const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12)
export const noteName = (m: number) => `${NOTE_NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`
export const hzToMidi = (hz: number) => Math.round(69 + 12 * Math.log2(hz / 440))

/** Voices that can carry a pitch, ordered low → high (the "melodic kit"). */
export const PITCHED: Voice[] = ['low', 'tomLo', 'tomHi', 'back', 'accent', 'bell']

export type Tuning = Partial<Record<Voice, number>> // MIDI note per voice

/** Return a copy of the kit with tuned voices' pitch overridden. Pure; no audio dependency. */
export function applyTuning(kit: Kit, t: Tuning): Kit {
  const voices = { ...kit.voices }
  for (const [v, m] of Object.entries(t) as [Voice, number][]) if (m !== undefined) voices[v] = { ...voices[v], pitch: midiToHz(m) }
  return { ...kit, voices }
}
