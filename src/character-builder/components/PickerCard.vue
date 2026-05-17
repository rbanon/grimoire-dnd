<template>
  <div
    class="group relative text-left w-full flex flex-col gap-2 p-4 rounded border transition-all duration-200 overflow-hidden cursor-pointer"
    :class="selected
      ? 'border-gold-mid/60 bg-gold-dim/10 shadow-[0_0_0_1px_rgba(212,168,67,0.2)]'
      : 'border-shadow bg-abyss hover:border-gold-dim/30 hover:bg-depths/80'"
    role="button"
    tabindex="0"
    @click="emit('select')"
    @keydown.enter.prevent="emit('select')"
    @keydown.space.prevent="emit('select')"
  >
    <!-- Selected shimmer line -->
    <div
      v-if="selected"
      class="absolute top-0 left-0 right-0 h-px"
      style="background: linear-gradient(90deg, transparent, rgba(212,168,67,0.6), transparent)"
    />

    <!-- Glyph + actions row -->
    <div class="flex items-start justify-between gap-2">
      <span
        class="text-2xl leading-none transition-transform duration-200"
        :class="selected ? 'scale-110' : 'group-hover:scale-105'"
      >{{ glyph }}</span>
      <div class="flex items-center gap-1 shrink-0">
        <button
          v-if="showInfo"
          type="button"
          class="w-5 h-5 flex items-center justify-center rounded text-mist/60 hover:text-ash hover:bg-depths/60 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="More information"
          @click.stop="emit('info')"
        >
          <InfoIcon :size="12" />
        </button>
        <div
          v-if="selected"
          class="w-5 h-5 rounded-full bg-gold-dim/30 border border-gold-mid/50 flex items-center justify-center"
        >
          <CheckIcon :size="11" class="text-gold-mid" />
        </div>
      </div>
    </div>

    <!-- Name -->
    <div>
      <p
        class="font-heading text-sm leading-tight transition-colors duration-150"
        :class="selected ? 'text-gold-deep' : 'text-vellum group-hover:text-gold-dim'"
      >{{ name }}</p>
      <p class="font-body text-xs text-mist mt-1 leading-snug line-clamp-2">{{ flavor }}</p>
    </div>

    <!-- Tags / stats row -->
    <div v-if="tags?.length || stats" class="flex items-center gap-1.5 flex-wrap mt-auto pt-1">
      <span
        v-for="tag in tags"
        :key="tag"
        class="text-2xs font-heading tracking-wide px-1.5 py-0.5 rounded-sm"
        :class="selected
          ? 'bg-gold-dim/20 text-gold-dim border border-gold-dim/30'
          : 'bg-shadow text-mist border border-shadow'"
      >{{ tag }}</span>
      <span v-if="stats" class="text-2xs font-heading text-mist ml-auto">{{ stats }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, InfoIcon } from 'lucide-vue-next'

defineProps<{
  name: string
  glyph: string
  flavor: string
  selected: boolean
  tags?: string[]
  stats?: string
  showInfo?: boolean
}>()

const emit = defineEmits<{
  select: []
  info: []
}>()
</script>
