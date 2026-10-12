import type { Kit, KitVoice, Voice } from '../engine/types'

/** Synth cymbals / extra voices for kits that don't define them. Every kit gets all voices. */
const SYNTH_EXTRA: Partial<Record<Voice, KitVoice>> = {
  crash1: { kind: 'metal', pitch: 340, tone: 7.3, decay: 1.6, gain: 0.1 },
  crash2: { kind: 'metal', pitch: 290, tone: 6.1, decay: 2.0, gain: 0.1 },
  china: { kind: 'metal', pitch: 380, tone: 11.2, decay: 1.2, gain: 0.09 },
  rideBell: { kind: 'metal', pitch: 900, tone: 2.3, decay: 0.9, gain: 0.12 },
  pedal: { kind: 'noise', tone: 6000, decay: 0.05, gain: 0.25 },
  tomMid: { kind: 'membrane', pitch: 125, decay: 0.4, pitchDecay: 0.03 },
}
function withCymbals(v: Partial<Record<Voice, KitVoice>>): Record<Voice, KitVoice> {
  const out = { ...SYNTH_EXTRA, ...v } as Record<Voice, KitVoice>
  for (const k of Object.keys(out) as Voice[]) if (out[k].kind === 'sample' && !out[k].fallback) out[k] = { ...out[k], fallback: SYNTH_EXTRA[k] }
  return out
}

export const KITS: Kit[] = [
  { id: 'acoustic', name: 'Acoustic kit', blurb: 'Recorded samples (Salamander Drumkit by Alexander Holm), with velocity layers and round-robin.', voices: withCymbals({
    low: { kind: 'sample', layers: [{vel: 0.45, files: ['low_p_1.mp3', 'low_p_4.mp3']}, {vel: 0.8, files: ['low_f_2.mp3', 'low_f_6.mp3']}, {vel: 1, files: ['low_ff_3.mp3', 'low_ff_8.mp3']}], gain: 1, fallback: { kind: 'membrane', pitch: 50, decay: 0.4, pitchDecay: 0.05, gain: 1.1 } },
    back: { kind: 'sample', layers: [{vel: 0.4, files: ['back_ghost_2.mp3', 'back_ghost_5.mp3']}, {vel: 0.8, files: ['back_mp_3.mp3', 'back_mp_8.mp3']}, {vel: 1, files: ['back_ff_2.mp3', 'back_ff_6.mp3']}], gain: 1, fallback: { kind: 'noise', tone: 3000, decay: 0.18, pitch: 190, gain: 0.8 } },
    tick: { kind: 'sample', layers: [{vel: 0.6, files: ['tick_p_3.mp3', 'tick_p_9.mp3', 'tick_p_15.mp3']}, {vel: 1, files: ['tick_f_4.mp3', 'tick_f_10.mp3', 'tick_f_16.mp3']}], gain: 0.6, fallback: { kind: 'noise', tone: 8000, decay: 0.04, gain: 0.35 } },
    open: { kind: 'sample', layers: [{vel: 0.6, files: ['open_p_2.mp3']}, {vel: 1, files: ['open_f_1.mp3', 'open_f_3.mp3']}], gain: 0.55, fallback: { kind: 'noise', tone: 7000, decay: 0.3, gain: 0.3 } },
    pedal: { kind: 'sample', layers: [{vel: 1, files: ['pedal_mp_2.mp3', 'pedal_mp_7.mp3']}], gain: 0.6 },
    ride: { kind: 'sample', layers: [{vel: 0.7, files: ['ride_mp_2.mp3', 'ride_mp_5.mp3']}, {vel: 1, files: ['ride_ff_1.mp3', 'ride_ff_3.mp3']}], gain: 0.55, fallback: { kind: 'metal', pitch: 420, tone: 5.1, decay: 0.5, gain: 0.12 } },
    rideBell: { kind: 'sample', layers: [{vel: 1, files: ['rideBell_f_2.mp3', 'rideBell_f_4.mp3']}], gain: 0.55 },
    crash1: { kind: 'sample', layers: [{vel: 0.6, files: ['crash1_p_2.mp3']}, {vel: 1, files: ['crash1_ff_2.mp3', 'crash1_ff_4.mp3']}], gain: 0.6 },
    crash2: { kind: 'sample', layers: [{vel: 0.6, files: ['crash2_p_1.mp3']}, {vel: 1, files: ['crash2_ff_3.mp3', 'crash2_ff_6.mp3']}], gain: 0.6 },
    china: { kind: 'sample', layers: [{vel: 1, files: ['china_ff_2.mp3', 'china_ff_5.mp3']}], gain: 0.5 },
    tomHi: { kind: 'sample', layers: [{vel: 0.6, files: ['tomHi_p_2.mp3', 'tomHi_p_5.mp3']}, {vel: 1, files: ['tomHi_ff_3.mp3', 'tomHi_ff_7.mp3']}], gain: 1, fallback: { kind: 'membrane', pitch: 160, decay: 0.35, pitchDecay: 0.03 } },
    tomLo: { kind: 'sample', layers: [{vel: 0.6, files: ['tomLo_mp_2.mp3', 'tomLo_mp_6.mp3']}, {vel: 1, files: ['tomLo_ff_2.mp3', 'tomLo_ff_5.mp3']}], gain: 1, fallback: { kind: 'membrane', pitch: 95, decay: 0.45, pitchDecay: 0.03 } },
    accent: { kind: 'sample', layers: [{vel: 1, files: ['accent_f_2.mp3', 'accent_f_6.mp3']}], gain: 0.8, fallback: { kind: 'noise', tone: 2500, decay: 0.05, pitch: 900, gain: 0.5 } },
    bell: { kind: 'sample', layers: [{vel: 0.6, files: ['bell_mp_2.mp3']}, {vel: 1, files: ['bell_ff_3.mp3', 'bell_ff_6.mp3']}], gain: 0.5, fallback: { kind: 'metal', pitch: 800, tone: 3.2, decay: 0.2, gain: 0.12 } },
    tomMid: { kind: 'sample', rate: 1.22, layers: [{ vel: 0.6, files: ['tomLo_mp_2.mp3', 'tomLo_mp_6.mp3'] }, { vel: 1, files: ['tomLo_ff_2.mp3', 'tomLo_ff_5.mp3'] }], fallback: { kind: 'membrane', pitch: 125, decay: 0.4, pitchDecay: 0.03 } },
    shaker: { kind: 'noise', tone: 9000, decay: 0.05, gain: 0.25 },
  }) },
  { id: 'electronic', name: 'Electronic', blurb: 'Drum-machine style: boomy kick, clap, tight hats.', voices: withCymbals({
    low: { kind: 'membrane', pitch: 42, decay: 0.8, pitchDecay: 0.08, gain: 1.2 },
    back: { kind: 'noise', tone: 1500, decay: 0.22, gain: 0.9 },
    tick: { kind: 'noise', tone: 10000, decay: 0.025, gain: 0.4 },
    open: { kind: 'noise', tone: 9000, decay: 0.22, gain: 0.3 },
    ride: { kind: 'metal', pitch: 600, tone: 8, decay: 0.3, gain: 0.1 },
    tomHi: { kind: 'membrane', pitch: 180, decay: 0.3, pitchDecay: 0.1 },
    tomLo: { kind: 'membrane', pitch: 90, decay: 0.4, pitchDecay: 0.1 },
    accent: { kind: 'metal', pitch: 1500, tone: 1.5, decay: 0.05, gain: 0.15 },
    shaker: { kind: 'noise', tone: 11000, decay: 0.04, gain: 0.3 },
    bell: { kind: 'metal', pitch: 560, tone: 1.4, decay: 0.15, gain: 0.15 } }) },
  { id: 'frame', name: 'Frame / shamanic drum', blurb: 'One large frame drum played many ways: center boom, edge, rim, rattle.', voices: withCymbals({
    low: { kind: 'membrane', pitch: 62, decay: 0.7, pitchDecay: 0.02, gain: 1.1 },
    back: { kind: 'membrane', pitch: 110, decay: 0.25, pitchDecay: 0.01 },
    tick: { kind: 'noise', tone: 5000, decay: 0.03, pitch: 400, gain: 0.3 },
    open: { kind: 'noise', tone: 4500, decay: 0.25, gain: 0.25 },
    ride: { kind: 'noise', tone: 6000, decay: 0.08, gain: 0.3 },
    tomHi: { kind: 'membrane', pitch: 90, decay: 0.4, pitchDecay: 0.02 },
    tomLo: { kind: 'membrane', pitch: 55, decay: 0.8, pitchDecay: 0.02 },
    accent: { kind: 'membrane', pitch: 140, decay: 0.12, pitchDecay: 0.005 },
    shaker: { kind: 'noise', tone: 7000, decay: 0.09, gain: 0.3 },
    bell: { kind: 'metal', pitch: 1200, tone: 2.1, decay: 0.4, gain: 0.08 } }) },
  { id: 'latin', name: 'Latin hand percussion', blurb: 'Congas, bongos, clave, cowbell, shaker.', voices: withCymbals({
    low: { kind: 'membrane', pitch: 85, decay: 0.35, pitchDecay: 0.015, gain: 1 },
    back: { kind: 'membrane', pitch: 210, decay: 0.12, pitchDecay: 0.004 },
    tick: { kind: 'noise', tone: 8000, decay: 0.06, gain: 0.3 },
    open: { kind: 'noise', tone: 6000, decay: 0.15, gain: 0.3 },
    ride: { kind: 'metal', pitch: 700, tone: 1.6, decay: 0.12, gain: 0.14 },
    tomHi: { kind: 'membrane', pitch: 290, decay: 0.15, pitchDecay: 0.005 },
    tomLo: { kind: 'membrane', pitch: 150, decay: 0.25, pitchDecay: 0.01 },
    accent: { kind: 'metal', pitch: 2500, tone: 1.1, decay: 0.06, gain: 0.2 },
    shaker: { kind: 'noise', tone: 9000, decay: 0.07, gain: 0.3 },
    bell: { kind: 'metal', pitch: 560, tone: 1.4, decay: 0.18, gain: 0.16 } }) },
  { id: 'tuned', name: 'Tuned toms', blurb: 'Six pitched membranes for melodic playing (Kit as Pitch).', voices: withCymbals({
    low: { kind: 'membrane', pitch: 65.4, decay: 0.7, pitchDecay: 0.03, gain: 1.1 },
    tomLo: { kind: 'membrane', pitch: 98, decay: 0.55, pitchDecay: 0.02 },
    tomHi: { kind: 'membrane', pitch: 130.8, decay: 0.5, pitchDecay: 0.02 },
    back: { kind: 'membrane', pitch: 164.8, decay: 0.45, pitchDecay: 0.015 },
    accent: { kind: 'membrane', pitch: 196, decay: 0.4, pitchDecay: 0.015 },
    bell: { kind: 'membrane', pitch: 261.6, decay: 0.35, pitchDecay: 0.01 },
    tick: { kind: 'noise', tone: 8000, decay: 0.04, gain: 0.35 },
    open: { kind: 'noise', tone: 7000, decay: 0.3, gain: 0.3 },
    ride: { kind: 'metal', pitch: 420, tone: 5.1, decay: 0.5, gain: 0.12 },
    shaker: { kind: 'noise', tone: 9000, decay: 0.05, gain: 0.25 } }) },
]
