// Validates all pattern grids (run after build via vite-node-free approach: transpile with esbuild)
import { build } from 'esbuild'
const out = await build({ stdin: { contents: "import {PATTERNS} from './src/data/rhythms';import './src/data/story';import './src/data/artists';import './src/data/cultures';import './src/data/theory';import {validatePattern} from './src/engine/pattern';const e=Object.values(PATTERNS).flatMap(validatePattern);console.log(Object.keys(PATTERNS).length+' patterns');if(e.length){console.error(e.join('\\n'));process.exit(1)}", resolveDir: '.', loader: 'ts' }, bundle: true, platform: 'node', write: false, format: 'esm' })
await import('data:text/javascript,' + encodeURIComponent(out.outputFiles[0].text))
