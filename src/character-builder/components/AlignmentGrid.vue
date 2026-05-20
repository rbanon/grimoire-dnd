<template>
  <div class="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Alignment">
    <div
      v-for="a in alignments"
      :key="a.value"
      class="group relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded border text-center transition-all duration-150 cursor-pointer"
      :class="modelValue === a.value
        ? 'border-gold-mid/60 bg-gold-dim/10 text-gold-deep'
        : 'border-shadow bg-abyss text-mist hover:border-gold-dim/25 hover:text-stone hover:bg-depths'"
      role="radio"
      :aria-checked="modelValue === a.value"
      tabindex="0"
      @click="emit('update:modelValue', a.value)"
      @keydown.enter.prevent="emit('update:modelValue', a.value)"
      @keydown.space.prevent="emit('update:modelValue', a.value)"
    >
      <!-- Selected top line -->
      <div
        v-if="modelValue === a.value"
        class="absolute top-0 left-2 right-2 h-px"
        style="background: linear-gradient(90deg, transparent, rgba(212,168,67,0.5), transparent)"
      />
      <span class="text-lg leading-none">{{ a.glyph }}</span>
      <span class="text-2xs font-heading tracking-wide leading-tight">{{ a.label }}</span>
      <!-- Info trigger -->
      <button
        type="button"
        class="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded text-mist/50 hover:text-ash hover:bg-depths/60 transition-colors opacity-0 group-hover:opacity-100 z-10"
        aria-label="Alignment details"
        @click.stop="infoPanel.open({ kind: 'alignment', value: a.value })"
      >
        <InfoIcon :size="9" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { InfoIcon } from 'lucide-vue-next'
import type { Alignment } from '@/shared/types/character'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'

defineProps<{ modelValue: Alignment }>()
const emit = defineEmits<{ 'update:modelValue': [v: Alignment] }>()
const infoPanel = useInfoPanel()

const alignments: { value: Alignment; label: string; glyph: string }[] = [
  { value: 'Lawful Good',    label: 'Lawful Good',    glyph: '⚖' },
  { value: 'Neutral Good',   label: 'Neutral Good',   glyph: '✦' },
  { value: 'Chaotic Good',   label: 'Chaotic Good',   glyph: '☀' },
  { value: 'Lawful Neutral', label: 'Lawful Neutral', glyph: '▣' },
  { value: 'True Neutral',   label: 'True Neutral',   glyph: '◎' },
  { value: 'Chaotic Neutral',label: 'Chaotic Neutral',glyph: '⟳' },
  { value: 'Lawful Evil',    label: 'Lawful Evil',    glyph: '⛧' },
  { value: 'Neutral Evil',   label: 'Neutral Evil',   glyph: '◈' },
  { value: 'Chaotic Evil',   label: 'Chaotic Evil',   glyph: '⚡' },
]
</script>
