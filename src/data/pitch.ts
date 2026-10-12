import type { Pattern } from '../engine/types'
import type { Tuning } from '../engine/pitch'
import { registerPatterns } from './rhythms'

const n = (s: string) => { // 'C2' -> midi
  const m = /^([A-G])(#?)(-?\d)$/.exec(s)!; return 12 * (+m[3] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]]! + (m[2] ? 1 : 0)
}
const T = (low: string, tomLo: string, tomHi: string, back: string, accent: string, bell: string): Tuning =>
  ({ low: n(low), tomLo: n(tomLo), tomHi: n(tomHi), back: n(back), accent: n(accent), bell: n(bell) })

export const TUNING_PRESETS: { id: string; name: string; note: string; tuning: Tuning }[] = [
  { id: 'triad', name: 'Major triad', note: 'C–G–C–E–G–C. Kick on the root, toms spell a C major chord.', tuning: T('C2', 'G2', 'C3', 'E3', 'G3', 'C4') },
  { id: 'penta', name: 'Pentatonic', note: 'C D E G A: no semitones, so any order of hits sounds consonant.', tuning: T('C2', 'C3', 'D3', 'E3', 'G3', 'A3') },
  { id: 'fourths', name: 'Fourths', note: 'Stacked perfect fourths. A common "open" tom tuning that keeps toms distinct without sounding like a chord.', tuning: T('E2', 'A2', 'D3', 'G3', 'C4', 'F4') },
  { id: 'thirds', name: 'Thirds', note: 'Alternating minor and major thirds (A minor 7th-ish). Closer spacing, more "singing" fills.', tuning: T('A1', 'C3', 'E3', 'G3', 'B3', 'D4') },
  { id: 'low', name: 'Low & deep', note: 'Low, close tunings with a long decay, in the spirit of big rock kits. Roughly a fourth apart, low in the range.', tuning: T('A1', 'D2', 'G2', 'C3', 'F3', 'A#3') },
]

export const PITCH_TEXT: { h: string; p: string }[] = [
  { h: 'Drums have pitch, roughly', p: 'A struck membrane vibrates in several modes at once. For an ideal circular membrane, the overtones are not whole-number multiples of the fundamental (roughly 1, 1.59, 2.14, 2.30, 2.65…), so the sound is inharmonic. That is why most drums give a "pitch centre" rather than a clean note. Timpani are the exception: the air and kettle shift the modes toward a near-harmonic series, giving a clear pitch (Rossing, The Science of Percussion Instruments, 2000; Fletcher & Rossing, The Physics of Musical Instruments).' },
  { h: 'What you actually hear', p: 'On a tom, the perceived pitch is mostly the lowest mode, and it glides downward after the hit, because the head is briefly tighter when struck hard. Pitch also depends on the balance between the batter and resonant heads and on how hard you play. A tom "in C" is an approximation: it may sit 20–30 cents off, slide by a semitone, or sound different in a room. Most drummers tune by ear for resonance and interval, not to a tuner.' },
  { h: 'Intervals between drums', p: 'What matters musically is usually the interval between drums. Toms tuned in fourths or thirds sound like a family, and a common practice tunes a set of toms to a chord or scale. The kick sits low (a fundamental often roughly 40–80 Hz), so it acts as a root more than a note. Snares are mostly about the wires (broadband noise), with the head tuned for crack.' },
  { h: 'Cymbals', p: 'Cymbals and hi-hats have dense, inharmonic spectra with no clear fundamental. They can feel "high" or "dark" but don\'t map to a note, so this page leaves them untuned.' },
  { h: 'Try it', p: 'Choose a preset, then play a melodic pattern. The real acoustic kit samples are pitch-shifted to each note. Nudge any voice by a semitone and listen to how the melody changes. Pitch-shifting a recorded drum also changes its decay a little, just as retuning a real drum does.' },
]

const M = (id: string, name: string, steps: number, spb: number, bpm: number, tracks: Pattern['tracks'], tps?: number): Pattern =>
  ({ id: `pi-${id}`, name, steps, stepsPerBeat: spb, suggestedBpm: bpm, tracks, ticksPerStep: tps })

export const PITCH_PATTERNS: Pattern[] = [
  M('arp', 'Rising arpeggio', 16, 4, 96, { low: 'X.......X.......', tomLo: '.x.......x......', tomHi: '..x.......x.....', back: '...x.......x....', accent: '....x.......x...', bell: '.....X.......X..', tick: 'x.x.x.x.x.x.x.x.' }),
  M('fall', 'Melodic fill: top to bottom', 16, 4, 96, { bell: 'Xx..............', accent: '..Xx............', back: '....Xx..........', tomHi: '......Xx........', tomLo: '........XxXx....', low: 'X...........X.X.' }),
  M('call', 'Call and answer', 16, 4, 104, { tomHi: 'X.x.............', back: '....X...........', tomLo: '........X.x.....', accent: '............X...', low: 'X.......X.......', tick: 'x.x.x.x.x.x.x.x.' }),
]
registerPatterns(PITCH_PATTERNS)
