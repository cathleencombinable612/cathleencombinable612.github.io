import { chromium } from 'playwright'
const URL = 'https://nmpy7knjd8-code.github.io/rhythm/'
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
const p = await ctx.newPage(); const S = n => p.screenshot({ path: `/workspace/screenshots/${n}.png` })
await p.goto(URL + '?v=' + Date.now(), { waitUntil: 'networkidle' })
console.log('bundle has single request field:', await p.evaluate(() => !!document.querySelector('input[placeholder^="Request a song"]')))
await S('live-home')
// Library / Songs
await p.goto(URL + '#/library', { waitUntil: 'networkidle' }).catch(() => {}); await p.waitForTimeout(600); await S('live-library-songs')
// Sober roll bar timing
const r = await p.evaluate(async () => { await window.__pulseLoadSong('sober'); const e = window.__pulseEngine; e.jumpSong(8); e.trace = []; await e.start()
  await new Promise(r => setTimeout(r, 1700)); e.stop(); return e.trace.filter(x => x.src === 'song').map(x => [x.t, x.voice]) })
const t0 = r[0][0]; const rel = r.map(([t, v]) => [Math.round((t - t0) * 1000), v])
console.log('Sober bar 9 roll onsets (ms from bar start):', JSON.stringify(rel.slice(0, 16)))
console.log('expected: 16th = 98.7 ms, 16th-triplet = 65.8 ms at 152 BPM')
// swipe-down on sheet
await p.getByRole('button', { name: 'Browse rhythms' }).click(); await p.waitForTimeout(400)
await p.getByRole('button', { name: 'Now playing' }).click(); await p.waitForTimeout(500); await S('live-player-sheet')
const h = await p.locator('[role=dialog] .touch-none').boundingBox()
const cdp = await ctx.newCDPSession(p); const x = h.x + 60, y = h.y + 20
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + i * 25 }] })
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500)
console.log('after swipe-down, dialog aria-hidden =', await p.locator('[role=dialog]').getAttribute('aria-hidden'))
// test request
await p.goto(URL + '#/library', { waitUntil: 'networkidle' }).catch(() => {}); await p.waitForTimeout(500)
const inp = p.locator('input[placeholder^="Request a song"]')
if (await inp.count()) {
  await inp.fill('Schism by Tool')
  const [resp] = await Promise.all([p.waitForResponse(r => r.url().includes('formsubmit.co'), { timeout: 20000 }), p.getByRole('button', { name: 'Send' }).click()])
  console.log('formsubmit status', resp.status(), (await resp.text()).slice(0, 200)); await p.waitForTimeout(800)
  console.log('inline msg:', await p.locator('text=Thanks, request sent').count()); await S('live-request-sent')
} else console.log('request input not found')
await b.close()
