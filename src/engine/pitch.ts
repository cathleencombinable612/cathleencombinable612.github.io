import type { Kit, Voice } from './types'

export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
export const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12)
export const noteName = (m: number) => `${NOTE_NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`
export const hzToMidi = (hz: number) => Math.round(69 + 12 * Math.log2(hz / 440))

/** Voices that can carry a pitch, ordered low → high (the "melodic kit"). */
export const PITCHED: Voice[] = ['low', 'tomLo', 'tomHi', 'back', 'accent', 'bell']

export type Tuning = Partial<Record<Voice, number>> // MIDI note per voice

/** Return a copy of the kit with tuned voices' pitch overridden. Pure; no audio dependency. */
/** Approximate fundamental (Hz) of each recorded sample voice as played, estimated by ear.
 *  Used to pitch-shift samples to a target note via playback rate. */
export const SAMPLE_BASE_HZ: Partial<Record<Voice, number>> = { low: 55, tomLo: 87, tomMid: 106, tomHi: 147, back: 220, accent: 392, bell: 784 }
export function applyTuning(kit: Kit, t: Tuning): Kit {
  const voices = { ...kit.voices }
  for (const [v, m] of Object.entries(t) as [Voice, number][]) {
    if (m === undefined) continue
    const k = voices[v], hz = midiToHz(m)
    if (k.kind === 'sample') {
      const base = SAMPLE_BASE_HZ[v] ?? hz
      voices[v] = { ...k, rate: (k.rate ?? 1) * Math.min(2.5, Math.max(0.4, hz / base)), fallback: k.fallback && { ...k.fallback, pitch: hz } }
    } else voices[v] = { ...k, pitch: hz }
  }
  return { ...kit, voices }
}

/** Shift voices by semitones (per-song tuning). Samples change playback rate; synths change pitch. */
export function applyShift(kit: Kit, shift: Partial<Record<Voice, number>> | undefined): Kit {
  if (!shift) return kit
  const voices = { ...kit.voices }
  for (const [v, st] of Object.entries(shift) as [Voice, number][]) {
    const k = voices[v]; if (!k || !st) continue; const r = 2 ** (st / 12)
    voices[v] = { ...k, rate: (k.rate ?? 1) * r, pitch: k.pitch ? k.pitch * r : k.pitch, fallback: k.fallback && { ...k.fallback, pitch: k.fallback.pitch ? k.fallback.pitch * r : undefined } }
  }
  return { ...kit, voices }
}
