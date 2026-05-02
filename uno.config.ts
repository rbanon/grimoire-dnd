import { defineConfig, presetWind, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetWind(),
    presetAttributify(),
    presetIcons({ scale: 1.2, warn: false }),
  ],

  theme: {
    colors: {
      // Core palette — resolved via CSS custom properties for light/dark switching
      void:    'rgb(var(--c-void) / <alpha-value>)',
      abyss:   'rgb(var(--c-abyss) / <alpha-value>)',
      depths:  'rgb(var(--c-depths) / <alpha-value>)',
      shadow:  'rgb(var(--c-shadow) / <alpha-value>)',
      dusk:    'rgb(var(--c-dusk) / <alpha-value>)',
      mist:    'rgb(var(--c-mist) / <alpha-value>)',
      stone:   'rgb(var(--c-stone) / <alpha-value>)',
      ash:     'rgb(var(--c-ash) / <alpha-value>)',
      vellum:  'rgb(var(--c-vellum) / <alpha-value>)',

      // Gold — antique, rich, not yellow
      gold: {
        dim:    'rgb(var(--c-gold-dim) / <alpha-value>)',
        deep:   'rgb(var(--c-gold-deep) / <alpha-value>)',
        base:   'rgb(var(--c-gold-base) / <alpha-value>)',
        mid:    'rgb(var(--c-gold-mid) / <alpha-value>)',
        bright: 'rgb(var(--c-gold-bright) / <alpha-value>)',
        pale:   'rgb(var(--c-gold-pale) / <alpha-value>)',
        glow:   'rgb(var(--c-gold-glow) / <alpha-value>)',
      },

      // Crimson — blood magic
      blood: {
        deep:   'rgb(var(--c-blood-deep) / <alpha-value>)',
        base:   'rgb(var(--c-blood-base) / <alpha-value>)',
        mid:    'rgb(var(--c-blood-mid) / <alpha-value>)',
        bright: 'rgb(var(--c-blood-bright) / <alpha-value>)',
      },

      // Arcane — sapphire magic
      arcane: {
        deep:   'rgb(var(--c-arcane-deep) / <alpha-value>)',
        base:   'rgb(var(--c-arcane-base) / <alpha-value>)',
        mid:    'rgb(var(--c-arcane-mid) / <alpha-value>)',
        bright: 'rgb(var(--c-arcane-bright) / <alpha-value>)',
        pale:   'rgb(var(--c-arcane-pale) / <alpha-value>)',
      },

      // Emerald — nature / druid
      verdant: {
        deep:   'rgb(var(--c-verdant-deep) / <alpha-value>)',
        base:   'rgb(var(--c-verdant-base) / <alpha-value>)',
        mid:    'rgb(var(--c-verdant-mid) / <alpha-value>)',
        bright: 'rgb(var(--c-verdant-bright) / <alpha-value>)',
      },

      // Semantic
      success: 'rgb(var(--c-success) / <alpha-value>)',
      danger:  'rgb(var(--c-danger) / <alpha-value>)',
      warning: 'rgb(var(--c-warning) / <alpha-value>)',
      info:    'rgb(var(--c-info) / <alpha-value>)',
    },

    fontFamily: {
      display: ['"Cinzel Decorative"', 'Cinzel', 'Georgia', 'serif'],
      heading: ['Cinzel', '"Cinzel Decorative"', 'Georgia', 'serif'],
      body:    ['"EB Garamond"', 'Georgia', 'serif'],
      mono:    ['"JetBrains Mono"', 'monospace'],
    },

    fontSize: {
      '2xs': ['0.625rem', { lineHeight: '1rem' }],
      xs:    ['0.75rem',  { lineHeight: '1.125rem' }],
      sm:    ['0.875rem', { lineHeight: '1.375rem' }],
      base:  ['1.0625rem',{ lineHeight: '1.75rem' }],
      lg:    ['1.1875rem',{ lineHeight: '1.875rem' }],
      xl:    ['1.375rem', { lineHeight: '2rem' }],
      '2xl': ['1.625rem', { lineHeight: '2.25rem' }],
      '3xl': ['2rem',     { lineHeight: '2.5rem' }],
      '4xl': ['2.5rem',   { lineHeight: '3rem' }],
      '5xl': ['3.25rem',  { lineHeight: '3.75rem' }],
    },

    boxShadow: {
      'card':        'var(--shadow-card)',
      'card-hover':  'var(--shadow-card-hover)',
      'panel':       'var(--shadow-panel)',
      'modal':       'var(--shadow-modal)',
      'glow-gold':   'var(--shadow-glow-gold)',
      'glow-arcane': 'var(--shadow-glow-arcane)',
      'inner':       'var(--shadow-inner)',
    },

    borderRadius: {
      none: '0',
      sm:   '2px',
      DEFAULT: '4px',
      md:   '6px',
      lg:   '8px',
      xl:   '12px',
      '2xl':'16px',
      full: '9999px',
    },
  },

  shortcuts: {
    // ── Layout
    'app-container': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

    // ── Cards — tome pages
    'card':
      'bg-abyss border border-shadow rounded-lg shadow-card relative overflow-hidden',
    'card-hover':
      'card transition-all duration-300 hover:border-gold-dim hover:shadow-card-hover cursor-pointer hover:-translate-y-px',
    'card-inner':
      'bg-depths border border-shadow/60 rounded-md',

    // ── Buttons
    'btn-base':
      'inline-flex items-center justify-center gap-2 font-heading text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-mid focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:opacity-40 disabled:pointer-events-none select-none',

    'btn-primary':
      'btn-base px-5 py-2 rounded bg-gold-base text-void font-semibold hover:bg-gold-mid active:bg-gold-deep shadow-[0_1px_0_rgba(255,255,255,0.15)_inset] hover:shadow-glow-gold',

    'btn-secondary':
      'btn-base px-5 py-2 rounded border border-shadow bg-depths text-stone hover:border-gold-dim hover:text-vellum hover:bg-dusk/50',

    'btn-ghost':
      'btn-base px-3 py-1.5 rounded text-ash hover:text-stone hover:bg-shadow/60',

    'btn-danger':
      'btn-base px-5 py-2 rounded bg-blood-mid text-vellum hover:bg-blood-bright',

    'btn-icon':
      'btn-base p-2 rounded text-ash hover:text-stone hover:bg-shadow/60',

    // ── Form controls
    'input-base':
      'w-full rounded border border-shadow bg-depths px-3.5 py-2.5 text-base font-body text-stone placeholder:text-mist focus:outline-none focus:border-gold-dim focus:ring-1 focus:ring-gold-dim/50 transition-colors',

    'label':
      'block text-xs font-heading tracking-widest uppercase text-ash mb-1.5',

    // ── Typography helpers
    'heading-display':
      'font-display text-vellum tracking-wider',
    'heading':
      'font-heading text-vellum tracking-wide',
    'text-muted':
      'text-ash font-body',
    'text-caption':
      'text-xs font-heading tracking-widest uppercase text-mist',

    // ── Decorative dividers
    'divider':
      'border-t border-shadow',
    'divider-gold':
      'border-t border-gold-dim/40',

    // ── Badges
    'badge':
      'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-heading tracking-wide',
    'badge-gold':
      'badge bg-gold-dim/20 text-gold-mid border border-gold-dim/30',
    'badge-arcane':
      'badge bg-arcane-deep/40 text-arcane-pale border border-arcane-base/30',
    'badge-blood':
      'badge bg-blood-deep/40 text-blood-bright border border-blood-base/30',
    'badge-verdant':
      'badge bg-verdant-deep/40 text-verdant-bright border border-verdant-base/30',

    // ── Stat display
    'stat-box':
      'card flex flex-col items-center justify-center p-3 gap-0.5',

    // ── Nav link
    'nav-link':
      'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-heading tracking-wide text-ash hover:text-stone hover:bg-shadow/60 transition-all duration-150',
    'nav-link-active':
      'nav-link text-gold-mid hover:text-gold-bright bg-gold-dim/10 hover:bg-gold-dim/15',
  },
})
