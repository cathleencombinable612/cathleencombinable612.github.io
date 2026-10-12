import { chromium } from 'playwright'
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await p.goto('http://localhost:4173/rhythm/', { waitUntil: 'networkidle' })
const r = await p.evaluate(async () => { await window.__pulseLoadSong('jambi', 0); const e = window.__pulseEngine; e.trace = []; await e.start(); await new Promise(r => setTimeout(r, 6000)); e.stop()
  const c = {}; for (const x of e.trace) if (x.variant) c[x.variant] = (c[x.variant] ?? 0) + 1; return c })
console.log('variants scheduled in first 6 s of Jambi:', JSON.stringify(r))
await p.getByRole('button', { name: 'Browse rhythms' }).click(); await p.getByRole('button', { name: 'Now playing' }).click(); await p.waitForTimeout(400)
await p.screenshot({ path: '/workspace/screenshots/pulse-variants.png' }); await b.close()
