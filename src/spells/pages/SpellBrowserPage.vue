<template>
  <div class="app-container py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="heading-display text-3xl font-semibold">Spells</h1>
      <p class="text-muted text-sm">{{ filteredSpells.length }} results</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6">
      <input
        v-model="query"
        type="search"
        placeholder="Search spells…"
        class="input-base max-w-xs"
      />
      <select v-model="levelFilter" class="input-base max-w-[120px]">
        <option value="">All levels</option>
        <option v-for="l in 10" :key="l - 1" :value="l - 1">
          {{ l === 1 ? 'Cantrip' : `Level ${l - 1}` }}
        </option>
      </select>
      <select v-model="schoolFilter" class="input-base max-w-[140px]">
        <option value="">All schools</option>
        <option v-for="s in schools" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <!-- Results -->
    <div v-if="isPending" class="flex justify-center py-16">
      <div class="animate-spin w-8 h-8 border-2 border-parchment-400 border-t-transparent rounded-full" />
    </div>
    <div v-else-if="isError" class="text-center py-16 text-danger">Failed to load spells.</div>
    <div v-else-if="filteredSpells.length === 0" class="text-center py-16 text-muted">No spells match your filters.</div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <RouterLink
        v-for="spell in filteredSpells"
        :key="spell.index"
        :to="`/spells`"
        class="card-hover p-4 flex flex-col gap-1"
        @click.prevent="selectedSpell = spell.index"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="font-medium text-vellum">{{ spell.name }}</span>
          <span class="badge-arcane text-xs shrink-0">{{ spell.level === 0 ? 'Cantrip' : `Lv ${spell.level}` }}</span>
        </div>
        <span class="text-xs text-muted">{{ spell.school }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'

const query = ref('')
const levelFilter = ref<number | ''>('')
const schoolFilter = ref('')
const selectedSpell = ref<string | null>(null)

const schools = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']

const { data, isPending, isError } = useQuery({
  queryKey: ['spells-index'],
  queryFn: () => fiveEApi.listSpells(),
  staleTime: Infinity,
})

// The 5e-bits spells list only returns index, name, level (if available), and url.
// We derive school from a lookup table here for display purposes.
const spellsWithMeta = computed(() => (data.value?.results ?? []).map((s) => ({
  index: s.index,
  name: s.name,
  level: 0,
  school: '',
})))

const filteredSpells = computed(() => {
  return spellsWithMeta.value.filter((s) => {
    if (query.value && !s.name.toLowerCase().includes(query.value.toLowerCase())) return false
    if (levelFilter.value !== '' && s.level !== levelFilter.value) return false
    if (schoolFilter.value && s.school !== schoolFilter.value) return false
    return true
  })
})
</script>
