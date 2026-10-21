/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Palette of the reference platform (Vuexy theme): primary #7367f0,
      // success #28c76f, warning #ff9f43, danger #ea5455, headings #5e5873,
      // body text #6e6b7b, page #f8f8f8, borders #ebe9f1 / inputs #d8d6de.
      colors: {
        primary: { 50:'#f1f0fe',100:'#e3e1fc',200:'#c7c2f9',300:'#aba4f6',400:'#8f85f3',500:'#8176f2',600:'#7367f0',700:'#5e50ee',800:'#4839eb',900:'#3626c9',950:'#241a86' },
        teal: { 50:'#e9faf1',100:'#d4f4e2',200:'#a9e9c5',300:'#7edfa9',400:'#53d48c',500:'#3ecd7d',600:'#28c76f',700:'#24b263',800:'#1f9d57',900:'#1b874b' },
        amber: { 50:'#fff5ec',100:'#ffecd9',200:'#ffd9b4',300:'#ffc58e',400:'#ffb269',500:'#ffa656',600:'#ff9f43',700:'#e58f3c',800:'#cc7f36',900:'#b26f2f' },
        red: { 50:'#fdeeee',100:'#fbdddd',200:'#f7bbbb',300:'#f29899',400:'#ee7677',500:'#ea5455',600:'#d34c4d',700:'#bb4344',800:'#a43b3b',900:'#8c3233' },
        surface: { 0:'#ffffff',50:'#f8f8f8',100:'#f3f2f7',200:'#ebe9f1',300:'#d8d6de' },
        ink: { 900:'#5e5873',800:'#5e5873',700:'#6e6b7b',600:'#6e6b7b',500:'#82868b',400:'#b9b9c3',300:'#c9c8d0' }
      },
      fontFamily: { sans:['Montserrat','Helvetica','Arial','sans-serif'] },
      boxShadow: { soft:'0 4px 24px 0 rgba(34,41,47,0.1)', card:'0 4px 24px 0 rgba(34,41,47,0.1)', float:'0 5px 25px 0 rgba(34,41,47,0.1)' },
      borderRadius: { xl2:'0.428rem', xl3:'0.428rem' },
      animation: { 'fade-in':'fadeIn 0.3s ease-out', 'slide-up':'slideUp 0.3s ease-out' },
      keyframes: { fadeIn:{from:{opacity:'0'},to:{opacity:'1'}}, slideUp:{from:{opacity:'0',transform:'translateY(12px)'},to:{opacity:'1',transform:'translateY(0)'}} }
    },
  },
  plugins: [],
}
