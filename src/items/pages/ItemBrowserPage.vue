<template>
  <div class="app-container py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="heading-display text-3xl font-semibold">Items & Equipment</h1>
      <div class="flex items-center gap-3">
        <p class="text-muted text-sm">{{ filteredItems.length }} results</p>
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
        v-model="filters.query"
        type="search"
        aria-label="Search items"
        placeholder="Search items…"
        class="input-base max-w-xs"
        @input="currentPage = 1"
      />
      <AppSelect v-model="filters.category" class="max-w-[180px]" @change="currentPage = 1">
        <option :value="null">All categories</option>
        <option value="weapon">Weapons</option>
        <option value="armor">Armor</option>
        <option value="adventuring-gear">Adventuring Gear</option>
        <option value="tools">Tools</option>
        <option value="magic-item">Magic Items</option>
      </AppSelect>
      <AppSelect v-model="filters.rarity" class="max-w-[150px]" @change="currentPage = 1">
        <option :value="null">Any rarity</option>
        <option v-for="r in RARITIES" :key="r" :value="r">{{ r }}</option>
      </AppSelect>
      <AppSelect v-model="attunementFilter" class="max-w-[180px]" @change="currentPage = 1">
        <option value="">Any attunement</option>
        <option value="yes">Requires Attunement</option>
        <option value="no">No Attunement</option>
      </AppSelect>
    </div>

    <!-- States -->
    <!-- Skeleton, matches grid layout -->
    <div
      v-if="isPending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      aria-label="Loading items…"
      aria-busy="true"
    >
      <div v-for="i in 12" :key="i" class="card p-4 flex flex-col gap-2">
        <div class="h-4 w-3/4 skeleton rounded-sm" />
        <div class="flex gap-1.5 mt-1">
          <div class="h-4 w-16 skeleton rounded-sm" />
          <div class="h-4 w-12 skeleton rounded-sm" />
        </div>
        <div class="h-3 w-1/3 skeleton rounded-sm mt-1" />
      </div>
    </div>
    <div v-else-if="isError" class="text-center py-16 text-danger">Failed to load items.</div>
    <div v-else-if="filteredItems.length === 0" class="text-center py-16 text-muted">No items match your filters.</div>

    <!-- Grid -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <button
        v-for="item in pagedItems"
        :key="item.index"
        type="button"
        class="card-hover p-4 flex flex-col text-left w-full"
        :style="{ 'border-left': `3px solid ${categoryBorderColor(item.category)}` }"
        @click="panel.open({ kind: 'item', index: item.index })"
      >
        <!-- Name + rarity/category badge -->
        <div class="flex items-start justify-between gap-2">
          <span class="font-medium text-vellum leading-tight">{{ item.name }}</span>
          <span v-if="item.rarity" :class="rarityBadgeClass(item.rarity)" class="text-2xs shrink-0">{{ item.rarity }}</span>
          <span v-else class="badge badge-gold text-2xs shrink-0">{{ formatCategory(item.category) }}</span>
        </div>
        <!-- Sub-category -->
        <p v-if="item.subCategory" class="text-2xs text-mist mt-0.5">{{ item.subCategory }}</p>

        <!-- Stat block, weapon -->
        <template v-if="item.category === 'weapon' && item.stats">
          <div class="mt-1.5 flex items-baseline gap-1.5 text-xs">
            <span class="font-mono text-gold-mid font-semibold">{{ weaponDamageStr(item.stats) }}</span>
            <span class="text-mist">{{ item.stats.damageType?.toLowerCase() }}</span>
          </div>
          <div v-if="item.stats.properties?.length" class="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
            <span
              v-for="prop in item.stats.properties"
              :key="prop"
              class="text-2xs text-mist/60"
            >{{ prop }}</span>
          </div>
        </template>

        <!-- Stat block, armor -->
        <template v-else-if="item.category === 'armor' && item.stats">
          <div class="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
            <span class="font-mono text-gold-mid font-semibold">AC {{ item.stats.acBase }}</span>
            <span v-if="item.stats.strMinimum" class="text-mist">
              Str {{ item.stats.strMinimum }}
            </span>
            <span v-if="item.stats.stealthDisadvantage" class="text-blood-bright text-2xs">
              stealth disadv.
            </span>
          </div>
        </template>

        <!-- Magic item: attunement tag -->
        <template v-else-if="item.isMagic && item.requiresAttunement">
          <span class="badge text-2xs bg-arcane-deep/30 text-arcane-pale border border-arcane-base/20 mt-1.5 w-fit">
            Attunement
          </span>
        </template>

        <!-- Footer: cost + weight -->
        <div v-if="item.cost || item.weight" class="flex gap-3 mt-auto pt-2 text-2xs text-mist/50">
          <span v-if="item.cost">{{ item.cost.quantity }} {{ item.cost.unit }}</span>
          <span v-if="item.weight">{{ item.weight }} lb</span>
        </div>
      </button>
    </div>

    <!-- List / Table -->
    <div v-else class="overflow-hidden rounded-lg border border-shadow">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm table-fixed">
          <thead>
            <tr class="bg-depths border-b-2 border-dusk/60">
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 cursor-pointer select-none w-[50%]" @click="toggleSort('name')">
                <span class="flex items-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  Item <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('name') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 cursor-pointer select-none hidden sm:table-cell w-[20%]" @click="toggleSort('category')">
                <span class="flex items-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  Type <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('category') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 cursor-pointer select-none hidden sm:table-cell w-[15%]" @click="toggleSort('rarity')">
                <span class="flex items-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  Rarity <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('rarity') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-center py-3 px-4 hidden md:table-cell w-[15%]">
                <span class="text-2xs font-heading tracking-[0.08em] uppercase text-mist">Attunement</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, i) in pagedItems"
              :key="item.index"
              class="border-b border-shadow/40 transition-colors duration-100 hover:bg-arcane-deep/20 cursor-pointer"
              :class="i % 2 === 0 ? 'bg-abyss' : 'bg-depths/50'"
              @click="panel.open({ kind: 'item', index: item.index })"
            >
              <td class="py-3 px-4 font-body text-stone">{{ item.name }}</td>
              <td class="py-3 px-4 font-body text-mist capitalize hidden sm:table-cell">
                {{ item.subCategory || formatCategory(item.category) }}
              </td>
              <td class="py-3 px-4 whitespace-nowrap hidden sm:table-cell">
                <span v-if="item.rarity" :class="rarityBadgeClass(item.rarity)" class="text-2xs">{{ item.rarity }}</span>
                <span v-else class="text-mist text-xs">-</span>
              </td>
              <td class="py-3 px-4 text-center hidden md:table-cell">
                <span v-if="item.isMagic" class="font-body text-xs" :class="item.requiresAttunement ? 'text-arcane-bright' : 'text-mist'">
                  {{ item.requiresAttunement ? 'Yes' : 'No' }}
                </span>
                <span v-else class="text-mist text-xs">-</span>
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
import type { ItemSearchFilterState, ItemRarity } from '@/shared/types/items'
import { DEFAULT_ITEM_FILTERS } from '@/shared/types/items'
import { loadItemIndex, type SlimItem } from '@/shared/data/srdIndex'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'

const panel = useInfoPanel()
const viewMode = ref<'grid' | 'list'>('grid')
const filters = ref<ItemSearchFilterState>({ ...DEFAULT_ITEM_FILTERS })
const attunementFilter = ref<'yes' | 'no' | ''>('')
const currentPage = ref(1)
const PAGE_SIZE = 15

const RARITIES: ItemRarity[] = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact']
const RARITY_ORDER: Record<string, number> = {
  Common: 0, Uncommon: 1, Rare: 2, 'Very Rare': 3, Legendary: 4, Artifact: 5, Varies: 6, Unknown: 7,
}

// Slim, prebaked item index: every equipment + magic item already normalized, with a
// compact weapon/armor stat block for grid cards. Loaded as a single lazy chunk,
// replacing ~600 rate-limited per-item detail fetches so filtering, sorting and card
// stats are instant and work offline. Full detail loads on click via the API.
const { data: itemIndex, isPending, isError } = useQuery({
  queryKey: ['item-index'],
  queryFn: loadItemIndex,
  staleTime: Infinity,
})

const allItems = computed<SlimItem[]>(() => itemIndex.value ?? [])

const filteredItems = computed(() => {
  let items = allItems.value

  if (filters.value.query) {
    const q = filters.value.query.toLowerCase()
    items = items.filter(i => i.name.toLowerCase().includes(q))
  }
  if (filters.value.category) {
    items = items.filter(i => i.category === filters.value.category)
  }
  if (filters.value.rarity) {
    items = items.filter(i => i.rarity === filters.value.rarity)
  }
  if (attunementFilter.value === 'yes') {
    items = items.filter(i => i.requiresAttunement === true)
  } else if (attunementFilter.value === 'no') {
    items = items.filter(i => i.isMagic && i.requiresAttunement === false)
  }

  const dir = filters.value.sortDir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    if (filters.value.sortBy === 'name') return dir * a.name.localeCompare(b.name)
    if (filters.value.sortBy === 'category') return dir * formatCategory(a.category).localeCompare(formatCategory(b.category))
    if (filters.value.sortBy === 'cost') {
      const ac = a.cost?.quantity ?? 0
      const bc = b.cost?.quantity ?? 0
      return dir * (ac - bc)
    }
    if (filters.value.sortBy === 'weight') {
      const aw = a.weight ?? 0
      const bw = b.weight ?? 0
      return dir * (aw - bw)
    }
    if (filters.value.sortBy === 'rarity') {
      const ar = RARITY_ORDER[a.rarity ?? ''] ?? -1
      const br = RARITY_ORDER[b.rarity ?? ''] ?? -1
      return dir * (ar - br)
    }
    return 0
  })
})

type SortKey = typeof filters.value.sortBy

function toggleSort(key: SortKey) {
  if (filters.value.sortBy === key) {
    filters.value.sortDir = filters.value.sortDir === 'asc' ? 'desc' : 'asc'
  } else {
    filters.value.sortBy = key
    filters.value.sortDir = 'asc'
  }
  currentPage.value = 1
}

function sortIndicator(key: SortKey): string {
  if (filters.value.sortBy !== key) return '↕'
  return filters.value.sortDir === 'asc' ? '↑' : '↓'
}

function formatCategory(cat: string): string {
  return cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function categoryBorderColor(category: string): string {
  if (category === 'weapon')          return 'rgb(var(--c-gold-mid))'
  if (category === 'armor')           return 'rgb(var(--c-stone))'
  if (category === 'adventuring-gear') return 'rgb(var(--c-verdant-bright))'
  if (category === 'tools')           return 'rgb(var(--c-verdant-mid))'
  if (category === 'magic-item')      return 'rgb(var(--c-arcane-mid))'
  return 'transparent'
}

function rarityBadgeClass(rarity: string): string {
  switch (rarity) {
    case 'Common':    return 'badge bg-shadow/60 text-ash border border-shadow'
    case 'Uncommon':  return 'badge badge-verdant'
    case 'Rare':      return 'badge bg-info/10 text-info border border-info/30'
    case 'Very Rare': return 'badge badge-arcane'
    case 'Legendary': return 'badge badge-gold'
    case 'Artifact':  return 'badge badge-blood'
    default:          return 'badge bg-shadow/60 text-ash border border-shadow'
  }
}

const totalPages = computed(() => Math.ceil(filteredItems.value.length / PAGE_SIZE))

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredItems.value.slice(start, start + PAGE_SIZE)
})

function weaponDamageStr(stats: SlimItem['stats']): string {
  if (!stats?.damageDice) return '-'
  return stats.twoHandedDamageDice ? `${stats.damageDice} / ${stats.twoHandedDamageDice}` : stats.damageDice
}

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
