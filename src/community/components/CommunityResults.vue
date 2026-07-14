<template>
  <div class="app-container py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-2 gap-4 flex-wrap">
      <h1 class="heading-display text-3xl font-semibold">Community</h1>
      <div class="flex items-center gap-3">
        <p class="text-muted text-sm">{{ items.length }} results</p>
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
    <p class="text-sm text-mist mb-4">{{ blurb }}</p>

    <!-- Section switcher -->
    <div class="mb-6">
      <CommunitySectionNav />
    </div>

    <!-- Filters (section-specific, provided by the page) -->
    <div class="flex flex-wrap gap-3 mb-6 items-center">
      <slot name="filters" />
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="isPending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      aria-label="Loading community content..."
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
    <div v-else-if="items.length === 0" class="text-center py-16 text-muted">
      <p v-if="sectionTotal === 0">{{ emptyText }}</p>
      <p v-else>Nothing matches your filters.</p>
    </div>

    <!-- Grid -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <button
        v-for="it in items"
        :key="it.id"
        type="button"
        class="card-hover p-4 flex flex-col gap-2 text-left w-full"
        :style="{ 'border-left': `3px solid ${statColor(it.primaryStat)}` }"
        @click="openDetail(it)"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="font-medium text-vellum leading-tight">{{ it.name }}</span>
          <span class="text-2xs shrink-0 font-mono px-1.5 py-0.5 rounded border border-arcane-base/30 bg-arcane-deep/15 text-arcane-pale max-w-[45%] truncate">
            {{ itemBadge(it) }}
          </span>
        </div>
        <p class="text-xs text-mist">{{ subtitle(it) }}</p>
        <div class="flex items-center justify-between gap-2 mt-0.5">
          <span class="text-2xs font-heading tracking-wide uppercase text-mist/60">{{ it.edition }}</span>
          <span v-if="it.authorName" class="text-2xs font-body text-mist/70 truncate max-w-[55%]">by {{ it.authorName }}</span>
        </div>
      </button>
    </div>

    <!-- List view -->
    <div v-else class="overflow-hidden rounded-lg border border-shadow">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm table-fixed">
          <thead>
            <tr class="bg-depths border-b-2 border-dusk/60">
              <th class="text-left py-3 px-4 w-[40%] text-2xs font-heading tracking-[0.08em] uppercase text-mist">Name</th>
              <th class="text-left py-3 px-4 w-[22%] text-2xs font-heading tracking-[0.08em] uppercase text-mist">{{ secondaryHeader }}</th>
              <th class="text-center py-3 px-4 w-[14%] hidden sm:table-cell text-2xs font-heading tracking-[0.08em] uppercase text-mist">Edition</th>
              <th class="text-left py-3 px-4 w-[24%] hidden md:table-cell text-2xs font-heading tracking-[0.08em] uppercase text-mist">Author</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(it, i) in items"
              :key="it.id"
              class="border-b border-shadow/40 transition-colors duration-100 hover:bg-arcane-deep/20 cursor-pointer"
              :class="i % 2 === 0 ? 'bg-abyss' : 'bg-depths/50'"
              @click="openDetail(it)"
            >
              <td class="py-3 px-4 font-body text-stone">{{ it.name }}</td>
              <td class="py-3 px-4">
                <span
                  v-if="kind === 'subclass'"
                  class="font-body text-mist"
                >{{ itemBadge(it) }}</span>
                <span
                  v-else
                  class="text-2xs font-mono px-1.5 py-0.5 rounded border border-arcane-base/30 bg-arcane-deep/15 text-arcane-pale"
                >{{ itemBadge(it) }}</span>
              </td>
              <td class="py-3 px-4 text-center font-body text-mist hidden sm:table-cell">{{ it.edition }}</td>
              <td class="py-3 px-4 font-body text-mist hidden md:table-cell truncate">{{ it.authorName ?? '-' }}</td>
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
import { LayoutGridIcon, ListIcon } from 'lucide-vue-next'
import type { CommunityItem } from '@/shared/types/customContent'
import { statColor, subtitle, itemBadge } from '@/community/communityDisplay'
import CommunitySectionNav from '@/community/components/CommunitySectionNav.vue'
import CommunityDetailModal from '@/community/components/CommunityDetailModal.vue'

const props = defineProps<{
  kind: CommunityItem['kind']
  items: CommunityItem[]
  isPending: boolean
  isError: boolean
  sectionTotal: number
}>()

const viewMode = ref<'grid' | 'list'>('grid')
const selected = ref<CommunityItem | null>(null)
const showDetail = ref(false)

const BLURBS: Record<CommunityItem['kind'], string> = {
  class: 'Homebrew classes shared by other players.',
  subclass: 'Homebrew subclasses shared by other players, grouped by their parent class.',
  race: 'Homebrew races & species shared by other players.',
}
const SECONDARY_HEADERS: Record<CommunityItem['kind'], string> = {
  class: 'Primary ability', subclass: 'Parent class', race: 'Ability boost',
}
const EMPTY_TEXT: Record<CommunityItem['kind'], string> = {
  class: 'No shared classes yet. Publish one from your profile to be the first!',
  subclass: 'No shared subclasses yet. Publish one from your profile to be the first!',
  race: 'No shared races yet. Publish one from your profile to be the first!',
}

const blurb = computed(() => BLURBS[props.kind])
const secondaryHeader = computed(() => SECONDARY_HEADERS[props.kind])
const emptyText = computed(() => EMPTY_TEXT[props.kind])

function openDetail(it: CommunityItem) {
  selected.value = it
  showDetail.value = true
}
</script>
