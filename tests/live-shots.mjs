import { chromium } from 'playwright'
const URL = 'https://nmpy7knjd8-code.github.io/rhythm/'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const go = async (h, n) => { await p.goto(URL + '#/' + h, { waitUntil: 'networkidle' }); await p.waitForTimeout(700); await p.screenshot({ path: `/workspace/screenshots/live-${n}.png` }) }
await go('library', 'library-songs')
await p.getByRole('button', { name: /^Styles/ }).click(); await p.waitForTimeout(400); await p.screenshot({ path: '/workspace/screenshots/live-library-styles.png' })
await go('story', 'story'); await go('lens', 'lens'); await go('lens/freese', 'lens-freese'); await go('history', 'history')
await p.goto(URL + '#/library', { waitUntil: 'networkidle' })
await p.getByRole('button', { name: 'Browse rhythms' }).click(); await p.waitForTimeout(500); await p.screenshot({ path: '/workspace/screenshots/live-browser.png' })
const fillCount = await p.evaluate(() => document.body.innerText.match(/Fill/g)?.length ?? 0)
console.log('fill mentions in browser', fillCount)
await b.close()
