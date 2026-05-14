<template>
  <div class="space-y-8">

    <!-- ── Currency ──────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="label">Currency</p>
      <div class="grid grid-cols-5 gap-2">
        <div v-for="coin in COINS" :key="coin.key" class="card p-2 text-center">
          <p class="text-2xs font-heading tracking-wide text-mist uppercase mb-1">{{ coin.label }}</p>
          <input
            v-model.number="currencyEdit[coin.key]"
            type="number"
            min="0"
            class="w-full text-center font-heading text-base bg-transparent outline-none text-vellum border-b border-transparent focus:border-gold-mid/50 transition-colors"
            @blur="saveCurrency"
          />
        </div>
      </div>
    </section>

    <!-- ── Inventory ─────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <p class="label">
          Inventory
          <span v-if="totalWeight > 0" class="text-mist font-body normal-case tracking-normal text-xs ml-2">
            {{ totalWeight.toFixed(1).replace(/\.0$/, '') }} lb.
          </span>
        </p>
      </div>

      <!-- Item list -->
      <div v-if="character.inventory.length > 0" class="space-y-1.5">
        <div
          v-for="item in character.inventory"
          :key="item.id"
          class="flex items-center gap-3 px-3 py-2.5 rounded border border-shadow bg-abyss/50 group"
        >
          <!-- Equipped toggle -->
          <button
            type="button"
            class="w-3 h-3 rounded-full shrink-0 border-2 transition-colors"
            :class="item.equipped
              ? 'bg-gold-mid border-gold-mid'
              : 'bg-transparent border-mist/40 hover:border-mist'"
            :title="item.equipped ? 'Equipped — click to unequip' : 'Click to equip'"
            @click="toggleEquipped(item.id)"
          />

          <!-- Name + category -->
          <div class="flex-1 min-w-0">
            <span class="font-heading text-sm text-vellum">{{ item.item.name }}</span>
            <span v-if="item.item.category" class="text-xs font-body text-mist/60 ml-2">{{ item.item.category }}</span>
          </div>

          <!-- Weight -->
          <span v-if="item.item.weight" class="text-xs font-body text-mist/50 shrink-0 hidden sm:inline">
            {{ item.item.weight }} lb.
          </span>

          <!-- Quantity -->
          <div class="flex items-center gap-1 shrink-0">
            <button
              type="button"
              class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading text-xs transition-colors"
              @click="adjustQuantity(item.id, -1)"
            >−</button>
            <span class="font-heading text-sm text-stone w-5 text-center">{{ item.quantity }}</span>
            <button
              type="button"
              class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading text-xs transition-colors"
              @click="adjustQuantity(item.id, 1)"
            >+</button>
          </div>

          <!-- Delete -->
          <button
            type="button"
            class="p-1 rounded text-mist/30 hover:text-blood-bright hover:bg-blood-base/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove item"
            @click="removeItem(item.id)"
          >
            <Trash2Icon :size="13" />
          </button>
        </div>
      </div>

      <div v-else-if="!showForm" class="card p-10 text-center">
        <PackageIcon :size="36" class="mx-auto text-mist/25 mb-3" />
        <p class="font-body text-ash text-sm">Inventory is empty.</p>
        <p class="font-body text-mist text-xs mt-1">Add weapons, armor, and gear to track your loadout.</p>
      </div>

      <!-- Add button -->
      <button
        v-if="!showForm"
        type="button"
        class="btn-secondary text-xs gap-1.5 w-full justify-center"
        @click="openForm"
      >
        <PlusIcon :size="13" /> Add Item
      </button>

      <!-- Add item form -->
      <div v-if="showForm" class="card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <p class="font-heading text-sm text-vellum">New Item</p>
          <button type="button" class="text-mist hover:text-ash transition-colors" @click="closeForm">
            <XIcon :size="15" />
          </button>
        </div>

        <!-- Name + Category -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label mb-1.5 block">Name <span class="text-blood-bright">*</span></label>
            <input
              ref="nameInputEl"
              v-model="draft.name"
              type="text"
              placeholder="Longsword, Rope, Potion…"
              class="input-base w-full"
              @keydown.enter="submitForm"
            />
          </div>
          <div>
            <label class="label mb-1.5 block">Category</label>
            <input
              v-model="draft.category"
              type="text"
              placeholder="Weapon, Armor, Gear…"
              class="input-base w-full"
            />
          </div>
        </div>

        <!-- Quantity + Weight -->
        <div class="grid grid-cols-2 gap-3 max-w-xs">
          <div>
            <label class="label mb-1.5 block">Quantity</label>
            <input
              v-model.number="draft.quantity"
              type="number"
              min="1"
              class="input-base w-full"
            />
          </div>
          <div>
            <label class="label mb-1.5 block">Weight (lb.)</label>
            <input
              v-model.number="draft.weight"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              class="input-base w-full"
            />
          </div>
        </div>

        <!-- Equipped toggle -->
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input v-model="draft.equipped" type="checkbox" class="w-3.5 h-3.5 accent-gold-mid" />
          <span class="text-xs font-body text-ash">Start equipped</span>
        </label>

        <!-- Actions -->
        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="btn-primary text-sm gap-1.5"
            :disabled="!draft.name.trim()"
            @click="submitForm"
          >
            <PlusIcon :size="13" /> Add Item
          </button>
          <button type="button" class="btn-secondary text-sm" @click="closeForm">Cancel</button>
        </div>
      </div>

      <!-- Add another (when list has items) -->
      <button
        v-if="!showForm && character.inventory.length > 0"
        type="button"
        class="btn-secondary text-xs gap-1.5"
        @click="openForm"
      >
        <PlusIcon :size="13" /> Add Item
      </button>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { PackageIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import type { Character } from '@/shared/types/character'
import { generateId } from '@/shared/lib/uuid'

const props = defineProps<{ character: Character }>()
const store = useCharactersStore()

// ── Currency ──────────────────────────────────────────────────────────────────

const COINS = [
  { key: 'cp' as const, label: 'CP' },
  { key: 'sp' as const, label: 'SP' },
  { key: 'ep' as const, label: 'EP' },
  { key: 'gp' as const, label: 'GP' },
  { key: 'pp' as const, label: 'PP' },
]

const currencyEdit = reactive({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 })

watch(
  () => props.character.currency,
  (c) => {
    currencyEdit.cp = c.cp
    currencyEdit.sp = c.sp
    currencyEdit.ep = c.ep
    currencyEdit.gp = c.gp
    currencyEdit.pp = c.pp
  },
  { immediate: true },
)

async function saveCurrency() {
  await store.update(props.character.id, { currency: { ...currencyEdit } })
}

// ── Inventory ─────────────────────────────────────────────────────────────────

const totalWeight = computed(() =>
  props.character.inventory.reduce((sum, item) => {
    return sum + (item.item.weight ?? 0) * item.quantity
  }, 0),
)

async function toggleEquipped(itemId: string) {
  await store.update(props.character.id, {
    inventory: props.character.inventory.map((i) =>
      i.id === itemId ? { ...i, equipped: !i.equipped } : i,
    ),
  })
}

async function adjustQuantity(itemId: string, delta: number) {
  await store.update(props.character.id, {
    inventory: props.character.inventory.map((i) =>
      i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i,
    ),
  })
}

async function removeItem(itemId: string) {
  await store.update(props.character.id, {
    inventory: props.character.inventory.filter((i) => i.id !== itemId),
  })
}

// ── Add item form ─────────────────────────────────────────────────────────────

const showForm = ref(false)
const nameInputEl = ref<HTMLInputElement | null>(null)

const draft = reactive({
  name: '',
  category: '',
  quantity: 1,
  weight: undefined as number | undefined,
  equipped: false,
})

function resetDraft() {
  draft.name = ''
  draft.category = ''
  draft.quantity = 1
  draft.weight = undefined
  draft.equipped = false
}

function openForm() {
  showForm.value = true
  nextTick(() => nameInputEl.value?.focus())
}

function closeForm() {
  showForm.value = false
  resetDraft()
}

async function submitForm() {
  if (!draft.name.trim()) return
  const newItem = {
    id: generateId(),
    item: {
      index: generateId(),
      name: draft.name.trim(),
      category: draft.category.trim() || undefined,
      weight: draft.weight || undefined,
    },
    quantity: Math.max(1, draft.quantity || 1),
    equipped: draft.equipped,
  }
  await store.update(props.character.id, {
    inventory: [...props.character.inventory, newItem],
  })
  closeForm()
}
</script>
