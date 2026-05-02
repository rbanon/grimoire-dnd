<template>
  <div class="app-container py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="heading-display text-3xl font-semibold">Items & Equipment</h1>
      <p class="text-muted text-sm">{{ filteredItems.length }} results</p>
    </div>

    <div class="flex flex-wrap gap-3 mb-6">
      <input v-model="filters.query" type="search" placeholder="Search items…" class="input-base max-w-xs" />
      <select v-model="filters.category" class="input-base max-w-[180px]">
        <option :value="null">All categories</option>
        <option value="weapon">Weapons</option>
        <option value="armor">Armor</option>
        <option value="adventuring-gear">Adventuring Gear</option>
        <option value="tools">Tools</option>
        <option value="magic-item">Magic Items</option>
      </select>
      <select v-model="filters.sortBy" class="input-base max-w-[120px]">
        <option value="name">Name</option>
        <option value="cost">Cost</option>
        <option value="weight">Weight</option>
      </select>
    </div>

    <div v-if="isPending" class="flex justify-center py-16">
      <div class="animate-spin w-8 h-8 border-2 border-parchment-400 border-t-transparent rounded-full" />
    </div>
    <div v-else-if="isError" class="text-center py-16 text-danger">Failed to load items.</div>
    <div v-else-if="filteredItems.length === 0" class="text-center py-16 text-muted">No items match your filters.</div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="item in filteredItems"
        :key="item.index"
        class="card-hover p-4 flex flex-col gap-1"
      >
        <span class="font-medium text-vellum">{{ item.name }}</span>
        <div class="flex gap-2 flex-wrap mt-1">
          <span v-if="item.cost" class="text-xs text-muted">{{ item.cost.quantity }} {{ item.cost.unit }}</span>
          <span v-if="item.weight" class="text-xs text-muted">{{ item.weight }} lb</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import type { NormalizedItem, ItemSearchFilterState } from '@/shared/types/items'
import { DEFAULT_ITEM_FILTERS } from '@/shared/types/items'
import type { ApiEquipment } from '@/shared/types/api'

const filters = ref<ItemSearchFilterState>({ ...DEFAULT_ITEM_FILTERS })

// Fetch full equipment list (no server-side filtering available)
const { data: equipmentList, isPending: equipPending, isError: equipError } = useQuery({
  queryKey: ['equipment-list'],
  queryFn: async () => {
    const list = await fiveEApi.listEquipment()
    // Batch-fetch all equipment details (client-side index)
    const details = await Promise.allSettled(
      list.results.map((r) => fiveEApi.getEquipment(r.index)),
    )
    return details
      .filter((r): r is PromiseFulfilledResult<ApiEquipment> => r.status === 'fulfilled')
      .map((r) => r.value)
  },
  staleTime: Infinity,
})

const isPending = computed(() => equipPending.value)
const isError = computed(() => equipError.value)

function normalizeEquipment(e: ApiEquipment): NormalizedItem {
  const cat = e.equipment_category?.index ?? 'other'
  return {
    index: e.index,
    name: e.name,
    category: (cat as NormalizedItem['category']) ?? 'other',
    subCategory: e.weapon_category ?? e.armor_category ?? e.gear_category?.name,
    cost: e.cost,
    weight: e.weight,
    weaponRange: e.weapon_range as 'Melee' | 'Ranged' | undefined,
    armorCategory: e.armor_category,
    isMagic: false,
  }
}

const allItems = computed<NormalizedItem[]>(() =>
  (equipmentList.value ?? []).map(normalizeEquipment),
)

const filteredItems = computed(() => {
  let items = allItems.value

  if (filters.value.query) {
    const q = filters.value.query.toLowerCase()
    items = items.filter((i) => i.name.toLowerCase().includes(q))
  }
  if (filters.value.category) {
    items = items.filter((i) => i.category === filters.value.category)
  }
  if (filters.value.weaponRange) {
    items = items.filter((i) => i.weaponRange === filters.value.weaponRange)
  }
  if (filters.value.armorCategory) {
    items = items.filter((i) => i.armorCategory === filters.value.armorCategory)
  }

  items = [...items].sort((a, b) => {
    if (filters.value.sortBy === 'name') return a.name.localeCompare(b.name)
    if (filters.value.sortBy === 'cost') {
      const ac = a.cost?.quantity ?? 0
      const bc = b.cost?.quantity ?? 0
      return filters.value.sortDir === 'asc' ? ac - bc : bc - ac
    }
    if (filters.value.sortBy === 'weight') {
      const aw = a.weight ?? 0
      const bw = b.weight ?? 0
      return filters.value.sortDir === 'asc' ? aw - bw : bw - aw
    }
    return 0
  })

  return items
})
</script>
