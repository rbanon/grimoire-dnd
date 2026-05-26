<template>
  <div class="app-container py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="heading-display text-3xl font-semibold">Spells</h1>
      <div class="flex items-center gap-3">
        <p class="text-muted text-sm">{{ filteredSpells.length }} results</p>
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
    <div class="flex flex-wrap gap-3 mb-6">
      <input
        v-model="query"
        type="search"
        placeholder="Search spells…"
        class="input-base max-w-xs"
        @input="currentPage = 1"
      />
      <select v-model="levelFilter" class="input-base max-w-[130px]" @change="currentPage = 1">
        <option value="">All levels</option>
        <option :value="0">Cantrip</option>
        <option v-for="l in 9" :key="l" :value="l">Level {{ l }}</option>
      </select>
      <select v-model="schoolFilter" class="input-base max-w-[150px]" @change="currentPage = 1">
        <option value="">All schools</option>
        <option v-for="s in SCHOOLS" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="classFilter" class="input-base max-w-[140px]" @change="currentPage = 1">
        <option value="">All classes</option>
        <option v-for="c in availableClasses" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="castingTimeFilter" class="input-base max-w-[150px]" @change="currentPage = 1">
        <option value="">Any cast time</option>
        <option v-for="ct in availableCastingTimes" :key="ct" :value="ct">
          {{ labelCastingTime(ct) }}
        </option>
      </select>
    </div>

    <!-- States -->
    <!-- Skeleton — matches grid layout, shows progress count as aria-label -->
    <div
      v-if="isPending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      :aria-label="`Loading spells… ${loadedCount} of ${totalCount}`"
      aria-busy="true"
    >
      <div v-for="i in 12" :key="i" class="card p-4 flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <div class="h-4 w-2/3 skeleton rounded-sm" />
          <div class="h-5 w-14 skeleton rounded-sm" />
        </div>
        <div class="h-3 w-1/2 skeleton rounded-sm" />
      </div>
    </div>
    <div v-else-if="isError" class="text-center py-16 text-danger">Failed to load spells.</div>
    <div v-else-if="filteredSpells.length === 0" class="text-center py-16 text-muted">No spells match your filters.</div>

    <!-- Grid -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <button
        v-for="spell in pagedSpells"
        :key="spell.index"
        type="button"
        class="card-hover p-4 flex flex-col gap-1 text-left w-full"
        @click="panel.open({ kind: 'spell', index: spell.index })"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="font-medium text-vellum leading-tight">{{ spell.name }}</span>
          <span class="badge-arcane text-xs shrink-0">{{ spell.level === 0 ? 'Cantrip' : `Lv ${spell.level}` }}</span>
        </div>
        <p class="text-xs text-mist">
          {{ spell.school.name }} · {{ labelCastingTime(normalizeCastingTime(spell.casting_time)) }}
        </p>
        <div v-if="spell.concentration || spell.ritual" class="flex gap-1 mt-0.5">
          <span v-if="spell.concentration" class="badge badge-gold text-2xs">Conc.</span>
          <span v-if="spell.ritual" class="badge badge-verdant text-2xs">Ritual</span>
        </div>
        <p v-if="spell.classes.length" class="text-2xs text-mist mt-0.5 truncate">
          {{ spell.classes.map(c => c.name).join(' · ') }}
        </p>
      </button>
    </div>

    <!-- List / Table -->
    <div v-else class="overflow-hidden rounded-lg border border-shadow">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm table-fixed">
          <thead>
            <tr class="bg-depths border-b-2 border-dusk/60">
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 w-auto cursor-pointer select-none" @click="toggleSort('name')">
                <span class="flex items-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  Spell <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('name') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-center py-3 px-4 w-16 cursor-pointer select-none" @click="toggleSort('level')">
                <span class="flex items-center justify-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  Lv <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('level') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 w-36 hidden sm:table-cell cursor-pointer select-none" @click="toggleSort('school')">
                <span class="flex items-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  School <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('school') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 w-36 hidden md:table-cell">
                <span class="text-2xs font-heading tracking-[0.08em] uppercase text-mist">Cast Time</span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 w-52 hidden lg:table-cell">
                <span class="text-2xs font-heading tracking-[0.08em] uppercase text-mist">Classes</span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-center py-3 px-4 w-16 hidden md:table-cell">
                <span class="text-2xs font-heading tracking-[0.08em] uppercase text-mist">Tags</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(spell, i) in pagedSpells"
              :key="spell.index"
              class="border-b border-shadow/40 transition-colors duration-100 hover:bg-arcane-deep/20 cursor-pointer"
              :class="i % 2 === 0 ? 'bg-abyss' : 'bg-depths/50'"
              @click="panel.open({ kind: 'spell', index: spell.index })"
            >
              <td class="py-3 px-4 font-body text-stone">{{ spell.name }}</td>
              <td class="py-3 px-4 text-center">
                <span class="badge-arcane text-xs">{{ spell.level === 0 ? 'C' : spell.level }}</span>
              </td>
              <td class="py-3 px-4 font-body text-mist hidden sm:table-cell">{{ spell.school.name }}</td>
              <td class="py-3 px-4 font-body text-mist hidden md:table-cell">{{ labelCastingTime(normalizeCastingTime(spell.casting_time)) }}</td>
              <td class="py-3 px-4 font-body text-mist text-xs hidden lg:table-cell truncate">
                {{ spell.classes.map(c => c.name).join(', ') }}
              </td>
              <td class="py-3 px-4 hidden md:table-cell">
                <div class="flex gap-1 justify-center">
                  <span v-if="spell.concentration" class="badge badge-gold text-2xs">C</span>
                  <span v-if="spell.ritual" class="badge badge-verdant text-2xs">R</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
      <button
        v-if="currentPage > 1"
        type="button"
        class="btn-ghost px-3 py-1.5 text-sm"
        @click="currentPage--"
      >← Prev</button>
      <template v-for="page in paginationPages" :key="page">
        <span v-if="page === '…'" class="px-2 text-muted text-sm select-none">…</span>
        <button
          v-else
          type="button"
          class="px-3 py-1.5 text-sm rounded transition-colors"
          :class="page === currentPage
            ? 'bg-arcane-base/20 text-arcane-pale border border-arcane-base/40'
            : 'btn-ghost'"
          @click="currentPage = page as number"
        >{{ page }}</button>
      </template>
      <button
        v-if="currentPage < totalPages"
        type="button"
        class="btn-ghost px-3 py-1.5 text-sm"
        @click="currentPage++"
      >Next →</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { LayoutGridIcon, ListIcon } from 'lucide-vue-next'
import { fiveEApi } from '@/shared/api/fiveE.client'
import type { ApiSpell } from '@/shared/types/api'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'

const panel = useInfoPanel()
const viewMode = ref<'grid' | 'list'>('grid')

const query = ref('')
const levelFilter = ref<number | ''>('')
const schoolFilter = ref('')
const classFilter = ref('')
const castingTimeFilter = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 15
const sortBy = ref<'name' | 'level' | 'school'>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']

const CASTING_TIME_ORDER = ['1 action', '1 bonus action', '1 reaction', '1 minute', '10 minutes', '1 hour', '8 hours', '12 hours', '24 hours']
const CASTING_TIME_LABELS: Record<string, string> = {
  '1 action':       'Action',
  '1 bonus action': 'Bonus Action',
  '1 reaction':     'Reaction',
  '1 minute':       '1 Minute',
  '10 minutes':     '10 Minutes',
  '1 hour':         '1 Hour',
  '8 hours':        '8 Hours',
  '12 hours':       '12 Hours',
  '24 hours':       '24 Hours',
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

function normalizeCastingTime(ct: string): string {
  return ct.replace(/,.*$/, '').trim().toLowerCase()
}

function labelCastingTime(normalized: string): string {
  return CASTING_TIME_LABELS[normalized]
    ?? (normalized.charAt(0).toUpperCase() + normalized.slice(1))
}

const totalCount = ref(0)
const loadedCount = ref(0)

const { data: spellList, isPending, isError } = useQuery({
  queryKey: ['spells-all'],
  queryFn: async () => {
    const list = await fiveEApi.listSpells()
    totalCount.value = list.results.length
    loadedCount.value = 0
    const details = await Promise.allSettled(
      list.results.map(r =>
        fiveEApi.getSpell(r.index).then(s => { loadedCount.value++; return s }),
      ),
    )
    return details
      .filter((r): r is PromiseFulfilledResult<ApiSpell> => r.status === 'fulfilled')
      .map(r => r.value)
  },
  staleTime: Infinity,
})

const availableClasses = computed(() => {
  const seen = new Set<string>()
  for (const s of spellList.value ?? []) {
    for (const c of s.classes) seen.add(c.name)
  }
  return [...seen].sort()
})

const availableCastingTimes = computed(() => {
  const seen = new Set<string>()
  for (const s of spellList.value ?? []) seen.add(normalizeCastingTime(s.casting_time))
  return [...seen].sort((a, b) => {
    const ai = CASTING_TIME_ORDER.indexOf(a)
    const bi = CASTING_TIME_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
})

const filteredSpells = computed(() => {
  let spells = spellList.value ?? []
  if (query.value) {
    const q = query.value.toLowerCase()
    spells = spells.filter(s => s.name.toLowerCase().includes(q))
  }
  if (levelFilter.value !== '') {
    spells = spells.filter(s => s.level === Number(levelFilter.value))
  }
  if (schoolFilter.value) {
    spells = spells.filter(s => s.school.name === schoolFilter.value)
  }
  if (classFilter.value) {
    spells = spells.filter(s => s.classes.some(c => c.name === classFilter.value))
  }
  if (castingTimeFilter.value) {
    spells = spells.filter(s => normalizeCastingTime(s.casting_time) === castingTimeFilter.value)
  }
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...spells].sort((a, b) => {
    if (sortBy.value === 'name')   return dir * a.name.localeCompare(b.name)
    if (sortBy.value === 'level')  return dir * (a.level - b.level)
    if (sortBy.value === 'school') return dir * a.school.name.localeCompare(b.school.name)
    return 0
  })
})

const totalPages = computed(() => Math.ceil(filteredSpells.value.length / PAGE_SIZE))

const pagedSpells = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredSpells.value.slice(start, start + PAGE_SIZE)
})

const paginationPages = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur === 1) {
    return [1, 2, 3, 4, 5, '…', total] as (number | '…')[]
  }
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
