<template>
  <CommunityResults
    kind="race"
    :items="filtered"
    :is-pending="isPending"
    :is-error="isError"
    :section-total="sectionItems.length"
  >
    <template #filters>
      <input
        v-model="query"
        type="search"
        aria-label="Search community races"
        placeholder="Search by name or author..."
        class="input-base max-w-xs"
      />
      <AppSelect v-model="sizeFilter" class="max-w-[150px]">
        <option value="">Any size</option>
        <option v-for="s in sizes" :key="s" :value="s">{{ s }}</option>
      </AppSelect>
      <AppSelect v-model="ability" class="max-w-[170px]">
        <option value="">Any ability boost</option>
        <option v-for="ab in ABILITY_ORDER" :key="ab" :value="ab">{{ ABILITY_LABELS[ab] }}</option>
      </AppSelect>
      <AppSelect v-model="editionFilter" class="max-w-[130px]">
        <option value="">Any edition</option>
        <option value="2014">2014</option>
        <option value="2024">2024</option>
      </AppSelect>
      <AppSelect v-model="sortBy" class="max-w-[180px]">
        <option value="ability">Sort: ability boost</option>
        <option value="name">Sort: name</option>
        <option value="recent">Sort: recently updated</option>
      </AppSelect>
    </template>
  </CommunityResults>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommunityFeed } from '@/community/useCommunityFeed'
import CommunityResults from '@/community/components/CommunityResults.vue'
import { ABILITY_ORDER, ABILITY_LABELS, statRank } from '@/community/communityDisplay'
import type { CommunityItem, CustomRace } from '@/shared/types/customContent'

const { items, isPending, isError } = useCommunityFeed()

const query = ref('')
const sizeFilter = ref('')
const ability = ref('')
const editionFilter = ref('')
const sortBy = ref<'ability' | 'name' | 'recent'>('ability')

const sectionItems = computed(() => (items.value ?? []).filter(it => it.kind === 'race'))

// Size options are free-form on homebrew races, so derive them from the data present.
const sizes = computed(() => {
  const set = new Set<string>()
  for (const it of sectionItems.value) {
    const size = (it.data as CustomRace).size
    if (size) set.add(size)
  }
  const ORDER = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
  return [...set].sort((a, b) => {
    const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    return a.localeCompare(b)
  })
})

const filtered = computed<CommunityItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  const list = sectionItems.value.filter((it) => {
    const r = it.data as CustomRace
    if (editionFilter.value && it.edition !== editionFilter.value) return false
    if (sizeFilter.value && r.size !== sizeFilter.value) return false
    if (ability.value && it.primaryStat !== ability.value) return false
    if (q && !(it.name.toLowerCase().includes(q) || (it.authorName ?? '').toLowerCase().includes(q))) return false
    return true
  })
  return [...list].sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'recent') return b.updatedAt.localeCompare(a.updatedAt)
    const rk = statRank(a.primaryStat) - statRank(b.primaryStat)
    return rk !== 0 ? rk : a.name.localeCompare(b.name)
  })
})
</script>
