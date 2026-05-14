<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <!-- Skills -->
    <section class="space-y-4">
      <div class="rule-gold">
        <span>Skill Proficiencies</span>
        <span class="text-mist text-xs ml-2 font-body">
          Choose {{ maxSkills }} — {{ selectedCount }}/{{ maxSkills }} selected
        </span>
      </div>

      <div v-if="skillsLoading" class="flex justify-center py-8"><GrimoireSpinner /></div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <label
          v-for="skill in skills"
          :key="skill.index"
          class="group flex items-center gap-3 px-3 py-2.5 rounded border cursor-pointer transition-all duration-150"
          :class="isSkillSelected(skill.index)
            ? 'border-gold-mid/50 bg-gold-dim/8'
            : canSelectMore || isSkillSelected(skill.index)
              ? 'border-shadow hover:border-gold-dim/20 hover:bg-depths'
              : 'border-shadow opacity-50 cursor-not-allowed'"
        >
          <input
            type="checkbox"
            class="sr-only"
            :checked="isSkillSelected(skill.index)"
            :disabled="!canSelectMore && !isSkillSelected(skill.index)"
            @change="toggleSkill(skill.index)"
          />
          <!-- Custom checkbox -->
          <div
            class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-150"
            :class="isSkillSelected(skill.index)
              ? 'border-gold-mid bg-gold-dim/30'
              : 'border-mist group-hover:border-ash'"
          >
            <CheckIcon v-if="isSkillSelected(skill.index)" :size="10" class="text-gold-mid" />
          </div>
          <div class="flex-1 min-w-0 flex items-center gap-2">
            <p class="text-sm font-heading tracking-wide" :class="isSkillSelected(skill.index) ? 'text-stone' : 'text-ash'">
              {{ skill.name }}
            </p>
            <span class="text-2xs font-heading text-mist/70 shrink-0">{{ SKILL_ABILITY[skill.index] }}</span>
          </div>
          <span v-if="isSkillSelected(skill.index)" class="badge-gold text-2xs shrink-0">Prof</span>
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
      <div class="rule-gold"><span>Languages</span></div>

      <div v-if="languagesLoading" class="flex justify-center py-4"><GrimoireSpinner /></div>
      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="lang in languages"
          :key="lang.index"
          type="button"
          class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
          :class="isLangSelected(lang.index)
            ? 'border-gold-mid/50 bg-gold-dim/10 text-gold-pale'
            : 'border-shadow text-ash hover:border-gold-dim/20 hover:text-stone'"
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
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const SKILL_ABILITY: Record<string, string> = {
  'acrobatics': 'DEX', 'animal-handling': 'WIS', 'arcana': 'INT',
  'athletics': 'STR', 'deception': 'CHA', 'history': 'INT',
  'insight': 'WIS', 'intimidation': 'CHA', 'investigation': 'INT',
  'medicine': 'WIS', 'nature': 'INT', 'perception': 'WIS',
  'performance': 'CHA', 'persuasion': 'CHA', 'religion': 'INT',
  'sleight-of-hand': 'DEX', 'stealth': 'DEX', 'survival': 'WIS',
}

const builder = useBuilderStore()
const infoPanel = useInfoPanel()

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

const maxSkills = computed(() => builder.draft.classSkillChoices || 2)
const selectedCount = computed(() => builder.draft.selectedSkills.length)
const canSelectMore = computed(() => selectedCount.value < maxSkills.value)

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
  } else {
    builder.draft.selectedLanguages.push(index)
  }
}
</script>
