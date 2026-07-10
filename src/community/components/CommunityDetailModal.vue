<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="show && item"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown.esc="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />

        <div
          role="dialog"
          aria-modal="true"
          v-focus-trap
          aria-labelledby="community-detail-title"
          class="relative w-full max-w-lg bg-void border border-shadow rounded-lg shadow-2xl overflow-hidden flex flex-col"
          style="max-height: 88vh"
        >
          <div class="h-0.5 w-full bg-arcane-base" />

          <!-- Header -->
          <div class="px-5 py-4 border-b border-shadow flex items-start justify-between gap-3 shrink-0">
            <div class="min-w-0">
              <p id="community-detail-title" class="font-heading text-base text-arcane-pale truncate">{{ item.name }}</p>
              <p class="text-2xs font-body text-mist mt-0.5">
                {{ item.kind === 'race' ? 'Race' : 'Class' }} · {{ item.edition }}
                <template v-if="item.authorName"> · by {{ item.authorName }}</template>
              </p>
            </div>
            <button type="button" class="text-mist hover:text-ash transition-colors shrink-0" aria-label="Close" @click="$emit('close')">
              <XIcon :size="16" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            <!-- Race detail -->
            <template v-if="race">
              <div v-if="raceAbilityChips.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="chip in raceAbilityChips"
                  :key="chip"
                  class="px-2 py-0.5 rounded border border-arcane-base/25 bg-arcane-deep/15 text-2xs font-heading text-arcane-pale"
                >{{ chip }}</span>
              </div>

              <div class="flex flex-wrap gap-2">
                <span class="px-2.5 py-1 rounded border border-gold-dim/30 text-xs font-heading text-gold-dim">Size {{ race.size }}</span>
                <span class="px-2.5 py-1 rounded border border-gold-dim/30 text-xs font-heading text-gold-dim">Speed {{ race.speed }} ft.</span>
                <span v-if="race.darkvision" class="px-2.5 py-1 rounded border border-arcane-base/30 text-xs font-heading text-arcane-pale">Darkvision {{ race.darkvision }} ft.</span>
              </div>

              <DetailChips v-if="race.resistances.length" label="Damage Resistances" :values="race.resistances.map(humanize)" />
              <DetailChips v-if="race.skillProficiencies.length" label="Skill Proficiencies" :values="race.skillProficiencies.map(humanize)" />
              <DetailChips v-if="race.toolProficiencies.length" label="Tool / Weapon Proficiencies" :values="race.toolProficiencies" />

              <p v-if="race.languageChoices" class="text-xs font-body text-mist">
                <span class="text-2xs font-heading tracking-wide uppercase text-mist">Bonus Languages:</span>
                {{ race.languageChoices }} (beyond Common)
              </p>

              <div v-if="race.traits.length" class="space-y-2">
                <p class="text-2xs font-heading tracking-wide uppercase text-mist">Racial Traits</p>
                <div
                  v-for="(trait, i) in race.traits"
                  :key="i"
                  class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-1"
                >
                  <p class="text-sm font-heading text-vellum">{{ trait.name || 'Unnamed trait' }}</p>
                  <p v-if="trait.desc" class="text-xs font-body text-ash leading-relaxed">{{ trait.desc }}</p>
                </div>
              </div>
            </template>

            <!-- Class detail -->
            <template v-else-if="classDef">
              <div class="flex flex-wrap gap-2">
                <span class="px-2.5 py-1 rounded border border-gold-dim/30 text-xs font-heading text-gold-dim">Hit Die d{{ classDef.hitDie }}</span>
                <span v-if="classDef.primaryAbility" class="px-2.5 py-1 rounded border border-arcane-base/30 text-xs font-heading text-arcane-pale">Primary {{ classDef.primaryAbility }}</span>
                <span v-if="classDef.spellcasting" class="px-2.5 py-1 rounded border border-arcane-base/30 text-xs font-heading text-arcane-pale">Spellcaster</span>
              </div>
              <p v-if="classDef.description" class="text-xs font-body text-ash leading-relaxed">{{ classDef.description }}</p>
              <DetailChips v-if="classDef.saves.length" label="Saving Throws" :values="classDef.saves.map(s => s.toUpperCase())" />
              <div v-for="(feats, lvl) in classDef.featuresByLevel" :key="lvl" class="space-y-2">
                <p class="text-2xs font-heading tracking-wide uppercase text-mist">Level {{ lvl }} Features</p>
                <div v-for="(f, i) in feats" :key="i" class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-1">
                  <p class="text-sm font-heading text-vellum">{{ f.name || 'Unnamed feature' }}</p>
                  <p v-if="f.desc" class="text-xs font-body text-ash leading-relaxed">{{ f.desc }}</p>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer: reuse action -->
          <div class="px-5 py-3 border-t border-shadow flex items-center justify-between gap-3 shrink-0">
            <div class="min-w-0">
              <span v-if="isOwn" class="text-2xs font-body text-mist/70 italic">This is from your collection.</span>
              <span v-else-if="!auth.isAuthenticated" class="text-2xs font-body text-mist/50 italic truncate">Sign in to copy this to your collection.</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" class="btn-secondary text-sm" @click="$emit('close')">Close</button>
              <button
                v-if="auth.isAuthenticated && !isOwn"
                type="button"
                class="btn-primary text-sm"
                :disabled="copying"
                @click="copyToCollection"
              >{{ copying ? 'Copying…' : 'Copy to my collection' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, defineComponent, h } from 'vue'
import { XIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/auth/store'
import { useCustomContentStore } from '@/custom-content/store'
import type { CommunityItem, CustomRace, CustomClass } from '@/shared/types/customContent'

const props = defineProps<{ show: boolean; item: CommunityItem | null }>()
const emit = defineEmits<{ close: [] }>()

const auth = useAuthStore()
const customContent = useCustomContentStore()
const copying = ref(false)

const race = computed<CustomRace | null>(() => props.item?.kind === 'race' ? (props.item.data as CustomRace) : null)
const classDef = computed<CustomClass | null>(() => props.item?.kind === 'class' ? (props.item.data as CustomClass) : null)
const isOwn = computed(() => !!props.item && !!auth.userId && props.item.userId === auth.userId)

const ABILITY_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const ABILITY_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}
const raceAbilityChips = computed(() => {
  const r = race.value
  if (!r) return []
  return ABILITY_ORDER
    .filter(k => (r.abilityBonuses[k] ?? 0) > 0)
    .map(k => `${ABILITY_LABELS[k]} +${r.abilityBonuses[k]}`)
})

function humanize(s: string): string {
  return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function copyToCollection() {
  const it = props.item
  if (!auth.isAuthenticated || !it || copying.value) return
  copying.value = true
  try {
    // Provenance: the copy is an independent snapshot, but remembers its origin (id/author +
    // the original's updatedAt at copy time, for a later "newer version available" hint).
    const source = { id: it.id, authorName: it.authorName, updatedAt: it.updatedAt }
    let created = null
    if (race.value) {
      const r = race.value
      created = await customContent.createRace({
        name: r.name,
        edition: r.edition,
        abilityBonuses: { ...r.abilityBonuses },
        size: r.size,
        speed: r.speed,
        darkvision: r.darkvision,
        resistances: [...r.resistances],
        skillProficiencies: [...r.skillProficiencies],
        toolProficiencies: [...r.toolProficiencies],
        languageChoices: r.languageChoices,
        traits: r.traits.map(t => ({ name: t.name, desc: t.desc })),
        isPublic: false,
        source,
      })
    } else if (classDef.value) {
      const c = classDef.value
      created = await customContent.createClass({
        name: c.name,
        edition: c.edition,
        description: c.description,
        hitDie: c.hitDie,
        primaryAbility: c.primaryAbility,
        saves: [...c.saves],
        armorProficiencies: [...c.armorProficiencies],
        weaponProficiencies: [...c.weaponProficiencies],
        toolProficiencies: [...c.toolProficiencies],
        skillChoices: c.skillChoices,
        skillOptions: [...c.skillOptions],
        spellcasting: c.spellcasting ? { ...c.spellcasting } : null,
        featuresByLevel: Object.fromEntries(
          Object.entries(c.featuresByLevel).map(([lvl, feats]) => [lvl, feats.map(f => ({ name: f.name, desc: f.desc }))]),
        ),
        isPublic: false,
        source,
      })
    }
    if (created) emit('close')
  } finally {
    copying.value = false
  }
}

// Small label + chip-row presenter used by both detail branches.
const DetailChips = defineComponent({
  props: { label: { type: String, required: true }, values: { type: Array as () => string[], required: true } },
  setup(p) {
    return () => h('div', { class: 'space-y-1.5' }, [
      h('p', { class: 'text-2xs font-heading tracking-wide uppercase text-mist' }, p.label),
      h('div', { class: 'flex flex-wrap gap-1.5' }, p.values.map((v) =>
        h('span', { class: 'px-2 py-0.5 rounded border border-shadow text-xs font-heading text-ash' }, v),
      )),
    ])
  },
})
</script>

<style scoped>
.dialog-fade-enter-active, .dialog-fade-leave-active { transition: opacity 0.15s ease; }
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }
</style>
