<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-8">
    <div class="rule-gold"><span>Starting Equipment</span></div>

    <!-- Mode selector -->
    <div class="grid sm:grid-cols-2 gap-4">
      <button
        type="button"
        class="card text-left p-5 transition-all duration-200"
        :class="builder.draft.useStartingEquipment
          ? 'border-gold-mid/50 bg-gold-dim/8'
          : 'hover:border-gold-dim/20'"
        @click="builder.draft.useStartingEquipment = true"
      >
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded border flex items-center justify-center text-lg"
            :class="builder.draft.useStartingEquipment ? 'border-gold-mid/50 bg-gold-dim/20' : 'border-shadow'"
          >⚔</div>
          <div>
            <p class="font-heading text-sm text-vellum">Starting Equipment</p>
            <p class="text-xs text-mist font-body">Gear from your class &amp; background</p>
          </div>
          <div v-if="builder.draft.useStartingEquipment" class="ml-auto w-4 h-4 rounded-full bg-gold-mid/30 border border-gold-mid/60 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-gold-mid" />
          </div>
        </div>
        <p class="text-xs font-body text-mist leading-relaxed">
          Your class and background grant you a standard set of equipment to begin your adventure.
        </p>
      </button>

      <button
        type="button"
        class="card text-left p-5 transition-all duration-200"
        :class="!builder.draft.useStartingEquipment
          ? 'border-gold-mid/50 bg-gold-dim/8'
          : 'hover:border-gold-dim/20'"
        @click="builder.draft.useStartingEquipment = false"
      >
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded border flex items-center justify-center text-lg"
            :class="!builder.draft.useStartingEquipment ? 'border-gold-mid/50 bg-gold-dim/20' : 'border-shadow'"
          >◎</div>
          <div>
            <p class="font-heading text-sm text-vellum">Gold Pieces</p>
            <p class="text-xs text-mist font-body">Buy your own equipment</p>
          </div>
          <div v-if="!builder.draft.useStartingEquipment" class="ml-auto w-4 h-4 rounded-full bg-gold-mid/30 border border-gold-mid/60 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-gold-mid" />
          </div>
        </div>
        <p class="text-xs font-body text-mist leading-relaxed">
          Start with gold pieces and purchase equipment from the item browser.
        </p>
      </button>
    </div>

    <!-- Gold mode -->
    <Transition name="fade">
      <div v-if="!builder.draft.useStartingEquipment" class="card p-5 space-y-4">
        <!-- Formula row -->
        <div v-if="goldFormula" class="flex items-center gap-3 px-3 py-2.5 rounded border border-shadow/40 bg-depths/20">
          <span class="text-gold-dim/60 text-xs shrink-0">◎</span>
          <p class="text-xs font-body text-mist flex-1">
            <span class="text-stone font-heading">{{ builder.draft.className || 'Your class' }}</span>
            starts with <span class="text-stone font-heading">{{ goldFormula.label }}</span>.
          </p>
          <button
            type="button"
            class="btn-secondary text-xs px-3 py-1.5 shrink-0"
            @click="rollGold"
          >
            Roll
          </button>
        </div>

        <label class="label" for="start-gold">Starting Gold (gp)</label>
        <div class="flex items-center gap-3">
          <input
            id="start-gold"
            v-model.number="builder.draft.manualGold"
            type="number"
            min="0"
            max="9999"
            class="input-base max-w-[140px] text-lg font-heading"
          />
          <span class="text-sm text-mist font-body">gold pieces</span>
        </div>
      </div>
    </Transition>

    <!-- Equipment picker (only when useStartingEquipment = true) -->
    <Transition name="fade">
      <div v-if="builder.draft.useStartingEquipment" class="space-y-6">

        <!-- Loading -->
        <div v-if="classLoading || bgLoading" class="flex justify-center py-6">
          <GrimoireSpinner label="Loading equipment" />
        </div>

        <template v-else>
          <!-- Fixed equipment section -->
          <section v-if="fixedItems.length > 0" class="space-y-3">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Always Included</p>
            <div class="card p-4 space-y-2">
              <div
                v-for="(item, i) in fixedItems"
                :key="i"
                class="flex items-center gap-3 py-1.5"
              >
                <span class="text-base w-6 text-center shrink-0">{{ itemIcon(item.equipment.index) }}</span>
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-heading text-vellum">{{ item.equipment.name }}</span>
                </div>
                <span v-if="item.quantity > 1" class="text-xs font-body text-mist tabular-nums shrink-0">×{{ item.quantity }}</span>
              </div>
            </div>
          </section>

          <!-- Option groups -->
          <section
            v-for="(group, gi) in optionGroups"
            :key="gi"
            class="space-y-3"
          >
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">
              Choice {{ gi + 1 }}
              <span class="normal-case tracking-normal font-body text-mist/60">({{ group.source }}: {{ group.source === 'class' ? builder.draft.className.toLowerCase() : builder.draft.backgroundName.toLowerCase() }})</span>
            </p>
            <p class="text-sm font-body text-ash">{{ group.desc }}</p>

            <div class="space-y-2">
              <div
                v-for="(variant, vi) in group.variants"
                :key="vi"
                class="card overflow-hidden transition-all duration-150"
                :class="choices[gi] === vi
                  ? 'border-gold-mid/50 bg-gold-dim/8'
                  : 'hover:border-gold-dim/20 cursor-pointer'"
                @click="choices[gi] !== vi && (choices[gi] = vi)"
              >
                <!-- Variant header -->
                <div class="flex items-center gap-3 p-4">
                  <div class="w-6 h-6 rounded border flex items-center justify-center shrink-0"
                    :class="choices[gi] === vi ? 'border-gold-mid/60 bg-gold-dim/20' : 'border-shadow'"
                  >
                    <div v-if="choices[gi] === vi" class="w-2.5 h-2.5 rounded-full bg-gold-mid" />
                    <span v-else class="text-2xs font-heading text-mist">{{ variantLabel(vi) }}</span>
                  </div>
                  <div>
                    <span class="text-sm font-heading text-vellum">{{ variant.label }}</span>
                    <p v-if="variantItemStatLine(variant)" class="text-xs font-heading text-mist mt-0.5">{{ variantItemStatLine(variant) }}</p>
                  </div>
                </div>

                <!-- Expanded content when this variant is selected -->
                <div v-if="choices[gi] === vi" class="px-4 pb-4 space-y-3 ml-9" @click.stop>

                  <!-- Pack contents -->
                  <template v-for="(slot, si) in variant.slots" :key="`pack-${si}`">
                    <template v-if="slot.kind === 'item'">
                      <div v-if="getPackContents(slot.ref.index).length > 0" class="space-y-2">
                        <p class="text-2xs font-heading tracking-wide text-mist uppercase">Pack Contents</p>
                        <div class="grid grid-cols-2 gap-1">
                          <div
                            v-for="c in getPackContents(slot.ref.index)"
                            :key="c.item.index"
                            class="text-xs font-body text-ash flex items-center gap-1.5"
                          >
                            <span class="text-mist/60 shrink-0">·</span>
                            {{ c.quantity > 1 ? `${c.quantity}× ` : '' }}{{ c.item.name }}
                          </div>
                        </div>
                      </div>

                      <!-- Holy symbol: description note + optional flavor text input -->
                      <div v-else-if="isHolySymbol(slot.ref.index)" class="space-y-2">
                        <p class="text-xs font-body text-mist leading-relaxed px-3 py-2 rounded border border-shadow/40 bg-depths/20">
                          A holy symbol is a representation of your deity, worn as an amulet, emblazoned on a shield, or held as a reliquary. Clerics and paladins use it as a divine spellcasting focus.
                        </p>
                        <label class="text-2xs font-heading tracking-wide text-mist uppercase">Describe your symbol (optional)</label>
                        <textarea
                          v-model="builder.draft.holySymbolDescriptions[`${gi}_${si}`]"
                          rows="2"
                          class="input-base w-full text-sm resize-none"
                          placeholder="e.g. A silver amulet bearing the sun, an oak shield embossed with a crescent…"
                        />
                      </div>
                    </template>
                  </template>

                  <!-- Category pickers (weapon/armor/other) -->
                  <template v-for="(slot, si) in variant.slots" :key="`cat-${si}`">
                    <div v-if="slot.kind === 'category'" class="space-y-2">
                      <p class="text-2xs font-heading tracking-wide text-mist uppercase">
                        Choose: {{ slot.categoryRef.name }}
                        <template v-if="catSlotsOfIndex(variant.slots, slot.categoryRef.index) > 1">
                          {{ catSlotOrdinal(variant.slots, si) }}
                        </template>
                      </p>

                      <!-- Current selection or picker button -->
                      <div v-if="categorySelections[`${gi}_${si}`]" class="flex items-center gap-3">
                        <div class="flex-1 card px-3 py-2.5 border-gold-mid/30 flex items-center gap-3">
                          <span class="text-base">{{ selectionGlyph(`${gi}_${si}`) }}</span>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-heading text-vellum">{{ selectionName(`${gi}_${si}`) }}</p>
                            <p class="text-xs font-heading text-mist">{{ selectionStatLine(`${gi}_${si}`) }}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          class="btn-secondary text-xs px-2 py-1.5 shrink-0"
                          @click="openPicker(gi, si, slot.categoryRef)"
                        >Change</button>
                      </div>

                      <button
                        v-else
                        type="button"
                        class="btn-secondary text-sm gap-2 w-full justify-center"
                        @click="openPicker(gi, si, slot.categoryRef)"
                      >
                        <span>⚔</span> Choose {{ slot.categoryRef.name }}
                      </button>
                    </div>
                  </template>

                  <!-- Money grant -->
                  <template v-for="(slot, si) in variant.slots" :key="`money-${si}`">
                    <div
                      v-if="slot.kind === 'money'"
                      class="flex items-center gap-2 px-3 py-2 rounded border border-gold-dim/30 bg-gold-dim/8"
                    >
                      <span class="text-gold-mid shrink-0">◎</span>
                      <span class="text-sm font-heading text-gold-mid">{{ formatMoney(slot.amount, slot.unit) }}</span>
                      <span class="text-2xs font-body text-mist">added to your purse</span>
                    </div>
                  </template>

                </div>
              </div>
            </div>
          </section>

          <!-- Summary -->
          <section v-if="summaryItems.length > 0 || hasEquipmentCurrency" class="space-y-3">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Your Starting Inventory</p>
            <div class="card p-4 divide-y divide-shadow/40">
              <div
                v-for="(inv, i) in resolvedInventory"
                :key="i"
                class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span class="text-base w-6 text-center shrink-0">{{ invGlyph(inv.itemType) }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-heading text-stone">
                    {{ inv.item.name }}
                    <span v-if="inv.quantity > 1" class="text-mist ml-1">×{{ inv.quantity }}</span>
                  </p>
                  <p v-if="invStatLine(inv)" class="text-xs font-heading text-mist mt-0.5">{{ invStatLine(inv) }}</p>
                </div>
                <span
                  class="text-2xs font-heading px-1.5 py-0.5 rounded border shrink-0"
                  :class="inv.itemType === 'weapon'
                    ? 'border-blood-base/30 text-blood-mid'
                    : inv.itemType === 'armor'
                      ? 'border-gold-dim/30 text-gold-dim'
                      : 'border-shadow text-mist'"
                >{{ inv.itemType }}</span>
              </div>
              <!-- Granted coins -->
              <div v-if="hasEquipmentCurrency" class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span class="text-base w-6 text-center shrink-0 text-gold-mid">◎</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-heading text-gold-mid">{{ equipmentCurrencyLabel }}</p>
                </div>
                <span class="text-2xs font-heading px-1.5 py-0.5 rounded border border-gold-dim/30 text-gold-dim shrink-0">coins</span>
              </div>
            </div>
          </section>

          <div v-else-if="!classLoading && !bgLoading && fixedItems.length === 0 && optionGroups.length === 0" class="card p-5 border-shadow/40 bg-depths/30">
            <p class="text-sm font-body text-mist">No starting equipment defined for this class and background combination.</p>
          </div>
        </template>
      </div>
    </Transition>

    <div class="card p-5 border-gold-dim/15 bg-depths/40">
      <p class="text-xs font-body text-mist leading-relaxed">
        <span class="text-gold-dim font-heading">Note:</span>
        Equipment can be added, removed, or modified at any time from the character sheet.
      </p>
    </div>

    <div class="h-4" />

    <!-- Equipment picker modal -->
    <EquipmentPickerModal
      :show="pickerOpen"
      :title="`Choose: ${pickerCategoryName}`"
      :category-index="pickerCategoryIndex"
      :edition="pickerCategoryEdition"
      :selected="pickerCurrentValue"
      @close="pickerOpen = false"
      @select="onPickerSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useBuilderStore } from '@/character-builder/builderStore'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { getStartingGoldFormula, rollStartingGold } from '@/character-builder/classMeta'
import { generateId } from '@/shared/lib/uuid'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'
import EquipmentPickerModal from '@/character-builder/components/EquipmentPickerModal.vue'
import type {
  ApiStartingEquipment,
  ApiEquipmentOption,
  ApiEqOptionEntry,
  ApiEqCountedRef,
  ApiEqCategoryRef,
  ApiEqChoice,
  ApiEqMoney,
  ApiEqOptionsArray,
  ApiReference,
  ApiEquipment,
} from '@/shared/types/api'
import type { InventoryItem } from '@/shared/types/character'

const builder = useBuilderStore()

// ── Starting gold ─────────────────────────────────────────────────────────────

const goldFormula = computed(() => getStartingGoldFormula(builder.draft.classIndex))

function rollGold() {
  builder.draft.manualGold = rollStartingGold(builder.draft.classIndex)
}

// Each ApiReference carries a `url` like `/api/2024/equipment/arrows`, the edition that
// owns the resource. Items from a 2024 background/class must be fetched from 2024
// (e.g. 2024 `arrows` doesn't exist as `arrows` in 2014, only `arrow`).
type EquipEdition = '2014' | '2024'
function editionFromUrl(url?: string): EquipEdition {
  return url?.includes('/api/2024/') ? '2024' : '2014'
}

// ── Normalized types ──────────────────────────────────────────────────────────

type Slot =
  | { kind: 'item'; ref: ApiReference; quantity: number }
  | { kind: 'category'; categoryRef: ApiReference }
  | { kind: 'money'; amount: number; unit: string }

interface Variant {
  slots: Slot[]
  label: string
}

interface OptionGroup {
  desc: string
  variants: Variant[]
  source: 'class' | 'background'
}

// ── Data fetching ─────────────────────────────────────────────────────────────

const classEdition = computed(() => builder.draft.classEdition ?? '2014')
const { data: classData, isPending: classLoading } = useQuery({
  queryKey: computed(() => [classEdition.value, 'class', builder.draft.classIndex]),
  queryFn: () => classEdition.value === '2024'
    ? fiveEApi.getClass2024(builder.draft.classIndex)
    : fiveEApi.getClass(builder.draft.classIndex),
  enabled: computed(() => !!builder.draft.classIndex),
  staleTime: Infinity,
})

const bgEdition = computed(() => builder.draft.backgroundEdition ?? '2014')
const { data: bgData, isLoading: bgLoading } = useQuery({
  queryKey: computed(() => [bgEdition.value, 'background', builder.draft.backgroundIndex]),
  queryFn: () => bgEdition.value === '2024'
    ? fiveEApi.getBackground2024(builder.draft.backgroundIndex)
    : fiveEApi.getBackground(builder.draft.backgroundIndex),
  enabled: computed(() => !!builder.draft.backgroundIndex && builder.draft.backgroundIndex !== 'custom'),
  staleTime: Infinity,
})

// ── Fixed items ───────────────────────────────────────────────────────────────

const fixedItems = computed<ApiStartingEquipment[]>(() => {
  const cls = classData.value?.starting_equipment ?? []
  const bg  = bgData.value?.starting_equipment ?? []
  return [...cls, ...bg]
})

// ── Option group parsing ──────────────────────────────────────────────────────

function parseEntry(entry: ApiEqOptionEntry): Slot[] {
  if (entry.option_type === 'counted_reference') {
    const e = entry as ApiEqCountedRef
    return [{ kind: 'item', ref: e.of, quantity: e.count }]
  }
  if (entry.option_type === 'money') {
    const e = entry as ApiEqMoney
    return [{ kind: 'money', amount: e.count, unit: e.unit }]
  }
  if (entry.option_type === 'multiple') {
    return entry.items.flatMap(parseEntry)
  }
  if (entry.option_type === 'choice') {
    const e = entry as ApiEqChoice
    const from = e.choice.from
    if ((from as ApiEqCategoryRef).option_set_type === 'equipment_category') {
      const cat = from as ApiEqCategoryRef
      const count = e.choice.choose ?? 1
      return Array.from({ length: count }, () => ({ kind: 'category' as const, categoryRef: cat.equipment_category }))
    }
    const arr = from as ApiEqOptionsArray
    return arr.options.flatMap(parseEntry)
  }
  return []
}

function formatMoney(amount: number, unit: string): string {
  return `${amount} ${unit.toUpperCase()}`
}

function slotLabel(slot: Slot): string {
  if (slot.kind === 'item') {
    return slot.quantity > 1 ? `${slot.quantity}× ${slot.ref.name}` : slot.ref.name
  }
  if (slot.kind === 'money') return formatMoney(slot.amount, slot.unit)
  return `Any ${slot.categoryRef.name}`
}

function parseOption(opt: ApiEquipmentOption, source: 'class' | 'background'): OptionGroup {
  const from = opt.from
  const isCategoryRef = (from as ApiEqCategoryRef).option_set_type === 'equipment_category'

  if (isCategoryRef) {
    const cat = from as ApiEqCategoryRef
    return {
      desc: opt.desc,
      source,
      variants: [{ slots: [{ kind: 'category', categoryRef: cat.equipment_category }], label: `Any ${cat.equipment_category.name}` }],
    }
  }

  const arr = from as ApiEqOptionsArray
  const variants: Variant[] = arr.options.map(entry => {
    const slots = parseEntry(entry)
    const label = slots.map(slotLabel).join(' + ') || entry.option_type
    return { slots, label }
  })

  return { desc: opt.desc, source, variants }
}

const optionGroups = computed<OptionGroup[]>(() => {
  const cls = (classData.value?.starting_equipment_options ?? []).map(opt => parseOption(opt, 'class'))
  const bg  = (bgData.value?.starting_equipment_options ?? []).map(opt => parseOption(opt, 'background'))
  return [...cls, ...bg]
})

// ── Choices state ─────────────────────────────────────────────────────────────

const choices = ref<Record<number, number>>({})
const categorySelections = ref<Record<string, string>>({})

function variantLabel(vi: number): string {
  return String.fromCharCode(65 + vi)
}

// ── Equipment picker modal state ──────────────────────────────────────────────

const pickerOpen = ref(false)
const pickerCategoryIndex = ref('')
const pickerCategoryName = ref('')
const pickerCategoryEdition = ref<EquipEdition>('2014')
const pickerKey = ref('')   // e.g. "0_1"
// Edition of each category-picked item, keyed like categorySelections, so we fetch the
// chosen item's details from the right endpoint.
const categorySelectionEditions = ref<Record<string, EquipEdition>>({})

function openPicker(gi: number, si: number, categoryRef: ApiReference) {
  pickerKey.value = `${gi}_${si}`
  pickerCategoryIndex.value = categoryRef.index
  pickerCategoryName.value = categoryRef.name
  pickerCategoryEdition.value = editionFromUrl(categoryRef.url)
  pickerOpen.value = true
}

const pickerCurrentValue = computed(() => categorySelections.value[pickerKey.value] ?? '')

function onPickerSelect(index: string) {
  categorySelections.value[pickerKey.value] = index
  categorySelectionEditions.value[pickerKey.value] = pickerCategoryEdition.value
  pickerOpen.value = false
}

// ── Pre-fetch category lists ──────────────────────────────────────────────────

// Resilient, edition-aware multi-fetch helper (individual 404s are skipped).
async function fetchEquipment(items: { index: string; edition: EquipEdition }[]): Promise<ApiEquipment[]> {
  const settled = await Promise.allSettled(
    items.map(it => it.edition === '2024' ? fiveEApi.getEquipment2024(it.index) : fiveEApi.getEquipment(it.index)),
  )
  return settled
    .filter((s): s is PromiseFulfilledResult<ApiEquipment> => s.status === 'fulfilled')
    .map(s => s.value)
}

const allCategoryItems = computed<{ index: string; edition: EquipEdition }[]>(() => {
  const map = new Map<string, EquipEdition>()
  for (const group of optionGroups.value) {
    for (const variant of group.variants) {
      for (const slot of variant.slots) {
        if (slot.kind === 'category' && !map.has(slot.categoryRef.index)) {
          map.set(slot.categoryRef.index, editionFromUrl(slot.categoryRef.url))
        }
      }
    }
  }
  return [...map].map(([index, edition]) => ({ index, edition }))
})

useQuery({
  queryKey: computed(() => ['eq-categories', ...allCategoryItems.value.map(c => `${c.edition}:${c.index}`)]),
  queryFn: async () => {
    const settled = await Promise.allSettled(
      allCategoryItems.value.map(c => c.edition === '2024'
        ? fiveEApi.getEquipmentCategory2024(c.index)
        : fiveEApi.getEquipmentCategory(c.index)),
    )
    return settled.filter(s => s.status === 'fulfilled')
  },
  enabled: computed(() => allCategoryItems.value.length > 0),
  staleTime: Infinity,
})

// ── Collect all equipment items (with edition) to fetch details for ───────────

const allItems = computed<{ index: string; edition: EquipEdition }[]>(() => {
  const map = new Map<string, EquipEdition>()
  const add = (index: string, edition: EquipEdition) => { if (index && !map.has(index)) map.set(index, edition) }

  for (const f of fixedItems.value) add(f.equipment.index, editionFromUrl(f.equipment.url))

  // Fetch all variant items upfront so stat lines are available before selection
  for (const group of optionGroups.value) {
    for (const variant of group.variants) {
      for (const slot of variant.slots) {
        if (slot.kind === 'item') add(slot.ref.index, editionFromUrl(slot.ref.url))
      }
    }
  }

  // Category-picked items, edition tracked at selection time
  for (const [key, idx] of Object.entries(categorySelections.value)) {
    if (idx) add(idx, categorySelectionEditions.value[key] ?? '2014')
  }

  return [...map].map(([index, edition]) => ({ index, edition }))
})

const { data: equipDetailList } = useQuery({
  queryKey: computed(() => ['eq-details', ...allItems.value.map(it => `${it.edition}:${it.index}`)]),
  queryFn: () => fetchEquipment(allItems.value),
  enabled: computed(() => allItems.value.length > 0),
  staleTime: Infinity,
})

const equipMap = computed<Record<string, ApiEquipment>>(() => {
  const map: Record<string, ApiEquipment> = {}
  for (const eq of equipDetailList.value ?? []) {
    map[eq.index] = eq
  }
  return map
})

// ── Pack contents & holy symbol helpers ───────────────────────────────────────

function getPackContents(itemIndex: string): { item: ApiReference; quantity: number }[] {
  const eq = equipMap.value[itemIndex]
  if (!eq?.contents?.length) return []
  return eq.contents
}

function isHolySymbol(itemIndex: string): boolean {
  const eq = equipMap.value[itemIndex]
  if (!eq) return itemIndex.includes('holy-symbol')
  return eq.gear_category?.index === 'holy-symbols' ||
    eq.equipment_category?.index === 'holy-symbols' ||
    eq.name.toLowerCase().includes('holy symbol')
}

// ── Category slot helpers (for duplicate-category numbering) ─────────────────

function catSlotsOfIndex(slots: Slot[], catIdx: string): number {
  return slots.filter(s => s.kind === 'category' && s.categoryRef.index === catIdx).length
}

function catSlotOrdinal(slots: Slot[], si: number): number {
  const slot = slots[si]
  if (slot.kind !== 'category') return 0
  const targetIdx = slot.categoryRef.index
  let n = 0
  for (let i = 0; i <= si; i++) {
    if (slots[i].kind === 'category' && (slots[i] as Extract<Slot, { kind: 'category' }>).categoryRef.index === targetIdx) n++
  }
  return n
}

// ── Variant item stat line ────────────────────────────────────────────────────

function variantItemStatLine(variant: Variant): string {
  const parts: string[] = []
  for (const slot of variant.slots) {
    if (slot.kind !== 'item') continue
    const eq = equipMap.value[slot.ref.index]
    if (!eq) continue
    const sp: string[] = []
    if (eq.damage) sp.push(`${eq.damage.damage_dice} ${eq.damage.damage_type?.name ?? ''}`.trim())
    if (eq.two_handed_damage) sp.push(`Versatile ${eq.two_handed_damage.damage_dice}`)
    if (eq.armor_class) sp.push(`CA ${eq.armor_class.base}`)
    if (eq.weapon_range) sp.push(eq.weapon_range)
    if (sp.length) parts.push(sp.join(' · '))
  }
  return parts.join(' + ')
}

// ── Category selection display helpers ────────────────────────────────────────

function selectionName(key: string): string {
  const idx = categorySelections.value[key]
  if (!idx) return ''
  return equipMap.value[idx]?.name ?? idx
}

function selectionGlyph(key: string): string {
  const idx = categorySelections.value[key]
  if (!idx) return '📦'
  const eq = equipMap.value[idx]
  if (!eq) return '📦'
  if (eq.damage) return '⚔'
  if (eq.armor_class) return '🛡'
  return '⚜'
}

function selectionStatLine(key: string): string {
  const idx = categorySelections.value[key]
  if (!idx) return ''
  const eq = equipMap.value[idx]
  if (!eq) return ''
  const parts: string[] = []
  if (eq.damage) parts.push(`${eq.damage.damage_dice} ${eq.damage.damage_type?.name ?? ''}`)
  if (eq.two_handed_damage) parts.push(`Versatile ${eq.two_handed_damage.damage_dice}`)
  if (eq.armor_class) parts.push(`CA ${eq.armor_class.base}`)
  if (eq.weapon_range) parts.push(eq.weapon_range)
  return parts.join(' · ')
}

// ── Pack expansion ────────────────────────────────────────────────────────────

// Creates a gear InventoryItem from a pack-contents ApiReference (no full fetch needed).
function packContentToInventoryItem(ref: ApiReference, quantity: number): InventoryItem {
  return {
    id: generateId(),
    item: { index: ref.index, name: ref.name },
    quantity,
    equipped: false,
    itemType: 'gear' as const,
  }
}

// Returns expanded items if equip is a pack (has contents), otherwise null.
function expandPack(eq: ApiEquipment, outerQty: number): InventoryItem[] | null {
  if (!eq.contents?.length) return null
  return eq.contents.map(c => packContentToInventoryItem(c.item, c.quantity * outerQty))
}

// ── Convert API equipment to InventoryItem ────────────────────────────────────

// 2014 items carry a singular `equipment_category`; 2024 items carry a plural
// `equipment_categories` array (and drop weapon_category/armor_category). Read both.
function equipCategoryIndexes(equip: ApiEquipment): string[] {
  const out: string[] = []
  if (equip.equipment_category?.index) out.push(equip.equipment_category.index)
  for (const c of equip.equipment_categories ?? []) if (c?.index) out.push(c.index)
  return out
}

function isWeaponEquip(equip: ApiEquipment): boolean {
  const cats = equipCategoryIndexes(equip)
  return cats.includes('weapon') || cats.includes('weapons') || !!equip.weapon_category
}

function isArmorEquip(equip: ApiEquipment): boolean {
  return equipCategoryIndexes(equip).includes('armor') || !!equip.armor_category
}

function isEquippableEquip(equip: ApiEquipment): boolean {
  return isWeaponEquip(equip) || isArmorEquip(equip)
}

function isRangedWeapon(equip: ApiEquipment): boolean {
  return equip.weapon_range === 'Ranged' || equipCategoryIndexes(equip).includes('ranged-weapons')
}

function toInventoryItem(equip: ApiEquipment, quantity: number): InventoryItem {
  const base = {
    id: generateId(),
    item: {
      index: equip.index,
      name: equip.name,
      category: equip.equipment_category?.name ?? equip.equipment_categories?.[0]?.name,
      weight: equip.weight,
      cost: equip.cost,
    },
    quantity,
    equipped: false,
  }

  if (isWeaponEquip(equip)) {
    return {
      ...base,
      itemType: 'weapon' as const,
      damage: equip.damage?.damage_dice,
      damageType: equip.damage?.damage_type?.name,
      attackBonus: '+0',
      range: isRangedWeapon(equip) && equip.range
        ? `${equip.range.normal}ft`
        : undefined,
    }
  }

  if (isArmorEquip(equip)) {
    return {
      ...base,
      itemType: 'armor' as const,
      armorClass: equip.armor_class?.base,
      armorType: deriveArmorType(equip),
      stealthDisadvantage: equip.stealth_disadvantage,
    }
  }

  return { ...base, itemType: 'gear' as const }
}

// Armor sub-type from the 2014 `armor_category` string ("Heavy") or the 2024
// `equipment_categories` array ("heavy-armor", "shields").
function deriveArmorType(equip: ApiEquipment): 'light' | 'medium' | 'heavy' | 'shield' | undefined {
  const fromField = normalizeArmorType(equip.armor_category)
  if (fromField) return fromField
  const cats = equipCategoryIndexes(equip)
  if (cats.includes('shields') || cats.includes('shield')) return 'shield'
  if (cats.includes('heavy-armor')) return 'heavy'
  if (cats.includes('medium-armor')) return 'medium'
  if (cats.includes('light-armor')) return 'light'
  return undefined
}

function normalizeArmorType(cat: string | undefined): 'light' | 'medium' | 'heavy' | 'shield' | undefined {
  if (!cat) return undefined
  const lc = cat.toLowerCase()
  if (lc === 'light' || lc === 'medium' || lc === 'heavy' || lc === 'shield') return lc
  return undefined
}

// ── Resolve inventory from choices ────────────────────────────────────────────

const resolvedInventory = computed<InventoryItem[]>(() => {
  const items: InventoryItem[] = []
  const map = equipMap.value

  for (const f of fixedItems.value) {
    const eq = map[f.equipment.index]
    if (!eq) continue
    const expanded = expandPack(eq, f.quantity)
    if (expanded) {
      items.push(...expanded)
      continue
    }
    const isEquippable = isEquippableEquip(eq)
    if (isEquippable && f.quantity > 1) {
      for (let q = 0; q < f.quantity; q++) items.push(toInventoryItem(eq, 1))
    } else {
      items.push(toInventoryItem(eq, f.quantity))
    }
  }

  for (const [giStr, vi] of Object.entries(choices.value)) {
    const gi = Number(giStr)
    const group = optionGroups.value[gi]
    if (!group) continue
    const variant = group.variants[vi]
    if (!variant) continue
    for (const [si, slot] of variant.slots.entries()) {
      if (slot.kind === 'item') {
        const eq = map[slot.ref.index]
        if (!eq) continue
        const expanded = expandPack(eq, slot.quantity)
        if (expanded) {
          items.push(...expanded)
          continue
        }
        const isEquippable = isEquippableEquip(eq)
        if (isEquippable && slot.quantity > 1) {
          // Weapons and armor with quantity>1 get separate entries so each
          // can be independently equipped to a different slot (MH/OH/armor).
          for (let q = 0; q < slot.quantity; q++) items.push(toInventoryItem(eq, 1))
        } else {
          items.push(toInventoryItem(eq, slot.quantity))
        }
      } else {
        const selIdx = categorySelections.value[`${gi}_${si}`]
        if (selIdx) {
          const eq = map[selIdx]
          if (eq) items.push(toInventoryItem(eq, 1))
        }
      }
    }
  }

  return items
})

watch(resolvedInventory, (items) => {
  builder.draft.startingInventory = items
}, { deep: true })

// Coins granted by chosen options (e.g. background "B) 50 GP") → applied to the character
// in the equipment path. Class/background starting-equipment options use gp in the SRD,
// but accumulate per-unit to be safe.
const resolvedCurrency = computed(() => {
  const cur = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
  for (const [giStr, vi] of Object.entries(choices.value)) {
    const variant = optionGroups.value[Number(giStr)]?.variants[vi]
    if (!variant) continue
    for (const slot of variant.slots) {
      if (slot.kind === 'money') {
        const u = slot.unit.toLowerCase()
        if (u in cur) cur[u as keyof typeof cur] += slot.amount
      }
    }
  }
  return cur
})

watch(resolvedCurrency, (cur) => {
  builder.draft.equipmentCurrency = cur
}, { deep: true, immediate: true })

watchEffect(() => {
  if (!builder.draft.useStartingEquipment || classLoading.value || bgLoading.value) {
    builder.draft.equipmentChoicesDone = true
    return
  }
  const n = optionGroups.value.length
  builder.draft.equipmentChoicesDone = n === 0 || Object.keys(choices.value).length >= n
})

// ── Summary helpers ───────────────────────────────────────────────────────────

const UNIT_ORDER: (keyof typeof resolvedCurrency.value)[] = ['pp', 'gp', 'ep', 'sp', 'cp']
const hasEquipmentCurrency = computed(() => UNIT_ORDER.some(u => resolvedCurrency.value[u] > 0))
const equipmentCurrencyLabel = computed(() =>
  UNIT_ORDER
    .filter(u => resolvedCurrency.value[u] > 0)
    .map(u => `${resolvedCurrency.value[u]} ${u.toUpperCase()}`)
    .join(', '),
)

interface SummaryEntry { name: string; quantity: number; icon: string }

const summaryItems = computed<SummaryEntry[]>(() =>
  resolvedInventory.value.map(inv => ({
    name: inv.item.name,
    quantity: inv.quantity,
    icon: inv.itemType === 'weapon' ? '⚔' : inv.itemType === 'armor' ? '🛡' : '📦',
  }))
)

function invGlyph(type: InventoryItem['itemType']): string {
  if (type === 'weapon') return '⚔'
  if (type === 'armor') return '🛡'
  return '📦'
}

function invStatLine(inv: InventoryItem): string {
  const parts: string[] = []
  if (inv.damage) parts.push(`${inv.damage}${inv.damageType ? ` ${inv.damageType}` : ''}`)
  if (inv.armorClass) parts.push(`CA ${inv.armorClass}`)
  if (inv.range) parts.push(inv.range)
  return parts.join(' · ')
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const WEAPON_KEYWORDS = ['sword', 'axe', 'dagger', 'spear', 'bow', 'crossbow', 'mace', 'hammer', 'flail', 'glaive', 'halberd', 'lance', 'pike', 'rapier', 'scimitar', 'shortsword', 'longsword', 'greatsword', 'warhammer', 'trident', 'whip', 'quarterstaff', 'club', 'javelin']
const ARMOR_KEYWORDS  = ['armor', 'mail', 'plate', 'shield', 'leather', 'hide', 'studded', 'breastplate', 'splint', 'ring mail']

function itemIcon(index: string): string {
  const lc = index.toLowerCase()
  if (WEAPON_KEYWORDS.some(w => lc.includes(w))) return '⚔'
  if (ARMOR_KEYWORDS.some(a => lc.includes(a))) return '🛡'
  return '📦'
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(4px); }
</style>
