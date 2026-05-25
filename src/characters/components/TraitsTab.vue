<template>
  <div class="space-y-6">

    <!-- Defenses -->
    <section>
      <p class="label mb-3">Defenses</p>
      <div class="space-y-3">

        <div>
          <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist mb-1.5">Resistances</p>
          <ChipListEditor
            :items="character.resistances"
            :edit-mode="editMode"
            placeholder="Add resistance…"
            :suggestions="damageTypes"
            chip-class="bg-emerald-900/30 border border-emerald-700/40 text-emerald-300/80"
            empty-label="No resistances"
            @update:items="update('resistances', $event)"
          />
        </div>

        <div>
          <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist mb-1.5">Immunities</p>
          <ChipListEditor
            :items="character.immunities"
            :edit-mode="editMode"
            placeholder="Add immunity…"
            :suggestions="damageTypes"
            chip-class="bg-arcane-deep/30 border border-arcane-pale/30 text-arcane-pale/80"
            empty-label="No immunities"
            @update:items="update('immunities', $event)"
          />
        </div>

        <div>
          <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist mb-1.5">Vulnerabilities</p>
          <ChipListEditor
            :items="character.vulnerabilities"
            :edit-mode="editMode"
            placeholder="Add vulnerability…"
            :suggestions="damageTypes"
            chip-class="bg-blood-dark/30 border border-blood-bright/30 text-blood-bright/80"
            empty-label="No vulnerabilities"
            @update:items="update('vulnerabilities', $event)"
          />
        </div>

      </div>
    </section>

    <!-- Senses -->
    <section>
      <p class="label mb-3">Senses</p>
      <ChipListEditor
        :items="character.senses"
        :edit-mode="editMode"
        placeholder="Add sense (e.g. Darkvision 60 ft.)…"
        :suggestions="SENSE_SUGGESTIONS"
        empty-label="No special senses"
        @update:items="update('senses', $event)"
      />
    </section>

    <!-- Knowledge -->
    <section>
      <p class="label mb-3">Knowledge</p>
      <div class="space-y-3">

        <div>
          <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist mb-1.5">Languages</p>
          <ChipListEditor
            :items="character.languages"
            :edit-mode="editMode"
            placeholder="Add language…"
            :suggestions="languageNames"
            chip-class="bg-gold-dim/10 border border-gold-dim/30 text-gold-dim"
            empty-label="No languages"
            @update:items="update('languages', $event)"
          />
        </div>

        <div>
          <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist mb-1.5">Other Proficiencies</p>
          <ChipListEditor
            :items="character.otherProficiencies"
            :edit-mode="editMode"
            placeholder="Add proficiency (e.g. Thieves' tools)…"
            empty-label="No other proficiencies"
            @update:items="update('otherProficiencies', $event)"
          />
        </div>

      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useCharactersStore } from '@/characters/store'
import type { Character } from '@/shared/types/character'
import type { ApiReference } from '@/shared/types/api'
import ChipListEditor from './ChipListEditor.vue'

const props = defineProps<{ character: Character; editMode: boolean }>()

const store = useCharactersStore()

const SENSE_SUGGESTIONS = [
  'Darkvision 60 ft.', 'Darkvision 120 ft.', 'Blindsight 10 ft.',
  'Blindsight 30 ft.', 'Tremorsense 60 ft.', 'Truesight 60 ft.', 'Truesight 120 ft.',
]

const { data: languagesData } = useQuery({
  queryKey: ['languages'],
  queryFn: () => fiveEApi.listLanguages(),
  staleTime: Infinity,
})

const { data: damageTypesData } = useQuery({
  queryKey: ['damage-types'],
  queryFn: () => fiveEApi.listDamageTypes(),
  staleTime: Infinity,
})

const languageNames = computed(() =>
  languagesData.value?.results.map((l: ApiReference) => l.name) ?? [],
)

const damageTypes = computed(() =>
  damageTypesData.value?.results.map((d: ApiReference) => d.name) ?? [],
)

function update(field: 'resistances' | 'immunities' | 'vulnerabilities' | 'senses' | 'languages' | 'otherProficiencies', value: string[]) {
  store.update(props.character.id, { [field]: value })
}
</script>
