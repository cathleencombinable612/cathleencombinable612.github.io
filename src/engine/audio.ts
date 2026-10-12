import * as Tone from 'tone'
import type { Kit, KitVoice, Layer, Voice, Arrangement, Pattern, Fill } from './types'
import { TICKS_PER_BAR, hitsAt, stepForTick, swingOffset, audibleLayers, ticksPerStep } from './pattern'

type Inst = { trigger: (t: number, v: number) => void; choke?: (t: number) => void; dispose: () => void }

// ---- sample bank: lazy, cached, shared across kits/layers ----
let SAMPLE_BASE = ''
export const setSampleBase = (b: string) => { SAMPLE_BASE = b }
const buffers = new Map<string, Tone.ToneAudioBuffer>()
const loading = new Map<string, Promise<void>>()
function loadFile(f: string): Promise<void> {
  if (!loading.has(f)) loading.set(f, new Promise<void>(res => {
    const b = new Tone.ToneAudioBuffer(SAMPLE_BASE + f, () => { buffers.set(f, b); res() }, () => res())
  }))
  return loading.get(f)!
}
/** Preload every sample a kit uses. Resolves with progress callbacks; safe to call repeatedly. */
export async function preloadKit(kit: Kit, onProgress?: (done: number, total: number) => void) {
  const files = Object.values(kit.voices).flatMap(v => v.layers?.flatMap(l => l.files) ?? [])
  let done = 0
  await Promise.all(files.map(f => loadFile(f).then(() => onProgress?.(++done, files.length))))
}

function makeSynth(kv: KitVoice, g: Tone.Gain): Inst {
  if (kv.kind === 'membrane') {
    const s = new Tone.MembraneSynth({ pitchDecay: kv.pitchDecay ?? 0.05, octaves: 4, envelope: { attack: 0.001, decay: (kv.decay ?? 0.3), sustain: 0, release: 0.05 } }).connect(g)
    return { trigger: (t, v) => s.triggerAttackRelease(kv.pitch ?? 60, (kv.decay ?? 0.3), t, v), dispose: () => s.dispose() }
  }
  if (kv.kind === 'noise') {
    const f = new Tone.Filter(kv.tone ?? 6000, kv.tone && kv.tone > 4000 ? 'highpass' : 'bandpass').connect(g)
    const s = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: (kv.decay ?? 0.3), sustain: 0 } }).connect(f)
    const body = kv.pitch ? new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 1.5, envelope: { attack: 0.001, decay: (kv.decay ?? 0.3) * 0.6, sustain: 0 } }).connect(g) : null
    return {
      trigger: (t, v) => { s.triggerAttackRelease((kv.decay ?? 0.3), t, v); body?.triggerAttackRelease(kv.pitch!, (kv.decay ?? 0.3) * 0.6, t, v * 0.6) },
      choke: t => s.triggerRelease(t),
      dispose: () => { s.dispose(); f.dispose(); body?.dispose() },
    }
  }
  const s = new Tone.MetalSynth({ harmonicity: kv.tone ?? 5.1, modulationIndex: 16, resonance: 3000, octaves: 1.2, envelope: { attack: 0.001, decay: (kv.decay ?? 0.3), release: 0.05 } }).connect(g)
  return { trigger: (t, v) => s.triggerAttackRelease(kv.pitch ?? 300, (kv.decay ?? 0.3), t, v), choke: t => s.triggerRelease(t), dispose: () => s.dispose() }
}

function makeInst(kv: KitVoice, out: Tone.ToneAudioNode): Inst {
  const g = new Tone.Gain(kv.gain ?? 1).connect(out)
  if (kv.kind !== 'sample') { const s = makeSynth(kv, g); return { ...s, dispose: () => { s.dispose(); g.dispose() } } }
  const layers = kv.layers ?? []
  layers.forEach(l => l.files.forEach(loadFile))
  const fb = kv.fallback ? makeSynth(kv.fallback, g) : null
  const rr = layers.map(() => 0)
  const live = new Set<Tone.ToneBufferSource>()
  return {
    trigger: (t, v) => {
      let li = layers.findIndex(l => v <= l.vel + 1e-6); if (li < 0) li = layers.length - 1
      const files = layers[li].files, f = files[rr[li]++ % files.length]
      const buf = buffers.get(f)
      if (!buf) { fb?.trigger(t, v); return }
      const lo = li ? layers[li - 1].vel : 0
      const rel = (v - lo) / Math.max(0.01, layers[li].vel - lo) // position within layer
      const src = new Tone.ToneBufferSource(buf).connect(g)
      if (kv.rate) src.playbackRate.value = kv.rate
      src.onended = () => { live.delete(src); src.dispose() }
      live.add(src)
      src.start(t, 0, undefined, 0.55 + 0.45 * Math.min(1, rel))
    },
    choke: t => { live.forEach(s => { try { s.stop(t + 0.01) } catch { /* already stopped */ } }); fb?.choke?.(t) },
    dispose: () => { fb?.dispose(); g.dispose() },
  }
}

interface Channel { gain: Tone.Gain; insts: Partial<Record<Voice, Inst>> }
export type StepListener = (layerSteps: Record<string, number>, bar: number) => void
const FILL_ID = 'fill', FX_ID = 'fx'

/** Thin Tone.js wrapper. All timing runs on Tone.Transport at a 48-tick-per-bar grid. */
export class RhythmEngine {
  private layers: Layer[] = []
  private channels = new Map<string, Channel>()
  private kit!: Kit
  private swing = 0
  private tick = 0
  private bar = 0
  private eventId: number | null = null
  private listeners = new Set<StepListener>()
  private master = new Tone.Gain(0.8).connect(new Tone.Compressor({ threshold: -14, ratio: 3, attack: 0.005, release: 0.15 }).toDestination())
  private arrangement: { arr: Arrangement; resolve: (ids: string[]) => Pattern[] } | null = null
  private fill: Fill | null = null
  private fillEvery = 0
  onSection?: (index: number) => void
  onBar?: (bar: number, inFill: boolean) => void

  setKit(kit: Kit) { this.kit = kit; for (const c of this.channels.values()) this.clearInsts(c) }
  setSwing(s: number) { this.swing = s }
  setBpm(bpm: number) { Tone.getTransport().bpm.rampTo(bpm, 0.05) }
  /** Insert `fill` in the last bar of every `every` bars (0 = off). */
  setFill(fill: Fill | null, every: number) { this.fill = fill; this.fillEvery = every }
  subscribe(l: StepListener) { this.listeners.add(l); return () => { this.listeners.delete(l) } }

  private channel(id: string, volume = 0.85): Channel {
    let c = this.channels.get(id)
    if (!c) { c = { gain: new Tone.Gain(volume).connect(this.master), insts: {} }; this.channels.set(id, c) }
    return c
  }

  setLayers(layers: Layer[]) {
    this.layers = layers
    const ids = new Set([...layers.map(l => l.id), FILL_ID, FX_ID])
    for (const [id, c] of this.channels) if (!ids.has(id)) { this.clearInsts(c); c.gain.dispose(); this.channels.delete(id) }
    for (const l of layers) this.channel(l.id, l.volume).gain.gain.rampTo(l.volume, 0.03)
  }

  setArrangement(arr: Arrangement | null, resolve?: (ids: string[]) => Pattern[]) {
    this.arrangement = arr && resolve ? { arr, resolve } : null
  }

  private clearInsts(c: Channel) { for (const i of Object.values(c.insts)) i?.dispose(); c.insts = {} }

  private inst(channelId: string, v: Voice): Inst | undefined {
    const c = this.channels.get(channelId) ?? this.channel(channelId)
    return (c.insts[v] ??= makeInst(this.kit.voices[v], c.gain))
  }

  private play(channelId: string, voice: Voice, t: number, vel: number, graces = 0, stepSec = 0.1) {
    const inst = this.inst(channelId, voice); if (!inst) return
    if (voice === 'tick' || voice === 'pedal') this.channels.get(channelId)?.insts.open?.choke?.(t)
    const g = Math.min(0.03, stepSec / 4)
    for (let i = graces; i > 0; i--) inst.trigger(Math.max(0, t - g * i), vel * 0.35)
    inst.trigger(t, vel)
  }

  private applySection(bar: number, time: number) {
    if (!this.arrangement) return
    const { arr, resolve } = this.arrangement
    const total = arr.sections.reduce((a, s) => a + s.bars, 0)
    let b = bar % total, idx = 0
    while (b >= arr.sections[idx].bars) { b -= arr.sections[idx].bars; idx++ }
    if (b !== 0 && bar !== 0) return
    const pats = resolve(arr.sections[idx].patternIds)
    this.setLayers(pats.map((p, i) => ({ id: `arr-${i}`, pattern: p, volume: 0.85, mute: false, solo: false })))
    if (arr.sections[idx].crash && bar > 0) this.play(FX_ID, 'crash1', time, 0.9)
    Tone.getDraw().schedule(() => this.onSection?.(idx), time)
  }

  private inFill(bar: number) { return !!this.fill && this.fillEvery > 0 && !this.arrangement && bar % this.fillEvery === this.fillEvery - 1 }

  async start() {
    await Tone.start()
    const tr = Tone.getTransport()
    if (this.eventId !== null) return
    this.tick = 0; this.bar = 0
    const tickLen = `${(tr.PPQ * 4) / TICKS_PER_BAR}i`
    this.eventId = tr.scheduleRepeat(time => {
      const barStart = this.tick % TICKS_PER_BAR === 0
      const fillBar = this.inFill(this.bar)
      if (barStart) {
        this.applySection(this.bar, time)
        if (this.fill?.crashAfter && this.fillEvery && this.bar > 0 && this.inFill(this.bar - 1)) this.play(FX_ID, 'crash1', time, 1)
        const bar = this.bar; Tone.getDraw().schedule(() => this.onBar?.(bar, fillBar), time)
      }
      const steps: Record<string, number> = {}
      const tickSec = Tone.Time(tickLen).toSeconds()
      const sources: { id: string; pattern: Pattern; tickBase: number }[] = fillBar
        ? [{ id: FILL_ID, pattern: this.fill!.pattern, tickBase: this.tick % TICKS_PER_BAR }]
        : audibleLayers(this.layers).map(l => ({ id: l.id, pattern: l.pattern, tickBase: this.tick }))
      for (const s of sources) {
        const step = stepForTick(s.pattern, s.tickBase); if (step === null) continue
        steps[s.id] = step
        const stepSec = tickSec * ticksPerStep(s.pattern)
        const t = time + swingOffset(s.pattern, step, this.swing) * stepSec
        for (const h of hitsAt(s.pattern, step)) this.play(s.id, h.voice, t, h.velocity, h.graces, stepSec)
      }
      if (!fillBar) for (const l of this.layers) if (steps[l.id] === undefined) { const s = stepForTick(l.pattern, this.tick); if (s !== null) steps[l.id] = s }
      if (Object.keys(steps).length) { const bar = this.bar; Tone.getDraw().schedule(() => this.listeners.forEach(f => f(steps, bar)), time) }
      this.tick++
      if (this.tick % TICKS_PER_BAR === 0) this.bar++
    }, tickLen, 0)
    tr.start('+0.05')
  }

  stop() {
    const tr = Tone.getTransport()
    if (this.eventId !== null) tr.clear(this.eventId)
    this.eventId = null; tr.stop(); tr.position = 0
    this.listeners.forEach(f => f({}, 0))
  }
  get playing() { return this.eventId !== null }
}
