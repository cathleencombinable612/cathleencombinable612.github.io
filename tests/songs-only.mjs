import { chromium } from 'playwright'
const URL = 'https://nmpy7knjd8-code.github.io/rhythm/'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await p.goto(URL + '?v=' + Date.now() + '#/library', { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
const titles = await p.locator('main article h2').allInnerTexts()
console.log('songs:', titles.length, '| offenders:', titles.filter(t => /reference|generic|Journey/i.test(t)).join(', ') || 'none')
console.log('tab label:', await p.getByRole('button', { name: /^Songs/ }).innerText())
await p.screenshot({ path: '/workspace/screenshots/v4-songs.png' })
await p.goto(URL + '#/story', { waitUntil: 'networkidle' }); await p.waitForTimeout(400)
await p.getByText('Style studies').scrollIntoViewIfNeeded(); await p.screenshot({ path: '/workspace/screenshots/v4-story-studies.png' })
console.log('style studies listed:', await p.locator('section:has(h2:text("Style studies")) li').count())
await b.close()
