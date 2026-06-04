<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <!-- Background picker -->
    <section class="space-y-4">
      <div class="rule-gold"><span>Background</span></div>

      <div v-if="backgroundsLoading" class="flex justify-center py-8">
        <GrimoireSpinner />
      </div>
      <div v-else-if="backgroundsError" class="text-sm text-blood-bright">Failed to load backgrounds.</div>
      <template v-else>
        <!-- 2014 Backgrounds -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div
            v-for="bg in backgrounds2014"
            :key="`2014:${bg.index}`"
            class="group relative flex items-center rounded border text-sm font-heading tracking-wide transition-all duration-150 cursor-pointer"
            :class="builder.draft.backgroundIndex === bg.index && builder.draft.backgroundEdition === '2014'
              ? 'border-gold-mid/60 bg-gold-dim/10 text-gold-deep'
              : 'border-shadow bg-abyss text-ash hover:border-gold-dim/25 hover:text-stone hover:bg-depths'"
            @click="selectBackground(bg.index, bg.name, '2014')"
          >
            <span class="flex-1 px-4 py-3 text-left">{{ bg.name }}</span>
            <button
              type="button"
              class="shrink-0 px-2.5 py-3 text-mist/60 hover:text-ash opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Background details"
              @click.stop="infoPanel.open({ kind: 'background', index: bg.index })"
            >
              <InfoIcon :size="12" />
            </button>
          </div>

          <!-- Custom background tile -->
          <div
            class="flex items-center rounded border text-sm font-heading tracking-wide transition-all duration-150 cursor-pointer"
            :class="isCustom
              ? 'border-arcane-base/60 bg-arcane-deep/10 text-arcane-pale'
              : 'border-shadow border-dashed bg-abyss text-mist hover:border-arcane-base/30 hover:text-ash hover:bg-depths'"
            @click="selectCustom"
          >
            <span class="flex-1 px-4 py-3 text-left flex items-center gap-2">
              <PencilIcon :size="12" class="shrink-0 opacity-60" />
              Custom
            </span>
          </div>
        </div>

        <!-- 2014 / 2024 separator -->
        <div v-if="backgrounds2024.length" class="flex items-center gap-3 py-1">
          <div class="flex-1 h-px bg-shadow/50" />
          <span class="text-2xs font-heading tracking-widest uppercase text-arcane-pale/50">2024 Backgrounds</span>
          <div class="flex-1 h-px bg-shadow/50" />
        </div>

        <!-- 2024 Backgrounds -->
        <div v-if="backgrounds2024.length" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div
            v-for="bg in backgrounds2024"
            :key="`2024:${bg.index}`"
            class="group relative flex items-center rounded border text-sm font-heading tracking-wide transition-all duration-150 cursor-pointer"
            :class="builder.draft.backgroundIndex === bg.index && builder.draft.backgroundEdition === '2024'
              ? 'border-arcane-base/60 bg-arcane-deep/10 text-arcane-pale'
              : 'border-shadow bg-abyss text-ash hover:border-arcane-base/15 hover:text-stone hover:bg-depths'"
            @click="selectBackground(bg.index, bg.name, '2024')"
          >
            <span class="flex-1 px-4 py-3 text-left">{{ bg.name }}</span>
            <span class="text-2xs font-heading text-arcane-pale/50 px-1 shrink-0">24</span>
            <button
              type="button"
              class="shrink-0 px-2.5 py-3 text-mist/60 hover:text-ash opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Background details"
              @click.stop="infoPanel.open({ kind: 'background', index: bg.index })"
            >
              <InfoIcon :size="12" />
            </button>
          </div>
        </div>
      </template>
      <p v-if="fieldErrors.background" class="text-xs font-body text-blood-bright">
        {{ fieldErrors.backgroundMessage }}
      </p>
    </section>

    <!-- Custom background form -->
    <Transition name="expand">
      <section v-if="isCustom" class="space-y-5">
        <div class="rule-gold"><span>Custom Background</span></div>

        <!-- Name -->
        <div class="space-y-1.5">
          <label class="text-2xs font-heading tracking-wide uppercase text-mist">Background Name</label>
          <input
            v-model.trim="builder.draft.backgroundName"
            type="text"
            maxlength="80"
            placeholder="e.g. Haunted Wanderer"
            class="input-base w-full text-sm"
          />
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-2xs font-heading tracking-wide uppercase text-mist">Description <span class="normal-case font-body text-mist/50">(optional)</span></label>
          <textarea
            v-model.trim="builder.draft.backgroundDescription"
            rows="4"
            maxlength="1000"
            placeholder="Describe your character's background story, feature, or special ability…"
            class="input-base w-full text-sm resize-none"
          />
        </div>

        <!-- Skill picker (choose 2) -->
        <div class="space-y-2">
          <div class="flex items-baseline gap-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Skill Proficiencies</p>
            <span class="text-2xs font-body text-mist/50">Choose 2</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              v-for="skill in SKILLS"
              :key="skill.index"
              type="button"
              class="text-left px-3 py-2 rounded border text-xs font-heading tracking-wide transition-all duration-100"
              :class="isSkillSelected(skill.index)
                ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale'
                : customSkillCount >= 2
                  ? 'border-shadow/40 text-mist/40 cursor-not-allowed'
                  : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone'"
              :disabled="!isSkillSelected(skill.index) && customSkillCount >= 2"
              @click="toggleCustomSkill(skill.index)"
            >
              {{ skill.name }}
              <span class="text-mist/40 font-body normal-case">{{ skill.ability.toUpperCase() }}</span>
            </button>
          </div>
        </div>

        <!-- Languages note -->
        <div class="flex items-start gap-2 px-3 py-2 rounded border border-shadow/40 bg-depths/20">
          <span class="text-gold-dim/60 text-xs shrink-0 mt-0.5">ℹ</span>
          <p class="text-xs font-body text-mist">
            Custom backgrounds grant
            <span class="text-stone font-heading">2</span>
            languages of your choice. You will select them in Step VII — Proficiencies.
          </p>
        </div>
      </section>
    </Transition>

    <!-- Standard background detail panel -->
    <Transition name="expand">
      <section v-if="builder.draft.backgroundIndex && !isCustom" class="space-y-5">
        <div class="rule-gold"><span>Background Details</span></div>

        <div v-if="bgDetailLoading" class="flex justify-center py-4">
          <GrimoireSpinner />
        </div>

        <template v-else-if="bgDetail">
          <!-- Feature (2014) -->
          <div v-if="bgDetail.feature" class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Feature</p>
            <div class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-1">
              <p class="text-sm font-heading text-vellum">{{ bgDetail.feature.name }}</p>
              <p
                v-for="(line, i) in bgDetail.feature.desc"
                :key="i"
                class="text-xs font-body text-ash leading-relaxed"
              >{{ line }}</p>
            </div>
          </div>

          <!-- Origin Feat + Ability Scores (2024) -->
          <div v-if="bgDetail.feat" class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Origin Feat</p>
            <span class="inline-block px-2.5 py-1 rounded border border-arcane-base/30 bg-arcane-deep/10 text-xs font-heading text-arcane-pale">
              {{ bgDetail.feat.name }}
            </span>
          </div>
          <div v-if="bgDetail.ability_scores?.length" class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Ability Scores</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="ab in bgDetail.ability_scores"
                :key="ab.index"
                class="px-2 py-0.5 rounded border border-gold-dim/25 bg-gold-dim/8 text-xs font-heading text-gold-dim"
              >{{ ab.name }}</span>
            </div>
            <p class="text-2xs font-body text-mist/60 italic">2024 backgrounds let you increase these ability scores (+2/+1 or +1/+1/+1).</p>
          </div>

          <!-- Auto proficiencies -->
          <div class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Proficiencies</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="prof in skillProfs"
                :key="prof.index"
                class="px-2 py-0.5 rounded border border-gold-dim/25 bg-gold-dim/8 text-xs font-heading text-gold-dim"
              >{{ prof.name }}</span>
              <span
                v-for="prof in toolProfs"
                :key="prof.index"
                class="px-2 py-0.5 rounded border border-shadow text-xs font-heading text-ash"
              >{{ prof.name }}</span>
            </div>
          </div>

          <!-- Language options -->
          <div v-if="bgDetail.language_options?.choose" class="flex items-start gap-2 px-3 py-2 rounded border border-shadow/40 bg-depths/20">
            <span class="text-gold-dim/60 text-xs shrink-0 mt-0.5">ℹ</span>
            <p class="text-xs font-body text-mist">
              This background grants
              <span class="text-stone font-heading">{{ bgDetail.language_options.choose }}</span>
              language{{ bgDetail.language_options.choose !== 1 ? 's' : '' }} of your choice.
              You will select them in Step VII — Proficiencies.
            </p>
          </div>

          <!-- Starting equipment -->
          <div v-if="bgDetail.starting_equipment.length || bgDetail.starting_equipment_options.length" class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Starting Equipment</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="eq in bgDetail.starting_equipment"
                :key="eq.equipment.index"
                class="px-2 py-0.5 rounded border border-shadow text-xs font-body text-stone"
              >{{ eq.quantity > 1 ? `${eq.quantity}× ` : '' }}{{ eq.equipment.name }}</span>
              <span v-if="bgDetail.starting_equipment_options.length" class="px-2 py-0.5 rounded border border-shadow/40 text-xs font-body text-mist italic">
                + {{ bgDetail.starting_equipment_options.length }} equipment choice{{ bgDetail.starting_equipment_options.length !== 1 ? 's' : '' }} (Step IX)
              </span>
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
import { InfoIcon, PencilIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { useBuilderStore } from '@/character-builder/builderStore'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import { SKILLS } from '@/shared/lib/skillAbilityMap'
import type { ApiBackground } from '@/shared/types/api'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()

const isCustom = computed(() => builder.draft.backgroundIndex === 'custom')

const fieldErrors = computed(() => ({
  background: showValidation.value && (
    !builder.draft.backgroundIndex ||
    (isCustom.value && (!builder.draft.backgroundName.trim() || builder.draft.backgroundSkillProficiencies.length < 2))
  ),
  backgroundMessage: !builder.draft.backgroundIndex
    ? 'Select a background to continue.'
    : !builder.draft.backgroundName.trim()
      ? 'Enter a name for your custom background.'
      : 'Choose 2 skills for your custom background.',
}))

const { data: bgList2014, isPending: backgroundsLoading2014, isError: backgroundsError } = useQuery({
  queryKey: ['backgrounds-2014'],
  queryFn: () => fiveEApi.listBackgrounds(),
  staleTime: Infinity,
})
const { data: bgList2024, isPending: backgroundsLoading2024 } = useQuery({
  queryKey: ['backgrounds-2024'],
  queryFn: () => fiveEApi.listBackgrounds2024(),
  staleTime: Infinity,
})
const backgroundsLoading = computed(() => backgroundsLoading2014.value || backgroundsLoading2024.value)
const backgrounds2014 = computed(() => bgList2014.value?.results ?? [])
const backgrounds2024 = computed(() => bgList2024.value?.results ?? [])

// ── Background detail (standard only) ────────────────────────────────────────

const bgIndex = computed(() => isCustom.value ? '' : builder.draft.backgroundIndex)
const bgEdition = computed(() => builder.draft.backgroundEdition ?? '2014')

const { data: bgDetail, isPending: bgDetailLoading } = useQuery({
  queryKey: computed(() => [bgEdition.value, 'background-detail', bgIndex.value]),
  queryFn: () => bgEdition.value === '2024'
    ? fiveEApi.getBackground2024(bgIndex.value) as Promise<ApiBackground>
    : fiveEApi.getBackground(bgIndex.value) as Promise<ApiBackground>,
  staleTime: Infinity,
  enabled: computed(() => !!bgIndex.value),
})

const skillProfs = computed(() =>
  (bgDetail.value?.starting_proficiencies ?? []).filter(p => p.index.startsWith('skill-')),
)
const toolProfs = computed(() =>
  (bgDetail.value?.starting_proficiencies ?? []).filter(p => !p.index.startsWith('skill-')),
)

// ── Custom skill picker ───────────────────────────────────────────────────────

const customSkillCount = computed(() => builder.draft.backgroundSkillProficiencies.length)

function isSkillSelected(index: string): boolean {
  return builder.draft.backgroundSkillProficiencies.includes(index)
}

function toggleCustomSkill(index: string) {
  const current = builder.draft.backgroundSkillProficiencies
  if (current.includes(index)) {
    builder.draft.backgroundSkillProficiencies = current.filter(s => s !== index)
  } else if (current.length < 2) {
    builder.draft.backgroundSkillProficiencies = [...current, index]
  }
}

// ── Select handlers ───────────────────────────────────────────────────────────

function selectCustom() {
  builder.draft.backgroundIndex = 'custom'
  builder.draft.backgroundName = ''
  builder.draft.backgroundDescription = ''
  builder.draft.backgroundSkillProficiencies = []
  builder.draft.backgroundToolProficiencies = []
  builder.draft.backgroundLanguageChoices = 2
}

async function selectBackground(index: string, name: string, edition: '2014' | '2024' = '2014') {
  builder.draft.backgroundIndex = index
  builder.draft.backgroundName = name
  builder.draft.backgroundEdition = edition
  builder.draft.backgroundDescription = ''
  builder.draft.backgroundSkillProficiencies = []
  builder.draft.backgroundToolProficiencies = []

  try {
    const detail: ApiBackground = edition === '2024'
      ? await fiveEApi.getBackground2024(index)
      : await fiveEApi.getBackground(index)
    builder.draft.backgroundSkillProficiencies = (detail.starting_proficiencies ?? [])
      .filter(p => p.index.startsWith('skill-'))
      .map(p => p.index.replace(/^skill-/, ''))
    builder.draft.backgroundToolProficiencies = (detail.starting_proficiencies ?? [])
      .filter(p => !p.index.startsWith('skill-'))
      .map(p => p.name)
    builder.draft.backgroundLanguageChoices = detail.language_options?.choose ?? 0
  } catch { /* ignore */ }
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 1200px; }
</style>
