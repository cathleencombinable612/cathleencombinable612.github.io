# Pulse: explore rhythm

A mobile-first rhythm explorer, sibling to [Muse](https://nmpy7knjd8-code.github.io/muse/).

**Live:** https://nmpy7knjd8-code.github.io/rhythm/

- `src/engine`: framework-free pattern logic (`pattern.ts`, `types.ts`) plus a thin Tone.js engine (`audio.ts`): 48-tick/bar Transport grid, swing, layering, mute/solo, arrangements.
- `src/data`: typed content: rhythms, kits (all sounds synthesized), story arrangement, history + bibliography, culture research (`cultures.json`, still being verified), percussionist lens pages.
- `src/ui`: React + Tailwind views.

Patterns use one string per abstract voice (`X` accent, `x` normal, `g` ghost, `.` rest); kits map voices to sounds. `npm run build` validates every pattern grid.
