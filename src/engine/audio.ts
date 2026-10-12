import * as Tone from 'tone'
import type { Kit, KitVoice, Layer, Voice, Arrangement, Pattern } from './types'
import { TICKS_PER_BAR, hitsAt, stepForTick, swingOffset, audibleLayers, ticksPerStep } from './pattern'

type Inst = { trigger: (t: number, v: number) => void; dispose: () => void }

function makeInst(kv: KitVoice, out: Tone.ToneAudioNode): Inst {
  const g = new Tone.Gain(kv.gain ?? 1).connect(out)
  if (kv.kind === 'membrane') {
    const s = new Tone.MembraneSynth({ pitchDecay: kv.pitchDecay ?? 0.05, octaves: 4, envelope: { attack: 0.001, decay: kv.decay, sustain: 0, release: 0.05 } }).connect(g)
    return { trigger: (t, v) => s.triggerAttackRelease(kv.pitch ?? 60, kv.decay, t, v), dispose: () => { s.dispose(); g.dispose() } }
  }
  if (kv.kind === 'noise') {
    const f = new Tone.Filter(kv.tone ?? 6000, kv.tone && kv.tone > 4000 ? 'highpass' : 'bandpass').connect(g)
    const s = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: kv.decay, sustain: 0 } }).connect(f)
    // body tone layered under snare-like noises
    const body = kv.pitch ? new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 1.5, envelope: { attack: 0.001, decay: kv.decay * 0.6, sustain: 0 } }).connect(g) : null
    return {
      trigger: (t, v) => { s.triggerAttackRelease(kv.decay, t, v); body?.triggerAttackRelease(kv.pitch!, kv.decay * 0.6, t, v * 0.6) },
      dispose: () => { s.dispose(); f.dispose(); body?.dispose(); g.dispose() },
    }
  }
  const s = new Tone.MetalSynth({ harmonicity: kv.tone ?? 5.1, modulationIndex: 16, resonance: 3000, octaves: 1.2, envelope: { attack: 0.001, decay: kv.decay, release: 0.05 } }).connect(g)
  s.frequency.value = kv.pitch ?? 300
  return { trigger: (t, v) => s.triggerAttackRelease(kv.pitch ?? 300, kv.decay, t, v), dispose: () => { s.dispose(); g.dispose() } }
}

interface Channel { gain: Tone.Gain; insts: Partial<Record<Voice, Inst>> }

export type StepListener = (layerSteps: Record<string, number>, bar: number) => void

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
  private master = new Tone.Gain(0.8).toDestination()
  private arrangement: { arr: Arrangement; resolve: (ids: string[]) => Pattern[] } | null = null
  onSection?: (index: number) => void

  setKit(kit: Kit) { this.kit = kit; for (const c of this.channels.values()) this.clearInsts(c) }
  setSwing(s: number) { this.swing = s }
  setBpm(bpm: number) { Tone.getTransport().bpm.rampTo(bpm, 0.05) }
  subscribe(l: StepListener) { this.listeners.add(l); return () => { this.listeners.delete(l) } }

  setLayers(layers: Layer[]) {
    this.layers = layers
    const ids = new Set(layers.map(l => l.id))
    for (const [id, c] of this.channels) if (!ids.has(id)) { this.clearInsts(c); c.gain.dispose(); this.channels.delete(id) }
    for (const l of layers) {
      let c = this.channels.get(l.id)
      if (!c) { c = { gain: new Tone.Gain(l.volume).connect(this.master), insts: {} }; this.channels.set(l.id, c) }
      c.gain.gain.rampTo(l.volume, 0.03)
    }
  }

  /** Play a multi-section arrangement: layers are replaced at section boundaries. */
  setArrangement(arr: Arrangement | null, resolve?: (ids: string[]) => Pattern[]) {
    this.arrangement = arr && resolve ? { arr, resolve } : null
  }

  private clearInsts(c: Channel) { for (const i of Object.values(c.insts)) i?.dispose(); c.insts = {} }

  private inst(layerId: string, v: Voice): Inst | undefined {
    const c = this.channels.get(layerId); if (!c) return
    return (c.insts[v] ??= makeInst(this.kit.voices[v], c.gain))
  }

  private applySection(bar: number) {
    if (!this.arrangement) return
    const { arr, resolve } = this.arrangement
    const total = arr.sections.reduce((a, s) => a + s.bars, 0)
    let b = bar % total, idx = 0
    while (b >= arr.sections[idx].bars) { b -= arr.sections[idx].bars; idx++ }
    if (b !== 0 && bar !== 0) return
    const pats = resolve(arr.sections[idx].patternIds)
    this.setLayers(pats.map((p, i) => ({ id: `arr-${i}`, pattern: p, volume: 0.85, mute: false, solo: false })))
    Tone.getDraw().schedule(() => this.onSection?.(idx), Tone.now())
  }

  async start() {
    await Tone.start()
    const tr = Tone.getTransport()
    if (this.eventId !== null) return
    this.tick = 0; this.bar = 0
    const tickLen = `${(Tone.getTransport().PPQ * 4) / TICKS_PER_BAR}i`
    this.eventId = tr.scheduleRepeat(time => {
      if (this.tick % TICKS_PER_BAR === 0) this.applySection(this.bar)
      const steps: Record<string, number> = {}
      const tickSec = Tone.Time(tickLen).toSeconds()
      for (const l of audibleLayers(this.layers)) {
        const step = stepForTick(l.pattern, this.tick); if (step === null) continue
        steps[l.id] = step
        const stepSec = tickSec * ticksPerStep(l.pattern)
        const t = time + swingOffset(l.pattern, step, this.swing) * stepSec
        for (const h of hitsAt(l.pattern, step)) this.inst(l.id, h.voice)?.trigger(t, h.velocity)
      }
      for (const l of this.layers) if (steps[l.id] === undefined) { const s = stepForTick(l.pattern, this.tick); if (s !== null) steps[l.id] = s }
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
