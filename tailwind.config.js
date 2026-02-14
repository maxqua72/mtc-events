/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./components/**/*.{js,vue,ts}",
        "./layouts/**/*.vue",
        "./pages/**/*.vue",
        "./plugins/**/*.{js,ts}",
        "./app.vue",
    ],
    theme: {
        extend: {
            colors: {
                chess: {
                    dark: '#1a1a1a',     // Ebano profondo per Header e testi
                    gold: '#E1AD01',     // Oro/Ottone per pulsanti e accenti
                    cream: '#f8f5f0',    // Avorio per sfondi delle card
                    wood: '#7c4a32',     // Marrone legno per elementi decorativi
                    surface: '#F2F2F2',
                    slate: '#4a4a4a',    // Grigio per testi secondari
                    pearl: '#fdfdfd',    // Bianco Perla (Sfondo Card)
                    board: '#ececec',    // Grigio Marmo (Sfondo Main - "Case Scure")
                    iron: '#3d3d3d',     // Grigio Ferro (Sidebar Manager)
                    chocolate: '#D2691E', // Marrone Cioccolato (Hover Pulsanti)
                    brown: '#895129',     // Marrone Sella (Hover Pulsanti)
                }
            }
        },
    },
    plugins: [],
}