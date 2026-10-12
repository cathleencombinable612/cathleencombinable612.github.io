import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await p.goto('http://localhost:4173/rhythm/', { waitUntil: 'networkidle' })
await p.evaluate(async () => { await window.__pulseLoadSong('sober', 1) })
await p.getByRole('button', { name: 'Browse rhythms' }).click(); await p.waitForTimeout(300)
await p.getByRole('button', { name: 'Now playing' }).click(); await p.waitForTimeout(800)
await p.screenshot({ path: '/workspace/screenshots/pulse-bar-variation.png' }); await b.close()
