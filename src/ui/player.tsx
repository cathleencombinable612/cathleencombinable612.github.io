import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { RhythmEngine } from '../engine/audio'
import type { Arrangement, Layer, Pattern } from '../engine/types'
import { KITS } from '../data/kits'
import { PATTERNS } from '../data/rhythms'

interface Ctx {
  layers: Layer[]; playing: boolean; bpm: number; swing: number; kitId: string; section: number | null; arrangement: Arrangement | null
  load: (p: Pattern, add?: boolean) => void
  loadArrangement: (a: Arrangement) => void
  update: (id: string, patch: Partial<Layer>) => void
  remove: (id: string) => void
  toggle: () => void; setBpm: (n: number) => void; setSwing: (n: number) => void; setKit: (id: string) => void
  subscribe: RhythmEngine['subscribe']
}
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

  const e = useCallback(() => {
    if (!eng.current) { eng.current = new RhythmEngine(); eng.current.setKit(KITS[0]); eng.current.onSection = setSection }
    return eng.current
  }, [])

  useEffect(() => { if (!arrangement) e().setLayers(layers) }, [layers, arrangement, e])

  const value = useMemo<Ctx>(() => ({
    layers, playing, bpm, swing, kitId, section, arrangement,
    load: (p, add) => {
      e().setArrangement(null); setArr(null); setSection(null)
      const l: Layer = { id: `l${n++}`, pattern: p, volume: 0.85, mute: false, solo: false }
      setLayers(prev => (add ? [...prev, l] : [l]))
      if (!add && p.suggestedBpm) { setBpmS(p.suggestedBpm); e().setBpm(p.suggestedBpm) }
      if (!add && p.suggestedSwing !== undefined) { setSwingS(p.suggestedSwing); e().setSwing(p.suggestedSwing) }
    },
    loadArrangement: a => {
      setArr(a); setBpmS(a.bpm); e().setBpm(a.bpm); setLayers([])
      e().setArrangement(a, ids => ids.map(id => PATTERNS[id]))
      e().stop(); setPlaying(false)
    },
    update: (id, patch) => setLayers(ls => ls.map(l => (l.id === id ? { ...l, ...patch } : l))),
    remove: id => setLayers(ls => ls.filter(l => l.id !== id)),
    toggle: async () => {
      const en = e()
      if (en.playing) { en.stop(); setPlaying(false); setSection(null) } else { await en.start(); setPlaying(true) }
    },
    setBpm: v => { setBpmS(v); e().setBpm(v) },
    setSwing: v => { setSwingS(v); e().setSwing(v) },
    setKit: id => { setKitId(id); e().setKit(KITS.find(k => k.id === id)!) },
    subscribe: l => e().subscribe(l),
  }), [layers, playing, bpm, swing, kitId, section, arrangement, e])
  return <C.Provider value={value}>{children}</C.Provider>
}

/** Load / add buttons used throughout content pages. */
export function LoadButtons({ pattern }: { pattern: Pattern }) {
  const { load, layers, toggle, playing } = usePlayer()
  const active = layers.some(l => l.pattern.id === pattern.id)
  return (
    <div className="flex gap-2 mt-3">
      <button className="h-10 px-4 rounded-full bg-amber text-ink text-sm font-medium" onClick={async () => { load(pattern); if (!playing) await toggle() }}>Play</button>
      <button className="h-10 px-4 rounded-full border border-line text-sm text-bone/80" onClick={() => load(pattern, true)}>{active ? 'Add again' : '+ Layer'}</button>
    </div>
  )
}

function Steps({ layer }: { layer: Layer }) {
  const { subscribe } = usePlayer()
  const [cur, setCur] = useState(-1)
  useEffect(() => subscribe(s => setCur(s[layer.id] ?? (Object.keys(s).length ? cur : -1))), [subscribe, layer.id]) // eslint-disable-line
  const p = layer.pattern
  return (
    <div className="flex gap-[3px] mt-2">
      {Array.from({ length: p.steps }, (_, i) => {
        const hit = Object.values(p.tracks).some(t => t && t[i] !== '.')
        return <span key={i} className={`h-2 flex-1 rounded-full ${i === cur ? 'bg-amber' : hit ? 'bg-bone/50' : 'bg-line'} ${i % p.stepsPerBeat === 0 && i ? 'ml-1' : ''}`} />
      })}
    </div>
  )
}

export function PlayerBar() {
  const P = usePlayer()
  const [open, setOpen] = useState(false)
  const title = P.arrangement ? `${P.arrangement.name}${P.section !== null ? ` · ${P.arrangement.sections[P.section].name}` : ''}` : P.layers.length ? P.layers.map(l => l.pattern.name).join(' + ') : 'Nothing loaded'
  const shown = P.arrangement ? [] : P.layers
  return (
    <div className="fixed bottom-0 inset-x-0 bg-ink/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-xl mx-auto px-5">
        {open && (
          <div className="pt-5 pb-2 space-y-5 max-h-[60vh] overflow-y-auto">
            {shown.map(l => (
              <div key={l.id}>
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-sm truncate">{l.pattern.name}</span>
                  <button aria-label="mute" onClick={() => P.update(l.id, { mute: !l.mute })} className={`w-9 h-9 rounded-full text-xs ${l.mute ? 'bg-bone text-ink' : 'border border-line text-bone/60'}`}>M</button>
                  <button aria-label="solo" onClick={() => P.update(l.id, { solo: !l.solo })} className={`w-9 h-9 rounded-full text-xs ${l.solo ? 'bg-amber text-ink' : 'border border-line text-bone/60'}`}>S</button>
                  <button aria-label="remove" onClick={() => P.remove(l.id)} className="w-9 h-9 text-bone/40">×</button>
                </div>
                <input type="range" min={0} max={1} step={0.01} value={l.volume} onChange={e => P.update(l.id, { volume: +e.target.value })} className="w-full mt-1" aria-label="volume" />
                <Steps layer={l} />
              </div>
            ))}
            {!shown.length && !P.arrangement && <p className="text-sm text-bone/50">Load a rhythm from the library, then add more layers to hear how they combine.</p>}
            <div className="grid grid-cols-2 gap-4 text-xs text-bone/60">
              <label>Tempo · {P.bpm} BPM<input type="range" min={40} max={260} value={P.bpm} onChange={e => P.setBpm(+e.target.value)} className="w-full" /></label>
              <label>Swing · {Math.round(P.swing * 100)}%<input type="range" min={0} max={1} step={0.01} value={P.swing} onChange={e => P.setSwing(+e.target.value)} className="w-full" /></label>
            </div>
            <div className="flex flex-wrap gap-2">
              {KITS.map(k => <button key={k.id} onClick={() => P.setKit(k.id)} className={`h-9 px-3 rounded-full text-xs ${P.kitId === k.id ? 'bg-bone text-ink' : 'border border-line text-bone/70'}`}>{k.name}</button>)}
            </div>
          </div>
        )}
        <div className="flex items-center gap-4 h-16">
          <button aria-label={P.playing ? 'stop' : 'play'} onClick={P.toggle} disabled={!P.layers.length && !P.arrangement} className="w-12 h-12 rounded-full bg-amber text-ink grid place-items-center disabled:opacity-30">
            {P.playing ? <span className="w-3.5 h-3.5 bg-ink" /> : <span className="ml-1 w-0 h-0 border-y-[8px] border-y-transparent border-l-[13px] border-l-ink" />}
          </button>
          <button className="flex-1 text-left min-w-0" onClick={() => setOpen(o => !o)}>
            <div className="text-sm truncate">{title}</div>
            <div className="text-xs text-bone/50">{P.bpm} BPM · {KITS.find(k => k.id === P.kitId)!.name}</div>
          </button>
          <button onClick={() => setOpen(o => !o)} className="text-xs text-bone/60 h-10 px-2">{open ? 'Close' : 'Mix'}</button>
        </div>
      </div>
    </div>
  )
}
