/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#eef9ff',100:'#d8f1ff',200:'#b9e8ff',300:'#88daff',400:'#50c2fd',500:'#28a8fa',600:'#0e8aef',700:'#0771dc',800:'#0c5ab2',900:'#104d8c',950:'#0c2f57' },
        teal: { 50:'#effefa',100:'#c8fff2',200:'#91ffe5',300:'#52f5d5',400:'#1de0bf',500:'#05c4a7',600:'#009d87',700:'#047d6d',800:'#086358',900:'#0b5249' },
        surface: { 0:'#ffffff',50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1' },
        ink: { 900:'#0f172a',700:'#334155',500:'#64748b',300:'#94a3b8' }
      },
      fontFamily: { sans:['Inter','system-ui','sans-serif'] },
      boxShadow: { soft:'0 2px 12px 0 rgba(15,23,42,0.06)', card:'0 4px 24px 0 rgba(15,23,42,0.08)', float:'0 8px 40px 0 rgba(15,23,42,0.12)' },
      borderRadius: { xl2:'1rem', xl3:'1.5rem' },
      animation: { 'fade-in':'fadeIn 0.3s ease-out', 'slide-up':'slideUp 0.3s ease-out' },
      keyframes: { fadeIn:{from:{opacity:'0'},to:{opacity:'1'}}, slideUp:{from:{opacity:'0',transform:'translateY(12px)'},to:{opacity:'1',transform:'translateY(0)'}} }
    },
  },
  plugins: [],
}
