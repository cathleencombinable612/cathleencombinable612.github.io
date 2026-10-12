/** @type {import('tailwindcss').Config} */
export default { content: ['./index.html','./src/**/*.{ts,tsx}'], theme: { extend: {
  colors: { ink:'#0a0a0b', panel:'#141416', line:'rgba(255,255,255,0.08)', amber:'#ffb000', bone:'#f4f1ea', mute:'rgba(244,241,234,0.5)' },
  fontFamily: { mono: ['ui-monospace','SFMono-Regular','Menlo','monospace'] } } }, plugins: [] }
