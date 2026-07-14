<template>
  <CommunityResults
    kind="subclass"
    :items="filtered"
    :is-pending="isPending"
    :is-error="isError"
    :section-total="sectionItems.length"
  >
    <template #filters>
      <input
        v-model="query"
        type="search"
        aria-label="Search community subclasses"
        placeholder="Search by name or author..."
        class="input-base max-w-xs"
      />
      <AppSelect v-model="parentClass" class="max-w-[200px]">
        <option value="">Any parent class</option>
        <option v-for="p in parentClasses" :key="p" :value="p">{{ p }}</option>
      </AppSelect>
      <AppSelect v-model="editionFilter" class="max-w-[130px]">
        <option value="">Any edition</option>
        <option value="2014">2014</option>
        <option value="2024">2024</option>
      </AppSelect>
      <AppSelect v-model="sortBy" class="max-w-[190px]">
        <option value="parent">Sort: parent class</option>
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
import type { CommunityItem, CustomSubclass } from '@/shared/types/customContent'

const { items, isPending, isError } = useCommunityFeed()

const query = ref('')
const parentClass = ref('')
const editionFilter = ref('')
const sortBy = ref<'parent' | 'name' | 'recent'>('parent')

const sectionItems = computed(() => (items.value ?? []).filter(it => it.kind === 'subclass'))

// Parent-class filter options, derived from the shared subclasses themselves.
const parentClasses = computed(() => {
  const names = new Set<string>()
  for (const it of sectionItems.value) {
    const name = (it.data as CustomSubclass).parentClassName
    if (name) names.add(name)
  }
  return [...names].sort((a, b) => a.localeCompare(b))
})

const filtered = computed<CommunityItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  const list = sectionItems.value.filter((it) => {
    const sc = it.data as CustomSubclass
    if (editionFilter.value && it.edition !== editionFilter.value) return false
    if (parentClass.value && sc.parentClassName !== parentClass.value) return false
    if (q && !(it.name.toLowerCase().includes(q) || (it.authorName ?? '').toLowerCase().includes(q))) return false
    return true
  })
  return [...list].sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'recent') return b.updatedAt.localeCompare(a.updatedAt)
    const ap = (a.data as CustomSubclass).parentClassName || ''
    const bp = (b.data as CustomSubclass).parentClassName || ''
    const p = ap.localeCompare(bp)
    return p !== 0 ? p : a.name.localeCompare(b.name)
  })
})
</script>
