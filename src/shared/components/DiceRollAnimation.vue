<template>
  <Transition name="dice-pop">
    <div
      v-if="animating"
      :key="rollKey"
      class="fixed bottom-6 right-6 z-50 w-14 h-14 pointer-events-none"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        class="w-full h-full animate-dice-tumble"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Outer polygon, die silhouette -->
        <polygon
          :points="outerPoints"
          :stroke="dieColor"
          stroke-width="1.8"
          stroke-linejoin="round"
          :fill="dieColor"
          fill-opacity="0.18"
        />
        <!-- Inner polygon, engraved face detail -->
        <polygon
          :points="innerPoints"
          :stroke="dieColor"
          stroke-width="0.9"
          stroke-linejoin="round"
          stroke-opacity="0.55"
          fill="none"
        />
      </svg>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoll } from '@/shared/composables/useRoll'

const { animating, animDieSides } = useRoll()

// Bump key on each new animation so CSS keyframe restarts cleanly
const rollKey = ref(0)
watch(animating, (val) => { if (val) rollKey.value++ })

function polygonPoints(n: number, radius: number, startAngleDeg: number, cx = 24, cy = 24): string {
  const startRad = (startAngleDeg * Math.PI) / 180
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const angle = startRad + (2 * Math.PI * i) / n
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`)
  }
  return pts.join(' ')
}

// [vertices, startAngleDeg]
const SHAPE: Record<number, [number, number]> = {
  4:  [3, -90],   // d4  → triangle, point up
  6:  [4, -45],   // d6  → square, flat sides
  8:  [4,   0],   // d8  → diamond, point up
  10: [5, -54],   // d10 → pentagon, flat bottom
  12: [5, -90],   // d12 → pentagon, point up
  20: [6,   0],   // d20 → hexagon, flat sides
}

// Hardcoded colors, no UnoCSS dependency; always visible regardless of scanner
const DIE_COLOR: Record<number, string> = {
  4:  '#ec6868',   // arcane-pale (light mode), pinkish crimson
  6:  '#d4af37',   // gold-mid, warm gold
  8:  '#d4af37',   // gold-mid
  10: '#b84040',   // blood-mid, deeper red
  12: '#e87878',   // blood-bright, bright red
  20: '#ec6868',   // arcane-pale, signature D20 crimson
}

const shapeConfig = computed(() => SHAPE[animDieSides.value] ?? [6, 0])
const outerPoints = computed(() => polygonPoints(shapeConfig.value[0], 18, shapeConfig.value[1]))
const innerPoints = computed(() => polygonPoints(shapeConfig.value[0], 11, shapeConfig.value[1]))
const dieColor = computed(() => DIE_COLOR[animDieSides.value] ?? '#d4af37')
</script>

<style scoped>
.dice-pop-enter-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.dice-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dice-pop-enter-from,
.dice-pop-leave-to {
  opacity: 0;
  transform: scale(0.7);
}
</style>
