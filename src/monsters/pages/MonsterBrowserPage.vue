<template>
  <div class="app-container py-8">
    <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <h1 class="heading-display text-3xl font-semibold">Bestiary</h1>
      <p class="text-muted text-sm">{{ filteredMonsters.length }} results</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6">
      <input
        v-model="query"
        type="search"
        aria-label="Search monsters"
        placeholder="Search monsters…"
        class="input-base max-w-xs"
        @input="currentPage = 1"
      />
      <select v-model="crFilter" class="input-base max-w-[170px]" @change="currentPage = 1">
        <option :value="null">Any challenge</option>
        <option v-for="cr in CR_OPTIONS" :key="cr.value" :value="cr.value">CR {{ cr.label }}</option>
      </select>
    </div>

    <!-- States -->
    <div
      v-if="isPending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      aria-label="Loading monsters…"
      aria-busy="true"
    >
      <div v-for="i in 12" :key="i" class="card p-4 flex flex-col gap-2">
        <div class="h-4 w-3/4 skeleton rounded-sm" />
        <div class="h-3 w-1/3 skeleton rounded-sm mt-1" />
      </div>
    </div>
    <div v-else-if="isError" class="text-center py-16 text-danger">Failed to load monsters.</div>
    <div v-else-if="filteredMonsters.length === 0" class="text-center py-16 text-muted">No monsters match your filters.</div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <button
        v-for="m in pagedMonsters"
        :key="m.index"
        type="button"
        class="card-hover p-4 flex items-center justify-between gap-2 text-left w-full"
        @click="panel.open({ kind: 'monster', index: m.index })"
      >
        <span class="font-medium text-vellum leading-tight">{{ m.name }}</span>
        <span class="text-2xs font-mono text-mist shrink-0">⛓</span>
      </button>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
      <button v-if="currentPage > 1" type="button" class="btn-ghost px-3 py-1.5 text-sm" @click="currentPage--">← Prev</button>
      <template v-for="page in paginationPages" :key="page">
        <span v-if="page === '…'" class="px-2 text-muted text-sm select-none">…</span>
        <button
          v-else
          type="button"
          class="px-3 py-1.5 text-sm rounded transition-colors"
          :class="page === currentPage ? 'bg-arcane-base/20 text-arcane-pale border border-arcane-base/40' : 'btn-ghost'"
          @click="currentPage = page as number"
        >{{ page }}</button>
      </template>
      <button v-if="currentPage < totalPages" type="button" class="btn-ghost px-3 py-1.5 text-sm" @click="currentPage++">Next →</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'

const panel = useInfoPanel()
const query = ref('')
const crFilter = ref<number | null>(null)
const currentPage = ref(1)
const PAGE_SIZE = 18

const CR_OPTIONS = [
  { value: 0, label: '0' }, { value: 0.125, label: '1/8' }, { value: 0.25, label: '1/4' }, { value: 0.5, label: '1/2' },
  ...Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
]

// Re-query the server when a CR is chosen (the list endpoint filters by challenge_rating).
const { data, isPending, isError } = useQuery({
  queryKey: computed(() => ['monsters-list', crFilter.value]),
  queryFn: () => fiveEApi.listMonsters(crFilter.value ?? undefined),
  staleTime: Infinity,
})

const filteredMonsters = computed(() => {
  const list = data.value?.results ?? []
  const q = query.value.trim().toLowerCase()
  return q ? list.filter((m) => m.name.toLowerCase().includes(q)) : list
})

const totalPages = computed(() => Math.ceil(filteredMonsters.value.length / PAGE_SIZE))

const pagedMonsters = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredMonsters.value.slice(start, start + PAGE_SIZE)
})

const paginationPages = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur === 1) return [1, 2, 3, 4, 5, '…', total] as (number | '…')[]
  const pages: (number | '…')[] = [1]
  const wStart = Math.max(2, cur - 2)
  const wEnd = Math.min(total - 1, cur + 2)
  if (wStart > 2) pages.push('…')
  for (let p = wStart; p <= wEnd; p++) pages.push(p)
  if (wEnd < total - 1) pages.push('…')
  pages.push(total)
  return pages
})
</script>
