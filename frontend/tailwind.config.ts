import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Acento de marca HUAP (rojo). Vía CSS var para permitir alternar a azul salud.
        accent: {
          DEFAULT: 'var(--accent)',
          50: 'var(--accent-50)',
          100: 'var(--accent-100)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
        },
        // Superficies y texto (tokens estilo Acervo, tema claro)
        app: 'var(--surface-app)',
        card: 'var(--surface-card)',
        sunken: 'var(--surface-sunken)',
        inset: 'var(--surface-inset)',
        hover: 'var(--surface-hover)',
        ink: 'var(--text-strong)',
        body: 'var(--text-body)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        tag: '3px',
        card: '14px',
        hero: '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,31,39,.05)',
        'card-hover': '0 10px 28px rgba(26,31,39,.1)',
        float: '0 10px 30px rgba(26,31,39,.1)',
      },
      keyframes: {
        viewin: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'none' },
        },
        pulse2: {
          '0%': { boxShadow: '0 0 0 0 var(--accent)' },
          '70%': { boxShadow: '0 0 0 6px transparent' },
          '100%': { boxShadow: '0 0 0 0 transparent' },
        },
      },
      animation: {
        viewin: 'viewin .3s cubic-bezier(.22,1,.36,1)',
        livedot: 'pulse2 2s infinite',
      },
      maxWidth: {
        container: '1180px',
      },
    },
  },
  plugins: [],
} satisfies Config
