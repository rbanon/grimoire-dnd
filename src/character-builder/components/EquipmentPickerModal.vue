<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown.esc="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />

        <div
          role="dialog"
          aria-modal="true"
          v-focus-trap
          aria-labelledby="equipment-picker-title"
          class="relative w-full max-w-2xl bg-void border border-shadow rounded-lg shadow-2xl overflow-hidden flex flex-col"
          style="max-height: 85vh"
        >
          <div class="h-0.5 w-full bg-gold-mid" />

          <!-- Header -->
          <div class="px-5 py-4 border-b border-shadow flex items-center justify-between shrink-0">
            <div>
              <p id="equipment-picker-title" class="font-heading text-base text-gold-mid">{{ title }}</p>
              <p class="text-2xs font-body text-mist mt-0.5">Select an item to view its statistics</p>
            </div>
            <button type="button" class="text-mist hover:text-ash transition-colors" @click="$emit('close')">
              <XIcon :size="16" />
            </button>
          </div>

          <!-- Body: list + stats panel -->
          <div class="flex flex-1 overflow-hidden">

            <!-- Item list -->
            <div class="flex-1 overflow-y-auto p-3 space-y-1">
              <div v-if="loading" class="flex justify-center py-8">
                <GrimoireSpinner label="Loading equipment…" />
              </div>
              <template v-else>
                <button
                  v-for="item in sortedItems"
                  :key="item.index"
                  type="button"
                  class="w-full text-left px-3 py-2.5 rounded border transition-all duration-150 flex items-center gap-3"
                  :class="localSelected === item.index
                    ? 'border-gold-mid/50 bg-gold-dim/10'
                    : 'border-shadow hover:border-gold-dim/20 hover:bg-depths'"
                  @click="localSelected = item.index"
                >
                  <span class="text-base shrink-0 w-6 text-center">{{ itemGlyph(item) }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-heading text-vellum">{{ item.name }}</p>
                    <div class="flex gap-3 mt-0.5 text-2xs font-heading text-mist">
                      <span v-if="item.damage">{{ item.damage.damage_dice }} {{ item.damage.damage_type?.name }}</span>
                      <span v-else-if="item.armor_class">CA {{ item.armor_class.base }}</span>
                      <span v-if="item.weapon_range">{{ item.weapon_range }}</span>
                      <span v-if="item.weapon_category">{{ item.weapon_category }}</span>
                    </div>
                  </div>
                  <CheckIcon v-if="localSelected === item.index" :size="14" class="text-gold-mid shrink-0" />
                </button>
              </template>
            </div>

            <!-- Stats panel -->
            <Transition name="stats-slide">
              <div
                v-if="selectedItem"
                class="w-52 shrink-0 border-l border-shadow bg-depths overflow-y-auto p-4 space-y-3"
              >
                <p class="font-heading text-sm text-vellum leading-snug">{{ selectedItem.name }}</p>

                <!-- Weapon stats -->
                <template v-if="selectedItem.damage">
                  <div class="space-y-2">
                    <StatRow label="Damage" :value="`${selectedItem.damage.damage_dice} ${selectedItem.damage.damage_type?.name ?? ''}`" highlight />
                    <StatRow v-if="selectedItem.two_handed_damage" label="Versatile" :value="selectedItem.two_handed_damage.damage_dice" />
                    <StatRow label="Type" :value="selectedItem.weapon_category ?? '-'" />
                    <StatRow label="Range" :value="selectedItem.weapon_range ?? '-'" />
                    <StatRow
                      v-if="selectedItem.range"
                      label="Range"
                      :value="`${selectedItem.range.normal}${selectedItem.range.long ? `/${selectedItem.range.long}` : ''} ft.`"
                    />
                  </div>
                  <div v-if="selectedItem.properties?.length" class="space-y-1.5">
                    <p class="text-2xs font-heading text-mist uppercase tracking-wider">Properties</p>
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="prop in selectedItem.properties"
                        :key="prop.index"
                        class="px-1.5 py-0.5 text-2xs font-heading border border-shadow/60 rounded text-ash"
                      >{{ prop.name }}</span>
                    </div>
                  </div>
                </template>

                <!-- Armor stats -->
                <template v-else-if="selectedItem.armor_class">
                  <div class="space-y-2">
                    <StatRow label="Base AC" :value="String(selectedItem.armor_class.base)" highlight />
                    <StatRow
                      v-if="selectedItem.armor_class.dex_bonus"
                      label="+ DEX"
                      :value="selectedItem.armor_class.max_bonus ? `max ${selectedItem.armor_class.max_bonus}` : 'Yes'"
                    />
                    <StatRow label="Type" :value="selectedItem.armor_category ?? '-'" />
                    <StatRow v-if="selectedItem.str_minimum" label="STR min." :value="String(selectedItem.str_minimum)" />
                    <div v-if="selectedItem.stealth_disadvantage" class="text-2xs font-body text-blood-mid">
                      Stealth Disadvantage
                    </div>
                  </div>
                </template>

                <!-- Generic / Holy symbol -->
                <template v-else>
                  <div class="text-xs font-body text-mist leading-relaxed">
                    {{ selectedItem.equipment_category?.name }}
                  </div>
                </template>

                <!-- Cost & weight -->
                <div class="pt-2 border-t border-shadow space-y-1.5">
                  <StatRow v-if="selectedItem.cost" label="Cost" :value="`${selectedItem.cost.quantity} ${selectedItem.cost.unit}`" />
                  <StatRow v-if="selectedItem.weight" label="Weight" :value="`${selectedItem.weight} lb.`" />
                </div>
              </div>
            </Transition>
          </div>

          <!-- Actions -->
          <div class="px-5 py-3 border-t border-shadow flex justify-end gap-2 shrink-0">
            <button type="button" class="btn-secondary text-sm" @click="$emit('close')">Cancel</button>
            <button
              type="button"
              class="btn-primary text-sm"
              :disabled="!localSelected"
              @click="confirmSelection"
            >Confirm Selection</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, h, defineComponent } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { XIcon, CheckIcon } from 'lucide-vue-next'
import { fiveEApi } from '@/shared/api/fiveE.client'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'
import type { ApiEquipment } from '@/shared/types/api'

const props = withDefaults(defineProps<{
  show: boolean
  title: string
  categoryIndex: string
  selected: string
  edition?: '2014' | '2024'
}>(), { edition: '2014' })

const emit = defineEmits<{
  close: []
  select: [index: string]
}>()

// ── Inline stat row component ─────────────────────────────────────────────────
const StatRow = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    highlight: { type: Boolean, default: false },
  },
  setup(props) {
    return () => h('div', { class: 'flex justify-between items-baseline gap-2 text-xs' }, [
      h('span', { class: 'font-heading text-mist shrink-0' }, props.label),
      h('span', { class: props.highlight ? 'font-heading text-vellum' : 'font-body text-ash text-right' }, props.value),
    ])
  },
})

// ── State ─────────────────────────────────────────────────────────────────────
const localSelected = ref(props.selected)

watch(() => props.show, (val) => {
  if (val) localSelected.value = props.selected
})

// ── Category items (names only) ───────────────────────────────────────────────
const { data: categoryData } = useQuery({
  queryKey: computed(() => [props.edition, 'eq-category', props.categoryIndex]),
  queryFn: () => props.edition === '2024'
    ? fiveEApi.getEquipmentCategory2024(props.categoryIndex)
    : fiveEApi.getEquipmentCategory(props.categoryIndex),
  enabled: computed(() => props.show && !!props.categoryIndex),
  staleTime: Infinity,
})

const itemRefs = computed(() => categoryData.value?.equipment ?? [])

// ── Fetch all item details for the category (resilient: skip individual 404s) ──
const { data: allDetails, isPending: loading } = useQuery({
  queryKey: computed(() => [props.edition, 'eq-cat-details', props.categoryIndex, itemRefs.value.length]),
  queryFn: async () => {
    const getEq = (i: string) => props.edition === '2024' ? fiveEApi.getEquipment2024(i) : fiveEApi.getEquipment(i)
    const settled = await Promise.allSettled(itemRefs.value.map(r => getEq(r.index)))
    return settled
      .filter((s): s is PromiseFulfilledResult<ApiEquipment> => s.status === 'fulfilled')
      .map(s => s.value)
  },
  enabled: computed(() => props.show && itemRefs.value.length > 0),
  staleTime: Infinity,
})

const sortedItems = computed<ApiEquipment[]>(() =>
  (allDetails.value ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
)

const selectedItem = computed<ApiEquipment | undefined>(() =>
  sortedItems.value.find(i => i.index === localSelected.value)
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function itemGlyph(item: ApiEquipment): string {
  if (item.damage) return '⚔'
  if (item.armor_class) return '🛡'
  return '⚜'
}

function confirmSelection() {
  if (localSelected.value) {
    emit('select', localSelected.value)
    emit('close')
  }
}
</script>

<style scoped>
.dialog-fade-enter-active, .dialog-fade-leave-active { transition: opacity 0.15s ease; }
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }

.stats-slide-enter-active, .stats-slide-leave-active { transition: all 0.2s ease; }
.stats-slide-enter-from { opacity: 0; transform: translateX(8px); }
.stats-slide-leave-to { opacity: 0; transform: translateX(8px); }
</style>
