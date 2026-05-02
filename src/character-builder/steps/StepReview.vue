<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-8">

    <!-- Hero card -->
    <div
      class="card corner-ornament p-6 relative overflow-hidden"
      style="background: linear-gradient(135deg, rgba(212,168,67,0.05) 0%, rgba(13,17,32,0) 50%)"
    >
      <div
        class="absolute top-0 left-0 right-0 h-px"
        style="background: linear-gradient(90deg, transparent, rgba(212,168,67,0.4), transparent)"
      />

      <div class="flex items-start gap-5">
        <!-- Portrait placeholder -->
        <div class="shrink-0 w-20 h-20 rounded border border-shadow bg-depths overflow-hidden relative">
          <img
            v-if="d.portraitUrl"
            :src="d.portraitUrl"
            class="w-full h-full object-cover"
            alt="Portrait"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-3xl">
            {{ classGlyph }}
          </div>
          <div class="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-gold-dim/40" />
          <div class="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-gold-dim/40" />
          <div class="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-gold-dim/40" />
          <div class="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-gold-dim/40" />
        </div>

        <div class="flex-1 min-w-0">
          <h2 class="font-display text-3xl text-vellum leading-tight">{{ d.name || 'Unnamed Hero' }}</h2>
          <p class="font-body text-ash mt-1">
            {{ d.raceName }}<span v-if="d.subraceName"> · {{ d.subraceName }}</span>
            <span class="text-mist mx-1.5">·</span>
            {{ d.className }}<span v-if="d.subclassName"> — {{ d.subclassName }}</span>
            <span class="text-mist mx-1.5">·</span>
            Level {{ d.level }}
          </p>
          <div class="flex gap-2 flex-wrap mt-2.5">
            <span class="badge-gold">{{ d.backgroundName || 'No background' }}</span>
            <span class="badge-arcane">{{ d.alignment }}</span>
            <span v-if="builder.isSpellcaster" class="badge-arcane">✶ Spellcaster</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats overview -->
    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
      <div v-for="ab in abilityDefs" :key="ab.key" class="card flex flex-col items-center py-3 gap-0.5">
        <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">{{ ab.label }}</p>
        <p class="font-heading text-xl text-vellum leading-none">{{ effectiveScore(ab.key) }}</p>
        <p
          class="text-xs font-heading"
          :class="effectiveMod(ab.key) >= 0 ? 'text-gold-mid' : 'text-blood-bright'"
        >
          {{ effectiveMod(ab.key) >= 0 ? '+' : '' }}{{ effectiveMod(ab.key) }}
        </p>
      </div>
    </div>

    <!-- Key stats row -->
    <div class="grid grid-cols-4 gap-2">
      <div v-for="stat in keyStats" :key="stat.label" class="card flex flex-col items-center py-3 gap-0.5">
        <p class="text-2xs font-heading tracking-wider uppercase text-mist">{{ stat.label }}</p>
        <p class="font-heading text-lg text-vellum">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Details columns -->
    <div class="grid sm:grid-cols-2 gap-6">
      <!-- Left column -->
      <div class="space-y-4">
        <ReviewSection title="Proficiencies" :items="skillLabels" :empty="'None selected'" />
        <ReviewSection title="Languages" :items="d.selectedLanguages" :empty="'None selected'" />
      </div>

      <!-- Right column -->
      <div class="space-y-4">
        <ReviewSection
          v-if="builder.isSpellcaster && d.selectedCantrips.length"
          title="Cantrips"
          :items="d.selectedCantrips.map(c => c.name)"
          :empty="'None selected'"
        />
        <div class="card p-4 space-y-2">
          <p class="label">Equipment</p>
          <p class="text-sm font-body text-ash">
            {{ d.useStartingEquipment ? 'Starting equipment from class & background' : `${d.manualGold} gp to spend` }}
          </p>
        </div>
      </div>
    </div>

    <!-- Biography preview -->
    <div v-if="d.personalityTraits || d.ideals || d.biography" class="space-y-2">
      <div class="rule-gold"><span>Personality</span></div>
      <div class="grid sm:grid-cols-2 gap-3">
        <div v-if="d.personalityTraits" class="card p-3">
          <p class="label mb-1">Traits</p>
          <p class="text-sm font-body text-stone">{{ d.personalityTraits }}</p>
        </div>
        <div v-if="d.ideals" class="card p-3">
          <p class="label mb-1">Ideals</p>
          <p class="text-sm font-body text-stone">{{ d.ideals }}</p>
        </div>
      </div>
    </div>

    <!-- Final confirmation note -->
    <div class="card p-4 border-gold-dim/15 bg-depths/40 flex items-start gap-3">
      <span class="text-gold-dim text-lg shrink-0">⚔</span>
      <p class="text-sm font-body text-ash leading-relaxed">
        Your character will be saved {{ isAuthenticated ? 'to the cloud' : 'locally in your browser' }}.
        You can edit all values at any time from the character sheet.
        <span v-if="!isAuthenticated" class="text-mist block mt-1">
          <RouterLink to="/login" class="text-gold-mid hover:text-gold-bright underline underline-offset-2">Sign in</RouterLink>
          to also back it up to the cloud.
        </span>
      </p>
    </div>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/character-builder/builderStore'
import { useAuthStore } from '@/auth/store'
import { computeModifier } from '@/shared/types/character'
import { computeProficiencyBonus } from '@/shared/lib/derivedStats'
import { getClassMeta } from '@/character-builder/classMeta'
import ReviewSection from '@/character-builder/components/ReviewSection.vue'

const builder = useBuilderStore()
const auth = useAuthStore()
const d = computed(() => builder.draft)
const isAuthenticated = computed(() => auth.isAuthenticated)

const abilityDefs = [
  { key: 'str' as const, label: 'STR' },
  { key: 'dex' as const, label: 'DEX' },
  { key: 'con' as const, label: 'CON' },
  { key: 'int' as const, label: 'INT' },
  { key: 'wis' as const, label: 'WIS' },
  { key: 'cha' as const, label: 'CHA' },
]

const effectiveScore = (key: typeof abilityDefs[number]['key']) => builder.effectiveScores[key]
const effectiveMod = (key: typeof abilityDefs[number]['key']) =>
  computeModifier(builder.effectiveScores[key])

const profBonus = computed(() => computeProficiencyBonus(d.value.level))
const classGlyph = computed(() => getClassMeta(d.value.classIndex).glyph || '⚔')

const keyStats = computed(() => [
  { label: 'HP',         value: builder.computedMaxHp },
  { label: 'AC',         value: 10 + effectiveMod('dex') },
  { label: 'Initiative', value: (effectiveMod('dex') >= 0 ? '+' : '') + effectiveMod('dex') },
  { label: 'Prof Bonus', value: `+${profBonus.value}` },
])

const skillLabels = computed(() => d.value.selectedSkills)
</script>
