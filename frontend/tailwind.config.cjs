/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                vx: {
                    bg: '#f6f7fb',
                    card: '#ffffff',
                    primary: '#6366f1',
                    accent: '#22c55e',
                    warn: '#f59e0b',
                    danger: '#ef4444',
                    text: '#0f172a',
                    subt: '#64748b',
                },
            },
            boxShadow: { vx: '0 10px 30px rgba(2,8,23,0.05)' },
            borderRadius: { '2xl': '1rem' },
        },
    },
    plugins: [],
};
