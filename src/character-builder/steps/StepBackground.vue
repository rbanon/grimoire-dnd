<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <section class="space-y-4">
      <div class="rule-gold"><span>Background</span></div>

      <div v-if="backgroundsLoading" class="flex justify-center py-8">
        <GrimoireSpinner />
      </div>
      <div v-else-if="backgroundsError" class="text-sm text-blood-bright">Failed to load backgrounds.</div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div
          v-for="bg in backgrounds"
          :key="bg.index"
          class="group relative flex items-center rounded border text-sm font-heading tracking-wide transition-all duration-150 cursor-pointer"
          :class="builder.draft.backgroundIndex === bg.index
            ? 'border-gold-mid/60 bg-gold-dim/10 text-gold-deep'
            : 'border-shadow bg-abyss text-ash hover:border-gold-dim/25 hover:text-stone hover:bg-depths'"
          @click="selectBackground(bg.index, bg.name)"
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
      </div>
      <p v-if="fieldErrors.background" class="text-xs font-body text-blood-bright">
        Select a background to continue.
      </p>
    </section>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { InfoIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { useBuilderStore } from '@/character-builder/builderStore'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import type { ApiBackground } from '@/shared/types/api'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()

const fieldErrors = computed(() => ({
  background: showValidation.value && !builder.draft.backgroundIndex,
}))

const { data: bgList, isPending: backgroundsLoading, isError: backgroundsError } = useQuery({
  queryKey: ['backgrounds'],
  queryFn: () => fiveEApi.listBackgrounds(),
  staleTime: Infinity,
})
const backgrounds = computed(() => bgList.value?.results ?? [])

async function selectBackground(index: string, name: string) {
  builder.draft.backgroundIndex = index
  builder.draft.backgroundName = name
  builder.draft.backgroundSkillProficiencies = []
  builder.draft.backgroundToolProficiencies = []

  try {
    const detail: ApiBackground = await fiveEApi.getBackground(index)
    builder.draft.backgroundSkillProficiencies = detail.starting_proficiencies
      .filter(p => p.index.startsWith('skill-'))
      .map(p => p.index.replace(/^skill-/, ''))
    builder.draft.backgroundToolProficiencies = detail.starting_proficiencies
      .filter(p => !p.index.startsWith('skill-'))
      .map(p => p.name)
  } catch { /* ignore */ }
}
</script>
