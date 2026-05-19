<template>
  <div class="group relative rounded overflow-hidden border border-gold-dim/20 bg-abyss transition-all duration-200 hover:border-gold-mid/45 hover:shadow-card-hover cursor-pointer">

    <!-- Portrait area -->
    <RouterLink :to="`/characters/${summary.id}`" class="block">
      <div class="aspect-[3/4] relative overflow-hidden bg-depths">

        <img
          v-if="summary.portraitUrl"
          :src="summary.portraitUrl"
          :alt="summary.name"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <!-- Placeholder -->
        <div
          v-else
          class="w-full h-full flex flex-col items-center justify-center gap-3"
        >
          <span class="font-display text-6xl leading-none select-none text-gold-mid/30">{{ classGlyph }}</span>
          <p class="font-mono text-2xs tracking-[0.2em] uppercase text-mist/60">No portrait</p>
        </div>

        <!-- Gradient scrim so the level badge is always legible -->
        <div
          class="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style="background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)"
        />

        <!-- Level badge -->
        <div class="absolute bottom-2 left-2">
          <span class="badge-gold">Lv {{ summary.level }}</span>
        </div>

        <!-- Hover actions -->
        <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            class="w-7 h-7 rounded bg-void/90 border border-shadow flex items-center justify-center text-ash hover:text-gold-mid transition-colors"
            title="Duplicate"
            @click.prevent="emit('duplicate')"
          ><CopyIcon :size="12" /></button>
          <button
            class="w-7 h-7 rounded bg-void/90 border border-shadow flex items-center justify-center text-ash hover:text-gold-mid transition-colors"
            title="Export"
            @click.prevent="emit('export')"
          ><DownloadIcon :size="12" /></button>
          <button
            class="w-7 h-7 rounded bg-void/90 border border-shadow flex items-center justify-center text-ash hover:text-arcane-bright transition-colors"
            title="Delete"
            @click.prevent="emit('delete')"
          ><Trash2Icon :size="12" /></button>
        </div>
      </div>

      <!-- Info -->
      <div class="px-3.5 py-3 border-t border-gold-dim/15">
        <h3 class="font-display text-base text-vellum leading-snug truncate group-hover:text-arcane-base transition-colors">
          {{ summary.name }}
        </h3>
        <p class="font-body text-sm text-ash mt-0.5 truncate">
          {{ summary.race }}<span class="text-mist mx-1">·</span>{{ summary.className }}
        </p>
        <p class="font-mono text-2xs tracking-widest uppercase text-mist mt-2">{{ relativeTime }}</p>
      </div>
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

const classGlyph = computed(() => classGlyphs[props.summary.className.toLowerCase()] ?? '⚔')

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
