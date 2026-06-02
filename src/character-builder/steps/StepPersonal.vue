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
              <label class="label" for="char-age">Age *</label>
              <input
                id="char-age"
                v-model="builder.draft.age"
                type="text"
                placeholder="e.g. 127"
                class="input-base"
                :class="{ '!border-blood-base/60 bg-blood-deep/10': fieldErrors.age }"
                maxlength="40"
                @blur="touched.age = true"
              />
              <p v-if="fieldErrors.age" class="mt-1 text-xs font-body text-blood-bright">Age is required.</p>
            </div>
            <div>
              <label class="label" for="char-gender">Gender / Identity *</label>
              <input
                id="char-gender"
                v-model="builder.draft.gender"
                type="text"
                placeholder="Any"
                class="input-base"
                :class="{ '!border-blood-base/60 bg-blood-deep/10': fieldErrors.gender }"
                maxlength="80"
                @blur="touched.gender = true"
              />
              <p v-if="fieldErrors.gender" class="mt-1 text-xs font-body text-blood-bright">Gender / Identity is required.</p>
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
          <input ref="fileInput" type="file" accept="image/*" class="sr-only" @change="onFileChange" />
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

    <!-- Alignment -->
    <section class="space-y-4">
      <div class="rule-gold"><span>Alignment</span></div>
      <AlignmentGrid v-model="builder.draft.alignment" />
    </section>

    <!-- Appearance (collapsible) -->
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

    <!-- Backstory (collapsible) -->
    <section class="space-y-4">
      <button
        type="button"
        class="rule-gold w-full text-left"
        @click="showBiography = !showBiography"
      >
        <span>Backstory</span>
        <span class="text-mist ml-2 text-xs">{{ showBiography ? '▲' : '▼' }} optional</span>
      </button>

      <Transition name="expand">
        <div v-if="showBiography">
          <textarea
            v-model="builder.draft.biography"
            class="input-base resize-none w-full"
            rows="5"
            placeholder="Tell the story of your character's past…"
            maxlength="5000"
          />
        </div>
      </Transition>
    </section>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ImageIcon, PencilIcon } from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import { compressPortrait } from '@/shared/lib/uploadPortrait'
import AlignmentGrid from '@/character-builder/components/AlignmentGrid.vue'

const MAX_PORTRAIT_BYTES = 10_485_760 // 10 MB — compression handles the rest

const builder = useBuilderStore()
const { showValidation } = useBuilderValidation()
const fileInput = ref<HTMLInputElement | null>(null)
const portraitError = ref('')
const showAppearance = ref(false)
const showPersonality = ref(false)
const showBiography = ref(false)
const touched = reactive({ name: false, age: false, gender: false })

const fieldErrors = computed(() => ({
  name:   (touched.name   || showValidation.value) && !builder.draft.name.trim(),
  age:    (touched.age    || showValidation.value) && !builder.draft.age.trim(),
  gender: (touched.gender || showValidation.value) && !builder.draft.gender.trim(),
}))

async function onFileChange(event: Event) {
  portraitError.value = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > MAX_PORTRAIT_BYTES) { portraitError.value = 'Max 10 MB'; return }
  try {
    const compressed = await compressPortrait(file)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(compressed)
    })
    builder.draft.portraitUrl = dataUrl
  } catch {
    portraitError.value = 'Could not process image'
  } finally {
    input.value = '' // allow re-selecting the same file
  }
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
.expand-enter-active, .expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 600px; }
</style>
