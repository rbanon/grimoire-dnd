<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/70" @click="$emit('close')" />

        <div class="relative w-full max-w-lg bg-void border border-shadow rounded-lg shadow-2xl flex flex-col"
          style="max-height: 80vh">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-shadow shrink-0">
            <div>
              <p class="font-heading text-base text-arcane-pale">Añadir Cantrips</p>
              <p class="text-2xs font-body text-mist mt-0.5">
                {{ className }} ·
                <span :class="remaining === 0 ? 'text-blood-bright' : ''">
                  {{ knownIndices.length + selected.length }}/{{ isFinite(limit) ? limit : '∞' }}
                </span>
              </p>
            </div>
            <button type="button" class="text-mist hover:text-ash transition-colors" @click="$emit('close')">
              <XIcon :size="16" />
            </button>
          </div>

          <!-- Search -->
          <div class="px-5 py-3 border-b border-shadow shrink-0">
            <input
              v-model="search"
              type="text"
              placeholder="Buscar cantrip…"
              class="input-base w-full text-sm"
              autofocus
            />
          </div>

          <!-- List -->
          <div class="overflow-y-auto flex-1 px-4 py-3 space-y-1">
            <div v-if="loading" class="flex justify-center py-10">
              <GrimoireSpinner label="Cargando cantrips…" />
            </div>
            <p v-else-if="filtered.length === 0" class="text-sm font-body text-mist text-center py-8">
              No se encontraron cantrips.
            </p>
            <template v-else>
              <div
                v-for="c in filtered"
                :key="c.index"
                class="flex items-center gap-3 px-3 py-2.5 rounded border transition-all"
                :class="isKnown(c.index) || isBlocked(c.index)
                  ? 'border-shadow opacity-40 cursor-not-allowed'
                  : isSelected(c.index)
                    ? 'border-arcane-base/60 bg-arcane-deep/20 cursor-pointer'
                    : 'border-shadow hover:border-arcane-base/30 hover:bg-arcane-deep/10 cursor-pointer'"
                @click="!isKnown(c.index) && !isBlocked(c.index) && toggle(c)"
              >
                <!-- Checkbox visual -->
                <div
                  class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                  :class="isSelected(c.index)
                    ? 'border-arcane-base bg-arcane-deep/40'
                    : 'border-mist/40'"
                >
                  <span v-if="isSelected(c.index)" class="text-arcane-pale text-[10px] leading-none">✓</span>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="font-heading text-sm" :class="isSelected(c.index) ? 'text-arcane-pale' : 'text-ash'">
                    {{ c.name }}
                  </p>
                  <p v-if="isKnown(c.index)" class="text-2xs font-body text-mist">Ya conocido</p>
                </div>

                <button
                  type="button"
                  class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/30 transition-all"
                  title="Ver detalles"
                  @click.stop="infoPanel.open({ kind: 'spell', index: c.index })"
                >
                  <InfoIcon :size="12" />
                </button>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="px-5 py-4 border-t border-shadow shrink-0 flex items-center justify-between">
            <span class="text-xs font-body text-mist">
              {{ selected.length > 0 ? `${selected.length} seleccionado${selected.length > 1 ? 's' : ''}` : 'Ninguno seleccionado' }}
            </span>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary text-sm" @click="$emit('close')">Cancelar</button>
              <button
                type="button"
                class="btn-primary text-sm"
                :disabled="selected.length === 0"
                @click="confirm"
              >Añadir</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { InfoIcon, XIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const props = defineProps<{
  show: boolean
  classIndex: string
  className: string
  knownIndices: string[]
  limit: number
}>()

const emit = defineEmits<{
  close: []
  add: [cantrips: { index: string; name: string; level: number }[]]
}>()

const infoPanel = useInfoPanel()
const search = ref('')
const selected = ref<{ index: string; name: string }[]>([])

const { data, isPending: loading } = useQuery({
  queryKey: ['cantrips', computed(() => props.classIndex)],
  queryFn: () => fiveEApi.listSpells({ level: 0, class: props.classIndex }),
  staleTime: Infinity,
  enabled: computed(() => props.show && !!props.classIndex),
})

const allCantrips = computed(() => data.value?.results ?? [])

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? allCantrips.value.filter(c => c.name.toLowerCase().includes(q)) : allCantrips.value
})

const remaining = computed(() => props.limit - props.knownIndices.length - selected.value.length)

function isKnown(index: string) { return props.knownIndices.includes(index) }
function isSelected(index: string) { return selected.value.some(s => s.index === index) }
function isBlocked(index: string) { return !isSelected(index) && remaining.value <= 0 }

function toggle(c: { index: string; name: string }) {
  if (isSelected(c.index)) {
    selected.value = selected.value.filter(s => s.index !== c.index)
  } else {
    selected.value.push({ index: c.index, name: c.name })
  }
}

function confirm() {
  emit('add', selected.value.map(c => ({ ...c, level: 0 })))
  selected.value = []
  search.value = ''
}
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .relative { transition: transform 0.15s ease; }
.modal-fade-enter-from .relative { transform: translateY(8px); }
</style>
