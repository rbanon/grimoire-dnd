<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <!-- Background auto-proficiencies (read-only) -->
    <section v-if="builder.draft.backgroundName" class="space-y-4">
      <div class="rule-gold"><span>Background Proficiencies</span></div>
      <p class="text-xs font-body text-mist -mt-2">
        Automatically granted by your background — no selection needed.
      </p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="skill in bgDisplaySkills"
          :key="skill"
          class="px-2.5 py-1 rounded border border-gold-dim/25 bg-gold-dim/8 text-xs font-heading text-gold-dim"
        >{{ skill }}</span>
        <span
          v-for="tool in builder.draft.backgroundToolProficiencies"
          :key="tool"
          class="px-2.5 py-1 rounded border border-shadow/60 text-xs font-heading text-ash"
        >{{ tool }}</span>
        <span v-if="bgDisplaySkills.length === 0 && builder.draft.backgroundToolProficiencies.length === 0"
          class="text-xs font-body text-mist/50 italic">Loading…</span>
      </div>
    </section>

    <!-- Race tool proficiency choices (e.g. Dwarf artisan tool) -->
    <section v-if="builder.draft.raceProfChoices > 0" class="space-y-4">
      <div class="rule-gold">
        <span>Race Proficiency</span>
        <span
          class="text-xs ml-2 font-body"
          :class="builder.draft.selectedRaceProfs.length === builder.draft.raceProfChoices ? 'text-gold-mid' : 'text-mist'"
        >
          {{ builder.draft.selectedRaceProfs.length }}/{{ builder.draft.raceProfChoices }} selected
        </span>
      </div>
      <p class="text-xs font-body -mt-2 text-mist">
        {{ builder.draft.raceName }} grants {{ builder.draft.raceProfChoices }} tool proficiency choice{{ builder.draft.raceProfChoices > 1 ? 's' : '' }}.
      </p>
      <p v-if="showValidation && builder.draft.selectedRaceProfs.length < builder.draft.raceProfChoices" class="text-xs font-body text-blood-bright">
        Choose {{ builder.draft.raceProfChoices - builder.draft.selectedRaceProfs.length }} more tool proficiency.
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in builder.draft.raceProfOptions"
          :key="opt.index"
          type="button"
          class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
          :class="builder.draft.selectedRaceProfs.includes(opt.index)
            ? 'border-gold-mid/50 bg-gold-dim/10 text-gold-deep'
            : canSelectMoreRaceProfs || builder.draft.selectedRaceProfs.includes(opt.index)
              ? 'border-shadow text-ash hover:border-gold-dim/20 hover:text-stone'
              : 'border-shadow text-mist/40 cursor-not-allowed opacity-50'"
          @click="toggleRaceProf(opt.index)"
        >
          {{ opt.name }}
          <span v-if="builder.draft.selectedRaceProfs.includes(opt.index)" class="ml-1 text-gold-dim">✓</span>
        </button>
      </div>
    </section>

    <!-- Class Skill Choices -->
    <section class="space-y-4">
      <div class="rule-gold">
        <span>Class Skills</span>
        <span
          class="text-xs ml-2 font-body"
          :class="selectedCount === maxSkills ? 'text-gold-mid' : selectedCount > maxSkills ? 'text-blood-bright' : 'text-mist'"
        >
          {{ selectedCount }}/{{ maxSkills }} selected
        </span>
      </div>
      <p
        v-if="selectedCount < maxSkills"
        class="text-xs font-body -mt-2"
        :class="showValidation ? 'text-blood-bright' : 'text-mist'"
      >
        Choose {{ maxSkills - selectedCount }} more skill{{ maxSkills - selectedCount > 1 ? 's' : '' }}.
      </p>

      <div v-if="skillsLoading" class="flex justify-center py-8"><GrimoireSpinner /></div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <label
          v-for="skill in skills"
          :key="skill.index"
          class="group flex items-center gap-3 px-3 py-2.5 rounded border transition-all duration-150"
          :class="isBackgroundSkill(skill.index) || isRaceSkill(skill.index)
            ? 'border-gold-dim/20 bg-gold-dim/4 cursor-default opacity-70'
            : isSkillSelected(skill.index)
              ? 'border-gold-mid/50 bg-gold-dim/8 cursor-pointer'
              : canSelectMore
                ? 'border-shadow hover:border-gold-mid/50 hover:bg-gold-dim/8 cursor-pointer'
                : 'border-shadow opacity-50 cursor-not-allowed'"
        >
          <input
            type="checkbox"
            class="sr-only"
            :checked="isSkillSelected(skill.index) || isBackgroundSkill(skill.index) || isRaceSkill(skill.index)"
            :disabled="isBackgroundSkill(skill.index) || isRaceSkill(skill.index) || (!canSelectMore && !isSkillSelected(skill.index))"
            @change="!isBackgroundSkill(skill.index) && !isRaceSkill(skill.index) && toggleSkill(skill.index)"
          />
          <div
            class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-150"
            :class="isBackgroundSkill(skill.index) || isRaceSkill(skill.index)
              ? 'border-gold-dim/50 bg-gold-dim/20'
              : isSkillSelected(skill.index)
                ? 'border-gold-mid bg-gold-dim/30'
                : 'border-mist/50 group-hover:border-gold-mid/60 group-hover:bg-gold-dim/10'"
          >
            <CheckIcon v-if="isSkillSelected(skill.index) || isBackgroundSkill(skill.index) || isRaceSkill(skill.index)" :size="10" class="text-gold-mid" />
          </div>
          <div class="flex-1 min-w-0 flex items-center gap-2">
            <p class="text-sm font-heading tracking-wide" :class="isSkillSelected(skill.index) || isBackgroundSkill(skill.index) || isRaceSkill(skill.index) ? 'text-stone' : 'text-ash'">
              {{ skill.name }}
            </p>
            <span class="text-2xs font-heading text-mist/70 shrink-0">{{ SKILL_ABILITY[skill.index] }}</span>
          </div>
          <span v-if="isBackgroundSkill(skill.index)" class="px-1.5 py-0.5 rounded border border-gold-dim/30 text-2xs font-heading text-gold-dim/70 shrink-0">BG</span>
          <span v-else-if="isRaceSkill(skill.index)" class="px-1.5 py-0.5 rounded border border-shadow text-2xs font-heading text-mist/60 shrink-0">Race</span>
          <span v-else-if="isSkillSelected(skill.index)" class="badge-gold text-2xs shrink-0">Prof</span>
          <button
            type="button"
            class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/50 hover:text-ash hover:bg-depths/60 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Skill details"
            @click.stop="infoPanel.open({ kind: 'skill', index: skill.index })"
          >
            <InfoIcon :size="11" />
          </button>
        </label>
      </div>
    </section>

    <!-- Expertise (Rogue / Bard) -->
    <section v-if="expertiseCount > 0" class="space-y-4">
      <div class="rule-gold">
        <span>Expertise</span>
        <span
          class="text-xs ml-2 font-body"
          :class="expertiseChosen === expertiseNeed ? 'text-arcane-pale' : 'text-mist'"
        >
          {{ expertiseChosen }}/{{ expertiseNeed }} selected
        </span>
      </div>
      <p class="text-xs font-body -mt-2 text-mist">
        {{ builder.draft.className }} doubles its proficiency bonus on
        {{ expertiseCount }} chosen skill{{ expertiseCount > 1 ? 's' : '' }}. Pick from skills you're already proficient in.
      </p>
      <p v-if="showValidation && expertiseChosen < expertiseNeed" class="text-xs font-body text-blood-bright">
        Choose {{ expertiseNeed - expertiseChosen }} more skill{{ expertiseNeed - expertiseChosen > 1 ? 's' : '' }} for Expertise.
      </p>

      <p v-if="proficientSkills.length === 0" class="text-xs font-body text-mist/60 italic">
        Choose your skill proficiencies above first.
      </p>
      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="skill in proficientSkills"
          :key="skill.index"
          type="button"
          class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
          :class="isExpertise(skill.index)
            ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale'
            : canSelectMoreExpertise
              ? 'border-shadow text-ash hover:border-arcane-base/30 hover:text-stone'
              : 'border-shadow text-mist/40 cursor-not-allowed opacity-50'"
          :disabled="!isExpertise(skill.index) && !canSelectMoreExpertise"
          @click="toggleExpertise(skill.index)"
        >
          {{ skill.name }}
          <span v-if="isExpertise(skill.index)" class="ml-1 text-arcane-pale/80">★</span>
        </button>
      </div>
      <p v-if="builder.draft.classIndex === 'rogue'" class="text-2xs font-body text-mist/50 italic">
        Note: Rogues may instead take Expertise in Thieves' Tools — adjust on the character sheet if preferred.
      </p>
    </section>

    <!-- Languages -->
    <section class="space-y-4">
      <div class="rule-gold">
        <span>Languages</span>
        <span
          v-if="choiceBudget > 0"
          class="text-xs ml-2 font-body"
          :class="chosenCount === choiceBudget ? 'text-gold-mid' : 'text-mist'"
        >
          {{ chosenCount }}/{{ choiceBudget }} chosen
        </span>
      </div>

      <!-- Granted racial languages (read-only) -->
      <div v-if="autoLanguageNames.length" class="space-y-1.5">
        <p class="text-2xs font-heading tracking-wide uppercase text-mist">Granted by {{ builder.draft.raceName || 'your race' }}</p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="name in autoLanguageNames"
            :key="name"
            class="px-2.5 py-1 rounded border border-gold-dim/25 bg-gold-dim/8 text-xs font-heading text-gold-dim"
          >{{ name }}</span>
        </div>
      </div>

      <template v-if="choiceBudget > 0">
        <p
          v-if="chosenCount < choiceBudget"
          class="text-xs font-body"
          :class="showValidation ? 'text-blood-bright' : 'text-mist'"
        >
          Choose {{ choiceBudget - chosenCount }} more language{{ choiceBudget - chosenCount > 1 ? 's' : '' }}
          <span class="text-mist/60">({{ builder.draft.raceLanguageChoices > 0 ? 'racial + ' : '' }}background choice).</span>
        </p>

        <div v-if="languagesLoading" class="flex justify-center py-4"><GrimoireSpinner /></div>
        <div v-else class="flex flex-wrap gap-2">
          <button
            v-for="lang in selectableLanguages"
            :key="lang.index"
            type="button"
            class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
            :class="isLangSelected(lang.index)
              ? 'border-gold-mid/50 bg-gold-dim/10 text-gold-deep'
              : canSelectMoreLang
                ? 'border-shadow text-ash hover:border-gold-dim/20 hover:text-stone'
                : 'border-shadow text-mist/40 cursor-not-allowed opacity-50'"
            :disabled="!isLangSelected(lang.index) && !canSelectMoreLang"
            @click="toggleLang(lang.index)"
          >
            {{ lang.name }}
            <span v-if="isLangSelected(lang.index)" class="ml-1 text-gold-dim">✓</span>
          </button>
        </div>
      </template>
      <p v-else class="text-xs font-body text-mist/60 italic">
        No additional languages to choose.
      </p>
    </section>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { CheckIcon, InfoIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { useBuilderStore } from '@/character-builder/builderStore'
import { getExpertiseCount } from '@/character-builder/classMeta'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import type { ApiBackground } from '@/shared/types/api'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'
import { SKILL_ABILITY } from '@/shared/lib/skillAbilityMap'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()

const { data: skillData, isPending: skillsLoading } = useQuery({
  queryKey: ['skills'],
  queryFn: () => fiveEApi.listSkills(),
  staleTime: Infinity,
})
const skills = computed(() => {
  const all = skillData.value?.results ?? []
  const allowed = builder.draft.classSkillOptions
  return allowed.length > 0 ? all.filter(s => allowed.includes(s.index)) : all
})

const { data: langData, isPending: languagesLoading } = useQuery({
  queryKey: ['languages'],
  queryFn: () => fiveEApi.listLanguages(),
  staleTime: Infinity,
})
const languages = computed(() => langData.value?.results ?? [])

const bgEdition = computed(() => builder.draft.backgroundEdition ?? '2014')
const { data: bgDetail } = useQuery({
  queryKey: computed(() => [bgEdition.value, 'background-detail', builder.draft.backgroundIndex]),
  queryFn: () => bgEdition.value === '2024'
    ? fiveEApi.getBackground2024(builder.draft.backgroundIndex) as Promise<ApiBackground>
    : fiveEApi.getBackground(builder.draft.backgroundIndex) as Promise<ApiBackground>,
  staleTime: Infinity,
  enabled: computed(() => !!builder.draft.backgroundIndex && builder.draft.backgroundIndex !== 'custom'),
})

const bgLanguageChoices = computed(() => builder.draft.backgroundLanguageChoices)

// Background auto skills for display (convert stored indices to display names via bgDetail)
const bgDisplaySkills = computed(() => {
  if (bgDetail.value) {
    return (bgDetail.value.starting_proficiencies ?? [])
      .filter(p => p.index.startsWith('skill-'))
      .map(p => p.name)
  }
  // Fallback: use stored indices capitalized
  return builder.draft.backgroundSkillProficiencies.map(s =>
    s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  )
})
// Fixed racial languages are auto-granted and read-only. The choosable budget = the
// race's extra language choice(s) (Human/Half-Elf +1) plus the background's choices.
const autoLanguages = computed(() => builder.draft.raceAutoLanguages ?? [])
const autoLanguageNames = computed(() =>
  autoLanguages.value.map(i => languages.value.find(l => l.index === i)?.name
    ?? i.charAt(0).toUpperCase() + i.slice(1)),
)
const choiceBudget = computed(() => builder.draft.raceLanguageChoices + bgLanguageChoices.value)
const chosenLanguages = computed(() => builder.draft.selectedLanguages.filter(l => !autoLanguages.value.includes(l)))
const chosenCount = computed(() => chosenLanguages.value.length)
const canSelectMoreLang = computed(() => chosenCount.value < choiceBudget.value)
const isAutoLang = (index: string) => autoLanguages.value.includes(index)
// Only languages NOT already granted by the race are choosable.
const selectableLanguages = computed(() => languages.value.filter(l => !isAutoLang(l.index)))

const maxSkills = computed(() => builder.draft.classSkillChoices || 2)
// Background and race skills don't consume class skill picks
const selectedCount = computed(() =>
  builder.draft.selectedSkills.filter(s => !isBackgroundSkill(s) && !isRaceSkill(s)).length
)
const canSelectMore = computed(() => selectedCount.value < maxSkills.value)

function isBackgroundSkill(index: string): boolean {
  return builder.draft.backgroundSkillProficiencies.includes(index)
}

function isRaceSkill(index: string): boolean {
  return builder.draft.raceSkillProficiencies.includes(index)
}

const canSelectMoreRaceProfs = computed(() =>
  builder.draft.selectedRaceProfs.length < builder.draft.raceProfChoices,
)

function toggleRaceProf(index: string) {
  if (builder.draft.selectedRaceProfs.includes(index)) {
    builder.draft.selectedRaceProfs = builder.draft.selectedRaceProfs.filter(i => i !== index)
  } else if (canSelectMoreRaceProfs.value) {
    builder.draft.selectedRaceProfs.push(index)
  }
}

function isSkillSelected(index: string) { return builder.draft.selectedSkills.includes(index) }
function toggleSkill(index: string) {
  if (isSkillSelected(index)) {
    builder.draft.selectedSkills = builder.draft.selectedSkills.filter(s => s !== index)
  } else if (canSelectMore.value) {
    builder.draft.selectedSkills.push(index)
  }
}

function isLangSelected(index: string) {
  return builder.draft.selectedLanguages.includes(index) && !isAutoLang(index)
}
function toggleLang(index: string) {
  if (isAutoLang(index)) return // racial languages are fixed
  if (builder.draft.selectedLanguages.includes(index)) {
    builder.draft.selectedLanguages = builder.draft.selectedLanguages.filter(l => l !== index)
  } else if (canSelectMoreLang.value) {
    builder.draft.selectedLanguages = [...builder.draft.selectedLanguages, index]
  }
}

// Drop chosen languages beyond the budget (e.g. after switching to a race with fewer
// choices). Runs immediately so a stale over-selection is corrected on entering this step.
watch(choiceBudget, (budget) => {
  if (chosenCount.value > budget) {
    const keep = chosenLanguages.value.slice(0, budget)
    builder.draft.selectedLanguages = [...autoLanguages.value, ...keep]
  }
}, { immediate: true })

// ── Expertise (Rogue L1/L6, Bard L3/L10) ──────────────────────────────────────

// All skills (unfiltered by class options) for index→name lookup, since a proficient
// skill may come from the background/race and lie outside the class skill options.
const allSkills = computed(() => skillData.value?.results ?? [])

// The proficient-skill pool = class-chosen + background + race skills (same set built
// into skillProficiencies). Expertise can only be applied to these.
const proficientSkillIndices = computed(() => [...new Set([
  ...builder.draft.selectedSkills,
  ...builder.draft.backgroundSkillProficiencies,
  ...builder.draft.raceSkillProficiencies,
])])

const proficientSkills = computed(() =>
  proficientSkillIndices.value
    .map(i => allSkills.value.find(s => s.index === i) ?? { index: i, name: prettifySkill(i) })
    .sort((a, b) => a.name.localeCompare(b.name)),
)

function prettifySkill(index: string): string {
  return index.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const expertiseCount = computed(() =>
  getExpertiseCount(builder.draft.classIndex, builder.draft.level),
)
// Can't pick more expertise skills than you have proficiencies in.
const expertiseNeed = computed(() => Math.min(expertiseCount.value, proficientSkillIndices.value.length))
const expertiseChosen = computed(() =>
  builder.draft.expertiseSkills.filter(s => proficientSkillIndices.value.includes(s)).length,
)
const canSelectMoreExpertise = computed(() => expertiseChosen.value < expertiseNeed.value)

function isExpertise(index: string) { return builder.draft.expertiseSkills.includes(index) }
function toggleExpertise(index: string) {
  if (isExpertise(index)) {
    builder.draft.expertiseSkills = builder.draft.expertiseSkills.filter(s => s !== index)
  } else if (canSelectMoreExpertise.value && proficientSkillIndices.value.includes(index)) {
    builder.draft.expertiseSkills = [...builder.draft.expertiseSkills, index]
  }
}

// Drop any expertise picks that are no longer proficient (e.g. a class skill was deselected).
watch(proficientSkillIndices, (pool) => {
  const valid = builder.draft.expertiseSkills.filter(s => pool.includes(s))
  if (valid.length !== builder.draft.expertiseSkills.length) {
    builder.draft.expertiseSkills = valid
  }
})
</script>
