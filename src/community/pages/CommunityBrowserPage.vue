<template>
  <div class="app-container py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-2 gap-4 flex-wrap">
      <h1 class="heading-display text-3xl font-semibold">Community</h1>
      <div class="flex items-center gap-3">
        <p class="text-muted text-sm">{{ filtered.length }} results</p>
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
    <p class="text-sm text-mist mb-6">Homebrew races, classes &amp; subclasses shared by other players — sorted by primary ability.</p>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6 items-center">
      <input
        v-model="query"
        type="search"
        aria-label="Search community content"
        placeholder="Search by name or author…"
        class="input-base max-w-xs"
      />
      <AppSelect v-model="kindFilter" class="max-w-[150px]">
        <option value="">All content</option>
        <option value="race">Races</option>
        <option value="class">Classes</option>
        <option value="subclass">Subclasses</option>
      </AppSelect>
      <AppSelect v-model="statFilter" class="max-w-[160px]">
        <option value="">Any primary stat</option>
        <option v-for="ab in ABILITY_ORDER" :key="ab" :value="ab">{{ ABILITY_LABELS[ab] }}</option>
      </AppSelect>
      <AppSelect v-model="editionFilter" class="max-w-[130px]">
        <option value="">Any edition</option>
        <option value="2014">2014</option>
        <option value="2024">2024</option>
      </AppSelect>
      <AppSelect v-model="sortBy" class="max-w-[170px]">
        <option value="stat">Sort: primary stat</option>
        <option value="name">Sort: name</option>
        <option value="recent">Sort: recently updated</option>
      </AppSelect>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="isPending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      aria-label="Loading community content…"
      aria-busy="true"
    >
      <div v-for="i in 6" :key="i" class="card p-4 flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <div class="h-4 w-3/4 skeleton rounded-sm" />
          <div class="h-5 w-10 skeleton rounded-sm" />
        </div>
        <div class="h-3 w-1/2 skeleton rounded-sm mt-1" />
      </div>
    </div>
    <div v-else-if="isError" class="text-center py-16 text-danger">Failed to load community content.</div>
    <div v-else-if="filtered.length === 0" class="text-center py-16 text-muted">
      <p v-if="(items ?? []).length === 0">No shared content yet. Be the first — publish a custom race from your profile!</p>
      <p v-else>Nothing matches your filters.</p>
    </div>

    <!-- Grid -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <button
        v-for="it in filtered"
        :key="it.id"
        type="button"
        class="card-hover p-4 flex flex-col gap-2 text-left w-full"
        :style="{ 'border-left': `3px solid ${statColor(it.primaryStat)}` }"
        @click="openDetail(it)"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="font-medium text-vellum leading-tight">{{ it.name }}</span>
          <span class="text-2xs shrink-0 font-mono px-1.5 py-0.5 rounded border border-arcane-base/30 bg-arcane-deep/15 text-arcane-pale">
            {{ statLabel(it.primaryStat) }}
          </span>
        </div>
        <p class="text-xs text-mist">{{ subtitle(it) }}</p>
        <div class="flex items-center justify-between gap-2 mt-0.5">
          <span class="text-2xs font-heading tracking-wide uppercase" :class="kindAccentClass(it.kind)">
            {{ kindLabel(it.kind) }} · {{ it.edition }}
          </span>
          <span v-if="it.authorName" class="text-2xs font-body text-mist/70 truncate max-w-[45%]">by {{ it.authorName }}</span>
        </div>
      </button>
    </div>

    <!-- List view -->
    <div v-else class="overflow-hidden rounded-lg border border-shadow">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm table-fixed">
          <thead>
            <tr class="bg-depths border-b-2 border-dusk/60">
              <th class="text-left py-3 px-4 w-[38%] text-2xs font-heading tracking-[0.08em] uppercase text-mist">Name</th>
              <th class="text-left py-3 px-4 w-[14%] text-2xs font-heading tracking-[0.08em] uppercase text-mist">Type</th>
              <th class="text-center py-3 px-4 w-[14%] text-2xs font-heading tracking-[0.08em] uppercase text-mist">Primary</th>
              <th class="text-center py-3 px-4 w-[12%] hidden sm:table-cell text-2xs font-heading tracking-[0.08em] uppercase text-mist">Edition</th>
              <th class="text-left py-3 px-4 w-[22%] hidden md:table-cell text-2xs font-heading tracking-[0.08em] uppercase text-mist">Author</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(it, i) in filtered"
              :key="it.id"
              class="border-b border-shadow/40 transition-colors duration-100 hover:bg-arcane-deep/20 cursor-pointer"
              :class="i % 2 === 0 ? 'bg-abyss' : 'bg-depths/50'"
              @click="openDetail(it)"
            >
              <td class="py-3 px-4 font-body text-stone">{{ it.name }}</td>
              <td class="py-3 px-4 font-body text-mist">{{ kindLabel(it.kind) }}</td>
              <td class="py-3 px-4 text-center">
                <span class="text-2xs font-mono px-1.5 py-0.5 rounded border border-arcane-base/30 bg-arcane-deep/15 text-arcane-pale">{{ statLabel(it.primaryStat) }}</span>
              </td>
              <td class="py-3 px-4 text-center font-body text-mist hidden sm:table-cell">{{ it.edition }}</td>
              <td class="py-3 px-4 font-body text-mist hidden md:table-cell truncate">{{ it.authorName ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <CommunityDetailModal :show="showDetail" :item="selected" @close="showDetail = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { LayoutGridIcon, ListIcon } from 'lucide-vue-next'
import { useCustomContentStore } from '@/custom-content/store'
import type { CommunityItem, CustomRace, CustomClass, CustomSubclass } from '@/shared/types/customContent'
import AppSelect from '@/shared/ui/AppSelect.vue'
import CommunityDetailModal from '@/community/components/CommunityDetailModal.vue'

const customContent = useCustomContentStore()

const viewMode = ref<'grid' | 'list'>('grid')
const query = ref('')
const kindFilter = ref<'' | 'race' | 'class' | 'subclass'>('')
const statFilter = ref('')
const editionFilter = ref('')
const sortBy = ref<'stat' | 'name' | 'recent'>('stat')

const selected = ref<CommunityItem | null>(null)
const showDetail = ref(false)

const ABILITY_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const ABILITY_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}

// Public read — works for guests too (RLS: is_public = true).
const { data: items, isPending, isError } = useQuery({
  queryKey: ['community'],
  queryFn: () => customContent.loadCommunity(),
  staleTime: 60_000,
})

function statLabel(s: string | null): string {
  return s ? (ABILITY_LABELS[s] ?? s.toUpperCase()) : '—'
}
// Canonical STR→CHA order so "sort by primary stat" reads like a character sheet, not A–Z.
function statRank(s: string | null): number {
  const i = s ? ABILITY_ORDER.indexOf(s) : -1
  return i === -1 ? 99 : i
}
function statColor(s: string | null): string {
  switch (s) {
    case 'str': return 'rgb(var(--c-blood-bright))'
    case 'dex': return 'rgb(var(--c-verdant-bright))'
    case 'con': return 'rgb(var(--c-gold-mid))'
    case 'int': return 'rgb(var(--c-arcane-base))'
    case 'wis': return 'rgb(var(--c-arcane-pale))'
    case 'cha': return 'rgb(var(--c-gold-bright))'
    default: return 'rgb(var(--c-mist))'
  }
}

function subtitle(it: CommunityItem): string {
  if (it.kind === 'race') {
    const r = it.data as CustomRace
    const parts = [r.size, `${r.speed} ft.`]
    if (r.darkvision) parts.push(`Darkvision ${r.darkvision} ft.`)
    return parts.join(' · ')
  }
  if (it.kind === 'subclass') {
    const sc = it.data as CustomSubclass
    return sc.parentClassName ? `Subclass · ${sc.parentClassName}` : 'Subclass'
  }
  const c = it.data as CustomClass
  return `d${c.hitDie}${c.primaryAbility ? ` · ${c.primaryAbility}` : ''}`
}

// Three-way kind badge (race / class / subclass).
const KIND_LABELS: Record<CommunityItem['kind'], string> = { race: 'Race', class: 'Class', subclass: 'Subclass' }
function kindLabel(kind: CommunityItem['kind']): string {
  return KIND_LABELS[kind]
}
function kindAccentClass(kind: CommunityItem['kind']): string {
  return kind === 'class' ? 'text-gold-dim' : 'text-arcane-pale/70'
}

const filtered = computed<CommunityItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  const list = (items.value ?? []).filter((it) => {
    if (kindFilter.value && it.kind !== kindFilter.value) return false
    if (editionFilter.value && it.edition !== editionFilter.value) return false
    if (statFilter.value && it.primaryStat !== statFilter.value) return false
    if (q && !(it.name.toLowerCase().includes(q) || (it.authorName ?? '').toLowerCase().includes(q))) return false
    return true
  })
  return [...list].sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'recent') return b.updatedAt.localeCompare(a.updatedAt)
    const r = statRank(a.primaryStat) - statRank(b.primaryStat)
    return r !== 0 ? r : a.name.localeCompare(b.name)
  })
})

function openDetail(it: CommunityItem) {
  selected.value = it
  showDetail.value = true
}
</script>
