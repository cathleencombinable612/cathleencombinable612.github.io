import type { Fill, Pattern } from '../engine/types'
import { registerPatterns } from './rhythms'
import { MORE_FILLS, OLD_FILL_CATEGORY } from './more'

const F = (id: string, name: string, steps: number, stepsPerBeat: number, tracks: Pattern['tracks'], description: string, crashAfter = true): Fill =>
  ({ pattern: { id: `fill-${id}`, name, steps, stepsPerBeat, tracks }, crashAfter, description })

/** One-bar fills (4/4). Inserted by the player in the last bar of every 4 or 8 bars. */
export const FILLS: Fill[] = [
  F('cascade', 'Tom cascade (16ths)', 16, 4, {
    back: 'X7X7............', tomHi: '....X7X7........', tomMid: '........X7X7....', tomLo: '............X7X7', low: 'X...............' },
    'Snare, high, mid and floor tom in groups of four: pitch falls step by step into the downbeat.'),
  F('linear', 'Linear fill', 16, 4, {
    back: 'X..6..X..6......', tomHi: '.7.......7......', low: '..8..8....8..8..', tomLo: '...........X7.X.' },
    'No two limbs strike at once. Hands and feet interlock into one continuous line, a Gadd/Garibaldi-style idea.'),
  F('triplet', 'Eighth-note triplet fill', 12, 3, {
    back: 'X76.........', tomHi: '...X76......', tomMid: '......X76...', tomLo: '.........X7X' },
    'Twelve even notes across the bar: the triplet grid "rolls" against the straight groove around it.'),
  F('sextuplet', 'Sextuplet run', 24, 6, {
    back: 'X65X65..................', tomHi: '......X65X65............', tomMid: '............X65X65......', tomLo: '..................X65X6X', low: 'X.....X.....X.....X.....' },
    'Six notes per beat (RLLRLL-style accents) moving around the kit, with the kick on each beat.'),
  F('bonham', 'Bonham-style triplet (hands-hands-foot)', 24, 6, {
    back: 'X..X..X..X..............', tomHi: '.7..7..7..7.............', low: '..8..8..8..8..8..8..8..8', tomLo: '............X..X..X..X..', tomMid: '.............7..7..7..7.' },
    'Sixteenth-note triplets split snare-tom-kick (later floor-tom-tom-kick). The kick on every third note gives that rolling, thunderous Bonham fill.'),
  F('peart', 'Around-the-kit (Peart-style)', 16, 4, {
    back: 'X6..............', tomHi: '..X6X6..........', tomMid: '......X6X6......', tomLo: '..........X6X6..', china: '..............X.', low: '..............X.' },
    'A composed run high to low across the toms, ending on a china and kick accent. Melodic and deliberate.'),
  F('flam', 'Flam & ruff fill', 16, 4, {
    back: 'f...f...r.g.r...', tomHi: '..f.............', tomMid: '......f.........', tomLo: '..........f...f.', low: 'X.......X.......' },
    'Flams (one grace note) and ruffs/drags (two grace notes) thicken each stroke, so the fill sounds wide and ceremonial.'),
  F('build', 'Build into a crash', 16, 4, {
    back: '3...4...5.5.6789', low: 'X...X...X...X.X.', tomLo: '............4567' },
    'Snare density doubles each beat (quarters, eighths, sixteenths) while the volume rises. Crash on the next downbeat.'),
  F('half', 'Half-bar snare-tom fill', 16, 4, {
    back: '........X7X7....', tomLo: '............X7X7' },
    'A simple two-beat fill that keeps the groove for the first half. Often the most musical choice.', false),
]

FILLS.forEach(f => { f.category = OLD_FILL_CATEGORY[f.pattern.id] ?? 'Rock' })
FILLS.push(...MORE_FILLS)
FILLS.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? ''))

export const FILL_EVERY = [0, 4, 8] as const
registerPatterns(FILLS.map(f => f.pattern))
