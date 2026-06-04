<template>
  <div class="space-y-10">

    <!-- ── Class Features ─────────────────────────────────────────────────── -->
    <section>
      <div class="rule-gold mb-5">
        <span>{{ character.identity.class.name }} Features</span>
        <span class="text-mist text-xs ml-2">Level {{ character.combat.level }}</span>
      </div>

      <div v-if="classPending" class="space-y-2">
        <div v-for="i in 5" :key="i" class="card p-4 flex flex-col gap-2">
          <div class="h-3.5 skeleton rounded-sm w-2/5" />
          <div class="h-3 skeleton rounded-sm w-3/5" />
        </div>
      </div>

      <div v-else-if="classError" class="card p-6 text-center">
        <p class="font-body text-ash text-sm">Failed to load class features.</p>
        <button class="btn-secondary text-xs mt-3" @click="() => classRefetch()">Retry</button>
      </div>

      <div v-else-if="classFeaturesByLevel.length === 0" class="card p-8 text-center">
        <p class="font-body text-mist text-sm">No features at level {{ character.combat.level }}.</p>
      </div>

      <div v-else class="space-y-1.5">
        <template v-for="group in classFeaturesByLevel" :key="group.level">
          <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist pt-4 pb-1 first:pt-0">
            Level {{ group.level }}
          </p>
          <FeatureRow
            v-for="feat in group.features"
            :key="feat.index"
            :name="feat.name"
            :description="feat.desc.join('\n\n')"
            :source="feat.subclass ? feat.subclass.name : character.identity.class.name"
            :is-subclass="!!feat.subclass"
            :open="expanded.has(feat.index)"
            @toggle="toggleExpand(feat.index)"
          />
        </template>
      </div>
    </section>

    <!-- ── Fighting Styles ──────────────────────────────────────────────── -->
    <section v-if="resolvedFightingStyles.length > 0">
      <div class="rule-gold mb-5">
        <span>Fighting Style</span>
      </div>
      <div class="space-y-1.5">
        <FeatureRow
          v-for="style in resolvedFightingStyles"
          :key="style.index"
          :name="style.name"
          :description="style.desc"
          source="Fighting Style"
          :open="expanded.has('fs-' + style.index)"
          @toggle="toggleExpand('fs-' + style.index)"
        />
      </div>
    </section>

    <!-- ── Choices & Feats ───────────────────────────────────────────────── -->
    <section v-if="character.features.length > 0">
      <div class="rule-gold mb-5">
        <span>Choices & Feats</span>
      </div>
      <div class="space-y-1.5">
        <FeatureRow
          v-for="feat in character.features"
          :key="feat.id"
          :name="feat.name"
          :description="feat.apiIndex && !feat.description ? (descCache[`${feat.apiEdition ?? '2024'}:${feat.apiIndex}`] ?? '') : feat.description"
          :loading="!!feat.apiIndex && !feat.description && loadingDesc[`${feat.apiEdition ?? '2024'}:${feat.apiIndex}`] === true"
          :source="feat.source ?? ''"
          :open="expanded.has(feat.id)"
          @toggle="toggleExpand(feat.id, feat)"
        />
      </div>
    </section>

    <!-- ── Race & Subrace Traits ──────────────────────────────────────────── -->
    <section>
      <div class="rule-gold mb-5">
        <span>{{ character.identity.race.name }} Traits</span>
        <span v-if="character.identity.subrace" class="text-mist text-xs ml-2">
          · {{ character.identity.subrace.name }}
        </span>
      </div>

      <div v-if="racePending" class="space-y-2">
        <div v-for="i in 3" :key="i" class="card p-4">
          <div class="h-3.5 skeleton rounded-sm w-2/5" />
        </div>
      </div>

      <div v-else-if="raceError" class="card p-6 text-center">
        <p class="font-body text-ash text-sm">Failed to load racial traits.</p>
        <button class="btn-secondary text-xs mt-3" @click="() => raceRefetch()">Retry</button>
      </div>

      <div v-else-if="allRaceTraits.length === 0" class="card p-8 text-center">
        <p class="font-body text-mist text-sm">No racial traits recorded.</p>
      </div>

      <div v-else class="space-y-1.5">
        <FeatureRow
          v-for="trait in allRaceTraits"
          :key="trait.index"
          :name="trait.name"
          :description="trait.desc.join('\n\n')"
          :source="traitSource(trait)"
          :open="expanded.has(trait.index)"
          @toggle="toggleExpand(trait.index)"
        />
      </div>
    </section>

    <!-- ── Class Mechanics ───────────────────────────────────────────────── -->
    <section v-if="hasClassMechanics">
      <div class="rule-gold mb-5">
        <span>Class Mechanics</span>
      </div>
      <div class="card p-4 space-y-3">
        <div v-for="m in classMechanics" :key="m.label" class="flex items-start gap-3">
          <span class="text-2xs font-heading tracking-[0.12em] uppercase text-mist/60 w-28 shrink-0 pt-0.5">{{ m.label }}</span>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono text-base text-gold-mid leading-none">{{ m.value }}</span>
            <span class="text-xs font-body text-ash/70 leading-snug">{{ m.detail }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Defenses & Senses ─────────────────────────────────────────────── -->
    <section v-if="hasDefenses">
      <div class="rule-gold mb-5">
        <span>Defenses &amp; Senses</span>
      </div>
      <div class="card p-4 space-y-3">
        <div v-if="character.resistances.length > 0" class="flex items-start gap-3">
          <span class="text-2xs font-heading tracking-[0.12em] uppercase text-mist/60 w-20 shrink-0 pt-0.5">Resistant</span>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="r in character.resistances"
              :key="r"
              class="px-2 py-0.5 rounded text-xs font-heading border border-arcane-base/35 text-arcane-pale bg-arcane-deep/10"
            >{{ capitalize(r) }}</span>
          </div>
        </div>
        <div v-if="character.immunities.length > 0" class="flex items-start gap-3">
          <span class="text-2xs font-heading tracking-[0.12em] uppercase text-mist/60 w-20 shrink-0 pt-0.5">Immune</span>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="r in character.immunities"
              :key="r"
              class="px-2 py-0.5 rounded text-xs font-heading border border-gold-dim/40 text-gold-mid bg-gold-dim/10"
            >{{ capitalize(r) }}</span>
          </div>
        </div>
        <div v-if="character.vulnerabilities.length > 0" class="flex items-start gap-3">
          <span class="text-2xs font-heading tracking-[0.12em] uppercase text-mist/60 w-20 shrink-0 pt-0.5">Vulnerable</span>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="r in character.vulnerabilities"
              :key="r"
              class="px-2 py-0.5 rounded text-xs font-heading border border-blood-base/40 text-blood-mid bg-blood-deep/10"
            >{{ capitalize(r) }}</span>
          </div>
        </div>
        <div v-if="character.senses.length > 0" class="flex items-start gap-3">
          <span class="text-2xs font-heading tracking-[0.12em] uppercase text-mist/60 w-20 shrink-0 pt-0.5">Senses</span>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="s in character.senses"
              :key="s"
              class="px-2 py-0.5 rounded text-xs font-heading border border-shadow text-stone"
            >{{ s }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Background Feature ─────────────────────────────────────────────── -->
    <section v-if="bgData || bgPending">
      <div class="rule-gold mb-5">
        <span>Background: {{ character.identity.background.name }}</span>
      </div>

      <div v-if="bgPending" class="card p-4 flex flex-col gap-2">
        <div class="h-3.5 skeleton rounded-sm w-2/5" />
        <div class="h-3 skeleton rounded-sm w-3/5" />
      </div>

      <FeatureRow
        v-else-if="bgData"
        :name="bgData.feature.name"
        :description="bgData.feature.desc.join('\n\n')"
        source="Background"
        :open="expanded.has('bg-feature')"
        @toggle="toggleExpand('bg-feature')"
      />
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import type { Character, TraitFeature } from '@/shared/types/character'
import type { ApiFeature, ApiTrait, Api2024Species, Api2024Subspecies } from '@/shared/types/api'
import { getFightingStyleByIndex, getSneakAttackDice } from '@/character-builder/classMeta'
import FeatureRow from './FeatureRow.vue'

const props = defineProps<{ character: Character }>()

// ── Expanded state ────────────────────────────────────────────────────────────

const expanded = ref<Set<string>>(new Set())

// Cache for lazily-fetched feat descriptions (keyed by `${edition}:${apiIndex}`)
const descCache = ref<Record<string, string>>({})
const loadingDesc = ref<Record<string, boolean>>({})

async function fetchFeatDesc(apiIndex: string, edition: '2014' | '2024' = '2024') {
  const cacheKey = `${edition}:${apiIndex}`
  if (descCache.value[cacheKey] !== undefined || loadingDesc.value[cacheKey]) return
  loadingDesc.value = { ...loadingDesc.value, [cacheKey]: true }
  try {
    let text: string
    if (edition === '2024') {
      const feat = await fiveEApi.getFeat2024(apiIndex)
      text = feat.description
    } else {
      const feat = await fiveEApi.getFeat2014(apiIndex)
      text = feat.desc.join('\n\n')
    }
    descCache.value = { ...descCache.value, [cacheKey]: text }
  } catch {
    descCache.value = { ...descCache.value, [cacheKey]: '' }
  } finally {
    loadingDesc.value = { ...loadingDesc.value, [cacheKey]: false }
  }
}

function toggleExpand(id: string, feat?: TraitFeature) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
  // trigger reactivity
  expanded.value = new Set(expanded.value)
  // Lazy-fetch description for API-backed feats with empty stored description
  if (feat?.apiIndex && !feat.description && expanded.value.has(id)) {
    fetchFeatDesc(feat.apiIndex, feat.apiEdition ?? '2024')
  }
}

// ── Defenses & senses ─────────────────────────────────────────────────────────

const hasDefenses = computed(() =>
  props.character.resistances.length > 0 ||
  props.character.immunities.length > 0 ||
  props.character.vulnerabilities.length > 0 ||
  props.character.senses.length > 0,
)

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Class mechanics (level-scaled display values) ─────────────────────────────

interface ClassMechanic { label: string; value: string; detail: string }

const classMechanics = computed((): ClassMechanic[] => {
  const cls = props.character.identity.class.index
  const lvl = props.character.combat.level
  const mechanics: ClassMechanic[] = []

  if (cls === 'rogue') {
    const dice = getSneakAttackDice(lvl)
    mechanics.push({
      label: 'Sneak Attack',
      value: `${dice}d6`,
      detail: 'Once per turn when you have advantage or an ally is adjacent to the target',
    })
  }

  return mechanics
})

const hasClassMechanics = computed(() => classMechanics.value.length > 0)

// ── Fighting styles ───────────────────────────────────────────────────────────

const resolvedFightingStyles = computed(() =>
  (props.character.fightingStyles ?? [])
    .map(idx => getFightingStyleByIndex(idx))
    .filter((s): s is NonNullable<ReturnType<typeof getFightingStyleByIndex>> => s !== null)
)

// ── Class features ────────────────────────────────────────────────────────────

const classIndex = computed(() => props.character.identity.class.index)
const characterLevel = computed(() => props.character.combat.level)
const subclassIndex = computed(() => props.character.identity.subclass?.index ?? null)

const {
  isPending: classPending,
  isError: classError,
  data: classData,
  refetch: classRefetch,
} = useQuery({
  queryKey: computed(() => ['class-features', classIndex.value, characterLevel.value]),
  enabled: computed(() => !!classIndex.value),
  queryFn: async () => {
    const levels = await fiveEApi.getClassLevels(classIndex.value)
    // Collect feature refs up to character level, deduplicated
    const seen = new Set<string>()
    const refs: string[] = []
    for (const lvl of levels) {
      if (lvl.level > characterLevel.value) continue
      for (const f of lvl.features) {
        if (!seen.has(f.index)) {
          seen.add(f.index)
          refs.push(f.index)
        }
      }
    }
    // Fetch full details in parallel; skip any that 404 or error
    const settled = await Promise.allSettled(refs.map(i => fiveEApi.getFeature(i)))
    const features = settled
      .filter((r): r is PromiseFulfilledResult<ApiFeature> => r.status === 'fulfilled')
      .map(r => r.value)
    // Keep base-class features and features matching the selected subclass
    return features.filter(f =>
      !f.subclass || f.subclass.index === subclassIndex.value,
    )
  },
  staleTime: Infinity,
})

const classFeaturesByLevel = computed(() => {
  if (!classData.value) return []
  const map = new Map<number, (typeof classData.value)>()
  for (const f of classData.value) {
    const arr = map.get(f.level) ?? []
    arr.push(f)
    map.set(f.level, arr)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([level, features]) => ({ level, features }))
})

// ── Race & subrace traits ─────────────────────────────────────────────────────

const raceIndex    = computed(() => props.character.identity.race.index)
const subraceIndex = computed(() => props.character.identity.subrace?.index ?? null)
const raceEdition  = computed(() => props.character.identity.race.edition ?? '2014')

const {
  isPending: racePending,
  isError: raceError,
  data: raceData,
  refetch: raceRefetch,
} = useQuery({
  queryKey: computed(() => ['race-traits', raceEdition.value, raceIndex.value, subraceIndex.value]),
  queryFn: async () => {
    if (raceEdition.value === '2024') {
      const species = await fiveEApi.getSpecies(raceIndex.value) as Api2024Species
      const traitRefs = [...species.traits]
      if (subraceIndex.value) {
        const subspecies = await fiveEApi.getSubspecies(subraceIndex.value) as Api2024Subspecies
        traitRefs.push(...subspecies.traits)
      }
      return Promise.all(traitRefs.map(t => fiveEApi.getTrait(t.index)))
    }
    const [race, subrace] = await Promise.all([
      fiveEApi.getRace(raceIndex.value),
      subraceIndex.value ? fiveEApi.getSubrace(subraceIndex.value) : null,
    ])
    const traitRefs = [
      ...race.traits,
      ...(subrace?.racial_traits ?? []),
    ]
    return Promise.all(traitRefs.map(t => fiveEApi.getTrait(t.index)))
  },
  staleTime: Infinity,
})

const allRaceTraits = computed(() => raceData.value ?? [])

function traitSource(trait: ApiTrait): string {
  if (raceEdition.value === '2024') {
    // For 2024 subspecies we can't match via trait.subraces — just use species name
    return props.character.identity.subrace
      ? props.character.identity.subrace.name
      : props.character.identity.race.name
  }
  if (subraceIndex.value && trait.subraces.some(s => s.index === subraceIndex.value)) {
    return props.character.identity.subrace!.name
  }
  return props.character.identity.race.name
}

// ── Background feature ────────────────────────────────────────────────────────

const bgIndex = computed(() => props.character.identity.background.index)

const { isLoading: bgPending, data: bgData } = useQuery({
  queryKey: computed(() => ['background', bgIndex.value]),
  queryFn: () => fiveEApi.getBackground(bgIndex.value),
  staleTime: Infinity,
  enabled: computed(() => !!bgIndex.value && bgIndex.value !== 'custom'),
})
</script>
