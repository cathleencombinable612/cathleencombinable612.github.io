import { useEffect, useState } from 'react'
import { PlayerProvider, PlayerBar } from './ui/player'
import { Library, Story, History, Lens, Theory, Pitch, About } from './ui/pages'

const NAV = [['library', 'Library'], ['theory', 'Theory'], ['story', 'Story'], ['pitch', 'Pitch'], ['history', 'History'], ['lens', "Drummer's Lens"]] as const

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
        <nav className="sticky top-0 z-20 -mx-6 px-6 bg-ink/80 backdrop-blur-xl flex items-center justify-between h-16">
          <a href="#/library" className="flex items-center gap-2 font-semibold tracking-tight"><span className="w-2 h-2 rounded-full bg-amber" />Pulse</a>
          <div className="hidden sm:flex gap-5 text-sm">{NAV.map(([k, l]) => <a key={k} href={`#/${k}`} className={page === k ? 'text-amber' : 'text-bone/60'}>{l}</a>)}</div>
          <button className="sm:hidden h-10 px-1 text-sm text-bone/70" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu(m => !m)}>{menu ? 'Close' : 'Menu'}</button>
          {menu && <div className="sm:hidden absolute top-16 inset-x-0 z-20 bg-ink/95 backdrop-blur-xl border-b border-line px-6 py-3 rise">
            {NAV.map(([k, l]) => <a key={k} href={`#/${k}`} onClick={() => setMenu(false)} className={`block py-3 text-lg ${page === k ? 'text-amber' : 'text-bone/80'}`}>{l}</a>)}
          </div>}
        </nav>
        <main key={route} className="pt-8 rise">
          {page === 'about' ? <About /> : page === 'pitch' ? <Pitch /> : page === 'theory' ? <Theory /> : page === 'story' ? <Story /> : page === 'history' ? <History /> : page === 'lens' ? <Lens id={sub} go={go} /> : <Library />}
        </main>
        <footer className="mt-24 pt-8 border-t border-line flex justify-between text-xs text-mute"><span>Pulse</span><a href="#/about">About & credits</a></footer>
      </div>
      <PlayerBar />
    </PlayerProvider>
  )
}
