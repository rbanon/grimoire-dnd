<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <!-- Race picker -->
    <section class="space-y-4">
      <div class="rule-gold"><span>Race</span></div>

      <div v-if="racesLoading" class="flex justify-center py-8">
        <GrimoireSpinner />
      </div>
      <div v-else-if="racesError" class="text-sm text-blood-bright">Failed to load races.</div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <PickerCard
          v-for="race in allRaces"
          :key="`${race.edition}:${race.index}`"
          :name="race.name"
          :glyph="getRaceMeta(race.index).glyph"
          :flavor="getRaceMeta(race.index).flavor"
          :tags="getRaceMeta(race.index).traits.slice(0, 2)"
          :selected="builder.draft.raceIndex === race.index && builder.draft.raceEdition === race.edition"
          :edition="race.edition"
          show-info
          @select="selectRace(race.index, race.name, race.edition)"
          @info="infoPanel.open({ kind: 'race', index: race.index })"
        />
      </div>
      <p v-if="fieldErrors.race" class="mt-2 text-xs font-body text-blood-bright">
        Select a race to continue.
      </p>
    </section>

    <!-- Race detail panel -->
    <Transition name="expand">
      <section v-if="builder.draft.raceIndex" class="space-y-4">
        <div class="rule-gold"><span>{{ raceEdition === '2024' ? 'Species' : 'Race' }} Details</span></div>

        <div v-if="raceDetailLoading" class="flex justify-center py-4">
          <GrimoireSpinner />
        </div>

        <!-- 2024 species detail -->
        <template v-else-if="speciesDetail">
          <div class="flex flex-wrap gap-2">
            <span class="px-2.5 py-1 rounded border border-gold-dim/30 text-xs font-heading text-gold-dim">
              Speed {{ speciesDetail.speed }} ft
            </span>
            <span class="px-2.5 py-1 rounded border border-gold-dim/30 text-xs font-heading text-gold-dim">
              Size {{ speciesDetail.size }}
            </span>
          </div>
          <!-- 2024: no fixed ability bonuses -->
          <div class="flex items-start gap-2 px-3 py-2 rounded border border-arcane-base/20 bg-arcane-deep/10">
            <span class="text-arcane-pale/60 text-xs shrink-0 mt-0.5">✦</span>
            <p class="text-xs font-body text-arcane-pale/80">
              <strong>2024 rules:</strong> Species don't grant fixed ability score bonuses.
              Distribute your bonuses freely in the Ability Scores step.
            </p>
          </div>
          <!-- Traits -->
          <div v-if="speciesDetail.traits.length" class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Species Traits</p>
            <div v-if="traitDetailsLoading" class="flex justify-center py-2"><GrimoireSpinner /></div>
            <div v-else class="space-y-2">
              <div
                v-for="trait in traitDetails"
                :key="trait.index"
                class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-1"
              >
                <p class="text-sm font-heading text-vellum">{{ trait.name }}</p>
                <p v-for="(line, i) in trait.desc" :key="i" class="text-xs font-body text-ash leading-relaxed">{{ line }}</p>
              </div>
            </div>
          </div>
        </template>

        <!-- 2014 race detail -->
        <template v-else-if="raceDetail">
          <div class="flex flex-wrap gap-2">
            <span class="px-2.5 py-1 rounded border border-gold-dim/30 text-xs font-heading text-gold-dim">
              Speed {{ raceDetail.speed }} ft
            </span>
            <span class="px-2.5 py-1 rounded border border-gold-dim/30 text-xs font-heading text-gold-dim">
              Size {{ raceDetail.size }}
            </span>
            <span
              v-for="ab in raceDetail.ability_bonuses"
              :key="ab.ability_score.index"
              class="px-2.5 py-1 rounded border border-gold-dim/25 bg-gold-dim/8 text-xs font-heading text-gold-dim"
            >
              {{ ab.ability_score.name.slice(0, 3).toUpperCase() }} +{{ ab.bonus }}
            </span>
          </div>
          <div v-if="raceDetail.languages.length" class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Languages</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="lang in raceDetail.languages" :key="lang.index" class="px-2 py-0.5 rounded text-xs font-body text-stone border border-shadow">{{ lang.name }}</span>
            </div>
            <p v-if="raceDetail.language_desc" class="text-xs font-body text-mist/70 italic leading-relaxed">{{ raceDetail.language_desc }}</p>
          </div>
          <div v-if="raceDetail.traits.length" class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Racial Traits</p>
            <div v-if="traitDetailsLoading" class="flex justify-center py-2"><GrimoireSpinner /></div>
            <div v-else class="space-y-2">
              <div v-for="trait in traitDetails" :key="trait.index" class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-1">
                <p class="text-sm font-heading text-vellum">{{ trait.name }}</p>
                <p v-for="(line, i) in trait.desc" :key="i" class="text-xs font-body text-ash leading-relaxed">{{ line }}</p>
              </div>
            </div>
          </div>
          <p v-if="raceDetail.size_description" class="text-xs font-body text-mist/60 italic leading-relaxed">{{ raceDetail.size_description }}</p>
        </template>
      </section>
    </Transition>

    <!-- Subrace / Subspecies picker -->
    <Transition name="expand">
      <section v-if="builder.draft.availableSubraces.length > 0" class="space-y-4">
        <div class="rule-gold"><span>{{ raceEdition === '2024' ? 'Subspecies' : 'Subrace' }}</span></div>
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
                : 'border-gold-dim/25 bg-depths text-stone hover:border-gold-dim/50 hover:text-vellum hover:bg-gold-dim/5'"
            @click="selectSubrace(sub.index, sub.name)"
          >
            {{ sub.name }}
          </button>
        </div>
        <p v-if="fieldErrors.subrace" class="text-xs font-body text-blood-bright">
          Select a subrace to continue.
        </p>
      </section>
    </Transition>

    <!-- Subrace detail panel -->
    <Transition name="expand">
      <section v-if="builder.draft.subraceIndex" class="space-y-4">
        <div class="rule-gold"><span>Subrace Details</span></div>

        <div v-if="subraceDetailLoading" class="flex justify-center py-4">
          <GrimoireSpinner />
        </div>

        <template v-else-if="subraceDetail">
          <!-- Subrace ASI bonuses (2014 only) -->
          <div v-if="raceEdition === '2014' && subraceDetail.ability_bonuses.length" class="flex flex-wrap gap-2">
            <span
              v-for="ab in subraceDetail.ability_bonuses"
              :key="ab.ability_score.index"
              class="px-2.5 py-1 rounded border border-gold-dim/25 bg-gold-dim/8 text-xs font-heading text-gold-dim"
            >
              {{ ab.ability_score.name.slice(0, 3).toUpperCase() }} +{{ ab.bonus }}
            </span>
          </div>

          <!-- Subrace description -->
          <p v-if="raceEdition === '2014' && subraceDetail.desc" class="text-xs font-body text-ash leading-relaxed">
            {{ subraceDetail.desc }}
          </p>

          <!-- Subrace traits -->
          <div v-if="subraceDetail.racial_traits.length" class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Subrace Traits</p>
            <div v-if="subraceTraitDetailsLoading" class="flex justify-center py-2">
              <GrimoireSpinner />
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="trait in subraceTraitDetails"
                :key="trait.index"
                class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-1"
              >
                <p class="text-sm font-heading text-vellum">{{ trait.name }}</p>
                <p
                  v-for="(line, j) in trait.desc"
                  :key="j"
                  class="text-xs font-body text-ash leading-relaxed"
                >{{ line }}</p>
              </div>
            </div>
          </div>
        </template>
      </section>
    </Transition>

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
import type { ApiRace, ApiSubrace, ApiTrait, Api2024Species, EditionTag } from '@/shared/types/api'
import PickerCard from '@/character-builder/components/PickerCard.vue'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()

const fieldErrors = computed(() => ({
  race:    showValidation.value && !builder.draft.raceIndex,
  subrace: showValidation.value && builder.draft.availableSubraces.length > 0 && !builder.draft.subraceIndex,
}))

// ── Race / species lists ───────────────────────────────────────────────────────

const { data: raceList2014, isPending: racesLoading2014, isError: racesError } = useQuery({
  queryKey: ['races'],
  queryFn: () => fiveEApi.listRaces(),
  staleTime: Infinity,
})
const { data: speciesList2024, isPending: racesLoading2024 } = useQuery({
  queryKey: ['species-2024'],
  queryFn: () => fiveEApi.listSpecies(),
  staleTime: Infinity,
})

const racesLoading = computed(() => racesLoading2014.value || racesLoading2024.value)
const allRaces = computed(() => [
  ...(raceList2014.value?.results ?? []).map(r => ({ ...r, edition: '2014' as EditionTag })),
  ...(speciesList2024.value?.results ?? []).map(r => ({ ...r, edition: '2024' as EditionTag })),
])

const raceEdition = computed(() => builder.draft.raceEdition ?? '2014')

// ── Race detail panel (2014 race) ─────────────────────────────────────────────

const raceIndex = computed(() => builder.draft.raceIndex)

const { data: raceDetail2014, isPending: raceDetailLoading2014 } = useQuery({
  queryKey: computed(() => ['race-detail', raceIndex.value]),
  queryFn: () => fiveEApi.getRace(raceIndex.value) as Promise<ApiRace>,
  staleTime: Infinity,
  enabled: computed(() => !!raceIndex.value && raceEdition.value === '2014'),
})

const { data: speciesDetail2024, isPending: raceDetailLoading2024 } = useQuery({
  queryKey: computed(() => ['species-detail-2024', raceIndex.value]),
  queryFn: () => fiveEApi.getSpecies(raceIndex.value),
  staleTime: Infinity,
  enabled: computed(() => !!raceIndex.value && raceEdition.value === '2024'),
})

const raceDetail = computed(() => raceEdition.value === '2024' ? null : raceDetail2014.value ?? null)
const speciesDetail = computed(() => raceEdition.value === '2024' ? speciesDetail2024.value ?? null : null)
const raceDetailLoading = computed(() => raceDetailLoading2014.value || raceDetailLoading2024.value)

const raceTraitIndices = computed(() => {
  if (raceEdition.value === '2024') return speciesDetail.value?.traits.map(t => t.index) ?? []
  return raceDetail.value?.traits.map(t => t.index) ?? []
})

const { data: traitDetailsList, isPending: traitDetailsLoading } = useQuery({
  queryKey: computed(() => ['race-traits', raceEdition.value, ...raceTraitIndices.value]),
  queryFn: () => Promise.all(raceTraitIndices.value.map(i => fiveEApi.getTrait(i))) as Promise<ApiTrait[]>,
  staleTime: Infinity,
  enabled: computed(() => raceTraitIndices.value.length > 0),
})
const traitDetails = computed(() => traitDetailsList.value ?? [])

// ── Subrace / subspecies detail ───────────────────────────────────────────────

const subraceIndex = computed(() => builder.draft.subraceIndex)

const { data: subraceDetail, isPending: subraceDetailLoading } = useQuery({
  queryKey: computed(() => ['subrace-detail', subraceIndex.value, raceEdition.value]),
  queryFn: () => raceEdition.value === '2024'
    ? fiveEApi.getSubspecies(subraceIndex.value).then(d => ({ ...d, racial_traits: d.traits, ability_bonuses: [] })) as Promise<ApiSubrace>
    : fiveEApi.getSubrace(subraceIndex.value) as Promise<ApiSubrace>,
  staleTime: Infinity,
  enabled: computed(() => !!subraceIndex.value),
})

const subraceTraitIndices = computed(() => subraceDetail.value?.racial_traits.map(t => t.index) ?? [])

const { data: subraceTraitDetailsList, isPending: subraceTraitDetailsLoading } = useQuery({
  queryKey: computed(() => ['subrace-traits', raceEdition.value, ...subraceTraitIndices.value]),
  queryFn: () => Promise.all(subraceTraitIndices.value.map(i => fiveEApi.getTrait(i))) as Promise<ApiTrait[]>,
  staleTime: Infinity,
  enabled: computed(() => subraceTraitIndices.value.length > 0),
})
const subraceTraitDetails = computed(() => subraceTraitDetailsList.value ?? [])

// ── Select handlers ───────────────────────────────────────────────────────────

async function selectRace(index: string, name: string, edition: EditionTag) {
  builder.draft.raceIndex = index
  builder.draft.raceName = name
  builder.draft.raceEdition = edition
  builder.draft.subraceIndex = ''
  builder.draft.subraceName = ''
  builder.draft.availableSubraces = []
  builder.draft.subraceAbilityBonuses = {}
  builder.draft.raceProfChoices = 0
  builder.draft.raceProfOptions = []
  builder.draft.selectedRaceProfs = []
  builder.draft.raceSkillProficiencies = []
  builder.draft.raceAbilityBonuses = {}

  if (edition === '2024') {
    try {
      const detail: Api2024Species = await fiveEApi.getSpecies(index)
      builder.draft.raceSpeed = detail.speed
      builder.draft.raceSizeCategory = detail.size
      // 2024 species don't grant fixed ability bonuses — player distributes freely
      builder.draft.raceAbilityBonuses = {}
      builder.draft.raceLanguageCount = 1 // no language data in 2024 species
      builder.draft.raceAutoLanguages = []
      builder.draft.availableSubraces = detail.subspecies.map(s => ({ index: s.index, name: s.name }))
    } catch (err) { console.warn('[StepRace] selectSpecies (2024) failed:', err) }
    return
  }

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
    const oldRaceLanguages = builder.draft.raceAutoLanguages ?? []
    const newRaceLanguages = detail.languages.map(l => l.index)
    const userChosenLanguages = builder.draft.selectedLanguages.filter(l => !oldRaceLanguages.includes(l))
    builder.draft.raceAutoLanguages = newRaceLanguages
    builder.draft.selectedLanguages = [...new Set([...newRaceLanguages, ...userChosenLanguages])]
    builder.draft.raceSkillProficiencies = (detail.starting_proficiencies ?? [])
      .filter(p => p.index.startsWith('skill-'))
      .map(p => p.index.replace(/^skill-/, ''))
    if (detail.starting_proficiency_options) {
      builder.draft.raceProfChoices = detail.starting_proficiency_options.choose
      builder.draft.raceProfOptions = (detail.starting_proficiency_options.from?.options ?? [])
        .map(o => ({ index: o.item.index, name: o.item.name }))
    }
  } catch (err) { console.warn('[StepRace] selectRace failed:', err) }
}

async function selectSubrace(index: string, name: string) {
  builder.draft.subraceIndex = index
  builder.draft.subraceName = name
  builder.draft.subraceAbilityBonuses = {}
  if (raceEdition.value === '2024') return // 2024 subspecies have no ability bonuses
  try {
    const detail: ApiSubrace = await fiveEApi.getSubrace(index)
    builder.draft.subraceAbilityBonuses = detail.ability_bonuses.reduce((acc, ab) => {
      const key = ab.ability_score.index as keyof typeof acc
      acc[key] = (acc[key] ?? 0) + ab.bonus
      return acc
    }, {} as Record<string, number>)
  } catch (err) { console.warn('[StepRace] selectSubrace failed:', err) }
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 1200px; }
</style>
