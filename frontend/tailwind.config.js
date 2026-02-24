/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'h1-blue': '#4b4dff',
                'h1-pink': '#ff4b91',
                'h1-black': '#000000',
                'h1-slate': '#94a3b8',
            },
            backgroundImage: {
                'dots': 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
            },
            animation: {
                'float-tl-br': 'float-tl-br 20s ease-in-out infinite',
                'float-br-tl': 'float-br-tl 25s ease-in-out infinite alternate',
            },
            keyframes: {
                'float-tl-br': {
                    '0%, 100%': { transform: 'translate(0, 0)' },
                    '50%': { transform: 'translate(50px, 30px)' },
                },
                'float-br-tl': {
                    '0%, 100%': { transform: 'translate(0, 0)' },
                    '50%': { transform: 'translate(-40px, -60px)' },
                },
            },
        },
    },
    plugins: [],
}
