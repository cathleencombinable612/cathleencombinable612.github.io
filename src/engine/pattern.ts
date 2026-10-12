import type { Hit, Pattern, Voice, Layer } from './types'

export const TICKS_PER_BAR = 48
const VEL: Record<string, number> = { X: 1, x: 0.75, g: 0.3 }

export function validatePattern(p: Pattern): string[] {
  const errs: string[] = []
  if (!p.ticksPerStep && TICKS_PER_BAR % p.steps !== 0) errs.push(`${p.id}: steps ${p.steps} must divide ${TICKS_PER_BAR}`)
  for (const [v, s] of Object.entries(p.tracks)) if (s && s.length !== p.steps) errs.push(`${p.id}.${v}: length ${s.length} != ${p.steps}`)
  return errs
}

export function hitsAt(p: Pattern, step: number): Hit[] {
  const out: Hit[] = []
  for (const [voice, s] of Object.entries(p.tracks) as [Voice, string][]) {
    const c = s?.[step]; if (c && VEL[c]) out.push({ voice, velocity: VEL[c] })
  }
  return out
}

export const ticksPerStep = (p: Pattern) => p.ticksPerStep ?? TICKS_PER_BAR / p.steps

/** Given an absolute tick since start, return the pattern step if a step starts here. Each pattern cycles independently (polymeter-safe). */
export function stepForTick(p: Pattern, tick: number): number | null {
  const per = ticksPerStep(p)
  return tick % per === 0 ? (tick / per) % p.steps : null
}

/** Swing delay as a fraction of a step. Odd steps of 8- or 16-step grids get delayed. swing 0..1 maps to straight..triplet. */
export function swingOffset(p: Pattern, step: number, swing: number): number {
  const tps = ticksPerStep(p)
  if (!p.swingable || (tps !== 3 && tps !== 6) || step % 2 === 0) return 0
  return swing * (1 / 3)
}

export function audibleLayers(layers: Layer[]): Layer[] {
  const anySolo = layers.some(l => l.solo)
  return layers.filter(l => (anySolo ? l.solo : !l.mute))
}

/** Beats per second of the quarter-note (or dotted-quarter in 12/8) pulse. */
export const pulseHz = (bpm: number) => bpm / 60

/** Bjorklund/Euclidean rhythm (Toussaint 2005): k onsets spread as evenly as possible over n steps, as an 'x'/'.' string. */
export function euclid(k: number, n: number, rotate = 0): string {
  const out: string[] = []
  for (let i = 0; i < n; i++) out.push(Math.floor((i * k) / n) !== Math.floor(((i - 1) * k) / n) || i === 0 ? 'x' : '.')
  const r = ((rotate % n) + n) % n
  return out.slice(r).concat(out.slice(0, r)).join('')
}
