<template>
  <div
    class="card flex flex-col items-center justify-center py-4 px-2 gap-1 group cursor-default relative overflow-hidden hover:border-gold-dim/30 transition-all duration-200"
  >
    <!-- Subtle background glow on hover -->
    <div
      class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      style="background: radial-gradient(ellipse at center, rgba(212,168,67,0.04) 0%, transparent 70%)"
    />
    <p class="text-2xs font-heading tracking-[0.2em] uppercase text-mist relative">{{ label }}</p>
    <p
      class="relative font-heading text-2xl leading-none transition-colors duration-200"
      :class="mod >= 0 ? 'text-gold-mid group-hover:text-gold-bright' : 'text-blood-bright'"
    >
      {{ modDisplay }}
    </p>
    <p class="relative text-sm font-body text-ash leading-none">{{ score }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ label: string; score: number; mod: number }>()
const modDisplay = computed(() => props.mod >= 0 ? `+${props.mod}` : String(props.mod))
</script>
