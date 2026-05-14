<template>
  <div class="space-y-10">

    <!-- ── Class Features ─────────────────────────────────────────────────── -->
    <section>
      <div class="rule-gold mb-5">
        <span class="text-gold-mid">{{ character.identity.class.name }} Features</span>
        <span class="text-mist text-xs ml-2">Level {{ character.combat.level }}</span>
      </div>

      <div v-if="classPending" class="space-y-2">
        <div v-for="i in 5" :key="i" class="card p-4 animate-pulse">
          <div class="h-3.5 bg-mist/10 rounded w-2/5 mb-2" />
          <div class="h-3 bg-mist/10 rounded w-3/5" />
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

    <!-- ── Race & Subrace Traits ──────────────────────────────────────────── -->
    <section>
      <div class="rule-gold mb-5">
        <span class="text-gold-mid">{{ character.identity.race.name }} Traits</span>
        <span v-if="character.identity.subrace" class="text-mist text-xs ml-2">
          · {{ character.identity.subrace.name }}
        </span>
      </div>

      <div v-if="racePending" class="space-y-2">
        <div v-for="i in 3" :key="i" class="card p-4 animate-pulse">
          <div class="h-3.5 bg-mist/10 rounded w-2/5" />
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

    <!-- ── Background Feature ─────────────────────────────────────────────── -->
    <section v-if="bgData || bgPending">
      <div class="rule-gold mb-5">
        <span class="text-gold-mid">Background: {{ character.identity.background.name }}</span>
      </div>

      <div v-if="bgPending" class="card p-4 animate-pulse">
        <div class="h-3.5 bg-mist/10 rounded w-2/5 mb-2" />
        <div class="h-3 bg-mist/10 rounded w-3/5" />
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
import type { Character } from '@/shared/types/character'
import type { ApiTrait } from '@/shared/types/api'
import FeatureRow from './FeatureRow.vue'

const props = defineProps<{ character: Character }>()

// ── Expanded state ────────────────────────────────────────────────────────────

const expanded = ref<Set<string>>(new Set())
function toggleExpand(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
  // trigger reactivity
  expanded.value = new Set(expanded.value)
}

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
  queryFn: async () => {
    const levels = await fiveEApi.getClassLevels(classIndex.value)
    // Collect feature refs up to character level, deduplicated
    const seen = new Set<string>()
    const refs: { index: string; level: number }[] = []
    for (const lvl of levels) {
      if (lvl.level > characterLevel.value) continue
      for (const f of lvl.features) {
        if (!seen.has(f.index)) {
          seen.add(f.index)
          refs.push({ index: f.index, level: lvl.level })
        }
      }
    }
    // Fetch full details in parallel
    const features = await Promise.all(refs.map(r => fiveEApi.getFeature(r.index)))
    return features.filter(f =>
      f.subclass === null || f.subclass.index === subclassIndex.value,
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

const raceIndex = computed(() => props.character.identity.race.index)
const subraceIndex = computed(() => props.character.identity.subrace?.index ?? null)

const {
  isPending: racePending,
  isError: raceError,
  data: raceData,
  refetch: raceRefetch,
} = useQuery({
  queryKey: computed(() => ['race-traits', raceIndex.value, subraceIndex.value]),
  queryFn: async () => {
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
  if (subraceIndex.value && trait.subraces.some(s => s.index === subraceIndex.value)) {
    return props.character.identity.subrace!.name
  }
  return props.character.identity.race.name
}

// ── Background feature ────────────────────────────────────────────────────────

const bgIndex = computed(() => props.character.identity.background.index)

const { isPending: bgPending, data: bgData } = useQuery({
  queryKey: computed(() => ['background', bgIndex.value]),
  queryFn: () => fiveEApi.getBackground(bgIndex.value),
  staleTime: Infinity,
})
</script>
