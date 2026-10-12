/** @type {import('tailwindcss').Config} */
export default { content: ['./index.html','./src/**/*.{ts,tsx}'], theme: { extend: {
  colors: { ink:'#0b0b0c', panel:'#151517', line:'#2a2a2e', amber:'#ffb000', bone:'#f2efe8', ember:'#ff5a36' },
  fontFamily: { mono: ['ui-monospace','SFMono-Regular','Menlo','monospace'] } } }, plugins: [] }
