<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <!-- Background picker -->
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

    <!-- Background detail panel -->
    <Transition name="expand">
      <section v-if="builder.draft.backgroundIndex" class="space-y-5">
        <div class="rule-gold"><span>Background Details</span></div>

        <div v-if="bgDetailLoading" class="flex justify-center py-4">
          <GrimoireSpinner />
        </div>

        <template v-else-if="bgDetail">
          <!-- Feature -->
          <div class="space-y-2">
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

// ── Background detail (for display panel) ────────────────────────────────────

const bgIndex = computed(() => builder.draft.backgroundIndex)

const { data: bgDetail, isPending: bgDetailLoading } = useQuery({
  queryKey: computed(() => ['background-detail', bgIndex.value]),
  queryFn: () => fiveEApi.getBackground(bgIndex.value) as Promise<ApiBackground>,
  staleTime: Infinity,
  enabled: computed(() => !!bgIndex.value),
})

const skillProfs = computed(() =>
  bgDetail.value?.starting_proficiencies.filter(p => p.index.startsWith('skill-')) ?? [],
)
const toolProfs = computed(() =>
  bgDetail.value?.starting_proficiencies.filter(p => !p.index.startsWith('skill-')) ?? [],
)

// ── Select handler ────────────────────────────────────────────────────────────

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
    builder.draft.backgroundLanguageChoices = detail.language_options?.choose ?? 0
  } catch { /* ignore */ }
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 1200px; }
</style>
