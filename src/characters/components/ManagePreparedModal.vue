<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        @keydown.esc="emit('close')"
      >
        <div class="absolute inset-0 bg-black/70" @click="emit('close')" />

        <div
          role="dialog"
          aria-modal="true"
          v-focus-trap
          aria-labelledby="manage-prepared-title"
          class="relative w-full max-w-lg bg-void border border-shadow rounded-lg shadow-2xl flex flex-col"
          style="max-height: 84vh"
        >
          <!-- Accent bar -->
          <div class="h-0.5 w-full bg-arcane-base/60 shrink-0" />

          <!-- Header -->
          <div class="px-5 py-4 border-b border-shadow shrink-0">
            <div class="flex items-center justify-between">
              <div>
                <p id="manage-prepared-title" class="font-heading text-base text-arcane-pale">Prepare Spells</p>
                <p class="text-2xs font-body text-mist mt-0.5">
                  {{ className }} · {{ isSpellbookMode ? 'from your spellbook' : 'full class spell list' }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="text-sm font-heading tabular-nums px-2.5 py-1 rounded border"
                  :class="atLimit
                    ? 'border-arcane-base/50 text-arcane-pale bg-arcane-deep/10'
                    : 'border-shadow text-mist'"
                >{{ localPrepared.length }} / {{ dailyLimit }}</span>
                <button type="button" class="text-mist hover:text-ash transition-colors" @click="emit('close')">
                  <XIcon :size="16" />
                </button>
              </div>
            </div>
          </div>

          <!-- Level tabs -->
          <div class="flex border-b border-shadow overflow-x-auto shrink-0 scrollbar-none">
            <button
              v-for="lvl in levelTabs"
              :key="lvl"
              type="button"
              class="px-3.5 py-2.5 text-xs font-heading tracking-wide whitespace-nowrap transition-colors shrink-0 border-b-2 relative"
              :class="activeLevel === lvl
                ? 'border-arcane-base text-arcane-pale'
                : 'border-transparent text-mist hover:text-ash'"
              @click="activeLevel = lvl; search = ''"
            >
              Lv {{ lvl }}
              <span
                v-if="preparedCountAtLevel(lvl) > 0"
                class="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-arcane-base/70"
              />
            </button>
          </div>

          <!-- Search -->
          <div class="px-5 py-3 border-b border-shadow shrink-0">
            <input
              v-model="search"
              type="text"
              :placeholder="`Search level ${activeLevel} spells…`"
              class="input-base w-full text-sm"
            />
          </div>

          <!-- Spell list -->
          <div class="overflow-y-auto flex-1 px-4 py-3 space-y-1">
            <div v-if="loading" class="flex justify-center py-10">
              <GrimoireSpinner label="Loading spells…" />
            </div>
            <p v-else-if="filtered.length === 0" class="text-sm font-body text-mist text-center py-8">
              No spells found.
            </p>
            <template v-else>
              <div
                v-for="spell in filtered"
                :key="spell.index"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded border text-left transition-all duration-100"
                :class="isPrepared(spell.index)
                  ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale'
                  : atLimit
                    ? 'border-shadow/40 text-mist/40 cursor-not-allowed'
                    : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone cursor-pointer'"
                :role="(!isPrepared(spell.index) && atLimit) ? undefined : 'button'"
                @click="(!isPrepared(spell.index) && atLimit) || toggle(spell)"
              >
                <span
                  class="w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-all"
                  :class="isPrepared(spell.index)
                    ? 'border-arcane-base/60 bg-arcane-base/30'
                    : 'border-mist/40 bg-shadow/30'"
                >
                  <CheckIcon v-if="isPrepared(spell.index)" :size="9" class="text-arcane-pale" />
                </span>
                <span class="font-body text-sm leading-snug flex-1">{{ spell.name }}</span>
                <button
                  type="button"
                  class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/30 transition-all"
                  title="Spell details"
                  @click.stop="infoPanel.open({ kind: 'spell', index: spell.index })"
                >
                  <InfoIcon :size="12" />
                </button>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="px-5 py-4 border-t border-shadow shrink-0 flex items-center justify-between">
            <span class="text-xs font-body text-mist">
              {{ localPrepared.length > 0
                ? `${localPrepared.length} spell${localPrepared.length !== 1 ? 's' : ''} prepared`
                : 'None prepared' }}
            </span>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary text-sm" @click="emit('close')">Cancel</button>
              <button type="button" class="btn-primary text-sm" @click="save">Save</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CheckIcon, InfoIcon, XIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import type { SpellReference } from '@/shared/types/character'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const props = defineProps<{
  show: boolean
  classIndex: string
  className: string
  currentPrepared: SpellReference[]
  maxSpellLevel: number
  dailyLimit: number
  /** When provided (spellbook casters), show only these spells instead of fetching the full class list */
  spellbookSpells?: SpellReference[]
}>()

const emit = defineEmits<{
  close: []
  save: [prepared: SpellReference[]]
}>()

const infoPanel = useInfoPanel()
const activeLevel = ref(1)
const search = ref('')
const localPrepared = ref<SpellReference[]>([])

const isSpellbookMode = computed(() => !!props.spellbookSpells)

const levelTabs = computed(() => {
  if (isSpellbookMode.value) {
    const levels = new Set(props.spellbookSpells!.map(s => s.level).filter(l => l > 0))
    return [...levels].sort((a, b) => a - b)
  }
  const tabs: number[] = []
  for (let i = 1; i <= props.maxSpellLevel; i++) tabs.push(i)
  return tabs
})

watch(() => props.show, (open) => {
  if (open) {
    activeLevel.value = levelTabs.value[0] ?? 1
    search.value = ''
    localPrepared.value = [...props.currentPrepared]
  }
})

const { data, isPending: apiLoading } = useQuery({
  queryKey: computed(() => ['spells', props.classIndex, activeLevel.value]),
  queryFn: () => fiveEApi.listSpells({ class: props.classIndex, level: activeLevel.value }),
  staleTime: Infinity,
  enabled: computed(() => props.show && !!props.classIndex && !isSpellbookMode.value),
})

const loading = computed(() => !isSpellbookMode.value && apiLoading.value)

const allSpells = computed(() => {
  if (isSpellbookMode.value) {
    return props.spellbookSpells!.filter(s => s.level === activeLevel.value)
  }
  return data.value?.results ?? []
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? allSpells.value.filter(s => s.name.toLowerCase().includes(q)) : allSpells.value
})

const atLimit = computed(() => localPrepared.value.length >= props.dailyLimit)

function isPrepared(index: string): boolean {
  return localPrepared.value.some(s => s.index === index)
}

function preparedCountAtLevel(level: number): number {
  return localPrepared.value.filter(s => s.level === level).length
}

function toggle(spell: { index: string; name: string }) {
  if (isPrepared(spell.index)) {
    localPrepared.value = localPrepared.value.filter(s => s.index !== spell.index)
  } else if (!atLimit.value) {
    localPrepared.value.push({ index: spell.index, name: spell.name, level: activeLevel.value })
  }
}

function save() {
  emit('save', [...localPrepared.value])
}
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-active .relative, .modal-fade-leave-active .relative { transition: opacity 0.15s ease, transform 0.15s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .relative { transform: translateY(8px); }
</style>
