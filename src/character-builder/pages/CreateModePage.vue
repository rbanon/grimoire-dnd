<template>
  <div>
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <header class="border-b border-shadow bg-void relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-gold-dim/5 to-transparent pointer-events-none" />
      <div class="app-container py-8 sm:py-10 relative">
        <RouterLink to="/" class="no-underline inline-flex items-center gap-1.5 group mb-3">
          <ChevronLeftIcon :size="13" class="text-mist group-hover:text-ash transition-colors" />
          <span class="font-mono text-2xs text-mist group-hover:text-ash transition-colors tracking-wide">Characters</span>
        </RouterLink>
        <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist mb-2">New Character</p>
        <h1 class="font-display text-4xl sm:text-5xl text-vellum leading-tight">How will you begin?</h1>
        <p class="font-body text-base text-ash mt-1.5">Choose how much of the character you want to craft yourself.</p>
      </div>
    </header>

    <!-- ── Body ────────────────────────────────────────────────────────────── -->
    <main class="app-container py-8 space-y-6">

      <!-- Resume draft -->
      <RouterLink
        v-if="draft"
        to="/characters/new/builder"
        class="no-underline flex items-center gap-4 px-5 py-4 rounded-lg border border-gold-dim/30 bg-abyss hover:border-gold-mid/50 hover:bg-gold-dim/5 transition-all group"
      >
        <div class="w-10 h-10 rounded border border-gold-dim/30 bg-gold-dim/5 flex items-center justify-center shrink-0">
          <BookOpenIcon :size="18" class="text-gold-mid" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-mono text-2xs tracking-[0.15em] uppercase text-mist">Draft in progress</p>
          <p class="font-display text-lg text-vellum leading-tight truncate">{{ draftTitle }}</p>
          <p v-if="draftSubtitle" class="font-body text-sm text-ash truncate">{{ draftSubtitle }}</p>
        </div>
        <span class="shrink-0 flex items-center gap-1.5 font-mono text-2xs tracking-wide uppercase text-gold-mid group-hover:gap-2.5 transition-all">
          Continue <ArrowRightIcon :size="13" />
        </span>
      </RouterLink>

      <!-- Mode cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RouterLink
          v-for="mode in modes"
          :key="mode.to"
          :to="mode.to"
          class="no-underline group relative flex flex-col rounded-lg border border-shadow bg-abyss p-6 hover:bg-depths/60 transition-all duration-150 overflow-hidden"
          :class="mode.accent.hover"
        >
          <!-- Top accent stripe on hover -->
          <div class="absolute top-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300" :class="mode.accent.stripe" />

          <div class="w-12 h-12 rounded-lg border flex items-center justify-center mb-4 transition-colors" :class="mode.accent.iconBox">
            <component :is="mode.icon" :size="22" :class="mode.accent.icon" />
          </div>

          <div class="flex items-center gap-2 mb-1.5">
            <h2 class="font-display text-xl text-vellum leading-tight">{{ mode.title }}</h2>
            <span v-if="mode.badge" class="text-2xs font-mono tracking-wide uppercase px-1.5 py-0.5 rounded border" :class="mode.accent.badge">{{ mode.badge }}</span>
          </div>
          <p class="font-body text-sm text-ash leading-relaxed flex-1">{{ mode.desc }}</p>

          <span class="mt-4 flex items-center gap-1.5 font-mono text-2xs tracking-wide uppercase transition-all group-hover:gap-2.5" :class="mode.accent.cta">
            {{ mode.cta }} <ArrowRightIcon :size="13" />
          </span>
        </RouterLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeftIcon, ArrowRightIcon, BookOpenIcon, FeatherIcon, SwordsIcon, Wand2Icon } from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'

const builder = useBuilderStore()

// Snapshot the saved draft once on mount (read-only, doesn't touch the live draft).
const draft = ref(builder.peekDraft())
const draftTitle = computed(() => draft.value?.name || 'Unnamed Character')
const draftSubtitle = computed(() => {
  const d = draft.value
  if (!d) return ''
  return [d.raceName, d.className].filter(Boolean).join(' · ')
})

const modes = [
  {
    to: '/characters/new/builder',
    icon: FeatherIcon,
    title: 'Full Builder',
    badge: '',
    desc: 'Craft every detail: class, race, abilities, spells and gear across the full eleven-step wizard.',
    cta: 'Start building',
    accent: {
      hover: 'hover:border-gold-mid/50',
      stripe: 'bg-gold-mid',
      iconBox: 'border-gold-dim/30 bg-gold-dim/5 group-hover:border-gold-mid/50',
      icon: 'text-gold-mid',
      badge: '',
      cta: 'text-gold-mid',
    },
  },
  {
    to: '/characters/new/presets',
    icon: SwordsIcon,
    title: 'Ready-Made',
    badge: 'Lvl 1-3',
    desc: 'Pick a pregenerated hero: a complete, balanced build you can play as-is or tweak in the builder.',
    cta: 'Browse heroes',
    accent: {
      hover: 'hover:border-arcane-base/50',
      stripe: 'bg-arcane-base',
      iconBox: 'border-arcane-base/30 bg-arcane-deep/10 group-hover:border-arcane-base/50',
      icon: 'text-arcane-pale',
      badge: 'border-arcane-base/30 text-arcane-pale/80',
      cta: 'text-arcane-pale',
    },
  },
  {
    to: '/characters/new/quiz',
    icon: Wand2Icon,
    title: 'Guided Quiz',
    badge: 'Lvl 1-3',
    desc: 'Answer a handful of questions and we\'ll conjure a fitting class, race and starting spells for you.',
    cta: 'Take the quiz',
    accent: {
      hover: 'hover:border-verdant-base/50',
      stripe: 'bg-verdant-base',
      iconBox: 'border-verdant-base/30 bg-verdant-deep/10 group-hover:border-verdant-base/50',
      icon: 'text-verdant-base',
      badge: 'border-verdant-base/30 text-verdant-base/80',
      cta: 'text-verdant-base',
    },
  },
]
</script>
