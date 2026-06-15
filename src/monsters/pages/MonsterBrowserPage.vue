<template>
  <div class="app-container py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <h1 class="heading-display text-3xl font-semibold">Bestiary</h1>
      <div class="flex items-center gap-3">
        <p class="text-muted text-sm">{{ filteredMonsters.length }} results</p>
        <div class="flex items-center gap-1 p-0.5 rounded border border-shadow bg-depths/40">
          <button
            type="button"
            class="p-1.5 rounded transition-colors"
            :class="viewMode === 'grid' ? 'bg-arcane-base/20 text-arcane-pale' : 'text-stone hover:text-vellum'"
            aria-label="Grid view"
            @click="viewMode = 'grid'"
          ><LayoutGridIcon :size="15" /></button>
          <button
            type="button"
            class="p-1.5 rounded transition-colors"
            :class="viewMode === 'list' ? 'bg-arcane-base/20 text-arcane-pale' : 'text-stone hover:text-vellum'"
            aria-label="List view"
            @click="viewMode = 'list'"
          ><ListIcon :size="15" /></button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6 items-center">
      <input
        v-model="query"
        type="search"
        aria-label="Search monsters"
        placeholder="Search monsters…"
        class="input-base max-w-xs"
        @input="currentPage = 1"
      />
      <AppSelect v-model="crFilter" class="max-w-[170px]" @change="currentPage = 1">
        <option :value="null">Any challenge</option>
        <option v-for="cr in CR_OPTIONS" :key="cr.value" :value="cr.value">CR {{ cr.label }}</option>
      </AppSelect>
      <AppSelect
        v-model="typeFilter"
        class="max-w-[170px]"
        :disabled="isLoadingDetails"
        @change="currentPage = 1"
      >
        <option value="">Any type</option>
        <option v-for="t in MONSTER_TYPES" :key="t" :value="t">{{ t }}</option>
      </AppSelect>
      <AppSelect
        v-model="sizeFilter"
        class="max-w-[150px]"
        :disabled="isLoadingDetails"
        @change="currentPage = 1"
      >
        <option value="">Any size</option>
        <option v-for="s in MONSTER_SIZES" :key="s" :value="s">{{ s }}</option>
      </AppSelect>
      <div v-if="isLoadingDetails" class="flex items-center gap-1.5 text-xs text-mist">
        <span class="w-3 h-3 border border-mist border-t-transparent rounded-full animate-spin shrink-0" />
        Loading details…
      </div>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="isListPending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      aria-label="Loading monsters…"
      aria-busy="true"
    >
      <div v-for="i in 12" :key="i" class="card p-4 flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <div class="h-4 w-3/4 skeleton rounded-sm" />
          <div class="h-5 w-10 skeleton rounded-sm" />
        </div>
        <div class="h-3 w-1/2 skeleton rounded-sm mt-1" />
      </div>
    </div>
    <div v-else-if="isListError" class="text-center py-16 text-danger">Failed to load monsters.</div>
    <div v-else-if="filteredMonsters.length === 0" class="text-center py-16 text-muted">No monsters match your filters.</div>

    <!-- Grid -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <button
        v-for="m in pagedMonsters"
        :key="m.index"
        type="button"
        class="card-hover p-4 flex flex-col gap-1 text-left w-full"
        :style="detail(m.index) ? { 'border-left': `3px solid ${typeBorderColor(detail(m.index)!.type)}` } : {}"
        @click="panel.open({ kind: 'monster', index: m.index })"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="font-medium text-vellum leading-tight">{{ m.name }}</span>
          <span v-if="detail(m.index)" :class="crBadgeClass(detail(m.index)!.challenge_rating)" class="text-2xs shrink-0 font-mono">
            CR {{ formatCR(detail(m.index)!.challenge_rating) }}
          </span>
        </div>
        <p v-if="detail(m.index)" class="text-xs text-mist mt-0.5">
          {{ detail(m.index)!.size }} · {{ capitalize(detail(m.index)!.type) }}
          <span v-if="detail(m.index)!.subtype">({{ detail(m.index)!.subtype }})</span>
        </p>
      </button>
    </div>

    <!-- List view -->
    <div v-else class="overflow-hidden rounded-lg border border-shadow">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm table-fixed">
          <thead>
            <tr class="bg-depths border-b-2 border-dusk/60">
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 w-[50%] cursor-pointer select-none" @click="toggleSort('name')">
                <span class="flex items-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  Name <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('name') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-center py-3 px-4 w-[10%] cursor-pointer select-none" @click="toggleSort('cr')">
                <span class="flex items-center justify-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  CR <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('cr') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 w-[20%] hidden sm:table-cell cursor-pointer select-none" @click="toggleSort('type')">
                <span class="flex items-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  Type <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('type') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 w-[20%] hidden md:table-cell">
                <span class="text-2xs font-heading tracking-[0.08em] uppercase text-mist">Size</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(m, i) in pagedMonsters"
              :key="m.index"
              class="border-b border-shadow/40 transition-colors duration-100 hover:bg-arcane-deep/20 cursor-pointer"
              :class="i % 2 === 0 ? 'bg-abyss' : 'bg-depths/50'"
              @click="panel.open({ kind: 'monster', index: m.index })"
            >
              <td class="py-3 px-4 font-body text-stone">{{ m.name }}</td>
              <td class="py-3 px-4 text-center">
                <span v-if="detail(m.index)" :class="crBadgeClass(detail(m.index)!.challenge_rating)" class="text-2xs font-mono">
                  {{ formatCR(detail(m.index)!.challenge_rating) }}
                </span>
                <span v-else class="text-mist/30 text-xs">…</span>
              </td>
              <td class="py-3 px-4 font-body text-mist hidden sm:table-cell">
                <span v-if="detail(m.index)">{{ capitalize(detail(m.index)!.type) }}</span>
                <span v-else class="text-mist/30 text-xs">…</span>
              </td>
              <td class="py-3 px-4 font-body text-mist hidden md:table-cell">
                <span v-if="detail(m.index)">{{ detail(m.index)!.size }}</span>
                <span v-else class="text-mist/30 text-xs">…</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
import { LayoutGridIcon, ListIcon } from 'lucide-vue-next'
import { fiveEApi } from '@/shared/api/fiveE.client'
import type { ApiMonster } from '@/shared/types/api'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'

const panel = useInfoPanel()
const viewMode = ref<'grid' | 'list'>('grid')
const query = ref('')
const crFilter = ref<number | null>(null)
const typeFilter = ref('')
const sizeFilter = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 18

const sortBy = ref<'name' | 'cr' | 'type'>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

const MONSTER_TYPES = [
  'Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon',
  'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid',
  'Monstrosity', 'Ooze', 'Plant', 'Undead',
]

const MONSTER_SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']

const CR_OPTIONS = [
  { value: 0, label: '0' },
  { value: 0.125, label: '1/8' },
  { value: 0.25, label: '1/4' },
  { value: 0.5, label: '1/2' },
  ...Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
]

// ── Data fetching ────────────────────────────────────────────────────────────

const { data: listData, isPending: isListPending, isError: isListError } = useQuery({
  queryKey: ['monsters-list'],
  queryFn: () => fiveEApi.listMonsters(),
  staleTime: Infinity,
})

const monsterRefs = computed(() => listData.value?.results ?? [])

// Fetch all monster details in the background. These are cached by TanStack Query
// (staleTime: Infinity) and by the PWA service worker (30 days), so this only
// runs once per session/install. Enables CR, type, size filtering and card details.
const { data: allDetails, isPending: isLoadingDetails } = useQuery({
  queryKey: ['monsters-all-details'],
  queryFn: () => Promise.all(monsterRefs.value.map(m => fiveEApi.getMonster(m.index))),
  enabled: computed(() => monsterRefs.value.length > 0),
  staleTime: Infinity,
})

const detailMap = computed(() => new Map(allDetails.value?.map(m => [m.index, m]) ?? []))

function detail(index: string): ApiMonster | undefined {
  return detailMap.value.get(index)
}

// ── Filtering & sorting ──────────────────────────────────────────────────────

const filteredMonsters = computed(() => {
  const q = query.value.trim().toLowerCase()

  let list = monsterRefs.value.filter(m => {
    if (q && !m.name.toLowerCase().includes(q)) return false
    const d = detailMap.value.get(m.index)
    if (d) {
      if (crFilter.value !== null && d.challenge_rating !== crFilter.value) return false
      if (typeFilter.value && d.type.toLowerCase() !== typeFilter.value.toLowerCase()) return false
      if (sizeFilter.value && d.size.toLowerCase() !== sizeFilter.value.toLowerCase()) return false
    }
    return true
  })

  if (sortBy.value !== 'name' || sortDir.value !== 'asc') {
    const dir = sortDir.value === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      if (sortBy.value === 'cr') {
        const aCR = detailMap.value.get(a.index)?.challenge_rating ?? -1
        const bCR = detailMap.value.get(b.index)?.challenge_rating ?? -1
        return dir * (aCR - bCR)
      }
      if (sortBy.value === 'type') {
        const aType = detailMap.value.get(a.index)?.type ?? ''
        const bType = detailMap.value.get(b.index)?.type ?? ''
        return dir * aType.localeCompare(bType)
      }
      return dir * a.name.localeCompare(b.name)
    })
  }

  return list
})

const totalPages = computed(() => Math.ceil(filteredMonsters.value.length / PAGE_SIZE))

const pagedMonsters = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredMonsters.value.slice(start, start + PAGE_SIZE)
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCR(cr: number): string {
  if (cr === 0.125) return '1/8'
  if (cr === 0.25) return '1/4'
  if (cr === 0.5) return '1/2'
  return String(cr)
}


function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function crBadgeClass(cr: number): string {
  if (cr <= 2)  return 'badge badge-verdant'
  if (cr <= 7)  return 'badge badge-gold'
  if (cr <= 12) return 'badge bg-blood-deep/40 text-blood-bright border border-blood-base/30'
  return 'badge bg-blood-deep/60 text-blood-bright border border-blood-base/50'
}

function typeBorderColor(type: string): string {
  const t = type.toLowerCase()
  if (t === 'aberration')  return 'rgb(var(--c-arcane-pale))'
  if (t === 'beast')       return 'rgb(var(--c-gold-mid))'
  if (t === 'celestial')   return 'rgb(var(--c-gold-bright))'
  if (t === 'construct')   return 'rgb(var(--c-stone))'
  if (t === 'dragon')      return 'rgb(var(--c-gold-bright))'
  if (t === 'elemental')   return 'rgb(var(--c-arcane-base))'
  if (t === 'fey')         return 'rgb(var(--c-verdant-bright))'
  if (t === 'fiend')       return 'rgb(var(--c-blood-bright))'
  if (t === 'giant')       return 'rgb(var(--c-stone))'
  if (t === 'humanoid')    return 'rgb(var(--c-mist))'
  if (t === 'monstrosity') return 'rgb(var(--c-blood-mid))'
  if (t === 'ooze')        return 'rgb(var(--c-verdant-mid))'
  if (t === 'plant')       return 'rgb(var(--c-verdant-bright))'
  if (t === 'undead')      return 'rgb(var(--c-arcane-pale))'
  return 'transparent'
}

function toggleSort(key: typeof sortBy.value) {
  if (sortBy.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortDir.value = 'asc'
  }
  currentPage.value = 1
}

function sortIndicator(key: typeof sortBy.value): string {
  if (sortBy.value !== key) return '↕'
  return sortDir.value === 'asc' ? '↑' : '↓'
}

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
