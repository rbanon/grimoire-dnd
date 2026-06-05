<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/70" @click="$emit('close')" />

        <div
          class="relative w-full max-w-lg bg-void border border-shadow rounded-lg shadow-2xl flex flex-col"
          style="max-height: 82vh"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-shadow shrink-0">
            <div>
              <p class="font-heading text-base text-arcane-pale">Add Spells</p>
              <p class="text-2xs font-body text-mist mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{{ className }}</span>
                <template v-if="isFinite(limit ?? Infinity)">
                  <span class="text-mist/40">·</span>
                  <span :class="remaining <= 0 ? 'text-blood-bright' : ''">
                    {{ knownIndices.length + selected.length }}/{{ limit }} total
                  </span>
                </template>
                <template v-if="slotsPerLevel">
                  <span class="text-mist/40">·</span>
                  <span>Lv {{ selectedLevel }}:</span>
                  <span :class="remainingAtLevel <= 0 ? 'text-blood-bright' : ''">
                    {{ knownAtCurrentLevel + selectedAtCurrentLevel }}/{{ slotsPerLevel[selectedLevel] ?? 0 }}
                  </span>
                </template>
              </p>
            </div>
            <button type="button" class="text-mist hover:text-ash transition-colors" @click="$emit('close')">
              <XIcon :size="16" />
            </button>
          </div>

          <!-- Level tabs -->
          <div class="flex border-b border-shadow overflow-x-auto shrink-0 scrollbar-none">
            <button
              v-for="lvl in availableLevels"
              :key="lvl"
              type="button"
              class="px-3.5 py-2.5 text-xs font-heading tracking-wide whitespace-nowrap transition-colors shrink-0 border-b-2"
              :class="selectedLevel === lvl
                ? 'border-arcane-base text-arcane-pale'
                : 'border-transparent text-mist hover:text-ash'"
              @click="selectedLevel = lvl; search = ''"
            >Level {{ lvl }}</button>
          </div>

          <!-- Search -->
          <div class="px-5 py-3 border-b border-shadow shrink-0">
            <input
              v-model="search"
              type="text"
              placeholder="Search spells…"
              class="input-base w-full text-sm"
            />
          </div>

          <!-- List -->
          <div class="overflow-y-auto flex-1 px-4 py-3 space-y-1">
            <div v-if="loading" class="flex justify-center py-10">
              <GrimoireSpinner label="Loading spells…" />
            </div>
            <p v-else-if="filtered.length === 0" class="text-sm font-body text-mist text-center py-8">
              No spells found.
            </p>
            <template v-else>
              <div
                v-for="s in filtered"
                :key="s.index"
                class="flex items-center gap-3 px-3 py-2.5 rounded border transition-all"
                :class="isKnown(s.index) || isBlocked(s.index)
                  ? 'border-shadow opacity-40 cursor-not-allowed'
                  : isSelected(s.index)
                    ? 'border-arcane-base/60 bg-arcane-deep/20 cursor-pointer'
                    : 'border-shadow hover:border-arcane-base/30 hover:bg-arcane-deep/10 cursor-pointer'"
                @click="!isKnown(s.index) && !isBlocked(s.index) && toggle(s)"
              >
                <!-- Checkbox -->
                <div
                  class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                  :class="isSelected(s.index) ? 'border-arcane-base bg-arcane-deep/40' : 'border-mist/40'"
                >
                  <span v-if="isSelected(s.index)" class="text-arcane-pale text-[10px] leading-none">✓</span>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="font-heading text-sm" :class="isSelected(s.index) ? 'text-arcane-pale' : 'text-ash'">
                    {{ s.name }}
                  </p>
                  <p v-if="isKnown(s.index)" class="text-2xs font-body text-mist">Already known</p>
                  <p v-else-if="isChosenElsewhere(s.index)" class="text-2xs font-body text-gold-dim/70">Chosen at another level</p>
                </div>

                <button
                  type="button"
                  class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/30 transition-all"
                  title="View details"
                  @click.stop="infoPanel.open({ kind: 'spell', index: s.index })"
                >
                  <InfoIcon :size="12" />
                </button>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="px-5 py-4 border-t border-shadow shrink-0 flex items-center justify-between">
            <span class="text-xs font-body text-mist">
              {{ selected.length > 0
                ? `${selected.length} spell${selected.length > 1 ? 's' : ''} selected`
                : 'None selected' }}
            </span>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary text-sm" @click="$emit('close')">Cancel</button>
              <button
                type="button"
                class="btn-primary text-sm"
                :disabled="selected.length === 0"
                @click="confirm"
              >Add</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { InfoIcon, XIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

const props = defineProps<{
  show: boolean
  classIndex: string
  className: string
  knownIndices: string[]
  /** Spells chosen at other accordion levels — shown as blocked/labelled but don't affect the remaining counter */
  chosenElsewhereIndices?: string[]
  /** When provided alongside slotsPerLevel, enables per-level limit enforcement */
  knownSpells?: { index: string; level: number }[]
  /** Per spell-level slot counts — enforces per-level caps instead of a single total */
  slotsPerLevel?: Record<number, number>
  limit?: number
  initialLevel?: number
  maxLevel?: number
  /** Subclass-expanded spells addable to this caster's options (e.g. Warlock patron list). */
  extraSpells?: { index: string; name: string; level: number }[]
}>()

const emit = defineEmits<{
  close: []
  add: [spells: { index: string; name: string; level: number }[]]
}>()

const infoPanel = useInfoPanel()
const selectedLevel = ref<number>(props.initialLevel ?? 1)
const availableLevels = computed(() => LEVELS.filter(l => props.maxLevel === undefined || l <= props.maxLevel))
const search = ref('')
const selected = ref<{ index: string; name: string; level: number }[]>([])

// Reset when modal opens or initialLevel changes
watch(() => props.show, (open) => {
  if (open) {
    selectedLevel.value = props.initialLevel ?? 1
    search.value = ''
    selected.value = []
  }
})
watch(() => props.initialLevel, (lvl) => {
  if (lvl !== undefined) selectedLevel.value = lvl
})

const { data, isPending: loading } = useQuery({
  queryKey: computed(() => ['spells', props.classIndex, selectedLevel.value]),
  queryFn: () => fiveEApi.listSpells({ class: props.classIndex, level: selectedLevel.value }),
  staleTime: Infinity,
  enabled: computed(() => props.show && !!props.classIndex),
})

const allSpells = computed(() => {
  const base = data.value?.results ?? []
  const extra = (props.extraSpells ?? []).filter(s => s.level === selectedLevel.value)
  if (extra.length === 0) return base
  const seen = new Set(base.map(s => s.index))
  const merged = [...base]
  for (const s of extra) if (!seen.has(s.index)) merged.push({ index: s.index, name: s.name, url: '' })
  return merged.sort((a, b) => a.name.localeCompare(b.name))
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? allSpells.value.filter(s => s.name.toLowerCase().includes(q)) : allSpells.value
})

const remaining = computed(() => {
  if (props.limit === undefined) return Infinity
  return props.limit - props.knownIndices.length - selected.value.length
})

// Per-level limit helpers (only active when slotsPerLevel is provided)
const knownAtCurrentLevel = computed(() =>
  (props.knownSpells ?? []).filter(s => s.level === selectedLevel.value).length
)
const selectedAtCurrentLevel = computed(() =>
  selected.value.filter(s => s.level === selectedLevel.value).length
)
const limitAtCurrentLevel = computed(() =>
  props.slotsPerLevel ? (props.slotsPerLevel[selectedLevel.value] ?? 0) : Infinity
)
const remainingAtLevel = computed(() =>
  limitAtCurrentLevel.value - knownAtCurrentLevel.value - selectedAtCurrentLevel.value
)

function isKnown(index: string) { return props.knownIndices.includes(index) }
function isChosenElsewhere(index: string) { return props.chosenElsewhereIndices?.includes(index) ?? false }
function isSelected(index: string) { return selected.value.some(s => s.index === index) }
function isBlocked(index: string) {
  if (isSelected(index)) return false
  if (isChosenElsewhere(index)) return true
  if (props.slotsPerLevel) return remainingAtLevel.value <= 0 || remaining.value <= 0
  return remaining.value <= 0
}

function toggle(s: { index: string; name: string }) {
  if (isSelected(s.index)) {
    selected.value = selected.value.filter(x => x.index !== s.index)
  } else {
    selected.value.push({ index: s.index, name: s.name, level: selectedLevel.value })
  }
}

function confirm() {
  emit('add', [...selected.value])
  selected.value = []
  search.value = ''
}
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
