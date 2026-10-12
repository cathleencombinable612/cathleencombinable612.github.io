import { useEffect, useState } from 'react'
import { PlayerProvider, PlayerBar } from './ui/player'
import { Library, Story, History, Lens, Theory } from './ui/pages'

const NAV = [['library', 'Library'], ['theory', 'Theory'], ['story', 'Story'], ['history', 'History'], ['lens', 'Lens']] as const

export default function App() {
  const read = () => location.hash.replace(/^#\/?/, '') || 'library'
  const [route, setRoute] = useState(read)
  useEffect(() => { const f = () => { setRoute(read()); window.scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  const go = (h: string) => { location.hash = `/${h}` }
  const [page, sub] = route.split('/')
  return (
    <PlayerProvider>
      <div className="max-w-xl mx-auto px-6 pb-40">
        <nav className="flex items-center justify-between h-20">
          <a href="#/library" className="font-semibold tracking-tight">Pulse</a>
          <div className="flex gap-4 text-sm">{NAV.map(([k, l]) => <a key={k} href={`#/${k}`} className={page === k ? 'text-amber' : 'text-bone/60'}>{l}</a>)}</div>
        </nav>
        <main className="pt-6">
          {page === 'theory' ? <Theory /> : page === 'story' ? <Story /> : page === 'history' ? <History /> : page === 'lens' ? <Lens id={sub} go={go} /> : <Library />}
        </main>
      </div>
      <PlayerBar />
    </PlayerProvider>
  )
}
