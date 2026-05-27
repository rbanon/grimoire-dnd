<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[70] flex items-center justify-center p-4"
        @keydown.esc="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />

        <div
          role="dialog"
          aria-modal="true"
          class="relative w-full max-w-lg bg-void border border-shadow rounded-lg shadow-2xl overflow-hidden flex flex-col"
          style="max-height: 88vh"
        >
          <div class="h-0.5 w-full bg-arcane-base" />

          <!-- Header -->
          <div class="px-5 py-4 border-b border-shadow flex items-start justify-between shrink-0 gap-3">
            <div class="min-w-0">
              <p class="font-heading text-base text-arcane-pale leading-snug">{{ spell.name }}</p>
              <p v-if="detail" class="text-2xs font-body text-mist mt-0.5">
                {{ isCantrip ? 'Cantrip' : `Level ${spell.level} spell` }}
                <span v-if="detail.school"> · {{ detail.school.name }}</span>
              </p>
            </div>
            <button type="button" class="shrink-0 text-mist hover:text-ash transition-colors mt-0.5" @click="$emit('close')">
              <XIcon :size="16" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            <div v-if="loading" class="flex justify-center py-8">
              <GrimoireSpinner label="Loading spell…" />
            </div>

            <template v-else-if="detail">
              <!-- Quick stats -->
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs font-heading text-mist">
                <span>{{ castingTime }}</span>
                <span>{{ detail.range }}</span>
                <span v-if="detail.duration">{{ detail.duration }}</span>
                <span v-if="detail.concentration" class="text-arcane-pale/70">Concentration</span>
                <span v-if="detail.ritual" class="text-gold-dim">Ritual</span>
                <span v-if="detail.components?.length" class="text-mist/60">{{ detail.components.join(', ') }}</span>
              </div>

              <!-- Description -->
              <div class="space-y-2">
                <p
                  v-for="(para, i) in detail.desc"
                  :key="i"
                  class="text-sm font-body text-ash leading-relaxed"
                >{{ para }}</p>
              </div>

              <!-- Level selector (leveled spells only) -->
              <template v-if="!isCantrip">
                <div class="border-t border-shadow pt-4 space-y-3">
                  <p class="text-2xs font-heading text-mist uppercase tracking-wider">Cast at level</p>

                  <div v-if="castableLevels.length === 0" class="text-xs font-body text-blood-bright">
                    No spell slots available.
                  </div>
                  <p
                    v-else-if="castableLevels[0] > spell.level"
                    class="text-xs font-body text-arcane-pale/80 italic"
                  >Pact Magic upcasts this spell to level {{ castableLevels[0] }}.</p>
                  <div v-if="castableLevels.length > 0" class="flex flex-wrap gap-2">
                    <button
                      v-for="lvl in castableLevels"
                      :key="lvl"
                      type="button"
                      class="px-3 py-1.5 rounded border text-sm font-heading transition-all duration-150"
                      :class="selectedLevel === lvl
                        ? 'border-arcane-base/70 bg-arcane-deep/30 text-arcane-pale'
                        : slotsRemaining(lvl) > 0
                          ? 'border-shadow text-ash hover:border-arcane-base/40 hover:text-arcane-pale'
                          : 'border-shadow/30 text-mist/30 cursor-not-allowed'"
                      :disabled="slotsRemaining(lvl) <= 0"
                      @click="slotsRemaining(lvl) > 0 && (selectedLevel = lvl)"
                    >
                      Lv {{ lvl }}
                      <span class="text-2xs ml-1 opacity-50">{{ slotsRemaining(lvl) }}/{{ slotsMax(lvl) }}</span>
                    </button>
                  </div>

                  <!-- At higher levels -->
                  <div
                    v-if="selectedLevel > spell.level && detail.higher_level?.length"
                    class="px-3 py-2.5 rounded border border-arcane-base/20 bg-arcane-deep/10"
                  >
                    <p class="text-2xs font-heading text-arcane-pale/70 uppercase tracking-wider mb-1.5">At Higher Levels</p>
                    <p
                      v-for="(hl, i) in detail.higher_level"
                      :key="i"
                      class="text-xs font-body text-ash leading-relaxed"
                    >{{ hl }}</p>
                  </div>
                </div>
              </template>
            </template>
          </div>

          <!-- Concentration warning -->
          <div
            v-if="detail?.concentration && character.combat.concentrationSpell"
            class="px-5 py-2.5 border-t border-arcane-base/30 bg-arcane-deep/10 flex items-start gap-2.5 shrink-0"
          >
            <AlertTriangleIcon :size="14" class="text-arcane-pale/70 shrink-0 mt-0.5" />
            <p class="text-xs font-body text-arcane-pale/80 leading-snug">
              Casting this will end your concentration on
              <span class="font-heading text-arcane-pale">{{ character.combat.concentrationSpell }}</span>.
            </p>
          </div>

          <!-- Actions -->
          <div class="px-5 py-3 border-t border-shadow flex justify-end gap-2 shrink-0">
            <button type="button" class="btn-secondary text-sm" @click="$emit('close')">Close</button>
            <button
              type="button"
              class="btn-primary text-sm"
              :disabled="!isCantrip && (castableLevels.length === 0 || slotsRemaining(selectedLevel) <= 0)"
              @click="handleCast"
            >
              {{ isCantrip ? 'Cast Cantrip' : 'Cast Spell' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XIcon, AlertTriangleIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'
import type { SpellReference } from '@/shared/types/character'
import type { Character } from '@/shared/types/character'

const props = defineProps<{
  show: boolean
  spell: SpellReference
  character: Character
}>()

const emit = defineEmits<{
  close: []
  cast: [slotLevel: number, isConcentration: boolean]
}>()

type SlotKey = `level${1|2|3|4|5|6|7|8|9}`
function slotKey(n: number): SlotKey { return `level${n}` as SlotKey }

const isCantrip = computed(() => props.spell.level === 0)
const selectedLevel = ref(Math.max(props.spell.level, 1))

const { data: detail, isPending: loading } = useQuery({
  queryKey: computed(() => ['spell', props.spell.index]),
  queryFn: () => fiveEApi.getSpell(props.spell.index),
  enabled: computed(() => props.show && !!props.spell.index),
  staleTime: Infinity,
})

const castingTime = computed(() => {
  const raw = detail.value?.casting_time ?? ''
  if (/bonus/i.test(raw)) return 'Bonus Action'
  if (/reaction/i.test(raw)) return 'Reaction'
  return raw
})

const sc = computed(() => props.character.spellcasting)
function slotsMax(n: number)       { return sc.value?.slotsMax[slotKey(n)] ?? 0 }
function slotsUsed(n: number)      { return sc.value?.slotsUsed[slotKey(n)] ?? 0 }
function slotsRemaining(n: number) { return Math.max(0, slotsMax(n) - slotsUsed(n)) }

const castableLevels = computed(() => {
  if (isCantrip.value) return []
  const levels: number[] = []
  for (let lvl = props.spell.level; lvl <= 9; lvl++) {
    if (slotsMax(lvl) > 0) levels.push(lvl)
  }
  return levels
})

watch(() => props.show, (val) => {
  if (val) {
    const firstAvailable = castableLevels.value[0] ?? Math.max(props.spell.level, 1)
    selectedLevel.value = firstAvailable
  }
}, { immediate: true })

function handleCast() {
  emit('cast', isCantrip.value ? 0 : selectedLevel.value, detail.value?.concentration ?? false)
  emit('close')
}
</script>

<style scoped>
.dialog-fade-enter-active, .dialog-fade-leave-active { transition: opacity 0.15s ease; }
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }
</style>
