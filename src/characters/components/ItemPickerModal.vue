<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown.esc="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="$emit('close')" />

        <div
          role="dialog"
          aria-modal="true"
          class="relative w-full max-w-2xl bg-void border border-shadow rounded-lg shadow-2xl flex flex-col overflow-hidden"
          style="max-height: 85vh"
        >
          <div class="h-0.5 w-full bg-gold-mid shrink-0" />

          <!-- Header -->
          <div class="px-5 pt-4 pb-3 shrink-0 space-y-3">
            <div class="flex items-center justify-between">
              <p class="font-heading text-base tracking-wide text-gold-mid">Add from SRD</p>
              <button type="button" class="text-mist hover:text-ash transition-colors" @click="$emit('close')">
                <XIcon :size="16" />
              </button>
            </div>

            <!-- Search -->
            <input
              v-model="search"
              type="search"
              class="input-base text-sm w-full"
              placeholder="Search items…"
              autofocus
            />

            <!-- Category tabs -->
            <div class="flex gap-0 border-b border-shadow -mb-3">
              <button
                v-for="tab in TABS"
                :key="tab.id"
                type="button"
                class="px-3 py-2 text-xs font-heading tracking-wide border-b-2 transition-all whitespace-nowrap shrink-0 -mb-px"
                :class="activeTab === tab.id
                  ? 'border-gold-mid text-gold-mid'
                  : 'border-transparent text-ash hover:text-stone'"
                @click="activeTab = tab.id"
              >{{ tab.label }}</button>
            </div>
          </div>

          <!-- Item list -->
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-0.5">
            <div v-if="loading" class="flex items-center justify-center py-12">
              <div class="w-6 h-6 border-2 border-gold-mid/30 border-t-gold-mid rounded-full animate-spin" />
            </div>

            <template v-else-if="filtered.length > 0">
              <label
                v-for="item in filtered"
                :key="item.index"
                class="flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors"
                :class="selected.has(item.index) ? 'bg-gold-dim/10 border border-gold-dim/20' : 'hover:bg-depths/50 border border-transparent'"
              >
                <input
                  type="checkbox"
                  class="w-3.5 h-3.5 accent-gold-mid shrink-0"
                  :checked="selected.has(item.index)"
                  @change="toggle(item.index)"
                />
                <component :is="iconFor(item.cat)" :size="12" class="shrink-0 text-mist/50" />
                <span class="font-heading text-sm text-vellum flex-1 min-w-0 truncate">{{ item.name }}</span>
              </label>
            </template>

            <div v-else class="py-12 text-center">
              <p class="font-body text-sm text-mist/50 italic">No items match "{{ search }}"</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-4 border-t border-shadow shrink-0 flex items-center justify-between gap-3">
            <p class="text-xs font-body text-mist">
              <span v-if="selected.size > 0" class="text-gold-mid font-heading">{{ selected.size }} selected</span>
              <span v-else>{{ filtered.length }} items</span>
            </p>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary text-sm" @click="$emit('close')">Cancel</button>
              <button
                type="button"
                class="btn-primary text-sm gap-1.5"
                :disabled="selected.size === 0 || adding"
                @click="confirm"
              >
                <div v-if="adding" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <PlusIcon v-else :size="13" />
                Add{{ selected.size > 0 ? ` ${selected.size}` : '' }} Item{{ selected.size !== 1 ? 's' : '' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { XIcon, SwordIcon, ShieldIcon, PackageIcon, PlusIcon } from 'lucide-vue-next'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { equipmentToInventoryItem } from '@/shared/lib/equipmentToInventoryItem'
import { computeModifier } from '@/shared/types/character'
import type { Character, InventoryItem } from '@/shared/types/character'

const props = defineProps<{ show: boolean; character: Character; profBonus: number }>()
const emit = defineEmits<{ close: []; add: [InventoryItem[]] }>()

const TABS = [
  { id: 'all',    label: 'All'     },
  { id: 'weapon', label: 'Weapons' },
  { id: 'armor',  label: 'Armor'   },
  { id: 'gear',   label: 'Gear'    },
]

const search    = ref('')
const activeTab = ref('all')
const selected  = ref(new Set<string>())
const adding    = ref(false)

watch(() => props.show, (open) => {
  if (open) {
    search.value = ''
    activeTab.value = 'all'
    selected.value = new Set()
  }
})

const enabled = computed(() => props.show)

// 3 lightweight list requests — no individual item fetches on open
const { data: allList,    isLoading: l1 } = useQuery({ queryKey: ['equipment-list'],               queryFn: () => fiveEApi.listEquipment(),                    staleTime: Infinity, enabled })
const { data: weaponCat,  isLoading: l2 } = useQuery({ queryKey: ['eq-cat', 'weapon'],             queryFn: () => fiveEApi.getEquipmentCategory('weapon'),     staleTime: Infinity, enabled })
const { data: armorCat,   isLoading: l3 } = useQuery({ queryKey: ['eq-cat', 'armor'],              queryFn: () => fiveEApi.getEquipmentCategory('armor'),      staleTime: Infinity, enabled })

const loading = computed(() => l1.value || l2.value || l3.value)

interface Row { index: string; name: string; cat: 'weapon' | 'armor' | 'gear' }

const rows = computed<Row[]>(() => {
  if (!allList.value) return []
  const weapons = new Set(weaponCat.value?.equipment.map(e => e.index) ?? [])
  const armors  = new Set(armorCat.value?.equipment.map(e => e.index) ?? [])
  return allList.value.results.map(r => ({
    index: r.index,
    name:  r.name,
    cat:   weapons.has(r.index) ? 'weapon' : armors.has(r.index) ? 'armor' : 'gear',
  }))
})

const filtered = computed(() => {
  const q   = search.value.trim().toLowerCase()
  const tab = activeTab.value
  return rows.value.filter(r => {
    if (tab !== 'all' && r.cat !== tab) return false
    if (q && !r.name.toLowerCase().includes(q)) return false
    return true
  })
})

function iconFor(cat: string) {
  if (cat === 'weapon') return SwordIcon
  if (cat === 'armor')  return ShieldIcon
  return PackageIcon
}

function toggle(index: string) {
  const s = new Set(selected.value)
  s.has(index) ? s.delete(index) : s.add(index)
  selected.value = s
}

async function confirm() {
  if (adding.value) return
  adding.value = true
  try {
    const strMod = computeModifier(props.character.abilityScores.str)
    const dexMod = computeModifier(props.character.abilityScores.dex)
    // Only fetch full details for the selected items (typically 1–5)
    const details = await Promise.all(
      [...selected.value].map(idx => fiveEApi.getEquipment(idx)),
    )
    const items = details.map(e => equipmentToInventoryItem(e, strMod, dexMod, props.profBonus))
    emit('add', items)
    emit('close')
  } finally {
    adding.value = false
  }
}
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.15s ease;
}
.dialog-fade-enter-active .relative,
.dialog-fade-leave-active .relative {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
.dialog-fade-enter-from .relative {
  transform: scale(0.95);
}
</style>
