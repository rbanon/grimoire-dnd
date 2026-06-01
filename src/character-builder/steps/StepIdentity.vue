<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <!-- Name & Portrait -->
    <section class="space-y-5">
      <div class="rule-gold"><span>Identity</span></div>

      <div class="grid sm:grid-cols-[1fr_auto] gap-5 items-start">
        <div class="space-y-4 flex-1">
          <div>
            <label class="label" for="char-name">Character Name *</label>
            <input
              id="char-name"
              v-model="builder.draft.name"
              type="text"
              placeholder="What do the gods call you?"
              class="input-base text-lg font-heading"
              :class="{ '!border-blood-base/60 bg-blood-deep/10': fieldErrors.name }"
              maxlength="120"
              autofocus
              @blur="touched.name = true"
            />
            <p v-if="fieldErrors.name" class="mt-1 text-xs font-body text-blood-bright">
              Character name is required.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label" for="char-age">Age</label>
              <input id="char-age" v-model="builder.draft.age" type="text" placeholder="e.g. 127" class="input-base" maxlength="40" />
            </div>
            <div>
              <label class="label" for="char-gender">Gender / Identity</label>
              <input id="char-gender" v-model="builder.draft.gender" type="text" placeholder="Any" class="input-base" maxlength="80" />
            </div>
          </div>
        </div>

        <!-- Portrait -->
        <div class="shrink-0">
          <label class="label mb-2">Portrait</label>
          <div
            class="w-24 h-24 rounded border border-shadow bg-depths flex items-center justify-center overflow-hidden relative group cursor-pointer"
            @click="fileInput?.click()"
          >
            <img
              v-if="builder.draft.portraitUrl"
              :src="builder.draft.portraitUrl"
              class="w-full h-full object-cover"
              alt="Portrait preview"
            />
            <div v-else class="flex flex-col items-center gap-1 text-mist group-hover:text-ash transition-colors">
              <ImageIcon :size="20" />
              <span class="text-2xs font-heading tracking-wide">Upload</span>
            </div>
            <div
              v-if="builder.draft.portraitUrl"
              class="absolute inset-0 bg-abyss/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <PencilIcon :size="16" class="text-stone" />
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="sr-only"
            @change="onFileChange"
          />
          <p v-if="portraitError" class="mt-1 text-2xs font-body text-blood-bright w-24">{{ portraitError }}</p>
          <button
            v-if="builder.draft.portraitUrl"
            type="button"
            class="mt-1 text-2xs font-heading text-mist hover:text-blood-bright transition-colors w-24 text-center"
            @click="builder.draft.portraitUrl = ''"
          >Remove</button>
        </div>
      </div>
    </section>

    <!-- Race Selection -->
    <section class="space-y-4">
      <div class="rule-gold"><span>Race</span></div>

      <div v-if="racesLoading" class="flex justify-center py-8">
        <GrimoireSpinner />
      </div>
      <div v-else-if="racesError" class="text-sm text-blood-bright">Failed to load races.</div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <PickerCard
          v-for="race in races"
          :key="race.index"
          :name="race.name"
          :glyph="getRaceMeta(race.index).glyph"
          :flavor="getRaceMeta(race.index).flavor"
          :tags="getRaceMeta(race.index).traits.slice(0, 2)"
          :selected="builder.draft.raceIndex === race.index"
          show-info
          @select="selectRace(race.index, race.name)"
          @info="infoPanel.open({ kind: 'race', index: race.index })"
        />
      </div>

      <p v-if="fieldErrors.race" class="mt-2 text-xs font-body text-blood-bright">
        Select a race to continue.
      </p>

      <!-- Subrace picker -->
      <Transition name="expand">
        <div v-if="builder.draft.availableSubraces.length > 0" class="mt-3 space-y-2">
          <label class="label">Subrace *</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="sub in builder.draft.availableSubraces"
              :key="sub.index"
              type="button"
              class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
              :class="builder.draft.subraceIndex === sub.index
                ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-deep'
                : fieldErrors.subrace
                  ? 'border-blood-base/50 text-ash hover:border-blood-base/70'
                  : 'border-shadow text-ash hover:border-gold-dim/25 hover:text-stone'"
              @click="selectSubrace(sub.index, sub.name)"
            >
              {{ sub.name }}
            </button>
          </div>
          <p v-if="fieldErrors.subrace" class="text-xs font-body text-blood-bright">
            Select a subrace to continue.
          </p>
        </div>
      </Transition>
    </section>

    <!-- Background Selection -->
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

    <!-- Alignment -->
    <section class="space-y-4">
      <div class="rule-gold"><span>Alignment</span></div>
      <AlignmentGrid v-model="builder.draft.alignment" />
    </section>

    <!-- Physical Appearance (collapsible) -->
    <section class="space-y-4">
      <button
        type="button"
        class="rule-gold w-full text-left"
        @click="showAppearance = !showAppearance"
      >
        <span>Appearance</span>
        <span class="text-mist ml-2 text-xs">{{ showAppearance ? '▲' : '▼' }} optional</span>
      </button>

      <Transition name="expand">
        <div v-if="showAppearance" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div v-for="field in appearanceFields" :key="field.key">
            <label class="label" :for="`char-${field.key}`">{{ field.label }}</label>
            <input
              :id="`char-${field.key}`"
              v-model="builder.draft[field.key]"
              type="text"
              :placeholder="field.placeholder"
              class="input-base"
              maxlength="40"
            />
          </div>
          <div class="col-span-2 sm:col-span-3">
            <label class="label" for="char-appearance-notes">Appearance Notes</label>
            <textarea
              id="char-appearance-notes"
              v-model="builder.draft.appearanceNotes"
              class="input-base resize-none"
              rows="2"
              placeholder="Distinctive features, scars, attire…"
              maxlength="2000"
            />
          </div>
        </div>
      </Transition>
    </section>

    <!-- Personality (collapsible) -->
    <section class="space-y-4">
      <button
        type="button"
        class="rule-gold w-full text-left"
        @click="showPersonality = !showPersonality"
      >
        <span>Personality</span>
        <span class="text-mist ml-2 text-xs">{{ showPersonality ? '▲' : '▼' }} optional</span>
      </button>

      <Transition name="expand">
        <div v-if="showPersonality" class="space-y-3">
          <div v-for="field in personalityFields" :key="field.key">
            <label class="label" :for="`char-${field.key}`">{{ field.label }}</label>
            <textarea
              :id="`char-${field.key}`"
              v-model="builder.draft[field.key]"
              class="input-base resize-none"
              rows="2"
              :placeholder="field.placeholder"
              maxlength="1000"
            />
          </div>
        </div>
      </Transition>
    </section>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { ImageIcon, PencilIcon, InfoIcon } from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'
import { getRaceMeta } from '@/character-builder/classMeta'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import { compressPortrait } from '@/shared/lib/uploadPortrait'
import type { ApiRace } from '@/shared/types/api'
import PickerCard from '@/character-builder/components/PickerCard.vue'
import AlignmentGrid from '@/character-builder/components/AlignmentGrid.vue'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const MAX_PORTRAIT_BYTES = 10_485_760 // 10 MB — compression handles the rest

const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()
const fileInput = ref<HTMLInputElement | null>(null)
const portraitError = ref('')
const portraitCompressing = ref(false)
const showAppearance = ref(false)
const showPersonality = ref(false)

async function onFileChange(event: Event) {
  portraitError.value = ''
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > MAX_PORTRAIT_BYTES) {
    portraitError.value = 'Max 10 MB'
    return
  }
  portraitCompressing.value = true
  try {
    const compressed = await compressPortrait(file)
    const reader = new FileReader()
    reader.onload = (e) => { builder.draft.portraitUrl = e.target?.result as string }
    reader.readAsDataURL(compressed)
  } finally {
    portraitCompressing.value = false
  }
}

// Track which required fields have been interacted with — errors only show after touch
const touched = reactive({ name: false, race: false, background: false })

const fieldErrors = computed(() => ({
  name:       (touched.name       || showValidation.value) && !builder.draft.name.trim(),
  race:       (touched.race       || showValidation.value) && !builder.draft.raceIndex,
  subrace:    showValidation.value && builder.draft.availableSubraces.length > 0 && !builder.draft.subraceIndex,
  background: (touched.background || showValidation.value) && !builder.draft.backgroundIndex,
}))

const { data: raceList, isPending: racesLoading, isError: racesError } = useQuery({
  queryKey: ['races'],
  queryFn: () => fiveEApi.listRaces(),
  staleTime: Infinity,
})
const races = computed(() => raceList.value?.results ?? [])

const { data: bgList, isPending: backgroundsLoading, isError: backgroundsError } = useQuery({
  queryKey: ['backgrounds'],
  queryFn: () => fiveEApi.listBackgrounds(),
  staleTime: Infinity,
})
const backgrounds = computed(() => bgList.value?.results ?? [])

async function selectRace(index: string, name: string) {
  touched.race = true
  builder.draft.raceIndex = index
  builder.draft.raceName = name
  builder.draft.subraceIndex = ''
  builder.draft.subraceName = ''
  builder.draft.availableSubraces = []
  try {
    const detail: ApiRace = await fiveEApi.getRace(index)
    builder.draft.raceSpeed = detail.speed
    builder.draft.raceSizeCategory = detail.size
    builder.draft.raceAbilityBonuses = detail.ability_bonuses.reduce((acc, ab) => {
      const key = ab.ability_score.index as keyof typeof acc
      acc[key] = (acc[key] ?? 0) + ab.bonus
      return acc
    }, {} as Record<string, number>)
    builder.draft.availableSubraces = detail.subraces.map(s => ({ index: s.index, name: s.name }))
    builder.draft.raceLanguageCount = detail.languages.length || 1
  } catch { /* ignore */ }
}

function selectSubrace(index: string, name: string) {
  builder.draft.subraceIndex = index
  builder.draft.subraceName = name
}

function selectBackground(index: string, name: string) {
  touched.background = true
  builder.draft.backgroundIndex = index
  builder.draft.backgroundName = name
}

type AppearanceKey = 'height' | 'weight' | 'eyes' | 'skin' | 'hair'
type PersonalityKey = 'personalityTraits' | 'ideals' | 'bonds' | 'flaws'

const appearanceFields: { key: AppearanceKey; label: string; placeholder: string }[] = [
  { key: 'height', label: 'Height', placeholder: "5'10\"" },
  { key: 'weight', label: 'Weight', placeholder: '160 lbs' },
  { key: 'eyes',   label: 'Eyes',   placeholder: 'Amber' },
  { key: 'skin',   label: 'Skin',   placeholder: 'Tanned' },
  { key: 'hair',   label: 'Hair',   placeholder: 'Silver, waist-length' },
]

const personalityFields: { key: PersonalityKey; label: string; placeholder: string }[] = [
  { key: 'personalityTraits', label: 'Personality Traits', placeholder: 'How do others see you?' },
  { key: 'ideals',            label: 'Ideals',             placeholder: 'What do you believe in?' },
  { key: 'bonds',             label: 'Bonds',              placeholder: 'What ties you to the world?' },
  { key: 'flaws',             label: 'Flaws',              placeholder: 'What holds you back?' },
]
</script>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 600px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
