<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <!-- Class picker -->
    <section class="space-y-4">
      <div class="rule-gold"><span>Class</span></div>

      <div v-if="classesLoading" class="flex justify-center py-8">
        <GrimoireSpinner label="Loading classes" />
      </div>
      <div v-else-if="classesError" class="text-sm text-blood-bright">Failed to load classes.</div>
      <template v-else>
        <!-- 2014 Classes -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <PickerCard
            v-for="cls in classes2014"
            :key="`2014:${cls.index}`"
            :name="cls.name"
            :glyph="getClassMeta(cls.index).glyph"
            :flavor="getClassMeta(cls.index).flavor"
            :tags="getClassMeta(cls.index).tags.slice(0, 2)"
            :stats="`d${getClassMeta(cls.index).hitDie}`"
            :selected="builder.draft.classIndex === cls.index && builder.draft.classEdition === '2014'"
            :edition="cls.edition"
            show-info
            @select="selectClass(cls.index, cls.name, cls.edition)"
            @info="infoPanel.open({ kind: 'class', index: cls.index })"
          />
        </div>

        <!-- 2014 / 2024 separator -->
        <div v-if="classes2024.length" class="flex items-center gap-3 py-1">
          <div class="flex-1 h-px bg-shadow/50" />
          <span class="text-2xs font-heading tracking-widest uppercase text-arcane-pale/50">2024 Classes</span>
          <div class="flex-1 h-px bg-shadow/50" />
        </div>

        <!-- 2024 Classes -->
        <div v-if="classes2024.length" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <PickerCard
            v-for="cls in classes2024"
            :key="`2024:${cls.index}`"
            :name="cls.name"
            :glyph="getClassMeta(cls.index).glyph"
            :flavor="getClassMeta(cls.index).flavor"
            :tags="getClassMeta(cls.index).tags.slice(0, 2)"
            :stats="`d${getClassMeta(cls.index).hitDie}`"
            :selected="builder.draft.classIndex === cls.index && builder.draft.classEdition === '2024'"
            :edition="cls.edition"
            show-info
            @select="selectClass(cls.index, cls.name, cls.edition)"
            @info="infoPanel.open({ kind: 'class', index: cls.index })"
          />
        </div>
      </template>

      <p v-if="showValidation && !builder.draft.classIndex" class="text-xs font-body text-blood-bright">
        Selecciona una clase para continuar.
      </p>

      <!-- Class detail panel -->
      <Transition name="fade">
        <div
          v-if="builder.draft.classIndex"
          class="card p-5 border-gold-dim/20"
          style="background: linear-gradient(135deg, rgba(212,168,67,0.04) 0%, transparent 60%)"
        >
          <div class="flex items-start gap-4 flex-wrap">
            <div class="text-3xl leading-none">{{ getClassMeta(builder.draft.classIndex).glyph }}</div>
            <div class="flex-1 min-w-0">
              <p class="font-heading text-lg text-vellum">{{ builder.draft.className }}</p>
              <p class="font-body text-sm text-ash mt-0.5">{{ getClassMeta(builder.draft.classIndex).flavor }}</p>
              <div class="flex gap-4 mt-3 text-xs font-heading text-mist">
                <span>Hit Die: <span class="text-gold-mid">d{{ builder.draft.classHitDie }}</span></span>
                <span>Primary: <span class="text-stone">{{ getClassMeta(builder.draft.classIndex).primaryAbility }}</span></span>
                <span>Saves: <span class="text-stone">{{ getClassMeta(builder.draft.classIndex).saves }}</span></span>
                <span v-if="builder.isSpellcaster" class="text-arcane-pale">✶ Spellcaster</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Subclass picker -->
      <Transition name="expand">
        <div v-if="builder.draft.availableSubclasses.length > 0" class="space-y-2">
          <div class="flex items-center gap-2">
            <label class="label mb-0">Subclass</label>
            <span v-if="builder.draft.level < 3" class="text-2xs font-body text-mist/60">(unlocks at level 3 — set in Step II)</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="sub in builder.draft.availableSubclasses"
              :key="sub.index"
              type="button"
              class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
              :class="builder.draft.subclassIndex === sub.index
                ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-deep'
                : 'border-gold-dim/25 bg-depths text-stone hover:border-gold-dim/50 hover:text-vellum hover:bg-gold-dim/5'"
              @click="toggleSubclass(sub.index, sub.name)"
            >
              {{ sub.name }}
            </button>
          </div>
          <p v-if="showValidation && !builder.draft.subclassIndex" class="text-xs font-body text-blood-bright">
            Select a subclass to continue.
          </p>

          <!-- Subclass detail -->
          <Transition name="fade">
            <div v-if="builder.draft.subclassIndex" class="mt-2 space-y-2">
              <div v-if="subclassDetailLoading" class="flex justify-center py-3">
                <GrimoireSpinner />
              </div>
              <template v-else-if="subclassDetail">
                <p class="text-2xs font-heading text-mist/60 uppercase tracking-wide">{{ subclassDetail.subclass_flavor }}</p>
                <p
                  v-for="(para, i) in subclassDetail.desc"
                  :key="i"
                  class="text-xs font-body text-ash leading-relaxed"
                >{{ para }}</p>
              </template>
            </div>
          </Transition>

          <!-- Druid Circle of the Land — land-type choice -->
          <Transition name="expand">
            <div v-if="isDruidLand" class="mt-3 space-y-2">
              <div class="flex items-center gap-2">
                <label class="label mb-0">Land Type</label>
                <span class="text-2xs font-body text-mist/60">determines your Circle Spells</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="opt in landTypeOptions"
                  :key="opt.value"
                  type="button"
                  class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
                  :class="builder.draft.druidLandType === opt.value
                    ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-deep'
                    : 'border-gold-dim/25 bg-depths text-stone hover:border-gold-dim/50 hover:text-vellum hover:bg-gold-dim/5'"
                  @click="builder.draft.druidLandType = opt.value"
                >{{ opt.label }}</button>
              </div>
              <p v-if="showValidation && !builder.draft.druidLandType" class="text-xs font-body text-blood-bright">
                Choose a land type to continue.
              </p>
            </div>
          </Transition>
        </div>
      </Transition>
    </section>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useBuilderStore } from '@/character-builder/builderStore'
import { getClassMeta } from '@/character-builder/classMeta'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import type { ApiClass, ApiProfChoiceOption, ApiSubclass } from '@/shared/types/api'
import type { EditionTag } from '@/shared/types/api'
import PickerCard from '@/character-builder/components/PickerCard.vue'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()

const { data: classList2014, isPending: classesLoading2014, isError: classesError2014 } = useQuery({
  queryKey: ['classes-2014'],
  queryFn: () => fiveEApi.listClasses(),
  staleTime: Infinity,
})
const { data: classList2024, isPending: classesLoading2024 } = useQuery({
  queryKey: ['classes-2024'],
  queryFn: () => fiveEApi.listClasses2024(),
  staleTime: Infinity,
})

const classesLoading = computed(() => classesLoading2014.value || classesLoading2024.value)
const classesError   = computed(() => classesError2014.value)

const classes2014 = computed(() =>
  (classList2014.value?.results ?? []).map(c => ({ ...c, edition: '2014' as EditionTag }))
)
const classes2024 = computed(() =>
  (classList2024.value?.results ?? []).map(c => ({ ...c, edition: '2024' as EditionTag }))
)

// Selected class edition (tracked separately from index since same index exists in both)
const selectedEdition = computed(() => builder.draft.classEdition ?? '2014')

const subclassIndex = computed(() => builder.draft.subclassIndex)
const { data: subclassDetail, isPending: subclassDetailLoading } = useQuery({
  queryKey: computed(() => ['subclass-detail', subclassIndex.value, selectedEdition.value]),
  queryFn: () => selectedEdition.value === '2024'
    ? fiveEApi.getSubclass2024(subclassIndex.value) as Promise<ApiSubclass>
    : fiveEApi.getSubclass(subclassIndex.value) as Promise<ApiSubclass>,
  staleTime: Infinity,
  enabled: computed(() => !!subclassIndex.value),
})

async function selectClass(index: string, name: string, edition: EditionTag) {
  builder.draft.classIndex = index
  builder.draft.className = name
  builder.draft.classEdition = edition
  builder.draft.subclassIndex = ''
  builder.draft.subclassName = ''
  builder.draft.availableSubclasses = []

  const meta = getClassMeta(index)
  builder.draft.classHitDie = meta.hitDie
  builder.draft.selectedSkills = []

  try {
    const detail: ApiClass = edition === '2024'
      ? await fiveEApi.getClass2024(index)
      : await fiveEApi.getClass(index)
    builder.draft.classSpellcastingAbility = detail.spellcasting?.spellcasting_ability?.index ?? null
    builder.draft.availableSubclasses = detail.subclasses.map(s => ({ index: s.index, name: s.name }))

    const skillChoice = detail.proficiency_choices?.find(c =>
      c.from.options.some((o: ApiProfChoiceOption) => o.item?.index?.startsWith('skill-'))
    )
    builder.draft.classSkillChoices = skillChoice?.choose ?? 2
    builder.draft.classSkillOptions = skillChoice
      ? skillChoice.from.options
          .filter((o: ApiProfChoiceOption) => o.item?.index?.startsWith('skill-'))
          .map((o: ApiProfChoiceOption) => o.item.index.replace(/^skill-/, ''))
      : []
  } catch { /* ignore */ }
}

// Druid Circle of the Land: spells are gated by a chosen land type (feature prereq).
const isDruidLand = computed(() =>
  builder.draft.classIndex === 'druid' && builder.draft.subclassSpells.some(s => s.feature),
)
const landTypeOptions = computed(() => {
  const feats = [...new Set(builder.draft.subclassSpells.map(s => s.feature).filter(Boolean) as string[])]
  return feats
    .map(f => ({ value: f, label: f.replace(/^Circle of the Land:\s*/i, '') }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

function toggleSubclass(index: string, name: string) {
  if (builder.draft.subclassIndex === index) {
    builder.draft.subclassIndex = ''
    builder.draft.subclassName = ''
    builder.draft.subclassSpells = []
    builder.draft.druidLandType = ''
  } else {
    builder.draft.subclassIndex = index
    builder.draft.subclassName = name
  }
}

// Capture subclass-granted spells (2014 spellcasting subclasses) into the draft.
// Each entry keeps the unlock level (class level) and, for Druid Circle of the Land,
// the land-type feature gate. Actual spell levels are resolved later (build / pickers).
watch(subclassDetail, (detail) => {
  if (!builder.draft.subclassIndex || detail?.index !== builder.draft.subclassIndex) return
  builder.draft.subclassSpells = (detail.spells ?? []).map(s => {
    const lvl  = s.prerequisites.find(p => p.type === 'level')
    const feat = s.prerequisites.find(p => p.type === 'feature')
    return {
      index: s.spell.index,
      name: s.spell.name,
      unlockLevel: lvl ? (parseInt(lvl.name.replace(/\D+/g, ''), 10) || 1) : 1,
      feature: feat?.name,
    }
  })
  // Drop a stale land-type pick if it's no longer offered
  const features = new Set(builder.draft.subclassSpells.map(s => s.feature).filter(Boolean) as string[])
  if (builder.draft.druidLandType && !features.has(builder.draft.druidLandType)) {
    builder.draft.druidLandType = ''
  }
}, { immediate: true })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(4px); }

.expand-enter-active, .expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 400px; }
</style>
