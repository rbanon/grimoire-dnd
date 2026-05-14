import { defineConfig, presetWind, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetWind(),
    presetAttributify(),
    presetIcons({ scale: 1.2, warn: false }),
  ],

  theme: {
    colors: {
      // Core neutrals — resolved via CSS custom properties for light/dark switching
      void:   'rgb(var(--c-void) / <alpha-value>)',
      abyss:  'rgb(var(--c-abyss) / <alpha-value>)',
      depths: 'rgb(var(--c-depths) / <alpha-value>)',
      shadow: 'rgb(var(--c-shadow) / <alpha-value>)',
      dusk:   'rgb(var(--c-dusk) / <alpha-value>)',
      mist:   'rgb(var(--c-mist) / <alpha-value>)',
      stone:  'rgb(var(--c-stone) / <alpha-value>)',
      ash:    'rgb(var(--c-ash) / <alpha-value>)',
      vellum: 'rgb(var(--c-vellum) / <alpha-value>)',

      // Antique gold — dividers, legendary items, secondary accents
      gold: {
        dim:    'rgb(var(--c-gold-dim) / <alpha-value>)',
        deep:   'rgb(var(--c-gold-deep) / <alpha-value>)',
        base:   'rgb(var(--c-gold-base) / <alpha-value>)',
        mid:    'rgb(var(--c-gold-mid) / <alpha-value>)',
        bright: 'rgb(var(--c-gold-bright) / <alpha-value>)',
        pale:   'rgb(var(--c-gold-pale) / <alpha-value>)',
        glow:   'rgb(var(--c-gold-glow) / <alpha-value>)',
      },

      // Crimson — primary interactive accent (DnD Beyond red)
      arcane: {
        deep:   'rgb(var(--c-arcane-deep) / <alpha-value>)',
        base:   'rgb(var(--c-arcane-base) / <alpha-value>)',
        mid:    'rgb(var(--c-arcane-mid) / <alpha-value>)',
        bright: 'rgb(var(--c-arcane-bright) / <alpha-value>)',
        pale:   'rgb(var(--c-arcane-pale) / <alpha-value>)',
      },

      // Blood — danger, HP, critical (darker wine/maroon than arcane)
      blood: {
        deep:   'rgb(var(--c-blood-deep) / <alpha-value>)',
        base:   'rgb(var(--c-blood-base) / <alpha-value>)',
        mid:    'rgb(var(--c-blood-mid) / <alpha-value>)',
        bright: 'rgb(var(--c-blood-bright) / <alpha-value>)',
      },

      // Verdant — nature, druid
      verdant: {
        deep:   'rgb(var(--c-verdant-deep) / <alpha-value>)',
        base:   'rgb(var(--c-verdant-base) / <alpha-value>)',
        mid:    'rgb(var(--c-verdant-mid) / <alpha-value>)',
        bright: 'rgb(var(--c-verdant-bright) / <alpha-value>)',
      },

      // Semantic aliases
      success: 'rgb(var(--c-success) / <alpha-value>)',
      danger:  'rgb(var(--c-danger) / <alpha-value>)',
      warning: 'rgb(var(--c-warning) / <alpha-value>)',
      info:    'rgb(var(--c-info) / <alpha-value>)',
    },

    fontFamily: {
      display: ['Cinzel', 'Georgia', 'serif'],
      heading: ['Cinzel', 'Georgia', 'serif'],
      body:    ['"Crimson Pro"', 'Georgia', 'serif'],
      mono:    ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
    },

    fontSize: {
      '2xs': ['0.625rem', { lineHeight: '1rem' }],
      xs:    ['0.75rem',  { lineHeight: '1.125rem' }],
      sm:    ['0.875rem', { lineHeight: '1.375rem' }],
      base:  ['1rem',     { lineHeight: '1.65rem' }],
      lg:    ['1.125rem', { lineHeight: '1.75rem' }],
      xl:    ['1.25rem',  { lineHeight: '1.875rem' }],
      '2xl': ['1.5rem',   { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
      '4xl': ['2.25rem',  { lineHeight: '2.75rem' }],
      '5xl': ['3rem',     { lineHeight: '3.5rem' }],
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
      none:    '0',
      sm:      '2px',
      DEFAULT: '3px',
      md:      '4px',
      lg:      '6px',
      xl:      '8px',
      '2xl':   '12px',
      full:    '9999px',
    },
  },

  shortcuts: {
    // ── Layout
    'app-container': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

    // ── Cards
    'card':
      'bg-abyss border border-shadow rounded-lg shadow-card relative overflow-hidden',
    'card-hover':
      'card transition-colors duration-200 hover:border-arcane-base/40 hover:shadow-card-hover cursor-pointer',
    'card-inner':
      'bg-depths border border-shadow/60 rounded-md',

    // ── Buttons
    'btn-base':
      'inline-flex items-center justify-center gap-2 font-heading text-sm tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-mid focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:opacity-40 disabled:pointer-events-none select-none',

    'btn-primary':
      'btn-base px-5 py-2 rounded-md bg-arcane-base text-vellum font-semibold hover:bg-arcane-mid active:bg-arcane-deep',

    'btn-secondary':
      'btn-base px-5 py-2 rounded-md border border-shadow bg-depths text-stone hover:border-arcane-base/40 hover:text-vellum',

    'btn-ghost':
      'btn-base px-3 py-1.5 rounded-md text-stone hover:text-vellum hover:bg-dusk/40',

    'btn-danger':
      'btn-base px-5 py-2 rounded-md bg-blood-mid text-vellum hover:bg-blood-bright',

    'btn-icon':
      'btn-base p-2 rounded-md text-stone hover:text-vellum hover:bg-dusk/40',

    // ── Form controls
    'input-base':
      'w-full rounded-md border border-shadow bg-depths px-3.5 py-2 text-base font-body text-stone placeholder:text-mist focus:outline-none focus:border-arcane-base/60 focus:ring-1 focus:ring-arcane-base/30 transition-colors',

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

    // ── Dividers
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

    // ── Navigation
    'nav-link':
      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-heading tracking-wide text-stone hover:text-vellum hover:bg-dusk/40 transition-all duration-150',
    'nav-link-active':
      'nav-link text-arcane-bright hover:text-arcane-bright bg-arcane-deep/30 hover:bg-arcane-deep/50',
  },
})
