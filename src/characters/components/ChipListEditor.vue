<template>
  <div>
    <!-- View mode: chips -->
    <div v-if="!editMode || items.length > 0" class="flex flex-wrap gap-1.5 mb-1.5">
      <span
        v-for="item in items"
        :key="item"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body"
        :class="chipClass"
      >
        {{ item }}
        <button
          v-if="editMode"
          type="button"
          class="opacity-60 hover:opacity-100 transition-opacity leading-none"
          :aria-label="`Remove ${item}`"
          @click="remove(item)"
        >×</button>
      </span>
      <span v-if="items.length === 0 && !editMode" class="text-xs font-body text-mist/50 italic">{{ emptyLabel }}</span>
    </div>

    <!-- Edit mode: input with autocomplete -->
    <div v-if="editMode" class="relative">
      <input
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        class="input-base text-xs py-1.5 w-full"
        @keydown.enter.prevent="addCurrent"
        @keydown="onKey"
        @input="onInput"
        @blur="onBlur"
        @focus="showSuggestions = true"
      />
      <!-- Suggestions dropdown -->
      <ul
        v-if="showSuggestions && filtered.length > 0"
        class="absolute z-20 top-full left-0 right-0 mt-0.5 bg-void border border-shadow rounded shadow-lg max-h-40 overflow-y-auto"
      >
        <li
          v-for="(s, i) in filtered"
          :key="s"
          class="px-3 py-1.5 text-xs font-body cursor-pointer transition-colors"
          :class="i === highlightIdx ? 'bg-gold-dim/20 text-vellum' : 'text-ash hover:bg-depths/60'"
          @mousedown.prevent="selectSuggestion(s)"
        >{{ s }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  items: string[]
  editMode: boolean
  placeholder?: string
  suggestions?: string[]
  chipClass?: string
  emptyLabel?: string
}>(), {
  placeholder: 'Add…',
  suggestions: () => [],
  chipClass: 'bg-depths border border-shadow text-ash',
  emptyLabel: 'None',
})

const emit = defineEmits<{ 'update:items': [string[]] }>()

const inputValue = ref('')
const showSuggestions = ref(false)
const highlightIdx = ref(-1)

const filtered = computed(() => {
  const q = inputValue.value.trim().toLowerCase()
  const existing = new Set(props.items.map(i => i.toLowerCase()))
  return props.suggestions
    .filter(s => !existing.has(s.toLowerCase()) && (!q || s.toLowerCase().includes(q)))
    .slice(0, 10)
})

function add(value: string) {
  const v = value.trim()
  if (!v || props.items.includes(v)) return
  emit('update:items', [...props.items, v])
  inputValue.value = ''
  highlightIdx.value = -1
}

function addCurrent() {
  if (highlightIdx.value >= 0 && filtered.value[highlightIdx.value]) {
    add(filtered.value[highlightIdx.value])
  } else {
    add(inputValue.value)
  }
}

function remove(item: string) {
  emit('update:items', props.items.filter(i => i !== item))
}

function selectSuggestion(s: string) {
  add(s)
  showSuggestions.value = false
}

function onInput() {
  showSuggestions.value = true
  highlightIdx.value = -1
}

function onKey(e: KeyboardEvent) {
  if (!showSuggestions.value || filtered.value.length === 0) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIdx.value = Math.min(highlightIdx.value + 1, filtered.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIdx.value = Math.max(highlightIdx.value - 1, -1)
  } else if (e.key === 'Escape') {
    showSuggestions.value = false
  }
}

function onBlur() {
  setTimeout(() => { showSuggestions.value = false }, 150)
}
</script>
