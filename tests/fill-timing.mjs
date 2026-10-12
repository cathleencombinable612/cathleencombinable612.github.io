// Measures scheduled event times: fills must occupy exactly one bar and the groove must resume on the next downbeat.
import { chromium } from 'playwright'
const url = process.argv[2] ?? 'http://localhost:4173/rhythm/'
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage()
await p.goto(url, { waitUntil: 'networkidle' })
await p.getByRole('button', { name: 'Browse rhythms' }).click() // creates the engine
await p.waitForTimeout(300)
const cases = [
  { name: '4/4 groove + 4/4 fill every 2', groove: { id: 'g44', name: 'g', steps: 16, stepsPerBeat: 4, tracks: { low: 'X.......X.......', tick: 'x.x.x.x.x.x.x.x.', back: '....X.......X...' } }, fill: { id: 'f44', name: 'f', steps: 16, stepsPerBeat: 4, tracks: { back: '........XxxxXxxx' } }, barTicks: 48 },
  { name: '7/8 groove + 7/8 fill every 2', groove: { id: 'g78', name: 'g', steps: 14, stepsPerBeat: 2, ticksPerStep: 3, tracks: { low: 'X...X...X.....', tick: 'x.x.x.x.x.x.x.' } }, fill: { id: 'f78', name: 'f', steps: 14, stepsPerBeat: 2, ticksPerStep: 3, tracks: { tomLo: '........X.x.X.' } }, barTicks: 42 },
  { name: '12/8 groove + triplet fill every 2', groove: { id: 'g128', name: 'g', steps: 12, stepsPerBeat: 3, tracks: { low: 'X.....X.....', ride: 'x.xx.xx.xx.x' } }, fill: { id: 'f128', name: 'f', steps: 12, stepsPerBeat: 3, tracks: { back: '......xxxxxX' } }, barTicks: 48 },
]
let fail = 0
for (const c of cases) {
  const r = await p.evaluate(async c => {
    const e = window.__pulseEngine
    e.setLayers([{ id: 't', pattern: c.groove, volume: 1, mute: false, solo: false }])
    e.setFill({ pattern: c.fill, crashAfter: false, description: '' }, 2)
    e.setBpm(150); e.trace = []
    await e.start(); await new Promise(r => setTimeout(r, 4200)); e.stop()
    return e.trace
  }, c)
  const bpm = 150, tick = 60 / bpm / 12, bar = c.barTicks * tick
  const t0 = r.find(x => x.src === 't').t
  let errs = [], maxDev = 0
  for (const ev of r) {
    const rel = ev.t - t0, k = rel / tick, dev = Math.abs(k - Math.round(k)) * tick; maxDev = Math.max(maxDev, dev)
    const barIdx = Math.floor((rel + 1e-9) / bar)
    if (ev.src === 'fill' && barIdx % 2 !== 1) errs.push(`fill event in bar ${barIdx}`)
    if (ev.src === 't' && barIdx % 2 === 1) errs.push(`groove event inside fill bar ${barIdx}`)
  }
  // groove resumes exactly on the downbeat after each fill bar
  const fillBars = [...new Set(r.filter(x => x.src === 'fill').map(x => Math.floor((x.t - t0 + 1e-9) / bar)))]
  for (const fb of fillBars) { const next = r.filter(x => x.src === 't' && x.t - t0 >= (fb + 1) * bar - 1e-9)[0]; if (next && Math.abs(next.t - t0 - (fb + 1) * bar) > 1e-6) errs.push(`resume off by ${(next.t - t0 - (fb + 1) * bar) * 1000} ms`) }
  console.log(`${c.name}: ${r.length} events, ${fillBars.length} fill bars, max grid deviation ${(maxDev * 1e6).toFixed(3)} µs, ${errs.length ? 'FAIL ' + errs.slice(0, 3).join('; ') : 'PASS'}`)
  if (errs.length || maxDev > 1e-6) fail++
}
await b.close(); process.exit(fail)
