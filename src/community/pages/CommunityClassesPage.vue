<template>
  <CommunityResults
    kind="class"
    :items="filtered"
    :is-pending="isPending"
    :is-error="isError"
    :section-total="sectionItems.length"
  >
    <template #filters>
      <input
        v-model="query"
        type="search"
        aria-label="Search community classes"
        placeholder="Search by name or author..."
        class="input-base max-w-xs"
      />
      <AppSelect v-model="ability" class="max-w-[160px]">
        <option value="">Any ability</option>
        <option v-for="ab in ABILITY_ORDER" :key="ab" :value="ab">{{ ABILITY_LABELS[ab] }}</option>
      </AppSelect>
      <AppSelect v-model="hitDie" class="max-w-[120px]">
        <option value="">Any hit die</option>
        <option v-for="d in HIT_DICE" :key="d" :value="String(d)">d{{ d }}</option>
      </AppSelect>
      <AppSelect v-model="caster" class="max-w-[160px]">
        <option value="">Any type</option>
        <option value="yes">Spellcaster</option>
        <option value="no">Non-caster</option>
      </AppSelect>
      <AppSelect v-model="editionFilter" class="max-w-[130px]">
        <option value="">Any edition</option>
        <option value="2014">2014</option>
        <option value="2024">2024</option>
      </AppSelect>
      <AppSelect v-model="sortBy" class="max-w-[180px]">
        <option value="ability">Sort: primary ability</option>
        <option value="name">Sort: name</option>
        <option value="hitDie">Sort: hit die</option>
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
import type { CommunityItem, CustomClass } from '@/shared/types/customContent'

const { items, isPending, isError } = useCommunityFeed()

const query = ref('')
const ability = ref('')
const hitDie = ref('')
const caster = ref<'' | 'yes' | 'no'>('')
const editionFilter = ref('')
const sortBy = ref<'ability' | 'name' | 'hitDie' | 'recent'>('ability')

const HIT_DICE = [6, 8, 10, 12]

const sectionItems = computed(() => (items.value ?? []).filter(it => it.kind === 'class'))

const filtered = computed<CommunityItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  const list = sectionItems.value.filter((it) => {
    const c = it.data as CustomClass
    if (editionFilter.value && it.edition !== editionFilter.value) return false
    if (ability.value && it.primaryStat !== ability.value) return false
    if (hitDie.value && c.hitDie !== Number(hitDie.value)) return false
    if (caster.value === 'yes' && !c.spellcasting) return false
    if (caster.value === 'no' && c.spellcasting) return false
    if (q && !(it.name.toLowerCase().includes(q) || (it.authorName ?? '').toLowerCase().includes(q))) return false
    return true
  })
  return [...list].sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'recent') return b.updatedAt.localeCompare(a.updatedAt)
    if (sortBy.value === 'hitDie') {
      const d = (b.data as CustomClass).hitDie - (a.data as CustomClass).hitDie
      return d !== 0 ? d : a.name.localeCompare(b.name)
    }
    const r = statRank(a.primaryStat) - statRank(b.primaryStat)
    return r !== 0 ? r : a.name.localeCompare(b.name)
  })
})
</script>
