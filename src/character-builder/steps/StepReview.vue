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
            {{ d.className }}<span v-if="d.subclassName">, {{ d.subclassName }}</span>
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
        <ReviewSection v-if="expertiseLabels.length > 0" title="Expertise" :items="expertiseLabels" :empty="'None'" />
        <ReviewSection title="Languages" :items="d.selectedLanguages" :empty="'None selected'" />
      </div>

      <!-- Right column -->
      <div class="space-y-4">

        <!-- Cantrips -->
        <div v-if="builder.isSpellcaster && d.selectedCantrips.length" class="card p-4 space-y-2">
          <p class="label">Cantrips</p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="c in d.selectedCantrips"
              :key="c.index"
              class="px-2 py-0.5 rounded text-xs font-heading border border-arcane-bright/30 bg-arcane-bright/8 text-arcane-pale"
            >
              {{ c.name }}
            </span>
          </div>
        </div>

        <!-- Spells by level -->
        <div v-if="builder.isSpellcaster && allSpells.length" class="card p-4 space-y-3">
          <div class="flex items-center justify-between">
            <p class="label">{{ isPreparedCaster ? 'Spell List' : 'Spells' }}</p>
            <span v-if="isPreparedCaster" class="text-2xs font-body text-mist">
              <span class="text-gold-mid">◆</span> prepared
            </span>
          </div>
          <div v-for="(group, lvl) in spellsByLevel" :key="lvl" class="space-y-1">
            <p class="text-2xs font-heading tracking-wider text-mist uppercase">
              {{ lvl === '1' ? '1st' : lvl === '2' ? '2nd' : lvl === '3' ? '3rd' : `${lvl}th` }} Level
            </p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="s in group"
                :key="s.index"
                class="flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-heading border transition-colors"
                :class="isPreparedCaster && !preparedIndices.has(s.index)
                  ? 'border-shadow/50 text-mist/50'
                  : 'border-arcane-bright/20 bg-arcane-bright/5 text-arcane-pale/80'"
              >
                <span v-if="isPreparedCaster && preparedIndices.has(s.index)" class="text-gold-mid text-2xs">◆</span>
                {{ s.name }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Equipment -->
    <div>
      <div class="rule-gold"><span>Equipment</span></div>

      <div v-if="!d.useStartingEquipment" class="card p-4 mt-3">
        <p class="text-sm font-body text-ash">Starting with <span class="text-gold-mid font-heading">{{ d.manualGold }} gp</span> to spend.</p>
      </div>

      <div v-else-if="d.startingInventory.length" class="mt-3 space-y-1.5">
        <div
          v-for="item in d.startingInventory"
          :key="item.id"
          class="card px-3 py-2 flex items-center gap-3"
        >
          <span class="text-base shrink-0">{{ itemGlyph(item.itemType) }}</span>
          <div class="flex-1 min-w-0">
            <span class="text-sm font-heading text-stone">{{ item.item.name }}</span>
            <span v-if="item.quantity > 1" class="ml-1.5 text-xs text-mist font-body">×{{ item.quantity }}</span>
          </div>
          <div class="flex gap-3 text-xs font-heading text-mist shrink-0">
            <span v-if="item.damage" class="text-vellum">{{ item.damage }} {{ item.damageType }}</span>
            <span v-if="item.armorClass" class="text-vellum">AC {{ item.armorClass }}</span>
            <span v-if="item.range" class="text-ash">{{ item.range }}</span>
            <span
              class="px-1.5 py-0.5 rounded border text-2xs uppercase tracking-wide"
              :class="itemTypeBadge(item.itemType)"
            >{{ item.itemType }}</span>
          </div>
        </div>
      </div>

      <div v-else class="card p-4 mt-3">
        <p class="text-sm font-body text-mist">Starting equipment from class &amp; background (details on character sheet).</p>
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
import { getClassMeta, getSpellProfile } from '@/character-builder/classMeta'
import ReviewSection from '@/character-builder/components/ReviewSection.vue'
import type { InventoryItem } from '@/shared/types/character'

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
const expertiseLabels = computed(() =>
  d.value.expertiseSkills.map(s => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')),
)

const profile = computed(() => getSpellProfile(d.value.classIndex))
const isPreparedCaster = computed(() => profile.value?.castingType === 'prepared')
const preparedIndices = computed(() => new Set(d.value.selectedPreparedSpells.map(s => s.index)))

// activeSpells handles all caster types correctly:
// known → derived from spellsByLevel, prepared/spellbook → selectedSpells directly
const allSpells = computed(() => builder.activeSpells)

const spellsByLevel = computed(() => {
  const groups: Record<string, { index: string; name: string; level: number }[]> = {}
  for (const s of allSpells.value) {
    const key = String(s.level)
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  }
  return groups
})

function itemGlyph(type: InventoryItem['itemType']): string {
  if (type === 'weapon') return '⚔'
  if (type === 'armor') return '🛡'
  return '🎒'
}

function itemTypeBadge(type: InventoryItem['itemType']): string {
  if (type === 'weapon') return 'border-blood-base/30 text-blood-mid'
  if (type === 'armor') return 'border-gold-dim/30 text-gold-dim'
  return 'border-shadow text-mist'
}
</script>
