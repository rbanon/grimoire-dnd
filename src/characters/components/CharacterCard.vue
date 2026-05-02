<template>
  <div
    class="card-hover group relative flex flex-col overflow-hidden gold-glow-hover"
    style="min-height: 200px"
  >
    <!-- Gold corner ornaments -->
    <div class="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold-dim/30 z-10 transition-colors duration-300 group-hover:border-gold-dim/70" />
    <div class="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold-dim/30 z-10 transition-colors duration-300 group-hover:border-gold-dim/70" />
    <div class="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold-dim/30 z-10 transition-colors duration-300 group-hover:border-gold-dim/70" />
    <div class="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold-dim/30 z-10 transition-colors duration-300 group-hover:border-gold-dim/70" />

    <!-- Portrait -->
    <div class="relative aspect-[4/3] bg-depths overflow-hidden">
      <!-- Subtle inner vignette -->
      <div
        class="absolute inset-0 z-10 pointer-events-none"
        style="background: linear-gradient(to bottom, transparent 50%, rgba(13,17,32,0.85) 100%)"
      />

      <img
        v-if="summary.portraitUrl"
        :src="summary.portraitUrl"
        :alt="summary.name"
        class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div
        v-else
        class="w-full h-full flex flex-col items-center justify-center gap-2"
        style="background: radial-gradient(ellipse at center, #1c2338 0%, #0d1120 100%)"
      >
        <!-- Placeholder sigil -->
        <div class="relative w-14 h-14">
          <div class="absolute inset-0 border border-gold-dim/20 rotate-45" style="border-radius: 2px" />
          <div class="absolute inset-1 border border-gold-dim/10" style="border-radius: 2px" />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-gold-dim/60 text-xl">{{ classGlyph }}</span>
          </div>
        </div>
        <span class="text-caption text-mist/60">No portrait</span>
      </div>

      <!-- Level badge -->
      <div class="absolute bottom-3 left-3 z-20">
        <span class="badge-gold text-xs">Lv {{ summary.level }}</span>
      </div>

      <!-- Action buttons — appear on hover -->
      <div class="absolute top-2.5 right-2.5 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
        <button
          class="w-7 h-7 rounded bg-abyss/90 border border-shadow flex items-center justify-center text-ash hover:text-gold-mid hover:border-gold-dim/40 transition-all duration-150"
          title="Duplicate"
          @click.prevent="emit('duplicate')"
        >
          <CopyIcon :size="12" />
        </button>
        <button
          class="w-7 h-7 rounded bg-abyss/90 border border-shadow flex items-center justify-center text-ash hover:text-gold-mid hover:border-gold-dim/40 transition-all duration-150"
          title="Export"
          @click.prevent="emit('export')"
        >
          <DownloadIcon :size="12" />
        </button>
        <button
          class="w-7 h-7 rounded bg-abyss/90 border border-shadow flex items-center justify-center text-ash hover:text-blood-bright hover:border-blood-base/40 transition-all duration-150"
          title="Remove"
          @click.prevent="emit('delete')"
        >
          <Trash2Icon :size="12" />
        </button>
      </div>
    </div>

    <!-- Info -->
    <RouterLink :to="`/characters/${summary.id}`" class="flex-1 p-4 flex flex-col gap-1.5 relative">
      <h3 class="font-heading text-base text-vellum leading-tight truncate group-hover:text-gold-pale transition-colors duration-200">
        {{ summary.name }}
      </h3>
      <p class="font-body text-sm text-ash leading-tight">
        {{ summary.race }}
        <span class="text-mist mx-1">·</span>
        {{ summary.className }}
      </p>
      <p class="text-2xs font-heading tracking-wider text-mist mt-auto pt-1">
        {{ relativeTime }}
      </p>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CopyIcon, DownloadIcon, Trash2Icon } from 'lucide-vue-next'
import type { CharacterSummary } from '@/shared/types/character'

const props = defineProps<{ summary: CharacterSummary }>()
const emit = defineEmits<{ duplicate: []; delete: []; export: [] }>()

const classGlyphs: Record<string, string> = {
  barbarian: '⚔', bard: '♪', cleric: '✦', druid: '☘', fighter: '🛡',
  monk: '◎', paladin: '✚', ranger: '⌖', rogue: '◆', sorcerer: '✶',
  warlock: '⌬', wizard: '⎊',
}

const classGlyph = computed(() => {
  const key = props.summary.className.toLowerCase()
  return classGlyphs[key] ?? '⚔'
})

const relativeTime = computed(() => {
  const diff = Date.now() - new Date(props.summary.updatedAt).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(props.summary.updatedAt).toLocaleDateString()
})
</script>
