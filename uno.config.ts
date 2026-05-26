import { defineConfig, presetWind, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetWind({ dark: 'class' }),
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
      display: ['"EB Garamond"', 'Georgia', 'serif'],
      heading: ['"EB Garamond"', 'Georgia', 'serif'],
      body:    ['Manrope', 'system-ui', 'sans-serif'],
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
      DEFAULT: '4px',
      md:      '4px',
      lg:      '8px',
      xl:      '12px',
      '2xl':   '16px',
      full:    '9999px',
    },
  },

  shortcuts: {
    // ── Layout
    'app-container': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

    // ── Cards
    'card':
      'bg-abyss border border-gold-dim/30 rounded shadow-card relative overflow-hidden',
    'card-hover':
      'card transition-colors duration-200 hover:border-gold-mid/50 hover:shadow-card-hover cursor-pointer',
    'card-inner':
      'bg-depths border border-gold-dim/20 rounded',

    // ── Buttons
    'btn-base':
      'appearance-none inline-flex items-center justify-center gap-2 font-heading text-sm tracking-wide transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-mid focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:opacity-40 disabled:pointer-events-none select-none',

    // Warm gold gradient — reads like pressed gold leaf, not a generic UI rectangle
    'btn-primary':
      'btn-base px-5 py-2 rounded font-semibold text-void bg-gradient-to-b from-gold-mid to-gold-base hover:from-gold-bright hover:to-gold-mid active:from-gold-dim active:to-gold-base',

    // Thin warm border, transparent interior — gilded frame, not a block
    'btn-secondary':
      'btn-base px-5 py-2 rounded border border-gold-dim/50 text-stone hover:border-gold-mid hover:text-vellum',

    // Text-only interaction — no box at all
    'btn-ghost':
      'btn-base px-3 py-1.5 rounded text-stone hover:text-vellum hover:bg-gold-dim/10',

    // Blood gradient — matches primary treatment
    'btn-danger':
      'btn-base px-5 py-2 rounded font-semibold text-white bg-gradient-to-b from-blood-bright to-blood-mid hover:from-blood-mid hover:to-blood-base active:from-blood-base active:to-blood-deep',

    'btn-icon':
      'btn-base p-2 rounded text-mist/70 hover:text-stone hover:bg-gold-dim/10',

    // ── Form controls
    'input-base':
      'w-full rounded border border-shadow bg-abyss px-3.5 py-2 text-base font-body text-vellum placeholder:text-mist/60 focus:outline-none focus:border-gold-mid/60 focus:ring-1 focus:ring-gold-mid/20 transition-colors',

    'label':
      'block text-xs font-mono tracking-widest uppercase text-mist mb-1.5',

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

    // ── Badges / Chips — rectangular per DESIGN spec
    'badge':
      'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-mono tracking-wide',
    'badge-gold':
      'badge bg-gold-dim/15 text-gold-deep border border-gold-dim/35',
    'badge-arcane':
      'badge bg-arcane-deep/20 text-arcane-pale border border-arcane-base/30',
    'badge-blood':
      'badge bg-blood-deep/20 text-blood-bright border border-blood-base/30',
    'badge-verdant':
      'badge bg-verdant-deep/20 text-verdant-base border border-verdant-base/30',

    // ── Stat display
    'stat-box':
      'card flex flex-col items-center justify-center p-3 gap-0.5',

    // ── Navigation
    'nav-link':
      'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-heading tracking-wider text-stone hover:text-vellum hover:bg-dusk/20 transition-all duration-150',
    'nav-link-active':
      'nav-link text-gold-deep hover:text-gold-deep font-semibold border-b-2 border-gold-mid rounded-none',
  },
})
