import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await p.goto('http://localhost:4173/rhythm/', { waitUntil: 'networkidle' })
const r = await p.evaluate(async () => { const s = await window.__pulseLoadSong('schism', 0); const e = window.__pulseEngine
  return { secBars: s?.sections?.reduce((n, x) => n + x.bars, 0), steps: [...new Set((s?.bars ?? []).map(b => b.timeSig + ':' + b.steps))].join(' ') } })
console.log(JSON.stringify(r))
const bar = await p.evaluate(() => window.__pulseLoadSong && document.title)
await p.getByRole('button', { name: 'Browse rhythms' }).click(); await p.getByRole('button', { name: 'Now playing' }).click()
// jump to a 7/8 21-step bar via its strip segment
await p.locator('[aria-label="Verse 1 bar variations"] button, [aria-label$="bar variations"] button').nth(40).click().catch(() => {})
await p.waitForTimeout(500); await p.screenshot({ path: '/workspace/screenshots/pulse-odd-bar.png' }); await b.close()
