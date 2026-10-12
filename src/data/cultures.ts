import raw from './cultures.json'
import type { Pattern } from '../engine/types'
import { registerPatterns } from './rhythms'

export type Strength = 'strong' | 'moderate' | 'weak' | 'romanticized'
export interface Culture { id: string; culture: string; instrument: string; practice: string; rhythm: string; groupEvidence: string; evidenceStrength: Strength; sources: string[]; flags: string[] }

/** Research data (sources still being verified). Replace cultures.json to update. */
export const CULTURES = (raw as { entries: Culture[] }).entries
export const SOURCES_VERIFIED = false

export const WORDING_NOTES = [
  'There is no evidence of shared or group trance in Nordic practice. Sami trance was individual (the noaidi), with an audience present.',
  'Theta entrainment is a hypothesis, not an established mechanism.',
  'The Mevlevi sema is contemplative. Mevlevis reject the word "trance."',
  '"Viking," "druid," ancient-Baltic and táltos drumming revivals are modern or romanticized.',
]

export const INTERLOCK_PRESETS: { pattern: Pattern; culture: string; note: string }[] = [
  { culture: 'basque', note: 'Two players share one set of planks, and each fills the other\'s gaps. One player keeps a steady pulse (tapa) and the other varies it (herrena). Hear this as an approximation of the principle, not a traditional pattern. Mute either player to hear one half.',
    pattern: { id: 'txalaparta', name: 'Txalaparta interlock (approx.)', steps: 8, stepsPerBeat: 2, suggestedBpm: 112, tracks: { tomHi: 'X.x.X.x.', tomLo: '.x.x.xx.' } } },
  { culture: 'baltic', note: 'Sutartinės: two voices in interlocking parts that clash and alternate, so a whole rhythm only exists between the singers. This is a rhythmic abstraction on two pitched voices.',
    pattern: { id: 'sutartines', name: 'Sutartinės interlock (abstraction)', steps: 8, stepsPerBeat: 2, suggestedBpm: 96, tracks: { bell: 'X.x.X.x.', accent: '.x.X.x.X' } } },
]
registerPatterns(INTERLOCK_PRESETS.map(p => p.pattern))
