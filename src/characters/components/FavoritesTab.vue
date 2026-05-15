<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <p class="font-body text-xs text-mist/50">Quick-access attacks, cantrips, and spells.</p>
      <button
        v-if="editMode"
        type="button"
        class="btn-secondary text-xs gap-1.5"
        @click="showModal = true"
      >
        <PlusIcon :size="13" /> Add to Favorites
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="favorites.length === 0" class="card p-12 text-center">
      <StarIcon :size="40" class="mx-auto text-mist/20 mb-4" />
      <p class="font-heading text-base text-ash">No favorites yet.</p>
      <p class="font-body text-sm text-mist/50 mt-1 mb-4">
        Add weapons from your inventory, known cantrips, and prepared spells for quick access.
      </p>
      <button
        v-if="editMode"
        type="button"
        class="btn-primary text-sm gap-1.5 mx-auto"
        @click="showModal = true"
      >
        <PlusIcon :size="13" /> Add to Favorites
      </button>
    </div>

    <!-- ── Weapons ────────────────────────────────────────────────────────── -->
    <section v-if="weapons.length > 0" class="space-y-3">
      <p class="label">Weapons</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="fav in weapons"
          :key="fav.id"
          class="card p-4 space-y-3"
        >
          <!-- Card header -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <SwordIcon :size="14" class="text-gold-dim/70 shrink-0 mt-0.5" />
              <span class="font-heading text-base text-vellum leading-tight truncate">{{ fav.weaponName }}</span>
            </div>
            <button
              v-if="editMode"
              type="button"
              class="p-1 rounded text-mist/40 hover:text-blood-bright hover:bg-blood-base/10 transition-colors shrink-0"
              title="Remove from Favorites"
              @click="removeFavorite(fav.id)"
            >
              <XIcon :size="13" />
            </button>
          </div>

          <!-- Stats grid -->
          <div v-if="resolvedWeapon(fav)" class="grid grid-cols-4 gap-2 text-center">
            <div class="space-y-0.5">
              <p class="text-2xs font-heading tracking-[0.12em] uppercase text-mist/50">Atk</p>
              <p class="font-heading text-lg text-gold-mid leading-none">
                {{ resolvedWeapon(fav)!.attackBonus || '—' }}
              </p>
            </div>
            <div class="space-y-0.5">
              <p class="text-2xs font-heading tracking-[0.12em] uppercase text-mist/50">Dice</p>
              <p class="font-mono text-base text-vellum leading-none">
                {{ dicePart(resolvedWeapon(fav)!.damage) || '—' }}
              </p>
            </div>
            <div class="space-y-0.5">
              <p class="text-2xs font-heading tracking-[0.12em] uppercase text-mist/50">Dmg</p>
              <p class="font-mono text-base text-stone leading-none">
                {{ resolvedWeapon(fav)!.damage || '—' }}
              </p>
            </div>
            <div class="space-y-0.5">
              <p class="text-2xs font-heading tracking-[0.12em] uppercase text-mist/50">Type</p>
              <p class="font-body text-xs text-ash leading-none mt-0.5">
                {{ shortDmgType(resolvedWeapon(fav)!.damageType) || '—' }}
              </p>
            </div>
          </div>

          <!-- Range + roll buttons -->
          <div class="flex items-center justify-between gap-2 pt-1 border-t border-shadow/30">
            <span v-if="resolvedWeapon(fav)?.range" class="text-xs font-body text-mist/50">
              {{ resolvedWeapon(fav)!.range }}
            </span>
            <span v-else class="text-xs font-body text-mist/30 italic">—</span>
            <div class="flex gap-1.5 shrink-0">
              <button
                type="button"
                class="px-3 py-1.5 rounded border border-arcane-base/40 bg-arcane-deep/10 text-arcane-pale hover:border-arcane-base/70 hover:bg-arcane-deep/20 transition-all font-heading text-xs"
                @click="(e) => rollWeaponAtk(fav, e)"
              >⚃ Roll Attack</button>
              <button
                v-if="resolvedWeapon(fav)?.damage"
                type="button"
                class="px-3 py-1.5 rounded border border-blood-base/40 bg-blood-deep/10 text-blood-mid hover:border-blood-base/70 hover:bg-blood-deep/20 transition-all font-heading text-xs"
                @click="rollWeaponDmg(fav)"
              >⚀ Roll Damage</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Cantrips ───────────────────────────────────────────────────────── -->
    <section v-if="cantrips.length > 0" class="space-y-3">
      <p class="label">Cantrips</p>
      <div class="grid gap-2 sm:grid-cols-2">
        <FavoriteSpellCard
          v-for="fav in cantrips"
          :key="fav.id"
          :fav="fav"
          :edit-mode="editMode"
          @remove="removeFavorite(fav.id)"
        />
      </div>
    </section>

    <!-- ── Spells ─────────────────────────────────────────────────────────── -->
    <section v-if="spells.length > 0" class="space-y-3">
      <p class="label">Spells</p>
      <div class="grid gap-2 sm:grid-cols-2">
        <FavoriteSpellCard
          v-for="fav in spells"
          :key="fav.id"
          :fav="fav"
          :edit-mode="editMode"
          @remove="removeFavorite(fav.id)"
        />
      </div>
    </section>

    <!-- Modal -->
    <AddToCombatModal
      v-if="showModal"
      :character="character"
      @close="showModal = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PlusIcon, XIcon, SwordIcon, StarIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import { useRoll } from '@/shared/composables/useRoll'
import type { Character, CombatFavorite, InventoryItem } from '@/shared/types/character'
import AddToCombatModal from './AddToCombatModal.vue'
import FavoriteSpellCard from './FavoriteSpellCard.vue'

const props = defineProps<{ character: Character; editMode: boolean }>()
const store = useCharactersStore()
const { rollD20, rollDamage } = useRoll()

const showModal = ref(false)

const favorites = computed(() => props.character.combatFavorites ?? [])
const weapons   = computed(() => favorites.value.filter(f => f.type === 'weapon'))
const cantrips  = computed(() => favorites.value.filter(f => f.type === 'cantrip'))
const spells    = computed(() => favorites.value.filter(f => f.type === 'spell'))

function resolvedWeapon(fav: CombatFavorite): InventoryItem | null {
  if (fav.type !== 'weapon' || !fav.inventoryItemId) return null
  return props.character.inventory.find(i => i.id === fav.inventoryItemId) ?? null
}

function dicePart(damage: string | undefined): string {
  if (!damage) return ''
  return damage.match(/\d+d\d+/i)?.[0] ?? ''
}

function shortDmgType(type: string | undefined): string {
  if (!type) return ''
  return type.length > 8 ? type.slice(0, 7) + '.' : type
}

function parseBonus(str: string | undefined): number {
  if (!str) return 0
  const m = str.match(/^([+-]?\d+)$/)
  return m ? parseInt(m[1]) : 0
}

function rollWeaponAtk(fav: CombatFavorite, event: MouseEvent) {
  const item = resolvedWeapon(fav)
  rollD20(parseBonus(item?.attackBonus), `${fav.weaponName} Attack`, event)
}

function rollWeaponDmg(fav: CombatFavorite) {
  const item = resolvedWeapon(fav)
  if (!item?.damage) return
  rollDamage(item.damage, `${fav.weaponName} Damage`)
}

async function removeFavorite(id: string) {
  await store.update(props.character.id, {
    combatFavorites: favorites.value.filter(f => f.id !== id),
  })
}
</script>
