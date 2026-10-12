import type { Pattern } from '../engine/types'
import { registerPatterns } from './rhythms'

export interface ArtistLens {
  id: string; name: string; band: string; era: string
  technique: string[]; feeling: string; storytelling: string
  tryThis: { pattern: Pattern; note: string }[]
}
const P = (id: string, name: string, steps: number, spb: number, bpm: number, tracks: Pattern['tracks'], swingable = false): Pattern => ({ id, name, steps, stepsPerBeat: spb, suggestedBpm: bpm, tracks, swingable })

export const ARTISTS: ArtistLens[] = [
  { id: 'peart', name: 'Neil Peart', band: 'Rush', era: '1974–2015',
    technique: ['Through-composed parts: fills and grooves written and repeated almost note-for-note live, treated as part of the song.', 'A large kit used melodically: tuned tom runs, orchestral percussion (glockenspiel, temple blocks, tubular bells), later electronic pads.', 'Comfortable in odd meters (7/8, 5/4 and mixed bars). Note: this v1 player only supports grids that divide 48 steps, so odd-meter examples are planned for v2.'],
    feeling: 'Precision as expression. The excitement comes from intricate, deliberate architecture played with full commitment, not from looseness.',
    storytelling: 'He treated a drum part like a lyric (he was also Rush\'s lyricist): motifs return, fills are signposts placed at structural seams, and the kit\'s range (high toms to gong) maps to dramatic peaks.',
    tryThis: [
      { pattern: P('peart-groove', 'Peart-style composed groove', 16, 4, 92, { low: 'X..x..X...X.....', back: '....X.......X...', tick: 'x.x.x.x.x.x.x.x.', tomHi: '..............xx' }), note: 'In the spirit of his rock grooves (not a transcription). A fixed tom pickup at the end of every bar acts as a motif.' },
      { pattern: P('peart-fill', 'Melodic tom cascade', 16, 4, 92, { back: 'Xx..............', tomHi: '..XxXx..........', tomLo: '......XxXxXx....', low: 'X...........X.X.' }), note: 'Layer with the groove above, then mute it, and hear how the fill works as a melody on its own.' } ] },
  { id: 'bonham', name: 'John Bonham', band: 'Led Zeppelin', era: '1968–1980',
    technique: ['Huge, open-tuned sound and a heavy right foot: fast kick-drum triplets were a signature (e.g. "Good Times Bad Times").', 'Behind-the-beat placement that makes slow grooves feel enormous ("When the Levee Breaks").', 'Deep R&B and funk roots. His half-time shuffle on "Fool in the Rain" draws on Bernard Purdie\'s "Purdie shuffle."'],
    feeling: 'Weight and swing at once: heavy without being stiff. Space between notes is as important as the notes.',
    storytelling: 'He often holds back early in a song, then opens up. He also lets the kick talk to Jimmy Page\'s riffs, doubling or answering them, so the drums take part in the riff instead of just backing it.',
    tryThis: [
      { pattern: P('bonham-halftime', 'Half-time shuffle (Purdie-style)', 12, 3, 130, { tick: 'x.xx.xx.xx.x', back: '..g..gX.g..g', low: 'X....x...X..' }), note: 'Snare only on beat 3, with ghost notes on the shuffle partials. Simplified, not a transcription.' },
      { pattern: P('bonham-triplet', 'Kick triplet figure', 12, 3, 92, { low: 'XxX...XxX...', back: '...X.....X..', tick: 'x..x..x..x..' }), note: 'Fast triplet bursts in the kick: try the acoustic kit, then the frame drum.' } ] },
  { id: 'ringo', name: 'Ringo Starr', band: 'The Beatles', era: '1962–1970',
    technique: ['A left-hander playing a right-handed kit. This is often cited as a reason his fills lead with unusual hand patterns and sound distinctive.', 'Inventive, song-specific patterns: the broken, lopsided figure of "Ticket to Ride," the tom phrases of "Come Together," the loose, dragging feel of "Rain."', 'Heavily damped toms (tea towels on the heads in the late period) for a dry, close sound.'],
    feeling: 'Groove in service of the song. He chose the part that made the song feel like itself, not the most impressive part.',
    storytelling: 'His parts often change with each section of a song (verse figure, chorus straight beat, signature fill into the bridge), so the drums mark the song\'s form. Few fills, each memorable.',
    tryThis: [
      { pattern: P('ringo-broken', 'Broken tom/snare figure', 16, 4, 122, { low: 'X.......X.......', back: '..X.X.....X.X...', tomLo: 'X..x....X..x....', tick: 'x.x.x.x.x.x.x.x.' }), note: 'Inspired by the lopsided feel of "Ticket to Ride" (approximation).' },
      { pattern: P('ringo-toms', 'Damped tom phrase', 16, 4, 84, { tomHi: 'x.x.............', tomLo: '....x.x.x.......', low: 'X.......X..x....', tick: '..........x.x.x.' }, true), note: 'In the spirit of "Come Together": the toms carry the hook. Try the frame kit.' } ] },
  { id: 'copeland', name: 'Stewart Copeland', band: 'The Police', era: '1977–1986, 2007–08',
    technique: ['Reggae vocabulary (one-drop, beat 1 left open) blended with punk energy.', 'Hi-hat as lead instrument: busy, accented, constantly varied, with splash cymbal punctuation.', 'High-tuned, cracking snare, often played on the rim, and a tendency to push ahead of the beat.'],
    feeling: 'Nervous, bright, restless energy over a spacious foundation.',
    storytelling: 'Verses often sit in sparse reggae-derived grooves, and choruses shift to driving rock. The genre switch itself is the story arc.',
    tryThis: [
      { pattern: P('copeland-hats', 'One-drop with busy hats', 16, 4, 80, { low: '........X.......', accent: '........X.......', tick: 'x.xxx.x.xxx.x.xx', open: '......x.......x.' }, true), note: 'An empty downbeat underneath, a busy hi-hat above. Mute the hats to hear the plain one-drop.' } ] },
  { id: 'allen', name: 'Tony Allen', band: 'Fela Kuti & Africa 70; solo', era: '1960s–2020',
    technique: ['Co-creator of Afrobeat with Fela Kuti, who said Afrobeat would not exist without him.', 'Four-way independence. Influenced by jazz drummers such as Max Roach and Art Blakey, he spread interlocking parts across hats, snare, kick and toms.', 'A light touch, open hi-hat accents on off-beats, and very few cymbal crashes.'],
    feeling: 'Floating, circular and danceable. The groove is dense but never crowded, because every limb leaves room for the others.',
    storytelling: 'Long songs that develop slowly. He kept the core pattern fixed and let small variations (an open hat here, a tom there) mark time over 10+ minutes. Brian Eno has been widely quoted calling him perhaps the greatest drummer who ever lived.',
    tryThis: [
      { pattern: P('allen-afrobeat', 'Afrobeat interlock (approximation)', 16, 4, 108, { tick: 'x.xxx.xxx.xxx.xx', open: '..x...x...x...x.', low: 'X.....X.x.......', back: '....x..g.g..X.g.', tomLo: '............x..x' }, true), note: 'Mute each voice in turn: each limb is a separate line.' },
      { pattern: P('allen-shaker', 'Shekere-style layer', 16, 4, 108, { shaker: 'x.Xx.xX.x.Xx.xX.' }), note: 'Layer on top with the Latin kit to hear the percussion section.' } ] },
]
registerPatterns(ARTISTS.flatMap(a => a.tryThis.map(t => t.pattern)))
