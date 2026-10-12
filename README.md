# Pulse: explore rhythm

A mobile-first rhythm explorer, sibling to [Muse](https://nmpy7knjd8-code.github.io/muse/).

**Live:** https://nmpy7knjd8-code.github.io/rhythm/

- `src/engine`: framework-free pattern logic (`pattern.ts`, `types.ts`) plus a thin Tone.js engine (`audio.ts`): 48-tick/bar Transport grid, swing, layering, mute/solo, arrangements.
- `src/data`: typed content: rhythms, kits (all sounds synthesized), story arrangement, history + bibliography, culture research (`cultures.json`, still being verified), percussionist lens pages.
- `src/ui`: React + Tailwind views.

Patterns use one string per abstract voice (`X` accent, `x` normal, `g` ghost, `.` rest); kits map voices to sounds. `npm run build` validates every pattern grid.

## Data from research
- `src/data/songs.json` comes from `song-patterns.json`, with per-step velocities 0–1. `src/data/songs.ts` converts it: it maps voice names (kick, snare, closedHat, …), turns time signatures into grid ticks, and imports song fills into the Fill menu. Every song pattern is labelled an **approximate transcription**.
- `src/data/videos.json` comes from `drum-videos.json`. Lens pages embed these through youtube-nocookie after you tap the thumbnail, and hide any video whose thumbnail fails to load.

## Pattern notation
`.` rest · `X` accent · `x` normal · `g` ghost · `1`–`9` velocity n/9 · `f` flam · `r` ruff/drag.
Voices: kick, snare, cross-stick, closed/open/pedal hi-hat, ride, ride bell, crash 1, crash 2, china, three toms, cowbell, shaker.

## Credits & licenses
- **Acoustic kit samples:** [Salamander Drumkit](https://archive.org/details/SalamanderDrumkit) by **Alexander Holm**. The README in the original archive says CC BY-SA 3.0. The author later [declared it public domain](https://rytmenpinne.wordpress.com/sounds-and-such/salamander-drumkit/) (2022). The adapted files in `public/samples/acoustic/` (trimmed, faded, mono, 96 kbps MP3) are offered under CC BY-SA 3.0 with attribution. See `public/samples/acoustic/LICENSE.txt`.
- Synth kits use [Tone.js](https://tonejs.github.io/) (MIT).
