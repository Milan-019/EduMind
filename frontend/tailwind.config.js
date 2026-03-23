/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "surface-container-lowest": "#ffffff",
                "surface-variant": "#dfe4df",
                "surface-container-highest": "#e2e0ba",
                "primary-container": "#bcebe3",
                "on-surface-variant": "#434846",
                "background": "#f4f0e4",
                "on-surface": "#191c1a",
                "surface-container": "#efeedf",
                "primary": "#44a194",
                "on-primary-container": "#004d43",
                "secondary": "#49635f",
                "on-secondary-container": "#05201c",
                "on-primary": "#ffffff",
                "surface-tint": "#2a756b",
                "on-secondary": "#ffffff",
                "error": "#ba1a1a",
                "on-error": "#ffffff",
                "surface-container-high": "#e8e6cd",
                "surface-dim": "#deddd6",
                "secondary-container": "#cce8e3",
                "surface-bright": "#fbfcf8",
                "surface": "#f4f0e4",
                "outline": "#737976",
                "surface-container-low": "#faf8f2",
                "on-background": "#191c1a"
            },
            fontFamily: {
                "headline": ["Noto Serif", "serif"],
                "body": ["Public Sans", "sans-serif"],
                "label": ["Public Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries')
    ],
  }
