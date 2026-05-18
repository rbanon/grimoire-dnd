<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-8">
    <div class="rule-gold"><span>Feats &amp; Ability Score Improvements</span></div>

    <!-- No ASIs yet -->
    <div v-if="activeAsiLevels.length === 0" class="card p-8 text-center border-shadow/30">
      <p class="font-heading text-sm text-stone mb-1">No improvements at this level</p>
      <p class="font-body text-xs text-mist">
        {{ builder.draft.className || 'Your class' }} gains its first Ability Score Improvement at level 4.
        Increase the level in Step II to unlock them.
      </p>
    </div>

    <!-- Per-ASI-level cards -->
    <template v-else>
      <div
        v-for="asiLevel in activeAsiLevels"
        :key="asiLevel"
        class="card p-5 space-y-4"
      >
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p class="font-heading text-sm text-vellum">
              Level {{ asiLevel }} — Improvement
            </p>
            <p class="text-2xs font-body text-mist mt-0.5">Choose an Ability Score Improvement or select a feat.</p>
          </div>
          <span
            class="text-2xs font-heading px-2 py-0.5 rounded border"
            :class="isLevelComplete(asiLevel)
              ? 'border-gold-dim/40 text-gold-dim bg-gold-dim/10'
              : 'border-shadow text-mist/50'"
          >{{ isLevelComplete(asiLevel) ? 'Done' : 'Pending' }}</span>
        </div>

        <!-- Toggle ASI / Feat -->
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 px-3 py-2 rounded border text-sm font-heading tracking-wide transition-all"
            :class="getType(asiLevel) === 'asi'
              ? 'border-gold-mid/50 bg-gold-dim/10 text-gold-deep'
              : 'border-shadow text-ash hover:border-gold-dim/20'"
            @click="setType(asiLevel, 'asi')"
          >Ability Score Improvement</button>
          <button
            type="button"
            class="flex-1 px-3 py-2 rounded border text-sm font-heading tracking-wide transition-all"
            :class="getType(asiLevel) === 'feat'
              ? 'border-gold-mid/50 bg-gold-dim/10 text-gold-deep'
              : 'border-shadow text-ash hover:border-gold-dim/20'"
            @click="setType(asiLevel, 'feat')"
          >Take a Feat</button>
        </div>

        <!-- ASI allocation UI -->
        <template v-if="getType(asiLevel) === 'asi'">
          <p class="text-xs font-body text-mist">+2 to one ability, or +1 to two different abilities · max 20 per score</p>

          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <div
              v-for="ab in abilityDefs"
              :key="ab.key"
              class="flex flex-col items-center gap-1.5"
            >
              <p class="text-2xs font-heading tracking-[0.15em] text-mist uppercase">{{ ab.label }}</p>
              <div class="text-center leading-none">
                <p class="font-heading text-lg text-vellum">{{ scoreAfterAsi(asiLevel, ab.key) }}</p>
                <p v-if="asiAlloc(asiLevel, ab.key) > 0" class="text-2xs font-heading text-verdant-bright mt-0.5">
                  +{{ asiAlloc(asiLevel, ab.key) }} ASI
                </p>
                <p v-else class="text-2xs text-mist/30 mt-0.5">+0</p>
              </div>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="w-6 h-6 flex items-center justify-center rounded border text-sm font-heading transition-all"
                  :class="canDecreaseAsi(asiLevel, ab.key)
                    ? 'border-shadow text-mist hover:border-blood-base/50 hover:text-blood-mid'
                    : 'border-shadow/20 text-mist/20 cursor-not-allowed'"
                  :disabled="!canDecreaseAsi(asiLevel, ab.key)"
                  @click="changeAsi(asiLevel, ab.key, -1)"
                >−</button>
                <button
                  type="button"
                  class="w-6 h-6 flex items-center justify-center rounded border text-sm font-heading transition-all"
                  :class="canIncreaseAsi(asiLevel, ab.key)
                    ? 'border-shadow text-mist hover:border-gold-dim/50 hover:text-gold-mid'
                    : 'border-shadow/20 text-mist/20 cursor-not-allowed'"
                  :disabled="!canIncreaseAsi(asiLevel, ab.key)"
                  @click="changeAsi(asiLevel, ab.key, 1)"
                >+</button>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs font-heading text-mist">Points used:</span>
            <span
              class="text-sm font-heading tabular-nums"
              :class="asiPointsUsed(asiLevel) === 2 ? 'text-gold-mid' : asiPointsUsed(asiLevel) === 0 ? 'text-mist/50' : 'text-stone'"
            >{{ asiPointsUsed(asiLevel) }}/2</span>
          </div>

          <p v-if="showValidation && asiPointsUsed(asiLevel) < 2" class="text-xs font-body text-blood-bright">
            Allocate both improvement points at level {{ asiLevel }} ({{ asiPointsUsed(asiLevel) }}/2 assigned).
          </p>
        </template>

        <!-- Feat picker -->
        <template v-else>
          <div v-if="featsLoading" class="flex justify-center py-4">
            <GrimoireSpinner />
          </div>
          <template v-else>
            <p class="text-xs font-body text-mist">
              Select a feat from the list below.
              <span v-if="Object.keys(featDetailsMap).length > 0" class="text-mist/60">
                Feats with unmet prerequisites are hidden.
              </span>
            </p>
            <div class="relative">
              <input
                v-model="featSearch"
                type="text"
                class="input-base w-full"
                placeholder="Search feats..."
              />
            </div>
            <p v-if="filteredFeats.length === 0 && featSearch" class="text-xs font-body text-mist/60 italic">No feats match your search.</p>
            <div v-else-if="filteredFeats.length === 0" class="space-y-1.5">
              <p class="text-xs font-body text-mist/60 italic">No feats meet your current prerequisites.</p>
              <div v-for="r in unmetFeatReasons" :key="r.name" class="text-xs font-body text-mist/50">
                <span class="text-ash">{{ r.name }}</span> requires
                <span v-for="(req, i) in r.requirements" :key="i">
                  {{ req.name }} {{ req.minimum }}
                  <span class="text-mist/40">(yours: {{ req.current }})</span>{{ i < r.requirements.length - 1 ? ', ' : '' }}
                </span>
              </div>
            </div>
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto pr-1">
              <button
                v-for="feat in filteredFeats"
                :key="feat.index"
                type="button"
                class="px-3 py-2 rounded border text-sm font-heading tracking-wide text-left transition-all"
                :class="builder.draft.featsByLevel[asiLevel]?.featIndex === feat.index
                  ? 'border-gold-mid/50 bg-gold-dim/10 text-gold-deep'
                  : 'border-shadow text-ash hover:border-gold-dim/20 hover:text-stone'"
                @click="selectFeat(asiLevel, feat.index, feat.name)"
              >
                {{ feat.name }}
                <span v-if="builder.draft.featsByLevel[asiLevel]?.featIndex === feat.index" class="text-gold-dim ml-1">✓</span>
              </button>
            </div>
            <p v-if="showValidation && !builder.draft.featsByLevel[asiLevel]?.featIndex" class="text-xs font-body text-blood-bright">
              Select a feat to continue.
            </p>
          </template>
        </template>
      </div>

      <!-- All ASI levels summary -->
      <div class="card p-4 border-shadow/30 bg-depths/20">
        <p class="text-xs font-heading text-mist/60 uppercase tracking-wide mb-2">All ASI levels for {{ builder.draft.className || 'this class' }}</p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="lvl in allAsiLevels"
            :key="lvl"
            class="px-2 py-1 rounded text-xs font-heading border"
            :class="lvl <= builder.draft.level
              ? 'border-gold-dim/40 text-gold-dim'
              : 'border-shadow text-mist/40'"
          >Lv {{ lvl }}</span>
        </div>
      </div>
    </template>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useBuilderStore } from '@/character-builder/builderStore'
import { getAsiLevels } from '@/character-builder/classMeta'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import { fiveEApi } from '@/shared/api/fiveE.client'
import type { AbilityScores } from '@/shared/types/character'
import type { ApiFeat } from '@/shared/types/api'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const builder = useBuilderStore()
const { showValidation } = useBuilderValidation()

const abilityDefs = [
  { key: 'str' as const, label: 'STR' },
  { key: 'dex' as const, label: 'DEX' },
  { key: 'con' as const, label: 'CON' },
  { key: 'int' as const, label: 'INT' },
  { key: 'wis' as const, label: 'WIS' },
  { key: 'cha' as const, label: 'CHA' },
]

const allAsiLevels = computed(() => getAsiLevels(builder.draft.classIndex))
const activeAsiLevels = computed(() => allAsiLevels.value.filter(l => l <= builder.draft.level))

// ── Feat picker ───────────────────────────────────────────────────────────────

const featSearch = ref('')

const { data: featData, isPending: featsLoading } = useQuery({
  queryKey: ['feats'],
  queryFn: () => fiveEApi.listFeats(),
  staleTime: Infinity,
})
const allFeats = computed(() => featData.value?.results ?? [])

// Fetch all feat details for prerequisite filtering
const featIndices = computed(() => allFeats.value.map(f => f.index))

const { data: featDetailsList } = useQuery({
  queryKey: computed(() => ['feat-details', ...featIndices.value]),
  queryFn: () => Promise.all(featIndices.value.map(i => fiveEApi.getFeat(i))) as Promise<ApiFeat[]>,
  staleTime: Infinity,
  enabled: computed(() => featIndices.value.length > 0),
})

const featDetailsMap = computed<Record<string, ApiFeat>>(() => {
  const map: Record<string, ApiFeat> = {}
  for (const feat of featDetailsList.value ?? []) {
    map[feat.index] = feat
  }
  return map
})

function featMeetsPrerequisites(featIndex: string): boolean {
  const detail = featDetailsMap.value[featIndex]
  if (!detail || detail.prerequisites.length === 0) return true
  const scores = builder.effectiveScores
  return detail.prerequisites.every(
    prereq => scores[prereq.ability_score.index as keyof AbilityScores] >= prereq.minimum_score,
  )
}

const filteredFeats = computed(() => {
  const q = featSearch.value.toLowerCase().trim()
  const list = q ? allFeats.value.filter(f => f.name.toLowerCase().includes(q)) : allFeats.value
  if (Object.keys(featDetailsMap.value).length > 0) {
    return list.filter(f => featMeetsPrerequisites(f.index))
  }
  return list
})

const unmetFeatReasons = computed(() => {
  if (Object.keys(featDetailsMap.value).length === 0) return []
  const scores = builder.effectiveScores
  return allFeats.value
    .filter(f => !featMeetsPrerequisites(f.index))
    .map(f => {
      const detail = featDetailsMap.value[f.index]
      if (!detail) return null
      const requirements = detail.prerequisites.map(p => ({
        name: p.ability_score.name,
        minimum: p.minimum_score,
        current: scores[p.ability_score.index as keyof AbilityScores],
      }))
      return { name: f.name, requirements }
    })
    .filter(Boolean) as { name: string; requirements: { name: string; minimum: number; current: number }[] }[]
})

// ── ASI/Feat type per level ───────────────────────────────────────────────────

function getType(asiLevel: number): 'asi' | 'feat' {
  return builder.draft.featsByLevel[asiLevel]?.type ?? 'asi'
}

function setType(asiLevel: number, type: 'asi' | 'feat') {
  builder.setFeatDecision(asiLevel, type)
}

function selectFeat(asiLevel: number, index: string, name: string) {
  builder.setFeatDecision(asiLevel, 'feat', { index, name })
}

function isLevelComplete(asiLevel: number): boolean {
  const type = getType(asiLevel)
  if (type === 'feat') return !!builder.draft.featsByLevel[asiLevel]?.featIndex
  return asiPointsUsed(asiLevel) >= 2
}

// ── ASI allocation helpers ────────────────────────────────────────────────────

function asiAlloc(asiLevel: number, key: keyof AbilityScores): number {
  return builder.draft.asiAllocations[asiLevel]?.[key] ?? 0
}

function asiPointsUsed(asiLevel: number): number {
  return Object.values(builder.draft.asiAllocations[asiLevel] ?? {}).reduce((s, v) => s + v, 0)
}

function scoreBeforeAsi(asiLevel: number, key: keyof AbilityScores): number {
  const base = builder.draft.baseScores[key]
  const rb = builder.draft.raceAbilityBonuses[key] ?? 0
  const sb = builder.draft.subraceAbilityBonuses[key] ?? 0
  const prevAsiTotal = activeAsiLevels.value
    .filter(l => l < asiLevel)
    .reduce((sum, l) => sum + asiAlloc(l, key), 0)
  return base + rb + sb + prevAsiTotal
}

function scoreAfterAsi(asiLevel: number, key: keyof AbilityScores): number {
  return Math.min(20, scoreBeforeAsi(asiLevel, key) + asiAlloc(asiLevel, key))
}

function canIncreaseAsi(asiLevel: number, key: keyof AbilityScores): boolean {
  if (asiPointsUsed(asiLevel) >= 2) return false
  return scoreBeforeAsi(asiLevel, key) + asiAlloc(asiLevel, key) < 20
}

function canDecreaseAsi(asiLevel: number, key: keyof AbilityScores): boolean {
  return asiAlloc(asiLevel, key) > 0
}

function changeAsi(asiLevel: number, key: keyof AbilityScores, delta: number) {
  if (delta > 0 && !canIncreaseAsi(asiLevel, key)) return
  if (delta < 0 && !canDecreaseAsi(asiLevel, key)) return
  builder.setAsiAllocation(asiLevel, key, asiAlloc(asiLevel, key) + delta)
}
</script>
