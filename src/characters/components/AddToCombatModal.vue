<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      @click.self="$emit('close')"
      @keydown.esc="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/70" @click="$emit('close')" />

      <div
        role="dialog"
        aria-modal="true"
          v-focus-trap
        aria-labelledby="add-to-combat-title"
        class="relative w-full max-w-lg bg-void border border-shadow rounded-lg shadow-2xl flex flex-col"
        style="max-height: 82vh"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-shadow shrink-0">
          <p id="add-to-combat-title" class="font-heading text-base text-vellum">Add to Favorites</p>
          <button type="button" class="text-mist hover:text-ash transition-colors" aria-label="Close" @click="$emit('close')">
            <XIcon :size="16" />
          </button>
        </div>

        <!-- Scrollable content: all three sections visible -->
        <div class="overflow-y-auto flex-1 px-4 py-4 space-y-6">

          <!-- ── Weapons ────────────────────────────────────────────────── -->
          <div class="space-y-2">
            <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">Weapons</p>
            <p v-if="weapons.length === 0" class="text-xs font-body text-mist/40 italic px-1">
              No weapons in inventory. Add weapons in the Equipment tab first.
            </p>
            <div
              v-for="item in weapons"
              :key="item.id"
              class="flex items-center gap-3 px-3 py-2.5 rounded border transition-all cursor-pointer select-none"
              :class="isWeaponFav(item.id)
                ? 'border-gold-mid/50 bg-gold-dim/10'
                : 'border-shadow hover:border-shadow/60 hover:bg-depths/40'"
              @click="toggleWeapon(item)"
            >
              <div
                class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                :class="isWeaponFav(item.id) ? 'border-gold-mid bg-gold-dim/30' : 'border-mist/40'"
              >
                <span v-if="isWeaponFav(item.id)" class="text-gold-mid text-[10px] leading-none">✓</span>
              </div>
              <SwordIcon :size="12" class="text-gold-dim/60 shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="font-heading text-sm text-ash">{{ item.item.name }}</p>
                <p v-if="item.attackBonus || item.damage" class="text-2xs font-body text-mist/60 mt-0.5">
                  <span v-if="item.attackBonus" class="text-gold-mid">{{ item.attackBonus }}</span>
                  <span v-if="item.attackBonus && item.damage" class="mx-1 text-mist/30">·</span>
                  <span v-if="item.damage" class="font-mono">{{ item.damage }}</span>
                  <span v-if="item.damageType" class="ml-1">{{ item.damageType }}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- ── Cantrips ───────────────────────────────────────────────── -->
          <div class="space-y-2">
            <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">Cantrips</p>
            <p v-if="cantrips.length === 0" class="text-xs font-body text-mist/40 italic px-1">
              No cantrips known.
            </p>
            <div
              v-for="spell in cantrips"
              :key="spell.index"
              class="flex items-center gap-3 px-3 py-2.5 rounded border transition-all cursor-pointer select-none"
              :class="isSpellFav(spell.index)
                ? 'border-arcane-base/60 bg-arcane-deep/20'
                : 'border-shadow hover:border-arcane-base/25 hover:bg-arcane-deep/10'"
              @click="toggleSpell(spell, 'cantrip')"
            >
              <div
                class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                :class="isSpellFav(spell.index) ? 'border-arcane-base bg-arcane-deep/40' : 'border-mist/40'"
              >
                <span v-if="isSpellFav(spell.index)" class="text-arcane-pale text-[10px] leading-none">✓</span>
              </div>
              <span class="text-arcane-pale/60 text-xs shrink-0">✦</span>
              <div class="flex-1 min-w-0">
                <p class="font-heading text-sm text-ash">{{ spell.name }}</p>
                <p v-if="spell.school" class="text-2xs font-body text-mist/50">{{ spell.school }}</p>
              </div>
              <span class="text-2xs font-heading text-arcane-pale/40 bg-arcane-deep/15 px-1.5 py-0.5 rounded tracking-wide shrink-0">Cantrip</span>
            </div>
          </div>

          <!-- ── Spells ─────────────────────────────────────────────────── -->
          <div class="space-y-2">
            <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">Spells</p>
            <p v-if="spells.length === 0" class="text-xs font-body text-mist/40 italic px-1">
              No spells known or prepared.
            </p>
            <div
              v-for="spell in spells"
              :key="spell.index"
              class="flex items-center gap-3 px-3 py-2.5 rounded border transition-all cursor-pointer select-none"
              :class="isSpellFav(spell.index)
                ? 'border-arcane-base/60 bg-arcane-deep/20'
                : 'border-shadow hover:border-arcane-base/25 hover:bg-arcane-deep/10'"
              @click="toggleSpell(spell, 'spell')"
            >
              <div
                class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                :class="isSpellFav(spell.index) ? 'border-arcane-base bg-arcane-deep/40' : 'border-mist/40'"
              >
                <span v-if="isSpellFav(spell.index)" class="text-arcane-pale text-[10px] leading-none">✓</span>
              </div>
              <span class="text-arcane-pale/60 text-xs shrink-0">◆</span>
              <div class="flex-1 min-w-0">
                <p class="font-heading text-sm text-ash">{{ spell.name }}</p>
                <p v-if="spell.school" class="text-2xs font-body text-mist/50">{{ spell.school }}</p>
              </div>
              <span class="text-2xs font-heading text-arcane-pale/40 bg-arcane-deep/15 px-1.5 py-0.5 rounded tracking-wide shrink-0">Lv {{ spell.level }}</span>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t border-shadow shrink-0 flex justify-end">
          <button type="button" class="btn-primary text-sm" @click="$emit('close')">Done</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { XIcon, SwordIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import type { Character, CombatFavorite, InventoryItem, SpellReference } from '@/shared/types/character'
import { generateId } from '@/shared/lib/uuid'

const props = defineProps<{ character: Character }>()
defineEmits<{ close: [] }>()
const store = useCharactersStore()

// ── Data sources ──────────────────────────────────────────────────────────────

const weapons = computed<InventoryItem[]>(() =>
  props.character.inventory.filter(i => i.itemType === 'weapon'),
)

const cantrips = computed<SpellReference[]>(() =>
  props.character.spellcasting?.cantripsKnown ?? [],
)

const spells = computed<SpellReference[]>(() => {
  const sc = props.character.spellcasting
  if (!sc) return []
  const seen = new Set<string>()
  const result: SpellReference[] = []
  for (const s of [...sc.spellsPrepared, ...sc.spellsKnown]) {
    if (!seen.has(s.index)) { seen.add(s.index); result.push(s) }
  }
  return result.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
})

// ── Favorite checks ───────────────────────────────────────────────────────────

const favs = computed(() => props.character.combatFavorites ?? [])

function isWeaponFav(itemId: string): boolean {
  return favs.value.some(f => f.type === 'weapon' && f.inventoryItemId === itemId)
}

function isSpellFav(spellIndex: string): boolean {
  return favs.value.some(f => (f.type === 'cantrip' || f.type === 'spell') && f.spellIndex === spellIndex)
}

// ── Toggles (immediate save) ──────────────────────────────────────────────────

async function toggleWeapon(item: InventoryItem) {
  const next: CombatFavorite[] = isWeaponFav(item.id)
    ? favs.value.filter(f => !(f.type === 'weapon' && f.inventoryItemId === item.id))
    : [...favs.value, { id: generateId(), type: 'weapon' as const, inventoryItemId: item.id, weaponName: item.item.name }]
  await store.update(props.character.id, { combatFavorites: next })
}

async function toggleSpell(spell: SpellReference, type: 'cantrip' | 'spell') {
  const next: CombatFavorite[] = isSpellFav(spell.index)
    ? favs.value.filter(f => !((f.type === 'cantrip' || f.type === 'spell') && f.spellIndex === spell.index))
    : [...favs.value, { id: generateId(), type, spellIndex: spell.index, spellName: spell.name, spellLevel: spell.level, spellSchool: spell.school }]
  await store.update(props.character.id, { combatFavorites: next })
}
</script>
