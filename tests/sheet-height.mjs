import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await p.goto('https://nmpy7knjd8-code.github.io/rhythm/?v=' + Date.now(), { waitUntil: 'networkidle' })
await p.locator('[aria-label="Browse rhythms"]').click(); await p.waitForTimeout(400)
const hs = {}
for (const t of ['Now playing', 'Kit view', 'Browse', 'Sound']) { await p.getByRole('button', { name: t, exact: true }).click(); await p.waitForTimeout(350); hs[t] = Math.round((await p.locator('[role=dialog]').boundingBox()).height) }
console.log('sheet heights:', JSON.stringify(hs))
console.log('select overflow:', await p.evaluate(() => { const d = document.querySelector('[role=dialog] .overflow-y-auto').getBoundingClientRect(); return [...document.querySelectorAll('[role=dialog] select')].some(s => s.getBoundingClientRect().right > d.right + 1) }))
await p.screenshot({ path: '/workspace/screenshots/v2-sound.png' }); await b.close()
