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
    <!-- Skeleton — matches grid layout -->
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

        <!-- Stat block — weapon -->
        <template v-if="item.category === 'weapon' && equipDetail(item.index)">
          <div class="mt-1.5 flex items-baseline gap-1.5 text-xs">
            <span class="font-mono text-gold-mid font-semibold">{{ weaponDamageStr(item.index) }}</span>
            <span class="text-mist">{{ equipDetail(item.index)?.damage?.damage_type.name.toLowerCase() }}</span>
          </div>
          <div v-if="equipDetail(item.index)?.properties?.length" class="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
            <span
              v-for="prop in equipDetail(item.index)!.properties"
              :key="prop.index"
              class="text-2xs text-mist/60"
            >{{ prop.name }}</span>
          </div>
        </template>

        <!-- Stat block — armor -->
        <template v-else-if="item.category === 'armor' && equipDetail(item.index)">
          <div class="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
            <span class="font-mono text-gold-mid font-semibold">AC {{ equipDetail(item.index)?.armor_class?.base }}</span>
            <span v-if="equipDetail(item.index)?.str_minimum" class="text-mist">
              Str {{ equipDetail(item.index)!.str_minimum }}
            </span>
            <span v-if="equipDetail(item.index)?.stealth_disadvantage" class="text-blood-bright text-2xs">
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
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 cursor-pointer select-none w-auto" @click="toggleSort('name')">
                <span class="flex items-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  Item <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('name') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 cursor-pointer select-none hidden sm:table-cell w-44" @click="toggleSort('category')">
                <span class="flex items-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  Type <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('category') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-left py-3 px-4 cursor-pointer select-none hidden sm:table-cell w-36" @click="toggleSort('rarity')">
                <span class="flex items-center gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  Rarity <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('rarity') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-right py-3 px-4 cursor-pointer select-none hidden md:table-cell w-28" @click="toggleSort('cost')">
                <span class="flex items-center justify-end gap-1.5 text-2xs font-heading tracking-[0.08em] uppercase text-mist">
                  Cost <span class="inline-block w-2.5 text-center text-mist/50 font-mono text-[0.6rem]">{{ sortIndicator('cost') }}</span>
                </span>
              </th>
              <th class="sticky top-0 z-10 bg-depths text-center py-3 px-4 hidden md:table-cell w-32">
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
                <span v-else class="text-mist text-xs">—</span>
              </td>
              <td class="py-3 px-4 text-right whitespace-nowrap hidden md:table-cell">
                <span v-if="item.cost" class="font-body text-mist text-xs">{{ item.cost.quantity }} {{ item.cost.unit }}</span>
                <span v-else class="text-mist text-xs">—</span>
              </td>
              <td class="py-3 px-4 text-center hidden md:table-cell">
                <span v-if="item.isMagic" class="font-body text-xs" :class="item.requiresAttunement ? 'text-arcane-bright' : 'text-mist'">
                  {{ item.requiresAttunement ? 'Yes' : 'No' }}
                </span>
                <span v-else class="text-mist text-xs">—</span>
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
import type { NormalizedItem, ItemSearchFilterState, ItemRarity, ItemCategory } from '@/shared/types/items'
import { DEFAULT_ITEM_FILTERS, ItemCategorySchema } from '@/shared/types/items'
import type { ApiEquipment, ApiMagicItem } from '@/shared/types/api'
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

interface ReferenceItem {
  index: string
  name: string
}


const { data: allListData, isPending: isListPending, isError: isListError } = useQuery({
  queryKey: ['items-list'],
  queryFn: async () => {
    const [equipList, magicList, weaponCat, armorCat, gearCat, toolsCat] = await Promise.all([
      fiveEApi.listEquipment(),
      fiveEApi.listMagicItems(),
      fiveEApi.getEquipmentCategory('weapon'),
      fiveEApi.getEquipmentCategory('armor'),
      fiveEApi.getEquipmentCategory('adventuring-gear'),
      fiveEApi.getEquipmentCategory('tools'),
    ])
    return {
      equipment: equipList.results,
      magicItems: magicList.results,
      weaponItemIndexes: new Set(weaponCat.equipment.map(e => e.index)),
      armorItemIndexes: new Set(armorCat.equipment.map(e => e.index)),
      gearItemIndexes: new Set(gearCat.equipment.map(e => e.index)),
      toolItemIndexes: new Set(toolsCat.equipment.map(e => e.index)),
    }
  },
  staleTime: Infinity,
})

const requiresDetails = computed(() => {
  return Boolean(
    filters.value.rarity ||
    attunementFilter.value ||
    filters.value.sortBy === 'cost' ||
    filters.value.sortBy === 'weight' ||
    filters.value.sortBy === 'rarity',
  )
})

const { data: detailData, isPending: isDetailsPending, isError: isDetailsError } = useQuery({
  queryKey: ['items-details'],
  queryFn: async () => {
    if (!allListData.value) return { equipment: [], magicItems: [] }
    const [equipDetails, magicDetails] = await Promise.all([
      Promise.allSettled(allListData.value.equipment.map(r => fiveEApi.getEquipment(r.index))),
      Promise.allSettled(allListData.value.magicItems.map(r => fiveEApi.getMagicItem(r.index))),
    ])
    return {
      equipment: equipDetails
        .filter((r): r is PromiseFulfilledResult<ApiEquipment> => r.status === 'fulfilled')
        .map(r => r.value),
      magicItems: magicDetails
        .filter((r): r is PromiseFulfilledResult<ApiMagicItem> => r.status === 'fulfilled')
        .map(r => r.value),
    }
  },
  staleTime: Infinity,
  enabled: computed(() => !!allListData.value && requiresDetails.value),
})

const isPending = computed(() => isListPending.value || (requiresDetails.value && isDetailsPending.value))
const isError = computed(() => isListError.value || isDetailsError.value)

function normalizeEquipment(e: ApiEquipment | undefined, fallbackCategory: ItemCategory): NormalizedItem {
  const cat = e?.equipment_category?.index ?? fallbackCategory
  const parsed = ItemCategorySchema.safeParse(cat)
  return {
    index: e?.index ?? 'unknown',
    name: e?.name ?? 'Unknown Item',
    category: parsed.success ? parsed.data : 'other',
    subCategory: e?.weapon_category ?? e?.armor_category ?? e?.gear_category?.name,
    cost: e?.cost,
    weight: e?.weight,
    weaponRange: e?.weapon_range as 'Melee' | 'Ranged' | undefined,
    armorCategory: e?.armor_category,
    requiresAttunement: false,
    isMagic: false,
  }
}

function normalizeEquipmentReference(item: ReferenceItem, fallbackCategory: ItemCategory): NormalizedItem {
  return {
    index: item.index,
    name: item.name,
    category: fallbackCategory,
    isMagic: false,
  }
}

function normalizeMagicItem(m: ApiMagicItem | undefined): NormalizedItem {
  const requiresAttunement = m?.desc?.[0]?.toLowerCase().includes('requires attunement') ?? false
  const rawRarity = m?.rarity?.name as ItemRarity | undefined
  return {
    index: m?.index ?? 'unknown',
    name: m?.name ?? 'Unknown Item',
    category: 'magic-item',
    subCategory: m?.equipment_category?.name,
    rarity: rawRarity,
    requiresAttunement,
    description: m?.desc,
    isMagic: true,
  }
}

function normalizeMagicItemReference(item: ReferenceItem): NormalizedItem {
  return {
    index: item.index,
    name: item.name,
    category: 'magic-item',
    isMagic: true,
  }
}

function getEquipmentCategory(index: string) {
  if (!allListData.value) return 'other' as ItemCategory
  if (allListData.value.weaponItemIndexes.has(index)) return 'weapon'
  if (allListData.value.armorItemIndexes.has(index)) return 'armor'
  if (allListData.value.toolItemIndexes.has(index)) return 'tools'
  if (allListData.value.gearItemIndexes.has(index)) return 'adventuring-gear'
  return 'other'
}

const allItems = computed<NormalizedItem[]>(() => {
  if (!allListData.value) return []

  const equipmentByIndex = new Map(detailData.value?.equipment.map(item => [item.index, item]))
  const magicByIndex = new Map(detailData.value?.magicItems.map(item => [item.index, item]))

  return [
    ...allListData.value.equipment.map((item) => {
      const detail = equipmentByIndex.get(item.index)
      return detail
        ? normalizeEquipment(detail, getEquipmentCategory(item.index))
        : normalizeEquipmentReference(item, getEquipmentCategory(item.index))
    }),
    ...allListData.value.magicItems.map((item) => {
      const detail = magicByIndex.get(item.index)
      return detail
        ? normalizeMagicItem(detail)
        : normalizeMagicItemReference(item)
    }),
  ]
})

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

// ── Page-level equipment detail query (for stat block in grid cards) ──────────

const pagedEquipIndices = computed(() =>
  pagedItems.value.filter(i => !i.isMagic).map(i => i.index)
)

const { data: pageEquipDetails } = useQuery({
  queryKey: computed(() => ['item-page-equip', pagedEquipIndices.value.join(',')]),
  queryFn: () =>
    Promise.allSettled(pagedEquipIndices.value.map(idx => fiveEApi.getEquipment(idx))).then(
      res => res.filter((r): r is PromiseFulfilledResult<ApiEquipment> => r.status === 'fulfilled').map(r => r.value),
    ),
  enabled: computed(() => pagedEquipIndices.value.length > 0),
  staleTime: Infinity,
})

const pageEquipMap = computed(() => new Map(pageEquipDetails.value?.map(d => [d.index, d]) ?? []))

function equipDetail(index: string): ApiEquipment | undefined {
  return pageEquipMap.value.get(index)
}

function weaponDamageStr(index: string): string {
  const e = pageEquipMap.value.get(index)
  if (!e?.damage) return '—'
  const base = e.damage.damage_dice
  return e.two_handed_damage ? `${base} / ${e.two_handed_damage.damage_dice}` : base
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
