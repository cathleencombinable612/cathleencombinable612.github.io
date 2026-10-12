import type { Arrangement, Pattern } from '../engine/types'
import { registerPatterns } from './rhythms'

const S = (id: string, name: string, tracks: Pattern['tracks']): Pattern => ({ id, name, steps: 16, stepsPerBeat: 4, suggestedBpm: 104, swingable: true, tracks })

export const STORY_PATTERNS: Pattern[] = [
  S('st-intro', 'Intro: hats only', { tick: 'x.x.x.x.x.x.x.x.' }),
  S('st-intro-kick', 'Intro: kick enters', { low: 'X.......X.......' }),
  S('st-verse', 'Verse: backbeat', { low: 'X.......X.x.....', back: '....X.......X...' }),
  S('st-verse-hat', 'Verse: hats', { tick: 'x.x.x.x.x.x.x.x.' }),
  S('st-build', 'Build: 16ths + ghosts', { low: 'X.....X.X.x...x.', back: '....X..g.g..X..g', tick: 'xxxxxxxxxxxxxxxx' }),
  S('st-fill', 'Turnaround fill', { back: 'XxXx............', tomHi: '....XxXx........', tomLo: '........XxXxX.X.', low: 'X...........X.X.' }),
  S('st-chorus', 'Chorus: ride + open hats', { low: 'X.x.....X.x.....', back: '....X.......X...', ride: 'X.x.X.x.X.x.X.x.', open: '..x...x...x...x.' }),
  S('st-chorus-tom', 'Chorus: floor-tom drive', { tomLo: 'x.x.x.x.x.x.x.x.' }),
  S('st-break', 'Breakdown', { low: 'X...............', ride: 'X.......X.......' }),
]
registerPatterns(STORY_PATTERNS)

export const STORY_ARRANGEMENT: Arrangement = { id: 'story', name: 'A drum part in five scenes', bpm: 104, sections: [
  { name: 'Introduce', bars: 2, patternIds: ['st-intro'], note: 'Hats alone: set the subdivision. The listener learns the "clock" before anything else.' },
  { name: 'Introduce', bars: 2, patternIds: ['st-intro', 'st-intro-kick'], note: 'The kick enters on 1 and 3: now there is weight and a sense of the downbeat.' },
  { name: 'Establish', bars: 4, patternIds: ['st-verse', 'st-verse-hat'], note: 'Snare backbeat completes the core triangle (low / high / time). Leave space for a singer.' },
  { name: 'Develop', bars: 3, patternIds: ['st-build'], note: 'Density rises: 16th hats, ghost notes, an extra kick. Same skeleton, more motion.' },
  { name: 'Develop', bars: 1, patternIds: ['st-fill'], note: 'Fill: break the loop, falling pitch, signal the arrival.' },
  { name: 'Interact / climax', bars: 4, patternIds: ['st-chorus', 'st-chorus-tom'], note: 'New timbres (ride, open hats, floor tom) answer each other. Highest energy.' },
  { name: 'Release', bars: 2, patternIds: ['st-break'], note: 'Strip back to almost nothing; the silence is now loud because of what came before.' },
] }

export const STORY_TEXT: { h: string; p: string }[] = [
  { h: 'A groove is a promise', p: 'Repetition teaches the listener what to expect. Everything a drummer does after that, like adding, withholding, or breaking a pattern, works because of that expectation. Theories of musical expectation (Huron, Sweet Anticipation, 2006) describe the pleasure of music as prediction, then confirmation or surprise. A drum part is the most explicit prediction engine in a band.' },
  { h: '1. Introduce: one element at a time', p: 'Bringing voices in one by one lets each define a role: hats or ride set the subdivision (how fast time ticks), kick sets weight and the downbeat, snare sets the backbeat. When parts arrive staggered, the listener can attach meaning to each.' },
  { h: '2. Establish: earn the right to change', p: 'Hold a pattern long enough that it becomes the "ground." Players such as Ringo Starr and Tony Allen show how a consistent part, once established, makes the smallest variation feel significant.' },
  { h: '3. Develop: same skeleton, new density', p: 'Development usually keeps the anchor (kick on 1, snare on 2 and 4) and changes the surface: subdivisions double, ghost notes appear, a cymbal opens. The listener hears growth, not a new song.' },
  { h: '4. Interact: elements in conversation', p: 'Kick and snare can answer each other. Toms can echo a vocal line. A ride bell can mark the clave. When two voices trade, the part stops being a loop and becomes a dialogue. Try muting single layers in the player during the climax to hear what each contributes.' },
  { h: '5. Fills and release: punctuation', p: 'Fills are commas and full stops. A falling pitch line (snare, high tom, low tom) works like a cadence. After the climax, removing almost everything is as dramatic as adding: contrast, not loudness, carries the story.' },
]
