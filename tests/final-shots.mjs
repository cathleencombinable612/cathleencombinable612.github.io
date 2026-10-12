import { chromium } from 'playwright'
const URL = 'https://nmpy7knjd8-code.github.io/rhythm/'
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const S = n => p.screenshot({ path: `/workspace/screenshots/${n}.png` })
await p.goto(URL + '?v=' + Date.now() + '#/library', { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
console.log('songs on page:', await p.locator('main article').count())
await p.getByRole('button', { name: 'Virtuoso', exact: true }).click(); await p.waitForTimeout(300)
console.log('virtuoso songs:', await p.locator('main article').count()); await S('v3-songs-virtuoso')
await p.locator('[aria-label="Browse rhythms"]').click(); await p.waitForTimeout(400)
const hs = {}
for (const t of ['Now playing', 'Kit view', 'Browse', 'Sound']) { await p.getByRole('button', { name: t, exact: true }).click(); await p.waitForTimeout(350); hs[t] = Math.round((await p.locator('[role=dialog]').boundingBox()).height) }
console.log('sheet heights (no song):', JSON.stringify(hs))
console.log('Sound select overflow:', await p.evaluate(() => { const d = document.querySelector('[role=dialog] .overflow-y-auto').getBoundingClientRect(); return [...document.querySelectorAll('[role=dialog] select')].some(s => s.getBoundingClientRect().right > d.right + 1) }))
await S('v3-sound')
await p.evaluate(async () => { await window.__pulseLoadSong('blackpage'); await window.__pulseEngine.start() }); await p.waitForTimeout(2500)
await p.getByRole('button', { name: 'Kit view', exact: true }).click(); await p.waitForTimeout(1200); await S('v3-kit-view')
await p.getByRole('button', { name: 'Now playing', exact: true }).click(); await p.waitForTimeout(400); await S('v3-now-playing-blackpage')
await p.evaluate(() => window.__pulseEngine.stop()); await b.close()
