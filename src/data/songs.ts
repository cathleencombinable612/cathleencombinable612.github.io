import raw from './songs.json'
import type { Fill, Pattern, Track, Voice } from '../engine/types'
import { registerPatterns } from './rhythms'

/** Shape of research/song-patterns.json entries. Velocities 0–1 per step. */
export interface SongEntryRaw {
  id: string; song: string; artist: string; drummer: string; bpm: number; timeSig: string
  stepsPerBar: number; bars: number; voices: Record<string, number[]>
  feel?: string; whyItWorks?: string; source?: string; confidence?: string; label?: string
  sections?: { name: string; repeat: number; confidence?: string; timeSig?: string; ticksPerStep?: number; bars: Record<string, string>[] }[]
  ticksPerStep?: number; meterSource?: string; lengthCheck?: { seconds: number | null; source: string; modelSeconds: number }
  tuning?: { status: string; note: string; source?: string; shift: Record<string, number> }
  form?: { section: string; bars: number }[]; formSource?: string; formNote?: string
  fills?: { name: string; stepsPerBar: number; bars: number; voices: Record<string, number[]> }[]
}
export interface SongSection { name: string; start: number; bars: number; confidence?: string; timeSig?: string }
export interface Song { raw: SongEntryRaw & { form?: { section: string; bars: number; timeSig?: string[] }[]; category?: string; transcription?: { source: string; songId: number; revisionId: number; track: string; bars: number } }
  pattern: Pattern; fills: Fill[]; bars: Pattern[]; sections: SongSection[] }
function stringTracks(b: Record<string, string>): Track {
  const t: Track = {}
  for (const [k, str] of Object.entries(b)) { const v = VOICE_ALIASES[k]; if (!v) continue
    t[v] = t[v] ? [...str].map((c, i) => (c !== '.' && (t[v]![i] === '.' || c > t[v]![i]) ? c : t[v]![i])).join('') : str }
  return t
}
interface SectionFile { name: string; bars: Record<string, string>[]; ticksPerStep: number[]; timeSig: string[]; bpm: number[]; confidence?: string }
/** Fetch the full bar-by-bar part for a song (kept out of the main bundle). */
export async function loadSongBars(song: Song): Promise<Song> {
  if (song.bars.length) return song
  const r = await fetch(`${import.meta.env.BASE_URL}songs/${song.raw.id}.json`)
  const data = (await r.json()) as { sections: SectionFile[] }
  const bars: Pattern[] = []
  data.sections.forEach((sec, si) => sec.bars.forEach((b, i) => {
    const steps = Object.values(b)[0]?.length ?? 16
    const [num] = (sec.timeSig[i] ?? '4/4').split('/').map(Number)
    const spb = Math.max(1, Math.round(steps / (sec.timeSig[i]?.endsWith('/8') ? num / (num % 3 === 0 ? 3 : 1) : num)))
    bars.push({ id: `song-${song.raw.id}-b${bars.length}`, name: song.raw.song, steps, stepsPerBeat: spb, ticksPerStep: sec.ticksPerStep[i], suggestedBpm: sec.bpm[i], timeSig: sec.timeSig[i], tracks: stringTracks(b) })
    void si
  }))
  song.bars = bars
  return song
}

export const SONGS: Song[] = (raw as unknown as SongEntryRaw[]).map(s => {
  const tps = s.ticksPerStep ?? ticksPerStepFor(s.timeSig, s.stepsPerBar)
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
  const sections: SongSection[] = []; let start = 0
  for (const f of (s as Song['raw']).form ?? []) { sections.push({ name: f.section, start, bars: f.bars, timeSig: f.timeSig?.join(' · ') }); start += f.bars }
  const bars: Pattern[] = []
  return { raw: s, pattern: { ...pattern, steps: s.stepsPerBar * s.bars }, fills, bars, sections }
})
registerPatterns(SONGS.flatMap(s => [s.pattern, ...s.fills.map(f => f.pattern)]))
