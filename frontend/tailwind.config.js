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
                "surface-variant": "#E0F2FE",
                "surface-container-highest": "#CCFBF1",
                "primary-container": "#CCFBF1",
                "on-surface-variant": "#115E59",
                "background": "#F0FDFA",
                "on-surface": "#134E4A",
                "surface-container": "#E6FFFA",
                "primary": "#0D9488",
                "on-primary-container": "#042F2E",
                "secondary": "#14B8A6",
                "on-secondary-container": "#042F2E",
                "on-primary": "#ffffff",
                "surface-tint": "#0F766E",
                "on-secondary": "#ffffff",
                "error": "#ba1a1a",
                "on-error": "#ffffff",
                "surface-container-high": "#D1FAE5",
                "surface-dim": "#A7F3D0",
                "secondary-container": "#CCFBF1",
                "surface-bright": "#ffffff",
                "surface": "#F0FDFA",
                "outline": "#5EEAD4",
                "surface-container-low": "#F0FDFA",
                "on-background": "#134E4A"
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
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries')
    ],
  }
