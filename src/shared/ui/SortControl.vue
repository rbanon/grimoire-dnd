<template>
  <div class="flex items-center gap-1">
    <AppSelect
      :model-value="sortBy"
      :class="selectClass"
      aria-label="Sort by"
      @update:model-value="onFieldChange"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        Sort: {{ opt.label }}
      </option>
    </AppSelect>
    <button
      type="button"
      class="shrink-0 rounded border border-shadow bg-abyss px-3 py-2 font-mono text-base leading-normal text-mist cursor-pointer hover:text-vellum hover:border-gold-dim/40 focus:outline-none focus:border-gold-mid/60 focus:ring-1 focus:ring-gold-mid/20 transition-colors"
      :aria-label="directionLabel"
      :title="directionLabel"
      @click="onDirectionToggle"
    >{{ sortDir === 'asc' ? '↑' : '↓' }}</button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import { computed } from 'vue'
import AppSelect from '@/shared/ui/AppSelect.vue'

// Sort control for the reference browsers. The clickable table headers only exist in list
// view, and they hide their own columns below sm, so grid users and phone users had no way
// to reach half the sort keys (Items never exposed cost or weight at all). This lives in the
// filter bar, where it is visible in every view mode and at every width.

interface SortOption { value: T, label: string }

const props = defineProps<{
  sortBy: T
  sortDir: 'asc' | 'desc'
  options: readonly SortOption[]
  /** Width class for the select, so each browser can size it to its longest label. */
  selectClass?: string
}>()

const emit = defineEmits<{
  'update:sortBy': [value: T]
  'update:sortDir': [value: 'asc' | 'desc']
  change: []
}>()

const directionLabel = computed(() =>
  props.sortDir === 'asc'
    ? 'Sorted ascending, activate to sort descending'
    : 'Sorted descending, activate to sort ascending',
)

function onFieldChange(value: unknown) {
  const next = value as T
  if (next === props.sortBy) return
  emit('update:sortBy', next)
  // Same rule the table headers follow: a newly picked field starts ascending.
  if (props.sortDir !== 'asc') emit('update:sortDir', 'asc')
  emit('change')
}

function onDirectionToggle() {
  emit('update:sortDir', props.sortDir === 'asc' ? 'desc' : 'asc')
  emit('change')
}
</script>
