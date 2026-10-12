import { useEffect, useState } from 'react'
import { PlayerProvider, PlayerBar } from './ui/player'
import { Library, Story, History, Lens, Theory, Pitch } from './ui/pages'

const NAV = [['library', 'Library'], ['theory', 'Theory'], ['story', 'Story'], ['pitch', 'Pitch'], ['history', 'History'], ['lens', 'Lens']] as const

export default function App() {
  const read = () => location.hash.replace(/^#\/?/, '') || 'library'
  const [route, setRoute] = useState(read)
  const [menu, setMenu] = useState(false)
  useEffect(() => { const f = () => { setRoute(read()); window.scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  const go = (h: string) => { location.hash = `/${h}` }
  const [page, sub] = route.split('/')
  return (
    <PlayerProvider>
      <div className="max-w-xl mx-auto px-6 pb-40">
        <nav className="relative flex items-center justify-between h-20">
          <a href="#/library" className="font-semibold tracking-tight">Pulse</a>
          <div className="hidden sm:flex gap-5 text-sm">{NAV.map(([k, l]) => <a key={k} href={`#/${k}`} className={page === k ? 'text-amber' : 'text-bone/60'}>{l}</a>)}</div>
          <button className="sm:hidden h-10 px-1 text-sm text-bone/70" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu(m => !m)}>{menu ? 'Close' : 'Menu'}</button>
          {menu && <div className="sm:hidden absolute top-20 inset-x-0 z-20 bg-ink border-y border-line py-2">
            {NAV.map(([k, l]) => <a key={k} href={`#/${k}`} onClick={() => setMenu(false)} className={`block py-3 text-lg ${page === k ? 'text-amber' : 'text-bone/80'}`}>{l}</a>)}
          </div>}
        </nav>
        <main className="pt-6">
          {page === 'pitch' ? <Pitch /> : page === 'theory' ? <Theory /> : page === 'story' ? <Story /> : page === 'history' ? <History /> : page === 'lens' ? <Lens id={sub} go={go} /> : <Library />}
        </main>
      </div>
      <PlayerBar />
    </PlayerProvider>
  )
}
