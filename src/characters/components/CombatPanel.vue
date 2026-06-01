<template>
  <section class="border-b border-shadow/40 bg-depths/30">
    <div class="app-container py-4">

      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">Combat</p>
        <button
          v-if="editMode"
          type="button"
          class="inline-flex items-center gap-1.5 text-2xs font-heading tracking-wide text-mist/50 hover:text-gold-mid transition-colors border border-shadow/40 hover:border-gold-dim/40 rounded px-2 py-1"
          @click="showModal = true"
        >
          <PlusIcon :size="10" /> Add
        </button>
      </div>

      <!-- Favorites list -->
      <div v-if="character.combatFavorites.length > 0" class="flex flex-wrap gap-2">
        <div
          v-for="fav in character.combatFavorites"
          :key="fav.id"
          class="inline-flex items-center gap-2 px-3 py-2 rounded border bg-abyss/50 group transition-colors"
          :class="fav.type === 'weapon' ? 'border-shadow hover:border-shadow/80' : 'border-arcane-base/25 hover:border-arcane-base/40'"
        >
          <!-- Weapon favorite -->
          <template v-if="fav.type === 'weapon'">
            <SwordIcon :size="11" class="text-gold-dim/70 shrink-0" />
            <span class="font-heading text-sm text-vellum">{{ fav.weaponName }}</span>
            <template v-if="resolvedWeapon(fav)">
              <span v-if="resolvedWeapon(fav)!.attackBonus" class="font-heading text-xs text-gold-mid">
                {{ resolvedWeapon(fav)!.attackBonus }}
              </span>
              <span v-if="resolvedWeapon(fav)!.damage" class="font-mono text-xs text-stone">
                {{ resolvedWeapon(fav)!.damage }}
                <span v-if="resolvedWeapon(fav)!.damageType" class="font-body text-mist/50 not-italic text-2xs">
                  {{ resolvedWeapon(fav)!.damageType }}
                </span>
              </span>
            </template>
            <div class="flex items-center gap-1 ml-0.5">
              <button
                type="button"
                class="px-2 py-0.5 rounded border border-arcane-base/30 bg-arcane-deep/10 text-arcane-pale hover:border-arcane-base/60 hover:bg-arcane-deep/20 transition-all font-heading text-xs"
                title="Roll attack"
                @click="(e) => rollWeaponAtk(fav, e)"
              >⚃ Atk</button>
              <button
                v-if="resolvedWeapon(fav)?.damage"
                type="button"
                class="px-2 py-0.5 rounded border border-blood-base/30 bg-blood-deep/10 text-blood-mid hover:border-blood-base/60 hover:bg-blood-deep/20 transition-all font-heading text-xs"
                title="Roll damage"
                @click="rollWeaponDmg(fav)"
              >⚀ Dmg</button>
            </div>
          </template>

          <!-- Cantrip favorite -->
          <template v-else-if="fav.type === 'cantrip'">
            <span class="text-arcane-pale/70 text-xs shrink-0">✦</span>
            <span class="font-heading text-sm text-vellum">{{ fav.spellName }}</span>
            <span class="text-2xs font-heading text-arcane-pale/50 bg-arcane-deep/20 px-1.5 py-0.5 rounded tracking-wide">Cantrip</span>
          </template>

          <!-- Spell favorite -->
          <template v-else>
            <span class="text-arcane-pale/70 text-xs shrink-0">◆</span>
            <span class="font-heading text-sm text-vellum">{{ fav.spellName }}</span>
            <span class="text-2xs font-heading text-arcane-pale/50 bg-arcane-deep/20 px-1.5 py-0.5 rounded tracking-wide">Lv {{ fav.spellLevel }}</span>
          </template>

          <!-- Remove -->
          <button
            v-if="editMode"
            type="button"
            class="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-mist/30 hover:text-blood-bright hover:bg-blood-base/10 ml-0.5 shrink-0"
            title="Remove from Combat"
            @click="removeFavorite(fav.id)"
          >
            <XIcon :size="11" />
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="flex items-center gap-2">
        <p class="text-xs font-body text-mist/40 italic">No combat actions yet.</p>
        <button
          v-if="editMode"
          type="button"
          class="text-xs font-body text-gold-dim/50 hover:text-gold-mid transition-colors underline underline-offset-2"
          @click="showModal = true"
        >Add weapons, cantrips and spells</button>
      </div>

    </div>

    <!-- Add to Combat modal -->
    <AddToCombatModal
      v-if="showModal"
      :character="character"
      @close="showModal = false"
    />

  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SwordIcon, PlusIcon, XIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import { useRoll } from '@/shared/composables/useRoll'
import { useConfirm } from '@/shared/composables/useConfirm'
import { computeFightingStyleBonuses, addBonusToDamage } from '@/shared/lib/derivedStats'
import type { Character, CombatFavorite, InventoryItem } from '@/shared/types/character'
import AddToCombatModal from './AddToCombatModal.vue'

const props = defineProps<{ character: Character; editMode: boolean }>()
const store = useCharactersStore()
const { confirm } = useConfirm()
const { rollD20, rollDamage } = useRoll()

const showModal = ref(false)

function resolvedWeapon(fav: CombatFavorite): InventoryItem | null {
  if (fav.type !== 'weapon' || !fav.inventoryItemId) return null
  return props.character.inventory.find(i => i.id === fav.inventoryItemId) ?? null
}

function parseBonus(str: string | undefined): number {
  if (!str) return 0
  const m = str.match(/^([+-]?\d+)$/)
  return m ? parseInt(m[1]) : 0
}

const equippedWeapons = computed(() =>
  props.character.inventory.filter(i => i.equipped && i.itemType === 'weapon')
)

function fsBonusFor(item: InventoryItem) {
  return computeFightingStyleBonuses(
    props.character.fightingStyles ?? [],
    item,
    equippedWeapons.value,
  )
}

function rollWeaponAtk(fav: CombatFavorite, event: MouseEvent) {
  const item = resolvedWeapon(fav)
  const bonus = item ? fsBonusFor(item) : { attack: 0, damage: 0 }
  rollD20(parseBonus(item?.attackBonus) + bonus.attack, `${fav.weaponName} Attack`, event)
}

function rollWeaponDmg(fav: CombatFavorite) {
  const item = resolvedWeapon(fav)
  if (!item?.damage) return
  const bonus = fsBonusFor(item)
  rollDamage(addBonusToDamage(item.damage, bonus.damage), `${fav.weaponName} Damage`)
}

async function removeFavorite(id: string) {
  const fav = props.character.combatFavorites.find(f => f.id === id)
  const ok = await confirm({
    title: 'Remove Favorite',
    body: `Remove "${fav?.weaponName ?? fav?.spellName ?? 'this favorite'}" from combat favorites?`,
    confirmLabel: 'Remove',
    variant: 'danger',
  })
  if (!ok) return
  await store.update(props.character.id, {
    combatFavorites: props.character.combatFavorites.filter(f => f.id !== id),
  })
}
</script>
