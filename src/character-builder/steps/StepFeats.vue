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
              Select a feat. <span class="text-mist/60">Shows feats from both 2014 and 2024 SRD.</span>
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
            <p v-else-if="filteredFeats.length === 0" class="text-xs font-body text-mist/60 italic">No feats available.</p>
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto pr-1">
              <button
                v-for="feat in filteredFeats"
                :key="feat.key"
                type="button"
                class="px-3 py-2 rounded border text-left transition-all flex flex-col gap-0.5"
                :class="builder.draft.featsByLevel[asiLevel]?.featIndex === feat.index && builder.draft.featsByLevel[asiLevel]?.featEdition === feat.edition
                  ? 'border-gold-mid/50 bg-gold-dim/10'
                  : 'border-shadow hover:border-gold-dim/20 hover:bg-depths/40'"
                @click="selectFeat(asiLevel, feat.index, feat.name, feat.edition)"
              >
                <span class="flex items-center justify-between gap-1 w-full">
                  <span
                    class="font-heading text-sm tracking-wide leading-snug"
                    :class="builder.draft.featsByLevel[asiLevel]?.featIndex === feat.index && builder.draft.featsByLevel[asiLevel]?.featEdition === feat.edition ? 'text-gold-deep' : 'text-ash'"
                  >{{ feat.name }}</span>
                  <span v-if="builder.draft.featsByLevel[asiLevel]?.featIndex === feat.index && builder.draft.featsByLevel[asiLevel]?.featEdition === feat.edition" class="text-gold-dim shrink-0">✓</span>
                </span>
                <span
                  class="text-2xs font-heading"
                  :class="feat.edition === '2024' ? 'text-arcane-pale/50' : 'text-gold-dim/50'"
                >{{ feat.edition }} SRD</span>
              </button>
            </div>

            <!-- Feat description preview -->
            <Transition name="feat-desc">
              <div
                v-if="previewFeat && (builder.draft.featsByLevel[asiLevel]?.featIndex === previewFeat.index && builder.draft.featsByLevel[asiLevel]?.featEdition === previewFeat.edition)"
                class="rounded border border-gold-dim/20 bg-depths/40 px-3 py-3 space-y-1.5"
              >
                <div v-if="previewFeatLoading" class="space-y-1.5">
                  <div class="h-3 skeleton rounded-sm w-2/5" />
                  <div class="h-3 skeleton rounded-sm w-4/5" />
                  <div class="h-3 skeleton rounded-sm w-3/5" />
                </div>
                <!-- 2014 feat preview -->
                <template v-else-if="previewFeat2014">
                  <div class="flex items-center gap-2">
                    <p class="font-heading text-sm text-gold-mid">{{ previewFeat2014.name }}</p>
                    <span class="text-2xs font-heading px-1.5 py-0.5 rounded border border-gold-dim/30 text-gold-dim/70 bg-gold-dim/8 shrink-0">2014 SRD</span>
                  </div>
                  <div v-if="format2014Prerequisites(previewFeat2014)" class="flex items-start gap-2">
                    <span class="text-2xs font-heading tracking-wide uppercase text-mist/60 shrink-0 mt-px">Requires</span>
                    <span class="font-body text-xs text-stone">{{ format2014Prerequisites(previewFeat2014) }}</span>
                  </div>
                  <p v-for="(line, i) in previewFeat2014.desc" :key="i" class="font-body text-xs text-ash leading-relaxed">{{ line }}</p>
                </template>
                <!-- 2024 feat preview -->
                <template v-else-if="previewFeat2024">
                  <div class="flex items-center gap-2">
                    <p class="font-heading text-sm text-gold-mid">{{ previewFeat2024.name }}</p>
                    <span class="text-2xs font-heading px-1.5 py-0.5 rounded border border-arcane-base/30 text-arcane-pale/70 bg-arcane-deep/10 shrink-0">2024 SRD</span>
                  </div>
                  <div v-if="format2024Prerequisites(previewFeat2024)" class="flex items-start gap-2">
                    <span class="text-2xs font-heading tracking-wide uppercase text-mist/60 shrink-0 mt-px">Requires</span>
                    <span class="font-body text-xs text-stone">{{ format2024Prerequisites(previewFeat2024) }}</span>
                  </div>
                  <p class="font-body text-xs text-ash leading-relaxed whitespace-pre-line">{{ previewFeat2024.description }}</p>
                </template>
              </div>
            </Transition>

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
import type { ApiFeat, Api2024Feat, EditionTag } from '@/shared/types/api'
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

// ── Feat picker — merged 2014 + 2024 ─────────────────────────────────────────

const featSearch = ref('')

const { data: featData2014, isPending: featsLoading2014 } = useQuery({
  queryKey: ['feats-2014'],
  queryFn: () => fiveEApi.listFeats2014(),
  staleTime: Infinity,
})
const { data: featData2024, isPending: featsLoading2024 } = useQuery({
  queryKey: ['feats-2024'],
  queryFn: () => fiveEApi.listFeats2024(),
  staleTime: Infinity,
})

const featsLoading = computed(() => featsLoading2014.value || featsLoading2024.value)

// Merged list with edition tag. Composite key = `${edition}:${index}`
const allFeats = computed(() => [
  ...(featData2014.value?.results ?? []).map(f => ({ ...f, edition: '2014' as EditionTag, key: `2014:${f.index}` })),
  ...(featData2024.value?.results ?? []).map(f => ({ ...f, edition: '2024' as EditionTag, key: `2024:${f.index}` })),
])

// Static prerequisites for 2014 feats (2024 prereqs fetched from API on selection)
const FEAT_PREREQUISITES_2014: Record<string, { ability_score: { index: string; name: string }; minimum_score: number }[]> = {
  athlete:             [{ ability_score: { index: 'str', name: 'Strength' },     minimum_score: 13 }],
  'defensive-duelist': [{ ability_score: { index: 'dex', name: 'Dexterity' },   minimum_score: 13 }],
  grappler:            [{ ability_score: { index: 'str', name: 'Strength' },     minimum_score: 13 }],
  'inspiring-leader':  [{ ability_score: { index: 'cha', name: 'Charisma' },    minimum_score: 13 }],
  'keen-mind':         [{ ability_score: { index: 'int', name: 'Intelligence' }, minimum_score: 13 }],
  linguist:            [{ ability_score: { index: 'int', name: 'Intelligence' }, minimum_score: 13 }],
  observant:           [{ ability_score: { index: 'int', name: 'Intelligence' }, minimum_score: 13 }],
  skulker:             [{ ability_score: { index: 'dex', name: 'Dexterity' },   minimum_score: 13 }],
}

function featMeetsPrerequisites(featIndex: string, edition: EditionTag): boolean {
  if (edition === '2014') {
    const prerequisites = FEAT_PREREQUISITES_2014[featIndex]
    if (!prerequisites || prerequisites.length === 0) return true
    const scores = builder.effectiveScores
    return prerequisites.every(prereq => scores[prereq.ability_score.index as keyof AbilityScores] >= prereq.minimum_score)
  }
  // 2024 prerequisites checked from API data after selection; show all by default
  return true
}

const filteredFeats = computed(() => {
  const q = featSearch.value.toLowerCase().trim()
  const list = q ? allFeats.value.filter(f => f.name.toLowerCase().includes(q)) : allFeats.value
  return list.filter(f => featMeetsPrerequisites(f.index, f.edition))
})

// ── Feat preview — handles both 2014 (desc[]) and 2024 (description string) ──

type PreviewKey = { index: string; edition: EditionTag } | null
const previewFeat = ref<PreviewKey>(null)

const { data: previewFeat2014Data, isPending: previewLoading2014 } = useQuery({
  queryKey: computed(() => ['feat-2014', previewFeat.value?.index]),
  queryFn:  () => fiveEApi.getFeat2014(previewFeat.value!.index),
  staleTime: Infinity,
  enabled: computed(() => !!previewFeat.value && previewFeat.value.edition === '2014'),
})
const { data: previewFeat2024Data, isPending: previewLoading2024 } = useQuery({
  queryKey: computed(() => ['feat-2024', previewFeat.value?.index]),
  queryFn:  () => fiveEApi.getFeat2024(previewFeat.value!.index),
  staleTime: Infinity,
  enabled: computed(() => !!previewFeat.value && previewFeat.value.edition === '2024'),
})

// Only check the relevant query's loading state — disabled queries in TanStack Query v5
// report isPending:true even though they never fetch, which would hide the data forever.
const previewFeatLoading = computed(() => {
  if (!previewFeat.value) return false
  return previewFeat.value.edition === '2014' ? previewLoading2014.value : previewLoading2024.value
})
const previewFeat2014 = computed(() => previewFeat.value?.edition === '2014' ? previewFeat2014Data.value ?? null : null)
const previewFeat2024 = computed(() => previewFeat.value?.edition === '2024' ? previewFeat2024Data.value ?? null : null)

function format2014Prerequisites(feat: ApiFeat): string {
  return feat.prerequisites.map(p => {
    if (p.ability_score && p.minimum_score != null) return `${p.ability_score.name} ${p.minimum_score}+`
    if (p.proficiency) return `Proficiency: ${p.proficiency.name}`
    if (p.minimum_level) return `Level ${p.minimum_level}+`
    return ''
  }).filter(Boolean).join(' · ')
}

function format2024Prerequisites(feat: Api2024Feat): string {
  const parts: string[] = []
  if (feat.prerequisites?.minimum_level) parts.push(`Level ${feat.prerequisites.minimum_level}+`)
  if (feat.prerequisite_options) {
    const opts = (feat.prerequisite_options.from?.options ?? [])
      .map((o: { ability_score?: { name: string }; minimum_score?: number }) =>
        o.ability_score ? `${o.ability_score.name} ${o.minimum_score ?? ''}+` : ''
      )
      .filter(Boolean)
    if (opts.length) parts.push(`${feat.prerequisite_options.desc || opts.join(' or ')}`)
  }
  return parts.join(' · ')
}

// ── ASI/Feat type per level ───────────────────────────────────────────────────

function getType(asiLevel: number): 'asi' | 'feat' {
  return builder.draft.featsByLevel[asiLevel]?.type ?? 'asi'
}

function setType(asiLevel: number, type: 'asi' | 'feat') {
  builder.setFeatDecision(asiLevel, type)
}

function selectFeat(asiLevel: number, index: string, name: string, edition: EditionTag) {
  builder.setFeatDecision(asiLevel, 'feat', { index, name, edition })
  previewFeat.value = { index, edition }
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

<style scoped>
.feat-desc-enter-active, .feat-desc-leave-active { transition: all 0.2s ease; }
.feat-desc-enter-from, .feat-desc-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
