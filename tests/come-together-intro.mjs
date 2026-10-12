// Renders the Come Together intro bar and checks the rhythm: kick+ride on 1 and the "and" of 1, hat 16th-triplets on 2 then an accented 8th,
// then a 16th-triplet tom run on 3–4 ending on a floor-tom 8th, laid back by ~14 ms with a small human wobble.
import { chromium } from 'playwright'
const url = process.argv[2] ?? 'http://localhost:4173/rhythm/'
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage(); await p.goto(url, { waitUntil: 'networkidle' })
await p.getByRole('button', { name: 'Browse rhythms' }).click(); await p.waitForTimeout(300)
const r = await p.evaluate(async () => { await window.__pulseLoadSong('cometogether', 0); const e = window.__pulseEngine; e.trace = []; await e.start(); await new Promise(r => setTimeout(r, 3500)); e.stop(); return e.trace })
const bpm = 83, beat = 60 / bpm, t0 = r[0].t - 0.014
const rows = r.filter(x => x.t - t0 < 4 * beat).map(x => ({ voice: x.voice, beat: +((x.t - t0) / beat + 1).toFixed(3) }))
console.log(rows.map(x => `${x.voice}@${x.beat}`).join('  '))
const toms = rows.filter(x => x.voice.startsWith('tom'))
const gaps = toms.slice(1).map((x, i) => +((x.beat - toms[i].beat) * beat * 1000).toFixed(0))
console.log('tom inter-onset ms:', gaps.join(', '), '| expected 16th-triplet at 83 BPM =', (beat / 6 * 1000).toFixed(0), 'ms (±14 ms humanize)')
const ok = gaps.slice(0, -1).every(g => Math.abs(g - beat / 6 * 1000) < 16) && Math.abs(toms[0].beat - 3) < 0.03
console.log(ok ? 'PASS' : 'FAIL'); await b.close(); process.exit(ok ? 0 : 1)
