import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { RhythmEngine, preloadKit, setSampleBase } from '../engine/audio'
import type { Arrangement, Fill, Layer, Pattern, Voice } from '../engine/types'
import { VOICES } from '../engine/types'
import { velocityOf, ticksPerStep } from '../engine/pattern'
import { KITS } from '../data/kits'
import { PATTERNS } from '../data/rhythms'
import { FILLS, FILL_EVERY } from '../data/fills'
import { SONGS, loadSongBars, type Song } from '../data/songs'
import { applyTuning, applyShift, type Tuning } from '../engine/pitch'

setSampleBase(`${import.meta.env.BASE_URL}samples/acoustic/`)
export const ALL_FILLS: Fill[] = [...FILLS, ...SONGS.flatMap(s => s.fills)]

interface Ctx {
  layers: Layer[]; playing: boolean; bpm: number; swing: number; kitId: string; section: number | null; arrangement: Arrangement | null
  tuning: Tuning; setTuning: (t: Tuning) => void
  fillId: string | null; fillEvery: number; setFill: (id: string | null, every?: number) => void; inFill: boolean
  kitProgress: number // 0..1 sample loading
  load: (p: Pattern, add?: boolean) => void
  loadArrangement: (a: Arrangement) => void
  update: (id: string, patch: Partial<Layer>) => void
  remove: (id: string) => void
  toggle: () => Promise<void>; setBpm: (n: number) => void; setSwing: (n: number) => void; setKit: (id: string) => void
  subscribe: RhythmEngine['subscribe']
  song: Song | null; songBar: number; loopSection: number | null
  loadSong: (s: Song, section?: number) => Promise<void>; jumpSection: (i: number) => void; setLoopSection: (i: number | null) => void
}
export const sectionOf = (s: Song, bar: number) => Math.max(0, s.sections.findIndex(x => bar >= x.start && bar < x.start + x.bars))
const C = createContext<Ctx>(null!)
export const usePlayer = () => useContext(C)
let n = 0

export function PlayerProvider({ children }: { children: ReactNode }) {
  const eng = useRef<RhythmEngine>()
  const [layers, setLayers] = useState<Layer[]>([])
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpmS] = useState(100)
  const [swing, setSwingS] = useState(0)
  const [kitId, setKitId] = useState('acoustic')
  const [arrangement, setArr] = useState<Arrangement | null>(null)
  const [section, setSection] = useState<number | null>(null)
  const [tuning, setTuning] = useState<Tuning>({})
  const [fillId, setFillId] = useState<string | null>(null)
  const [fillEvery, setFillEvery] = useState(4)
  const [inFill, setInFill] = useState(false)
  const [kitProgress, setKitProgress] = useState(0)
  const [song, setSong] = useState<Song | null>(null)
  const [songBar, setSongBar] = useState(0)
  const [loopSection, setLoopS] = useState<number | null>(null)

  const e = useCallback(() => {
    if (!eng.current) {
      eng.current = new RhythmEngine(); eng.current.setKit(KITS[0]); eng.current.onSection = setSection
      eng.current.onBar = (_b, f) => setInFill(f); eng.current.onSongBar = setSongBar
    }
    return eng.current
  }, [])

  useEffect(() => { if (!arrangement && !song) e().setLayers(layers) }, [layers, arrangement, song, e])
  useEffect(() => {
    const kit = KITS.find(k => k.id === kitId)!
    e().setKit(applyShift(applyTuning(kit, tuning), song?.raw.tuning?.shift as Partial<Record<Voice, number>> | undefined))
  }, [kitId, tuning, song, e])
  useEffect(() => { e().setFill(ALL_FILLS.find(f => f.pattern.id === fillId) ?? null, fillId ? fillEvery : 0) }, [fillId, fillEvery, e])

  const preload = useCallback((id: string) => {
    const kit = KITS.find(k => k.id === id)!
    if (!Object.values(kit.voices).some(v => v.kind === 'sample')) { setKitProgress(1); return }
    void preloadKit(kit, (d, t) => setKitProgress(d / t))
  }, [])

  const value = useMemo<Ctx>(() => ({
    layers, playing, bpm, swing, kitId, section, arrangement, tuning, setTuning, fillId, fillEvery, inFill, kitProgress,
    setFill: (id, every) => { setFillId(id); if (every !== undefined) setFillEvery(every) },
    song, songBar, loopSection,
    loadSong: async (sg, sec = 0) => {
      await loadSongBars(sg)
      const en = e(); en.stop(); setPlaying(false); en.setArrangement(null); setArr(null); setSection(null); setLayers([])
      en.setSong(sg.bars); const st = sg.sections[sec]?.start ?? 0; en.jumpSong(st); setSong(sg); setSongBar(st); setLoopS(null); setSwingS(0); en.setSwing(0)
      setBpmS(sg.raw.bpm); en.setBpm(sg.raw.bpm)
    },
    jumpSection: i => { if (!song) return; const st = song.sections[i].start; e().jumpSong(st); if (!e().playing) setSongBar(st)
      if (loopSection !== null && loopSection !== i) { setLoopS(i); e().setSongLoop([st, st + song.sections[i].bars]) } },
    setLoopSection: i => { setLoopS(i); e().setSongLoop(i === null || !song ? null : [song.sections[i].start, song.sections[i].start + song.sections[i].bars]) },
    load: (p, add) => {
      e().setSong(null); setSong(null)
      e().setArrangement(null); setArr(null); setSection(null)
      const l: Layer = { id: `l${n++}`, pattern: p, volume: 0.85, mute: false, solo: false }
      setLayers(prev => (add ? [...prev, l] : [l]))
      if (!add && p.suggestedBpm) { setBpmS(p.suggestedBpm); e().setBpm(p.suggestedBpm) }
      if (!add) { const s = p.suggestedSwing ?? 0; setSwingS(s); e().setSwing(s) }
    },
    loadArrangement: a => {
      e().setSong(null); setSong(null)
      setArr(a); setBpmS(a.bpm); e().setBpm(a.bpm); setLayers([])
      e().setArrangement(a, ids => ids.map(id => PATTERNS[id]))
      e().stop(); setPlaying(false)
    },
    update: (id, patch) => setLayers(ls => ls.map(l => (l.id === id ? { ...l, ...patch } : l))),
    remove: id => setLayers(ls => ls.filter(l => l.id !== id)),
    toggle: async () => {
      const en = e()
      if (en.playing) { en.stop(); setPlaying(false); setSection(null); setInFill(false); if (song) { en.jumpSong(songBar) } }
      else { preload(kitId); await en.start(); setPlaying(true) }
    },
    setBpm: v => { setBpmS(v); e().setBpm(v) },
    setSwing: v => { setSwingS(v); e().setSwing(v) },
    setKit: id => { setKitId(id); setKitProgress(0); preload(id) },
    subscribe: l => e().subscribe(l),
  }), [layers, playing, bpm, swing, kitId, section, arrangement, tuning, fillId, fillEvery, inFill, kitProgress, song, songBar, loopSection, e, preload])
  return <C.Provider value={value}>{children}</C.Provider>
}

// ---------- shared pieces ----------

export function LoadButtons({ pattern }: { pattern: Pattern }) {
  const { load, layers, toggle, playing } = usePlayer()
  const active = layers.some(l => l.pattern.id === pattern.id)
  return (
    <div className="flex items-center gap-2 mt-4">
      <button className="btn-primary" onClick={async () => { load(pattern); if (!playing) await toggle() }}>
        <PlayGlyph /> Play
      </button>
      <button className="btn-ghost" onClick={() => load(pattern, true)}>{active ? 'Add again' : 'Add layer'}</button>
      {pattern.suggestedBpm && <span className="ml-auto text-xs text-mute tabular-nums" title={pattern.bpmNote}>{pattern.suggestedBpm} BPM</span>}
    </div>
  )
}
const PlayGlyph = () => <span className="inline-block w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-current" />

const VOICE_LABEL: Record<Voice, string> = {
  crash1: 'Crash', crash2: 'Crash 2', china: 'China', ride: 'Ride', rideBell: 'Bell', open: 'Open HH', tick: 'Hi-hat', pedal: 'Pedal HH',
  tomHi: 'Tom 1', tomMid: 'Tom 2', tomLo: 'Floor', back: 'Snare', accent: 'Rim', low: 'Kick', bell: 'Cowbell', shaker: 'Shaker',
}

/** Velocity-aware step grid. Rows = voices used, bars show velocity, playhead column glows. */
export function StepGrid({ pattern, current }: { pattern: Pattern; current: number }) {
  const rows = VOICES.filter(v => pattern.tracks[v])
  const dense = pattern.steps > 16
  return (
    <div className={`mt-3 ${dense ? 'overflow-x-auto -mx-1 px-1' : ''}`}>
      <div className="space-y-1" style={{ minWidth: dense ? pattern.steps * 11 : undefined }}>
        {rows.map(v => (
          <div key={v} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-[10px] uppercase tracking-wider text-mute">{VOICE_LABEL[v]}</span>
            <div className="flex-1 flex gap-[2px]">
              {Array.from({ length: pattern.steps }, (_, i) => {
                const c = pattern.tracks[v]![i]; const vel = velocityOf(c)
                const beat = i % pattern.stepsPerBeat === 0 && i > 0
                return (
                  <span key={i} className={`relative flex-1 h-5 rounded-[3px] overflow-hidden transition-colors duration-75 ${beat ? 'ml-[3px]' : ''} ${i === current ? 'bg-amber/25' : 'bg-white/[0.04]'}`}>
                    {vel > 0 && <span className={`absolute inset-x-0 bottom-0 rounded-[3px] transition-[background-color,transform] duration-100 ${i === current ? 'bg-amber scale-y-110' : 'bg-bone/70'}`} style={{ height: `${Math.round(25 + vel * 75)}%` }} />}
                    {(c === 'f' || c === 'r') && <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ink" />}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function useStep(id: string) {
  const { subscribe } = usePlayer()
  const [cur, setCur] = useState(-1)
  useEffect(() => subscribe(s => { if (!Object.keys(s).length) setCur(-1); else if (s[id] !== undefined) setCur(s[id]) }), [subscribe, id])
  return cur
}

function LayerCard({ layer }: { layer: Layer }) {
  const P = usePlayer()
  const cur = useStep(layer.id)
  const dim = P.layers.some(l => l.solo) ? !layer.solo : layer.mute
  return (
    <div className={`card transition-opacity duration-200 ${dim ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium truncate">{layer.pattern.name}</div>
          <div className="text-[11px] text-mute tabular-nums">{layer.pattern.steps} steps · {(layer.pattern.steps * ticksPerStep(layer.pattern)) / 12} beats</div>
        </div>
        <button aria-pressed={layer.mute} onClick={() => P.update(layer.id, { mute: !layer.mute })} className={`chip-sq ${layer.mute ? 'bg-bone text-ink' : ''}`}>M</button>
        <button aria-pressed={layer.solo} onClick={() => P.update(layer.id, { solo: !layer.solo })} className={`chip-sq ${layer.solo ? 'bg-amber text-ink border-amber' : ''}`}>S</button>
        <button aria-label="Remove layer" onClick={() => P.remove(layer.id)} className="chip-sq border-transparent text-mute">✕</button>
      </div>
      <StepGrid pattern={layer.pattern} current={cur} />
      <input type="range" min={0} max={1} step={0.01} value={layer.volume} onChange={e => P.update(layer.id, { volume: +e.target.value })} className="slider mt-3" aria-label="Layer volume" />
    </div>
  )
}

function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex p-0.5 rounded-full bg-white/[0.05]">
      {options.map(o => <button key={String(o.v)} onClick={() => onChange(o.v)} className={`h-8 px-3.5 rounded-full text-xs transition-all duration-200 ${value === o.v ? 'bg-bone text-ink shadow' : 'text-bone/60'}`}>{o.l}</button>)}
    </div>
  )
}

export function PlayerBar() {
  const P = usePlayer()
  const [open, setOpen] = useState(false)
  const sg = P.song; const si = sg ? sectionOf(sg, P.songBar) : 0
  const title = sg ? sg.raw.song : P.arrangement ? P.arrangement.name : P.layers.length ? P.layers.map(l => l.pattern.name).join(' + ') : 'Choose a rhythm'
  const sub = sg ? `${sg.sections[si].name} · bar ${P.songBar - sg.sections[si].start + 1}/${sg.sections[si].bars}${P.loopSection !== null ? ' · looping' : ''}` : P.arrangement && P.section !== null ? P.arrangement.sections[P.section].name : P.inFill ? 'Fill' : `${KITS.find(k => k.id === P.kitId)!.name}`
  const kitLoading = P.kitProgress < 1 && P.playing && KITS.find(k => k.id === P.kitId)!.voices.low.kind === 'sample'
  return (
    <>
      <div onClick={() => setOpen(false)} className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className="fixed bottom-0 inset-x-0 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-xl mx-auto px-3 pb-3">
          <div className="rounded-[22px] bg-[#141416]/90 backdrop-blur-xl border border-white/[0.07] shadow-2xl shadow-black/60 overflow-hidden">
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <div className="max-h-[68vh] overflow-y-auto px-4 pt-5 pb-2 space-y-6">
                  {sg && <SongForm />}
                  {!P.arrangement && !sg && (P.layers.length ? <div className="space-y-3">{P.layers.map(l => <LayerCard key={l.id} layer={l} />)}</div>
                    : <p className="text-sm text-mute">Load a rhythm, then add layers to hear how parts combine.</p>)}
                  {P.arrangement && <ol className="space-y-1.5 text-sm">{P.arrangement.sections.map((s, i) => <li key={i} className={`transition-colors ${P.section === i ? 'text-amber' : 'text-mute'}`}>{s.name} · {s.bars} bars</li>)}</ol>}

                  <section>
                    <Label>Tempo <span className="text-bone tabular-nums">{P.bpm}</span> <span className="normal-case tracking-normal">BPM</span></Label>
                    <input type="range" min={40} max={260} value={P.bpm} onChange={e => P.setBpm(+e.target.value)} className="slider" aria-label="Tempo" />
                    
                  </section>
                  <section>
                    <Label>Swing <span className="text-bone tabular-nums">{Math.round(P.swing * 100)}%</span></Label>
                    <input type="range" min={0} max={1} step={0.01} value={P.swing} onChange={e => P.setSwing(+e.target.value)} className="slider" aria-label="Swing" />
                  </section>
                  <section>
                    <Label>Kit</Label>
                    <div className="flex flex-wrap gap-2">{KITS.map(k => <button key={k.id} onClick={() => P.setKit(k.id)} className={`chip ${P.kitId === k.id ? 'chip-on' : ''}`}>{k.name}</button>)}</div>
                    {P.kitProgress > 0 && P.kitProgress < 1 && <div className="mt-2 h-0.5 rounded bg-white/10 overflow-hidden"><div className="h-full bg-amber transition-[width] duration-200" style={{ width: `${P.kitProgress * 100}%` }} /></div>}
                  </section>
                  <section>
                    <div className="flex items-center justify-between mb-2"><Label className="mb-0">Fill</Label>
                      <Segmented value={P.fillId ? P.fillEvery : 0} options={FILL_EVERY.map(v => ({ v, l: v ? `Every ${v}` : 'Off' }))} onChange={v => v ? P.setFill(P.fillId ?? FILLS[0].pattern.id, v) : P.setFill(null)} /></div>
                    <div className="flex flex-wrap gap-2">{FILLS.map(f => <button key={f.pattern.id} title={f.description} onClick={() => P.setFill(f.pattern.id)} className={`chip ${P.fillId === f.pattern.id ? 'chip-on' : ''}`}>{f.pattern.name}</button>)}</div>
                    {SONGS.some(s => s.fills.length) && <div className="flex flex-wrap gap-2 mt-2">{SONGS.flatMap(s => s.fills).map(f => <button key={f.pattern.id} onClick={() => P.setFill(f.pattern.id)} className={`chip ${P.fillId === f.pattern.id ? 'chip-on' : ''}`}>{f.pattern.name}</button>)}</div>}
                    {P.fillId && <p className="mt-2 text-[11px] text-mute">{ALL_FILLS.find(f => f.pattern.id === P.fillId)?.description}</p>}
                  </section>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 h-[68px] px-3">
              <button aria-label={P.playing ? 'Stop' : 'Play'} onClick={P.toggle} disabled={!P.layers.length && !P.arrangement && !P.song}
                className={`relative w-12 h-12 shrink-0 rounded-full bg-amber text-ink grid place-items-center transition-transform active:scale-90 disabled:opacity-25 ${P.playing ? 'pulse-ring' : ''}`}>
                {P.playing ? <span className="w-3.5 h-3.5 rounded-[2px] bg-ink" /> : <span className="ml-1 w-0 h-0 border-y-[8px] border-y-transparent border-l-[13px] border-l-ink" />}
              </button>
              <button className="flex-1 min-w-0 text-left" onClick={() => setOpen(o => !o)}>
                <div className="text-[15px] font-medium truncate">{title}</div>
                <div className="text-xs text-mute truncate">{kitLoading ? `Loading samples ${Math.round(P.kitProgress * 100)}%` : sub}</div>
              </button>
              <span className="text-xs tabular-nums text-mute">{P.bpm}</span>
              <button onClick={() => setOpen(o => !o)} aria-label={open ? 'Close mixer' : 'Open mixer'} className="w-10 h-10 grid place-items-center rounded-full text-bone/70 active:scale-90 transition-transform">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}><path d="M6 15l6-6 6 6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
const Label = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={`mb-2 text-[11px] uppercase tracking-[0.12em] text-mute flex gap-1.5 items-baseline ${className}`}>{children}</div>

/** Section list for the loaded song: tap a row to jump, tap the loop icon to repeat that section. */
export function SongForm({ song }: { song?: Song }) {
  const P = usePlayer()
  const sg = song ?? P.song!
  const live = P.song?.raw.id === sg.raw.id
  const cur = live ? sectionOf(sg, P.songBar) : -1
  const cur_step = useStep('song')
  return <div>
    {live && sg.bars[P.songBar] && <StepGrid pattern={sg.bars[P.songBar]} current={P.playing ? cur_step : -1} />}
    <ol className="mt-3 divide-y divide-line">{sg.sections.map((s, i) => {
      const on = i === cur; const pct = on ? ((P.songBar - s.start + 1) / s.bars) * 100 : 0
      return <li key={i} className="flex items-center gap-2 py-1.5">
        <button className={`flex-1 min-w-0 text-left text-sm ${on ? 'text-amber' : 'text-bone/70'}`} onClick={async () => { if (!live) { await P.loadSong(sg, i); await P.toggle() } else P.jumpSection(i) }}>
          <span className="truncate block">{s.name}</span>
          {on && <span className="block mt-1 h-0.5 rounded bg-white/10 overflow-hidden"><span className="block h-full bg-amber transition-[width] duration-150" style={{ width: `${pct}%` }} /></span>}
        </button>
        <span className="text-[11px] tabular-nums text-mute">{s.bars}</span>
        {live && <button aria-label={`Loop ${s.name}`} aria-pressed={P.loopSection === i} onClick={() => P.setLoopSection(P.loopSection === i ? null : i)} className={`w-8 h-8 grid place-items-center rounded-full text-xs ${P.loopSection === i ? 'bg-amber text-ink' : 'text-mute'}`}>↻</button>}
      </li>
    })}</ol>
  </div>
}
