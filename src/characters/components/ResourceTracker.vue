<template>
  <div v-if="resources.length > 0" class="space-y-3">
    <div
      v-for="pool in resources"
      :key="pool.id"
      class="card p-3"
    >
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="font-heading text-sm text-vellum truncate">{{ pool.name }}</span>
          <span
            class="text-2xs font-body px-1.5 py-0.5 rounded border shrink-0"
            :class="pool.refreshOn === 'short'
              ? 'border-arcane-base/30 text-arcane-pale/60'
              : 'border-gold-dim/30 text-gold-dim/60'"
            :title="pool.refreshOn === 'short' ? 'Recovers on short rest' : 'Recovers on long rest'"
          >{{ pool.refreshOn === 'short' ? 'S' : 'L' }}</span>
          <button
            v-if="featureMap.get(pool.name)"
            type="button"
            class="shrink-0 w-5 h-5 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/30 transition-all"
            title="Feature details"
            @click="infoPanel.open({ kind: 'feature', index: featureMap.get(pool.name)!, name: pool.name })"
          >
            <InfoIcon :size="11" />
          </button>
        </div>
        <span class="font-heading tabular-nums text-xs text-mist shrink-0">{{ pool.current }}/{{ pool.max }}</span>
      </div>

      <!-- Pips for max ≤ 6 -->
      <div v-if="pool.max <= 6" class="flex items-center gap-1.5">
        <button
          v-for="pip in pool.max"
          :key="pip"
          type="button"
          class="w-4 h-4 rounded-full border-2 transition-all duration-100 cursor-pointer hover:border-gold-dim/80"
          :class="pip <= pool.current
            ? 'bg-gold-mid/70 border-gold-mid/70'
            : 'bg-transparent border-shadow/60'"
          :title="pip <= pool.current ? 'Click to spend' : 'Click to recover'"
          @click="togglePip(pool, pip)"
        />
      </div>

      <!-- Stepper for max > 6 -->
      <div v-else class="flex items-center gap-2">
        <button
          type="button"
          class="w-6 h-6 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths font-heading text-base leading-none transition-colors"
          :disabled="pool.current <= 0"
          @click="spend(pool, 1)"
        >−</button>
        <div class="flex-1 flex items-center gap-1.5">
          <div
            class="h-1.5 rounded-full bg-shadow/30 flex-1 overflow-hidden"
          >
            <div
              class="h-full rounded-full bg-gold-mid/60 transition-all duration-200"
              :style="{ width: pool.max > 0 ? `${(pool.current / pool.max) * 100}%` : '0%' }"
            />
          </div>
          <span class="font-heading tabular-nums text-sm text-vellum w-12 text-right">{{ pool.current }}</span>
        </div>
        <button
          type="button"
          class="w-6 h-6 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths font-heading text-base leading-none transition-colors"
          :disabled="pool.current >= pool.max"
          @click="recover(pool, 1)"
        >+</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { InfoIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import type { ResourcePool } from '@/shared/types/character'

const infoPanel = useInfoPanel()

const props = defineProps<{
  resources: ResourcePool[]
  classIndex: string
}>()

const emit = defineEmits<{
  change: [pools: ResourcePool[]]
}>()

const classIndexRef = toRef(props, 'classIndex')

const { data: levelsData } = useQuery({
  queryKey: computed(() => ['class-levels', classIndexRef.value]),
  queryFn: () => fiveEApi.getClassLevels(classIndexRef.value),
  staleTime: Infinity,
})

// Flat list of all features across all class levels
const allFeatures = computed(() => levelsData.value?.flatMap(l => l.features) ?? [])

// Map pool.name → API feature index using prefix match
// The API appends level-specific details in parens, e.g. "Wild Shape (CR 1/4...)"
// so we match "Wild Shape" against names that start with "Wild Shape ("
const featureMap = computed(() => {
  const map = new Map<string, string>()
  for (const pool of props.resources) {
    const match = allFeatures.value.find(
      f => f.name === pool.name ||
           f.name.startsWith(pool.name + ' (') ||
           pool.name.startsWith(f.name)
    )
    if (match) map.set(pool.name, match.index)
  }
  return map
})

function togglePip(pool: ResourcePool, pip: number) {
  const next = pip <= pool.current ? pip - 1 : pip
  emit('change', props.resources.map(r => r.id === pool.id ? { ...r, current: next } : r))
}

function spend(pool: ResourcePool, amount: number) {
  const next = Math.max(0, pool.current - amount)
  emit('change', props.resources.map(r => r.id === pool.id ? { ...r, current: next } : r))
}

function recover(pool: ResourcePool, amount: number) {
  const next = Math.min(pool.max, pool.current + amount)
  emit('change', props.resources.map(r => r.id === pool.id ? { ...r, current: next } : r))
}
</script>
