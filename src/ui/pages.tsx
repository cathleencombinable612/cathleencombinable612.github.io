import { useState } from 'react'
import { RHYTHMS, PATTERNS } from '../data/rhythms'
import { STORY_ARRANGEMENT, STORY_TEXT } from '../data/story'
import { HISTORY, SOURCES } from '../data/history'
import { CULTURES, WORDING_NOTES, INTERLOCK_PRESETS, SOURCES_VERIFIED, type Strength } from '../data/cultures'
import { ARTISTS } from '../data/artists'
import { THEORY } from '../data/theory'
import type { Pattern, Voice } from '../engine/types'
import { PITCHED, noteName, midiToHz } from '../engine/pitch'
import { TUNING_PRESETS, PITCH_TEXT, PITCH_PATTERNS } from '../data/pitch'
import { LoadButtons, usePlayer } from './player'

const H1 = ({ t, sub }: { t: string; sub: string }) => <header className="mb-12"><h1 className="text-3xl font-semibold tracking-tight">{t}</h1><p className="mt-3 text-bone/60 leading-relaxed">{sub}</p></header>
const Tag = ({ c }: { c: string }) => <span className="text-[11px] uppercase tracking-wider text-bone/50">{c}</span>

export function Library() {
  const fams = [...new Set(RHYTHMS.map(r => r.family))]
  return <>
    <H1 t="Rhythm library" sub="Fifteen grooves. Each has notes on how it tends to feel and why. Play one, then add layers to hear how they combine." />
    {fams.map(f => <section key={f} className="mb-14"><Tag c={f} />
      {RHYTHMS.filter(r => r.family === f).map(r => <article key={r.pattern.id} className="mt-6 pb-8 border-b border-line last:border-0">
        <h2 className="text-lg font-medium">{r.pattern.name}</h2>
        <p className="mt-2 text-bone/80 leading-relaxed">{r.effect}</p>
        <p className="mt-2 text-bone/60 leading-relaxed text-sm">{r.why}</p>
        {r.evidence !== 'established' && <p className="mt-3 text-sm text-bone/60 border-l-2 border-amber pl-3"><span className="text-amber">Evidence: {r.evidence}.</span> {r.evidenceNote}</p>}
        {r.evidence === 'established' && r.evidenceNote && <p className="mt-2 text-xs text-bone/40">{r.evidenceNote}</p>}
        <LoadButtons pattern={r.pattern} />
        {r.tryLayering && <p className="mt-2 text-xs text-bone/50">Try layering: {r.tryLayering.map(id => PATTERNS[id].name).join(', ')}</p>}
      </article>)}
    </section>)}
  </>
}

export function Story() {
  const { loadArrangement, toggle, playing, section, arrangement } = usePlayer()
  return <>
    <H1 t="Storytelling" sub="How a drum part introduces, develops and resolves, and how kit elements interact along the way." />
    <button className="h-11 px-5 rounded-full bg-amber text-ink text-sm font-medium mb-10" onClick={async () => { loadArrangement(STORY_ARRANGEMENT); await toggle() }}>{playing && arrangement ? 'Restart example' : 'Play the 18-bar example'}</button>
    <ol className="mb-14 space-y-3">{STORY_ARRANGEMENT.sections.map((s, i) => <li key={i} className={`text-sm ${arrangement && section === i ? 'text-amber' : 'text-bone/60'}`}><span className="font-medium">{s.name}</span> · {s.bars} bars. {s.note}</li>)}</ol>
    {STORY_TEXT.map(t => <section key={t.h} className="mb-10"><h2 className="text-lg font-medium">{t.h}</h2><p className="mt-2 text-bone/70 leading-relaxed">{t.p}</p></section>)}
  </>
}

const STRENGTH: Record<Strength, string> = { strong: 'text-bone', moderate: 'text-bone/70', weak: 'text-bone/50', romanticized: 'text-amber' }

export function History() {
  const [open, setOpen] = useState<string | null>(null)
  return <>
    <H1 t="History" sub="Trance drumming from the Sámi noaidi to the wider shamanic world, and what the evidence can and can't support." />
    <section className="mb-12 border-l-2 border-amber pl-4"><Tag c="Read with care" /><ul className="mt-2 space-y-1 text-sm text-bone/70">{WORDING_NOTES.map(w => <li key={w}>{w}</li>)}</ul></section>
    {HISTORY.map(h => <section key={h.id} className="mb-14"><Tag c={h.confidence} /><h2 className="mt-1 text-xl font-medium">{h.title}</h2>
      {h.body.map((b, i) => <p key={i} className="mt-3 text-bone/70 leading-relaxed">{b}</p>)}
      <p className="mt-3 text-xs text-bone/40">Sources: {h.sources.map(s => SOURCES.find(x => x.id === s)!.cite.split('(')[0].trim()).join('; ')}</p>
    </section>)}
    <section className="mb-14"><Tag c="Across Europe and its neighbours" /><h2 className="mt-1 text-xl font-medium">Fifteen traditions, rated by evidence</h2>
      <p className="mt-2 text-xs text-bone/40">{SOURCES_VERIFIED ? `Source links checked ${SOURCES_VERIFIED}.` : 'These research notes are still being checked against their sources.'}</p>
      <div className="mt-6 divide-y divide-line">{CULTURES.map(c => <div key={c.id} className="py-4">
        <button className="w-full flex justify-between text-left gap-4" onClick={() => setOpen(open === c.id ? null : c.id)}>
          <span>{c.culture}</span><span className={`text-xs uppercase tracking-wider ${STRENGTH[c.evidenceStrength]}`}>{c.evidenceStrength}</span></button>
        {open === c.id && <div className="mt-3 text-sm text-bone/70 space-y-1">
          <p><span className="text-bone/40">Instrument</span> {c.instrument}</p><p><span className="text-bone/40">Practice</span> {c.practice}</p>
          <p><span className="text-bone/40">Rhythm</span> {c.rhythm}</p><p><span className="text-bone/40">Group</span> {c.groupEvidence}</p>
          {c.flags.map(f => <p key={f} className="text-amber/90">{f}</p>)}
          <p className="text-xs text-bone/40 break-words">{c.sources.map(s => <a key={s} href={s} className="underline mr-2" target="_blank" rel="noreferrer">{decodeURIComponent(s.replace(/^https?:\/\/(www\.)?/, '')).slice(0, 48)}</a>)}</p>
          {INTERLOCK_PRESETS.filter(p => p.culture === c.id).map(p => <div key={p.pattern.id} className="pt-2"><p className="text-bone/60">{p.note}</p><LoadButtons pattern={p.pattern} /></div>)}
        </div>}
      </div>)}</div>
    </section>
    <section className="mb-10"><Tag c="Interlocking parts" /><h2 className="mt-1 text-xl font-medium">Two players, one rhythm</h2>
      {INTERLOCK_PRESETS.map(p => <div key={p.pattern.id} className="mt-6"><h3 className="font-medium">{p.pattern.name}</h3><p className="mt-1 text-sm text-bone/60">{p.note}</p><LoadButtons pattern={p.pattern} /></div>)}
    </section>
    <section><Tag c="Bibliography" /><ul className="mt-3 space-y-3 text-xs text-bone/50">{SOURCES.map(s => <li key={s.id}>{s.cite}{s.note && <span className="text-bone/35"> {s.note}</span>}</li>)}</ul></section>
  </>
}

export function Lens({ id, go }: { id?: string; go: (h: string) => void }) {
  const a = ARTISTS.find(x => x.id === id)
  if (!a) return <>
    <H1 t="Percussionist lens" sub="How six drummers create feeling and tell a story with the kit." />
    <ul className="divide-y divide-line">{ARTISTS.map(x => <li key={x.id}><button onClick={() => go(`lens/${x.id}`)} className="w-full py-5 text-left flex justify-between"><span className="text-lg">{x.name}</span><span className="text-sm text-bone/40">{x.band}</span></button></li>)}</ul>
  </>
  return <>
    <button onClick={() => go('lens')} className="text-sm text-bone/50 mb-8">← All drummers</button>
    <H1 t={a.name} sub={`${a.band} · ${a.era}`} />
    <section className="mb-10"><Tag c="Technique" /><ul className="mt-3 space-y-3 text-bone/75 leading-relaxed">{a.technique.map(t => <li key={t}>{t}</li>)}</ul></section>
    <section className="mb-10"><Tag c="Feeling" /><p className="mt-3 text-bone/75 leading-relaxed">{a.feeling}</p></section>
    <section className="mb-12"><Tag c="Storytelling" /><p className="mt-3 text-bone/75 leading-relaxed">{a.storytelling}</p></section>
    <section><Tag c="Try this" />{a.tryThis.map(t => <div key={t.pattern.id} className="mt-5"><h3 className="font-medium">{t.pattern.name}</h3><p className="mt-1 text-sm text-bone/60">{t.note}</p><LoadButtons pattern={t.pattern} /></div>)}
      <p className="mt-8 text-xs text-bone/40">These patterns are simplified illustrations of each drummer's approach, not transcriptions.</p></section>
  </>
}

export function Theory() {
  const { load, toggle, playing } = usePlayer()
  const loadAll = async (ps: Pattern[]) => { ps.forEach((p, i) => load(p, i > 0)); if (!playing) await toggle() }
  return <>
    <H1 t="Theory" sub="The ideas underneath rhythm, from meter to tension and release. Every concept has a pattern you can play." />
    <nav className="mb-14 flex flex-wrap gap-x-4 gap-y-2 text-sm text-bone/50">{THEORY.map(c => <a key={c.id} href={`#/theory`} onClick={e => { e.preventDefault(); document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth' }) }}>{c.title.split(':')[0]}</a>)}</nav>
    {THEORY.map(c => <section key={c.id} id={c.id} className="mb-16 scroll-mt-6">
      <h2 className="text-xl font-medium">{c.title}</h2>
      <p className="mt-3 text-bone/75 leading-relaxed">{c.body}</p>
      <p className="mt-4 text-sm text-bone/50">{c.listen}</p>
      {c.patterns.map(p => <div key={p.id} className="mt-5"><h3 className="text-sm font-medium">{p.name}</h3><LoadButtons pattern={p} /></div>)}
      {c.patterns.length > 1 && <button className="mt-4 text-sm text-amber" onClick={() => loadAll(c.patterns)}>Play all {c.patterns.length} together →</button>}
    </section>)}
  </>
}

export function Pitch() {
  const { tuning, setTuning, kitId, setKit } = usePlayer()
  const [preset, setPreset] = useState<string | null>(null)
  const pick = (id: string) => { const p = TUNING_PRESETS.find(x => x.id === id)!; setPreset(id); setTuning(p.tuning); if (kitId !== 'tuned') setKit('tuned') }
  const nudge = (v: Voice, d: number) => { const base = tuning[v] ?? TUNING_PRESETS[0].tuning[v]!; setTuning({ ...TUNING_PRESETS[0].tuning, ...tuning, [v]: base + d }); setPreset(null) }
  const LABEL: Record<string, string> = { low: 'Kick', tomLo: 'Floor tom', tomHi: 'Low tom', back: 'Mid tom', accent: 'High tom', bell: 'Top tom' }
  return <>
    <H1 t="Kit as pitch" sub="Drums have pitch, though not as precisely as a piano. Tune each voice to a note and the kit can play a melody." />
    {PITCH_TEXT.slice(0, 4).map(t => <section key={t.h} className="mb-10"><h2 className="text-lg font-medium">{t.h}</h2><p className="mt-2 text-bone/70 leading-relaxed">{t.p}</p></section>)}
    <section className="mb-12">
      <h2 className="text-lg font-medium">Tune the kit</h2>
      <p className="mt-2 text-sm text-bone/50">{PITCH_TEXT[4].p}</p>
      <div className="mt-5 flex flex-wrap gap-2">{TUNING_PRESETS.map(p => <button key={p.id} onClick={() => pick(p.id)} className={`h-9 px-3 rounded-full text-xs ${preset === p.id ? 'bg-bone text-ink' : 'border border-line text-bone/70'}`}>{p.name}</button>)}
        <button onClick={() => { setTuning({}); setPreset(null) }} className="h-9 px-3 text-xs text-bone/40">Reset</button></div>
      {preset && <p className="mt-3 text-sm text-bone/60">{TUNING_PRESETS.find(p => p.id === preset)!.note}</p>}
      <ul className="mt-6 divide-y divide-line">{[...PITCHED].reverse().map(v => { const m = tuning[v]; return (
        <li key={v} className="flex items-center gap-3 py-3">
          <span className="flex-1 text-sm">{LABEL[v]}</span>
          <span className="w-24 text-right text-sm tabular-nums">{m !== undefined ? <>{noteName(m)} <span className="text-bone/40">{midiToHz(m).toFixed(1)} Hz</span></> : <span className="text-bone/40">kit default</span>}</span>
          <button aria-label="down a semitone" onClick={() => nudge(v, -1)} className="w-9 h-9 rounded-full border border-line">−</button>
          <button aria-label="up a semitone" onClick={() => nudge(v, 1)} className="w-9 h-9 rounded-full border border-line">+</button>
        </li>) })}</ul>
      <p className="mt-3 text-xs text-bone/40">Tuning applies to whichever kit is selected. It sounds clearest on Tuned toms.</p>
    </section>
    <section><Tag c="Melodic patterns" />{PITCH_PATTERNS.map(p => <div key={p.id} className="mt-5"><h3 className="text-sm font-medium">{p.name}</h3><LoadButtons pattern={p} /></div>)}
      <p className="mt-6 text-sm text-bone/50">See also the <a href="#/lens/carey" className="text-amber">Danny Carey</a> lens page.</p></section>
  </>
}
