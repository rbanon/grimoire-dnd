<template>
  <div class="space-y-6">

    <!-- ── Personality ──────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="label">Personality</p>
      <div class="grid sm:grid-cols-2 gap-3">
        <div v-for="field in personalityFields" :key="field.key" class="card p-4 flex flex-col gap-1.5">
          <p class="text-2xs font-heading tracking-[0.12em] uppercase text-mist">{{ field.label }}</p>
          <textarea
            v-if="editMode"
            :value="field.value ?? ''"
            :rows="field.rows"
            :placeholder="field.placeholder"
            class="input-base w-full resize-y font-body text-sm leading-relaxed bg-transparent"
            @blur="savePersonality(field.key, ($event.target as HTMLTextAreaElement).value)"
          />
          <p v-else class="font-body text-sm text-stone leading-relaxed whitespace-pre-wrap">
            {{ field.value || '—' }}
          </p>
        </div>
      </div>
    </section>

    <!-- ── Biography ───────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="label">Backstory</p>
      <div class="card p-4 flex flex-col gap-1.5">
        <textarea
          v-if="editMode"
          :value="character.personality.biography ?? ''"
          rows="6"
          placeholder="Write the character's backstory, history, motivations…"
          class="input-base w-full resize-y font-body text-sm leading-relaxed bg-transparent"
          @blur="savePersonality('biography', ($event.target as HTMLTextAreaElement).value)"
        />
        <p v-else class="font-body text-sm text-stone leading-relaxed whitespace-pre-wrap">
          {{ character.personality.biography || '—' }}
        </p>
      </div>
    </section>

    <!-- ── Appearance ───────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="label">Appearance</p>
      <div class="card p-4 space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div v-for="field in appearanceShortFields" :key="field.key" class="flex flex-col gap-1">
            <p class="text-2xs font-heading tracking-[0.12em] uppercase text-mist">{{ field.label }}</p>
            <input
              v-if="editMode"
              :value="field.value ?? ''"
              type="text"
              :placeholder="field.label"
              class="input-base w-full font-body text-sm bg-transparent"
              @blur="saveIdentity(field.key, ($event.target as HTMLInputElement).value)"
            />
            <p v-else class="font-body text-sm text-stone">{{ field.value || '—' }}</p>
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <p class="text-2xs font-heading tracking-[0.12em] uppercase text-mist">Notes</p>
          <textarea
            v-if="editMode"
            :value="character.identity.appearanceNotes ?? ''"
            rows="3"
            placeholder="Distinctive features, scars, tattoos, clothing style…"
            class="input-base w-full resize-y font-body text-sm leading-relaxed bg-transparent"
            @blur="saveIdentity('appearanceNotes', ($event.target as HTMLTextAreaElement).value)"
          />
          <p v-else class="font-body text-sm text-stone leading-relaxed whitespace-pre-wrap">
            {{ character.identity.appearanceNotes || '—' }}
          </p>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Character } from '@/shared/types/character'
import { useCharactersStore } from '@/characters/store'

const props = defineProps<{
  character: Character
  editMode: boolean
}>()

const store = useCharactersStore()

const personalityFields = computed(() => [
  { key: 'personalityTraits', label: 'Personality Traits', rows: 3, placeholder: 'How does this character act and speak?', value: props.character.personality.personalityTraits },
  { key: 'ideals',            label: 'Ideals',             rows: 2, placeholder: 'What does this character believe in?',  value: props.character.personality.ideals },
  { key: 'bonds',             label: 'Bonds',              rows: 2, placeholder: 'Who or what does this character care about?', value: props.character.personality.bonds },
  { key: 'flaws',             label: 'Flaws',              rows: 2, placeholder: 'What weakness or vice does this character have?', value: props.character.personality.flaws },
])

const appearanceShortFields = computed(() => [
  { key: 'age',    label: 'Age',    value: props.character.identity.age    },
  { key: 'gender', label: 'Gender', value: props.character.identity.gender },
  { key: 'height', label: 'Height', value: props.character.identity.height },
  { key: 'weight', label: 'Weight', value: props.character.identity.weight },
  { key: 'eyes',   label: 'Eyes',   value: props.character.identity.eyes   },
  { key: 'skin',   label: 'Skin',   value: props.character.identity.skin   },
  { key: 'hair',   label: 'Hair',   value: props.character.identity.hair   },
])

function savePersonality(key: string, value: string) {
  store.update(props.character.id, {
    personality: { ...props.character.personality, [key]: value || undefined },
  })
}

function saveIdentity(key: string, value: string) {
  store.update(props.character.id, {
    identity: { ...props.character.identity, [key]: value || undefined },
  })
}
</script>
