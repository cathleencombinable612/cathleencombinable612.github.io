import raw from './songs.json'
import type { Fill, Pattern, Track, Voice } from '../engine/types'
import { registerPatterns } from './rhythms'

/** Shape of research/song-patterns.json entries. Velocities 0–1 per step. */
export interface SongEntryRaw {
  id: string; song: string; artist: string; drummer: string; bpm: number; timeSig: string
  stepsPerBar: number; bars: number; voices: Record<string, number[]>
  feel?: string; whyItWorks?: string; source?: string; confidence?: string; label?: string
  sections?: { name: string; repeat: number; confidence?: string; bars: Record<string, string>[] }[]
  form?: { section: string; bars: number }[]; formSource?: string; formNote?: string
  fills?: { name: string; stepsPerBar: number; bars: number; voices: Record<string, number[]> }[]
}
export interface SongSection { name: string; start: number; bars: number; confidence?: string }
export interface Song { raw: SongEntryRaw; pattern: Pattern; fills: Fill[]; bars: Pattern[]; sections: SongSection[] }
function stringTracks(b: Record<string, string>): Track {
  const t: Track = {}
  for (const [k, str] of Object.entries(b)) { const v = VOICE_ALIASES[k]; if (!v) continue
    t[v] = t[v] ? [...str].map((c, i) => (c !== '.' && (t[v]![i] === '.' || c > t[v]![i]) ? c : t[v]![i])).join('') : str }
  return t
}

/** Map research voice names onto the app's abstract voices. Unknown names are dropped (and reported in dev). */
export const VOICE_ALIASES: Record<string, Voice> = {
  kick: 'low', snare: 'back', closedHat: 'tick', hihat: 'tick', openHat: 'open', pedalHat: 'pedal',
  ride: 'ride', rideBell: 'rideBell', crash: 'crash1', crash1: 'crash1', crash2: 'crash2', china: 'china', splash: 'china',
  tomHi: 'tomHi', tomMid: 'tomMid', tomFloor: 'tomLo', tomLo: 'tomLo', crossStick: 'accent', rim: 'accent',
  cowbell: 'bell', shaker: 'shaker',
}
const velChar = (v: number) => (v <= 0 ? '.' : String(Math.max(1, Math.min(9, Math.round(v * 9)))))

export function toTracks(voices: Record<string, number[]>): Track {
  const t: Track = {}
  for (const [k, arr] of Object.entries(voices)) {
    const v = VOICE_ALIASES[k]; if (!v) continue
    const s = arr.map(velChar).join('')
    // merge if two source voices map to one app voice (keep louder)
    t[v] = t[v] ? [...s].map((c, i) => (c > t[v]![i] && c !== '.' ? c : t[v]![i])).join('') : s
  }
  return t
}

/** ticks per step from time signature: bar length in 12-ticks-per-quarter units / steps per bar. */
export function ticksPerStepFor(timeSig: string, stepsPerBar: number): number {
  const [num, den] = timeSig.split('/').map(Number)
  return Math.round((12 * num * 4) / den / stepsPerBar)
}

export const SONGS: Song[] = (raw as unknown as SongEntryRaw[]).map(s => {
  const tps = ticksPerStepFor(s.timeSig, s.stepsPerBar)
  const [num, den] = s.timeSig.split('/').map(Number)
  const spb = Math.max(1, Math.round(s.stepsPerBar / (den === 8 && num % 3 === 0 ? num / 3 : num)))
  const pattern: Pattern = {
    id: `song-${s.id}`, name: s.song, steps: s.stepsPerBar * s.bars, stepsPerBeat: spb, ticksPerStep: tps,
    suggestedBpm: s.bpm, bpmNote: `${s.bpm} BPM from the song-pattern research (approximate tempo of the recording).`,
    swingable: s.stepsPerBar % 2 === 0 && s.stepsPerBar !== 12, tracks: toTracks(s.voices),
  }
  const fills: Fill[] = (s.fills ?? []).map((f, i) => ({
    pattern: { id: `song-${s.id}-fill${i}`, name: `${s.song}: ${f.name}`, steps: f.stepsPerBar * f.bars, stepsPerBeat: Math.max(1, f.stepsPerBar / 4), tracks: toTracks(f.voices) },
    crashAfter: true, description: `From the ${s.song} research entry (approximate transcription).`,
  }))
  const bars: Pattern[] = []; const sections: SongSection[] = []
  for (const sec of s.sections ?? []) {
    const start = bars.length
    for (let r = 0; r < (sec.repeat || 1); r++) for (const b of sec.bars)
      bars.push({ ...pattern, id: `song-${s.id}-b${bars.length}`, steps: s.stepsPerBar, tracks: stringTracks(b) })
    sections.push({ name: sec.name, start, bars: bars.length - start, confidence: sec.confidence })
  }
  return { raw: s, pattern: { ...pattern, steps: s.stepsPerBar * s.bars }, fills, bars, sections }
})
registerPatterns(SONGS.flatMap(s => [s.pattern, ...s.fills.map(f => f.pattern)]))
