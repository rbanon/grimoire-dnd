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

    <!-- Languages -->
    <section class="space-y-4">
      <div class="rule-gold">
        <span>Languages</span>
        <span
          class="text-xs ml-2 font-body"
          :class="langCount > maxLanguages ? 'text-blood-bright' : langCount === maxLanguages ? 'text-gold-mid' : 'text-mist'"
        >
          {{ langCount }}/{{ maxLanguages }} selected
        </span>
      </div>

      <p
        v-if="langCount < maxLanguages"
        class="text-xs font-body -mt-2"
        :class="showValidation ? 'text-blood-bright' : 'text-mist'"
      >
        Choose {{ maxLanguages - langCount }} more language{{ maxLanguages - langCount > 1 ? 's' : '' }}.
      </p>

      <div class="flex items-start gap-2 px-3 py-2 rounded border border-shadow/40 bg-depths/20">
        <span class="text-gold-dim/60 text-xs shrink-0 mt-0.5">ℹ</span>
        <p class="text-xs font-body text-mist">
          <span class="text-stone">{{ builder.draft.raceName }}</span> grants
          <span class="text-stone">{{ builder.draft.raceLanguageCount }}</span> language{{ builder.draft.raceLanguageCount !== 1 ? 's' : '' }} (e.g. Common + racial).
          <template v-if="bgLanguageChoices > 0">
            Your background adds <span class="text-stone">{{ bgLanguageChoices }}</span> of your choice.
          </template>
          Select up to <span class="text-stone">{{ maxLanguages }}</span> total.
        </p>
      </div>

      <div v-if="languagesLoading" class="flex justify-center py-4"><GrimoireSpinner /></div>
      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="lang in languages"
          :key="lang.index"
          type="button"
          class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
          :class="isLangSelected(lang.index)
            ? 'border-gold-mid/50 bg-gold-dim/10 text-gold-deep'
            : canSelectMoreLang || isLangSelected(lang.index)
              ? 'border-shadow text-ash hover:border-gold-dim/20 hover:text-stone'
              : 'border-shadow text-mist/40 cursor-not-allowed opacity-50'"
          @click="toggleLang(lang.index)"
        >
          {{ lang.name }}
          <span v-if="isLangSelected(lang.index)" class="ml-1 text-gold-dim">✓</span>
        </button>
      </div>
    </section>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckIcon, InfoIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { useBuilderStore } from '@/character-builder/builderStore'
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
const maxLanguages = computed(() => builder.draft.raceLanguageCount + bgLanguageChoices.value)
const langCount = computed(() => builder.draft.selectedLanguages.length)
const canSelectMoreLang = computed(() => langCount.value < maxLanguages.value)

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

function isLangSelected(index: string) { return builder.draft.selectedLanguages.includes(index) }
function toggleLang(index: string) {
  if (isLangSelected(index)) {
    builder.draft.selectedLanguages = builder.draft.selectedLanguages.filter(l => l !== index)
  } else if (canSelectMoreLang.value) {
    builder.draft.selectedLanguages.push(index)
  }
}
</script>
