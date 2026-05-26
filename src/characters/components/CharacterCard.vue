<template>
  <div class="group relative rounded-lg overflow-hidden border border-gold-dim/25 bg-abyss transition-all duration-200 hover:border-gold-mid/50 hover:shadow-card-hover flex flex-col">

    <!-- Portrait hero area (aspect-[4/3]) -->
    <RouterLink :to="`/characters/${summary.id}`" class="block relative overflow-hidden aspect-[4/3] bg-depths shrink-0">

      <img
        v-if="summary.portraitUrl"
        :src="summary.portraitUrl"
        :alt="summary.name"
        class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
      />

      <!-- Placeholder -->
      <div
        v-else
        class="w-full h-full flex flex-col items-center justify-center gap-2"
      >
        <span class="font-display text-7xl leading-none select-none text-gold-mid/25">{{ classGlyph }}</span>
      </div>

      <!-- Bottom gradient overlay -->
      <div class="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-abyss via-abyss/40 to-transparent pointer-events-none" />

      <!-- Name overlaid on portrait bottom -->
      <div class="absolute inset-x-0 bottom-0 px-3.5 pb-3 pointer-events-none">
        <div class="flex items-end justify-between gap-2">
          <h3 class="font-display text-lg text-vellum leading-snug line-clamp-2 flex-1 min-w-0">
            {{ summary.name }}
          </h3>
          <span class="badge-gold shrink-0 mb-0.5">Lv {{ summary.level }}</span>
        </div>
      </div>

      <!-- Corner action buttons (top-right, always visible on mobile, hover on desktop) -->
      <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          class="w-7 h-7 rounded bg-void/85 border border-shadow/60 flex items-center justify-center text-ash hover:text-gold-mid transition-colors"
          title="Duplicate"
          @click.prevent="emit('duplicate')"
        ><CopyIcon :size="12" /></button>
        <button
          class="w-7 h-7 rounded bg-void/85 border border-shadow/60 flex items-center justify-center text-ash hover:text-gold-mid transition-colors"
          title="Export"
          @click.prevent="emit('export')"
        ><DownloadIcon :size="12" /></button>
        <button
          class="w-7 h-7 rounded bg-void/85 border border-shadow/60 flex items-center justify-center text-ash hover:text-arcane-bright transition-colors"
          title="Delete"
          @click.prevent="emit('delete')"
        ><Trash2Icon :size="12" /></button>
      </div>
    </RouterLink>

    <!-- Info panel -->
    <div class="px-3.5 pt-2.5 pb-3 flex flex-col gap-1.5 flex-1">

      <!-- Race · Class — Subclass -->
      <p class="font-body text-sm text-ash leading-snug truncate">
        {{ summary.race }}<span class="text-dusk mx-1.5">·</span>{{ summary.className }}<span v-if="summary.subclassName" class="text-mist/70"> — {{ summary.subclassName }}</span>
      </p>

      <!-- Last edited + HP/AC -->
      <div class="flex items-center justify-between gap-2 mt-auto">
        <p class="font-mono text-2xs text-mist/50 tracking-wide">{{ relativeTime }}</p>
        <span class="font-mono text-2xs text-mist/50 tracking-wide">
          {{ summary.currentHp }}/{{ summary.maxHp }} HP · {{ summary.armorClass }} AC
        </span>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CopyIcon, DownloadIcon, Trash2Icon } from 'lucide-vue-next'
import type { CharacterSummary } from '@/shared/types/character'
import { getClassGlyph } from '@/character-builder/classMeta'

const props = defineProps<{ summary: CharacterSummary }>()
const emit = defineEmits<{ duplicate: []; delete: []; export: [] }>()

const classGlyph = computed(() => getClassGlyph(props.summary.className))

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
