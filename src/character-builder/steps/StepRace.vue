<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <section class="space-y-4">
      <div class="rule-gold"><span>Race</span></div>

      <div v-if="racesLoading" class="flex justify-center py-8">
        <GrimoireSpinner />
      </div>
      <div v-else-if="racesError" class="text-sm text-blood-bright">Failed to load races.</div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <PickerCard
          v-for="race in races"
          :key="race.index"
          :name="race.name"
          :glyph="getRaceMeta(race.index).glyph"
          :flavor="getRaceMeta(race.index).flavor"
          :tags="getRaceMeta(race.index).traits.slice(0, 2)"
          :selected="builder.draft.raceIndex === race.index"
          show-info
          @select="selectRace(race.index, race.name)"
          @info="infoPanel.open({ kind: 'race', index: race.index })"
        />
      </div>
      <p v-if="fieldErrors.race" class="mt-2 text-xs font-body text-blood-bright">
        Select a race to continue.
      </p>

      <!-- Subrace picker -->
      <Transition name="expand">
        <div v-if="builder.draft.availableSubraces.length > 0" class="mt-3 space-y-2">
          <label class="label">Subrace *</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="sub in builder.draft.availableSubraces"
              :key="sub.index"
              type="button"
              class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
              :class="builder.draft.subraceIndex === sub.index
                ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-deep'
                : fieldErrors.subrace
                  ? 'border-blood-base/50 text-ash hover:border-blood-base/70'
                  : 'border-shadow text-ash hover:border-gold-dim/25 hover:text-stone'"
              @click="selectSubrace(sub.index, sub.name)"
            >
              {{ sub.name }}
            </button>
          </div>
          <p v-if="fieldErrors.subrace" class="text-xs font-body text-blood-bright">
            Select a subrace to continue.
          </p>
        </div>
      </Transition>
    </section>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useBuilderStore } from '@/character-builder/builderStore'
import { getRaceMeta } from '@/character-builder/classMeta'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import type { ApiRace } from '@/shared/types/api'
import PickerCard from '@/character-builder/components/PickerCard.vue'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()

const fieldErrors = computed(() => ({
  race:    showValidation.value && !builder.draft.raceIndex,
  subrace: showValidation.value && builder.draft.availableSubraces.length > 0 && !builder.draft.subraceIndex,
}))

const { data: raceList, isPending: racesLoading, isError: racesError } = useQuery({
  queryKey: ['races'],
  queryFn: () => fiveEApi.listRaces(),
  staleTime: Infinity,
})
const races = computed(() => raceList.value?.results ?? [])

async function selectRace(index: string, name: string) {
  builder.draft.raceIndex = index
  builder.draft.raceName = name
  builder.draft.subraceIndex = ''
  builder.draft.subraceName = ''
  builder.draft.availableSubraces = []
  try {
    const detail: ApiRace = await fiveEApi.getRace(index)
    builder.draft.raceSpeed = detail.speed
    builder.draft.raceSizeCategory = detail.size
    builder.draft.raceAbilityBonuses = detail.ability_bonuses.reduce((acc, ab) => {
      const key = ab.ability_score.index as keyof typeof acc
      acc[key] = (acc[key] ?? 0) + ab.bonus
      return acc
    }, {} as Record<string, number>)
    builder.draft.availableSubraces = detail.subraces.map(s => ({ index: s.index, name: s.name }))
    builder.draft.raceLanguageCount = detail.languages.length || 1
  } catch { /* ignore */ }
}

function selectSubrace(index: string, name: string) {
  builder.draft.subraceIndex = index
  builder.draft.subraceName = name
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 400px; }
</style>
