<template>
  <div class="app-container py-10">

    <!-- Header -->
    <RouterLink to="/characters/new" class="no-underline inline-flex items-center gap-1.5 group mb-4">
      <ChevronLeftIcon :size="13" class="text-mist group-hover:text-ash transition-colors" />
      <span class="font-mono text-2xs text-mist group-hover:text-ash transition-colors tracking-wide">Creation modes</span>
    </RouterLink>
    <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist mb-2">Ready-Made · Levels 1-3</p>
    <h1 class="font-display text-4xl text-vellum leading-tight">Pregenerated Heroes</h1>
    <p class="font-body text-base text-ash mt-1.5 mb-8 max-w-2xl">
      Pick a complete, balanced build to open in the builder. Review each step, make it yours, and save.
    </p>

    <!-- Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <button
        v-for="p in PRESETS"
        :key="p.id"
        type="button"
        class="group text-left rounded-lg border border-shadow bg-abyss p-5 hover:bg-depths/60 hover:border-gold-mid/40 transition-all duration-150 flex flex-col"
        :style="{ 'border-left': `3px solid ${statColor(p.primaryStat)}` }"
        @click="usePreset(p)"
      >
        <div class="flex items-start justify-between gap-2 mb-1">
          <div class="min-w-0">
            <h2 class="font-display text-xl text-vellum leading-tight truncate">{{ p.title }}</h2>
            <p class="font-body text-2xs text-mist mt-0.5">{{ p.subtitle }}</p>
          </div>
          <span class="shrink-0 text-2xs font-mono px-1.5 py-0.5 rounded border" :style="{ 'border-color': statColor(p.primaryStat), color: statColor(p.primaryStat) }">
            {{ statLabel(p.primaryStat) }}
          </span>
        </div>

        <p class="font-body text-sm text-ash leading-relaxed flex-1 my-2">{{ p.blurb }}</p>

        <div class="flex items-center gap-2 mt-1">
          <span class="text-2xs font-mono tracking-wide uppercase px-1.5 py-0.5 rounded border border-gold-dim/30 text-gold-dim">Lvl {{ p.level }}</span>
          <span v-if="p.isSpellcaster" class="text-2xs font-heading text-arcane-pale flex items-center gap-1">✶ Spellcaster</span>
          <span class="ml-auto flex items-center gap-1.5 font-mono text-2xs tracking-wide uppercase text-gold-mid transition-all group-hover:gap-2.5">
            Use <ArrowRightIcon :size="12" />
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ArrowRightIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useBuilderStore } from '@/character-builder/builderStore'
import { PRESETS, type CharacterPreset } from '@/character-builder/presets'

const router = useRouter()
const builder = useBuilderStore()

const ABILITY_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}
function statLabel(s: string): string { return ABILITY_LABELS[s] ?? s.toUpperCase() }
function statColor(s: string): string {
  switch (s) {
    case 'str': return 'rgb(var(--c-blood-bright))'
    case 'dex': return 'rgb(var(--c-verdant-bright))'
    case 'con': return 'rgb(var(--c-gold-mid))'
    case 'int': return 'rgb(var(--c-arcane-base))'
    case 'wis': return 'rgb(var(--c-arcane-pale))'
    case 'cha': return 'rgb(var(--c-gold-bright))'
    default: return 'rgb(var(--c-mist))'
  }
}

function usePreset(p: CharacterPreset) {
  builder.applyDraft(p.draft, 1)
  router.push({ path: '/characters/new/builder', query: { from: 'preset' } })
}
</script>
