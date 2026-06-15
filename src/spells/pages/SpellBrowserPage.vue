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
        aria-label="Search spells"
        placeholder="Search spells…"
        class="input-base max-w-xs"
        @input="currentPage = 1"
      />
      <AppSelect v-model="levelFilter" class="max-w-[130px]" @change="currentPage = 1">
        <option value="">All levels</option>
        <option :value="0">Cantrip</option>
        <option v-for="l in 9" :key="l" :value="l">Level {{ l }}</option>
      </AppSelect>
      <AppSelect v-model="schoolFilter" class="max-w-[150px]" @change="currentPage = 1">
        <option value="">All schools</option>
        <option v-for="s in SCHOOLS" :key="s" :value="s">{{ s }}</option>
      </AppSelect>
      <AppSelect v-model="classFilter" class="max-w-[140px]" @change="currentPage = 1">
        <option value="">All classes</option>
        <option v-for="c in availableClasses" :key="c" :value="c">{{ c }}</option>
      </AppSelect>
      <AppSelect v-model="castingTimeFilter" class="max-w-[150px]" @change="currentPage = 1">
        <option value="">Any cast time</option>
        <option v-for="ct in availableCastingTimes" :key="ct" :value="ct">
          {{ labelCastingTime(ct) }}
        </option>
      </AppSelect>
    </div>

    <!-- States -->
    <!-- Skeleton — matches grid layout, shows progress count as aria-label -->
    <div
      v-if="isPending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      aria-label="Loading spells…"
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
        :style="spell.level !== -1 ? { 'border-left': `3px solid ${schoolBorderColor(spell.school.name)}` } : {}"
        @click="panel.open({ kind: 'spell', index: spell.index })"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="font-medium text-vellum leading-tight">{{ spell.name }}</span>
          <span class="badge-arcane text-xs shrink-0">
            {{ spell.level === 0 ? 'Cantrip' : spell.level && spell.level > 0 ? `Lv ${spell.level}` : '…' }}
          </span>
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
              <td class="py-3 px-4 font-body text-mist hidden sm:table-cell">
                <span class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: schoolBorderColor(spell.school.name) }" />
                  {{ spell.school.name }}
                </span>
              </td>
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
import { computed, ref } from 'vue'
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
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
const CASTING_TIMES = ['1 action', '1 bonus action', '1 reaction', '1 minute', '10 minutes', '1 hour', '8 hours', '12 hours', '24 hours'] as const
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

function schoolBorderColor(school: string): string {
  const map: Record<string, string> = {
    'Abjuration':    'rgb(var(--c-arcane-pale))',
    'Conjuration':   'rgb(var(--c-gold-mid))',
    'Divination':    'rgb(var(--c-mist))',
    'Enchantment':   'rgb(var(--c-blood-mid))',
    'Evocation':     'rgb(var(--c-blood-bright))',
    'Illusion':      'rgb(var(--c-arcane-base))',
    'Necromancy':    'rgb(var(--c-verdant-bright))',
    'Transmutation': 'rgb(var(--c-gold-dim))',
  }
  return map[school] ?? 'transparent'
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

function normalizeCastingTime(ct?: string): string {
  return (ct ?? '').replace(/,.*$/, '').trim().toLowerCase()
}

function labelCastingTime(normalized: string): string {
  return CASTING_TIME_LABELS[normalized]
    ?? (normalized.charAt(0).toUpperCase() + normalized.slice(1))
}

const { data: classList } = useQuery({
  queryKey: ['classes-all'],
  queryFn: () => fiveEApi.listClasses(),
  staleTime: Infinity,
})

const { data: spellList, isPending: isListPending, isError: isListError } = useQuery({
  queryKey: computed(() => ['spells-list', query.value, levelFilter.value, schoolFilter.value, classFilter.value]),
  queryFn: async () => {
    const list = await fiveEApi.listSpells({
      name: query.value || undefined,
      level: levelFilter.value === '' ? undefined : Number(levelFilter.value),
      school: schoolFilter.value || undefined,
      class: classFilter.value || undefined,
    })
    return list
  },
  staleTime: Infinity,
})

const spellRefs = computed(() => spellList.value?.results ?? [])

const requiresDetailsAll = computed(() => sortBy.value !== 'name' || Boolean(castingTimeFilter.value))
const { data: allSpellDetails, isPending: isAllDetailsPending, isError: isAllDetailsError } = useQuery({
  queryKey: computed(() => ['spells-details', spellRefs.value.map(spell => spell.index).join(',')]),
  queryFn: async () => Promise.all(spellRefs.value.map(spell => fiveEApi.getSpell(spell.index))),
  enabled: computed(() => requiresDetailsAll.value && spellRefs.value.length > 0),
  staleTime: Infinity,
})

const allSpellDetailMap = computed(() => new Map(allSpellDetails.value?.map(spell => [spell.index, spell]) ?? []))

const availableClasses = computed(() => {
  return [...(classList.value?.results ?? [])]
    .map(c => c.name)
    .sort((a, b) => a.localeCompare(b))
})

const availableCastingTimes = computed(() => [...CASTING_TIMES])

const filteredSpells = computed(() => {
  let spells = [...spellRefs.value]
  if (castingTimeFilter.value) {
    if (!allSpellDetails?.value) return []
    spells = spells.filter(spell => {
      const detail = allSpellDetailMap.value.get(spell.index)
      return detail && normalizeCastingTime(detail.casting_time) === castingTimeFilter.value
    })
  }

  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...spells].sort((a, b) => {
    if (sortBy.value === 'name') return dir * a.name.localeCompare(b.name)
    const aDetail = allSpellDetailMap.value.get(a.index)
    const bDetail = allSpellDetailMap.value.get(b.index)
    if (sortBy.value === 'level') {
      return dir * ((aDetail?.level ?? 0) - (bDetail?.level ?? 0))
    }
    if (sortBy.value === 'school') {
      return dir * ((aDetail?.school.name ?? '').localeCompare(bDetail?.school.name ?? ''))
    }
    return 0
  })
})

const totalPages = computed(() => Math.ceil(filteredSpells.value.length / PAGE_SIZE))

const pagedSpellRefs = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredSpells.value.slice(start, start + PAGE_SIZE)
})

const { data: pageSpellDetails } = useQuery({
  queryKey: computed(() => ['spell-page-details', pagedSpellRefs.value.map(spell => spell.index).join(',')]),
  queryFn: async () => Promise.all(pagedSpellRefs.value.map(spell => fiveEApi.getSpell(spell.index))),
  enabled: computed(() => pagedSpellRefs.value.length > 0),
  staleTime: Infinity,
  placeholderData: keepPreviousData,
})

const pageSpellDetailMap = computed(() => new Map(pageSpellDetails.value?.map(spell => [spell.index, spell]) ?? []))

const pagedSpells = computed(() => {
  return pagedSpellRefs.value.map(spell => pageSpellDetailMap.value.get(spell.index) ?? {
    index: spell.index,
    name: spell.name,
    desc: [],
    higher_level: [],
    range: '',
    components: [],
    material: '',
    ritual: false,
    duration: '',
    concentration: false,
    casting_time: '',
    level: -1,
    attack_type: undefined,
    damage: undefined,
    school: { index: '', name: 'Unknown', url: '' },
    classes: [],
    subclasses: [],
    url: '',
  } as ApiSpell)
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

const isPending = computed(() => isListPending.value || (requiresDetailsAll.value && isAllDetailsPending.value))
const isError = computed(() => isListError.value || !!isAllDetailsError.value)
</script>
