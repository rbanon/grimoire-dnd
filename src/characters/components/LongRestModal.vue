<template>
  <Teleport to="body">
    <Transition name="lr-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keydown.esc="emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" @click="emit('close')" />

        <div class="relative w-full max-w-lg bg-void border border-shadow rounded-lg shadow-2xl flex flex-col max-h-[90vh]">

          <!-- Accent bar -->
          <div class="h-0.5 w-full bg-gold-mid shrink-0" />

          <!-- Header -->
          <div class="px-5 pt-4 pb-3 shrink-0">
            <div class="flex items-center justify-between">
              <p class="font-heading text-base text-gold-mid tracking-wide">Long Rest</p>
              <span class="badge-gold">Lv {{ character.combat.level }}</span>
            </div>
            <p class="font-body text-sm text-ash mt-0.5">
              After a full rest, you awaken refreshed and restored.
            </p>
          </div>

          <!-- Scrollable body -->
          <div class="overflow-y-auto px-5 pb-5 space-y-5 flex-1">

            <!-- ── Spell preparation (prepared casters only) ── -->
            <section v-if="isPreparedCaster">
              <div class="rule-gold mb-3"><span>Prepare Spells</span></div>

              <p class="font-body text-xs text-ash mb-3">
                Choose up to
                <span class="font-heading text-vellum">{{ dailyLimit }}</span>
                spells
                <span class="text-mist">({{ abilityName }} mod {{ fmt(abilityMod) }} + level {{ character.combat.level }})</span>.
              </p>

              <!-- Selected counter -->
              <div class="flex items-center justify-between mb-3">
                <p class="text-xs font-heading text-mist uppercase tracking-wide">Prepared</p>
                <span
                  class="text-xs font-heading tabular-nums px-2 py-0.5 rounded border"
                  :class="atLimit
                    ? 'border-arcane-base/50 text-arcane-pale bg-arcane-deep/10'
                    : 'border-shadow text-mist'"
                >{{ localPrepared.length }} / {{ dailyLimit }}</span>
              </div>

              <!-- Level tabs -->
              <div class="flex gap-1 mb-3 flex-wrap">
                <button
                  v-for="lvl in availableLevels"
                  :key="lvl"
                  type="button"
                  class="px-2.5 py-1 rounded text-xs font-heading tracking-wide transition-all border"
                  :class="selectedLevel === lvl
                    ? 'border-arcane-base/50 bg-arcane-deep/20 text-arcane-pale'
                    : 'border-shadow text-ash hover:border-arcane-base/25'"
                  @click="selectedLevel = lvl"
                >Lv {{ lvl }}</button>
              </div>

              <!-- Spell list -->
              <div v-if="spellsLoading" class="flex justify-center py-4">
                <div class="w-5 h-5 rounded-full border-2 border-arcane-base/30 border-t-arcane-pale animate-spin" />
              </div>
              <div v-else-if="spellsAtLevel.length === 0" class="text-xs font-body text-mist/50 italic">
                No spells available at this level.
              </div>
              <div v-else class="grid grid-cols-1 gap-1">
                <button
                  v-for="spell in spellsAtLevel"
                  :key="spell.index"
                  type="button"
                  class="flex items-center gap-2.5 px-3 py-2 rounded border text-left transition-all duration-100"
                  :class="isPrepared(spell.index)
                    ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale'
                    : atLimit
                      ? 'border-shadow/40 text-mist/40 cursor-not-allowed'
                      : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone cursor-pointer'"
                  :disabled="!isPrepared(spell.index) && atLimit"
                  @click="toggleSpell(spell)"
                >
                  <span
                    class="w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-all"
                    :class="isPrepared(spell.index)
                      ? 'border-arcane-base/60 bg-arcane-base/30 text-arcane-pale'
                      : 'border-shadow/60'"
                  >
                    <span v-if="isPrepared(spell.index)" class="text-2xs leading-none">✓</span>
                  </span>
                  <span class="font-body text-sm leading-snug">{{ spell.name }}</span>
                </button>
              </div>
            </section>

            <!-- ── Rest effects summary ── -->
            <section>
              <div class="rule-gold mb-3"><span>Restored</span></div>
              <div class="rounded border border-shadow bg-depths/30 px-3 py-2.5 space-y-1.5">
                <div class="flex items-baseline gap-3">
                  <span class="font-mono text-2xs tracking-widest uppercase text-mist w-20 shrink-0">HP</span>
                  <span class="font-body text-sm text-vellum">Restored to {{ character.combat.maxHp }} / {{ character.combat.maxHp }}</span>
                </div>
                <div v-if="character.spellcasting" class="flex items-baseline gap-3">
                  <span class="font-mono text-2xs tracking-widest uppercase text-mist w-20 shrink-0">Spell Slots</span>
                  <span class="font-body text-sm text-vellum">All recovered</span>
                </div>
                <div class="flex items-baseline gap-3">
                  <span class="font-mono text-2xs tracking-widest uppercase text-mist w-20 shrink-0">Hit Dice</span>
                  <span class="font-body text-sm text-vellum">
                    +{{ hitDiceRegained }} recovered
                    ({{ Math.min(character.combat.level, character.combat.hitDiceRemaining + hitDiceRegained) }}d{{ hitDie }} remaining)
                  </span>
                </div>
                <div v-if="isPreparedCaster" class="flex items-baseline gap-3">
                  <span class="font-mono text-2xs tracking-widest uppercase text-mist w-20 shrink-0">Prepared</span>
                  <span class="font-body text-sm text-vellum">{{ localPrepared.length }} spell{{ localPrepared.length !== 1 ? 's' : '' }} prepared</span>
                </div>
              </div>
            </section>
          </div>

          <!-- Footer -->
          <div class="px-5 py-4 border-t border-shadow shrink-0 flex gap-2">
            <button type="button" class="flex-1 btn-secondary text-sm" @click="emit('close')">
              Cancel
            </button>
            <button type="button" class="flex-1 btn-primary text-sm" @click="confirm">
              Begin Rest
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { computeAllModifiers } from '@/shared/types/character'
import { getSpellProfile, getMaxSpellLevel, CLASS_META } from '@/character-builder/classMeta'
import type { Character, SpellReference } from '@/shared/types/character'

const props = defineProps<{ show: boolean; character: Character }>()
const emit = defineEmits<{ close: []; rested: [prepared: SpellReference[]] }>()

// ── Character shortcuts ───────────────────────────────────────────────────────

const classIndex  = computed(() => props.character.identity.class.index)
const profile     = computed(() => getSpellProfile(classIndex.value))
const mods        = computed(() => computeAllModifiers(props.character.abilityScores))
const hitDie      = computed(() => CLASS_META[classIndex.value]?.hitDie ?? 8)

// ── Prepared caster logic ─────────────────────────────────────────────────────

const isPreparedCaster = computed(() => profile.value?.castingType === 'prepared')

const abilityKey = computed(() => profile.value?.preparedAbility ?? 'wis')
const abilityMod = computed(() => mods.value[abilityKey.value] ?? 0)
const abilityName = computed(() => ({ wis: 'WIS', int: 'INT', cha: 'CHA' }[abilityKey.value] ?? 'WIS'))

const dailyLimit = computed(() => {
  const lv = props.character.combat.level
  const mod = abilityMod.value
  if (classIndex.value === 'paladin') return Math.max(1, Math.floor(lv / 2) + mod)
  return Math.max(1, lv + mod)
})

const maxSpellLevel = computed(() =>
  getMaxSpellLevel(classIndex.value, props.character.combat.level)
)
const availableLevels = computed(() =>
  Array.from({ length: maxSpellLevel.value }, (_, i) => i + 1)
)

// ── Local prepared selection ──────────────────────────────────────────────────

const localPrepared = ref<SpellReference[]>([])

watch(() => props.show, (open) => {
  if (open) {
    localPrepared.value = [...(props.character.spellcasting?.spellsPrepared ?? [])]
    selectedLevel.value = 1
  }
})

const atLimit = computed(() => localPrepared.value.length >= dailyLimit.value)

function isPrepared(index: string): boolean {
  return localPrepared.value.some(s => s.index === index)
}

function toggleSpell(spell: { index: string; name: string }) {
  if (isPrepared(spell.index)) {
    localPrepared.value = localPrepared.value.filter(s => s.index !== spell.index)
  } else if (!atLimit.value) {
    localPrepared.value.push({ index: spell.index, name: spell.name, level: selectedLevel.value })
  }
}

// ── Spell fetch ───────────────────────────────────────────────────────────────

const selectedLevel = ref(1)

const { data: spellData, isPending: spellsLoading } = useQuery({
  queryKey: computed(() => ['spells', classIndex.value, selectedLevel.value]),
  queryFn: () => fiveEApi.listSpells({ class: classIndex.value, level: selectedLevel.value }),
  staleTime: Infinity,
  enabled: computed(() => props.show && isPreparedCaster.value),
})

const spellsAtLevel = computed(() => spellData.value?.results ?? [])

// ── Rest summary helpers ──────────────────────────────────────────────────────

const hitDiceRegained = computed(() =>
  Math.max(1, Math.floor(props.character.combat.level / 2))
)

// ── Confirm ───────────────────────────────────────────────────────────────────

function confirm() {
  emit('rested', isPreparedCaster.value ? [...localPrepared.value] : [])
}

function fmt(n: number) { return n >= 0 ? `+${n}` : String(n) }
</script>

<style scoped>
.lr-fade-enter-active,
.lr-fade-leave-active {
  transition: opacity 0.15s ease;
}
.lr-fade-enter-active .relative,
.lr-fade-leave-active .relative {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.lr-fade-enter-from,
.lr-fade-leave-to { opacity: 0; }
.lr-fade-enter-from .relative { transform: scale(0.97); }
</style>
