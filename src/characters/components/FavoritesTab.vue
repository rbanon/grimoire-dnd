<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <button
        v-if="editMode"
        type="button"
        class="btn-secondary text-xs gap-1.5"
        @click="showModal = true"
      >
        <PlusIcon :size="13" /> Add to Favorites
      </button>
    </div>

    <!-- ── Class resources ──────────────────────────────────────────────────── -->
    <section v-if="character.resources.length > 0" class="space-y-2">
      <p class="label">Class Resources</p>
      <ResourceTracker
        :resources="character.resources"
        :class-index="character.identity.class.index"
        @change="onResourceChange"
      />
    </section>

    <!-- Empty state -->
    <div v-if="favorites.length === 0 && character.resources.length === 0" class="card p-12 text-center">
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
            <div class="flex items-center gap-1.5 shrink-0">
              <!-- Slot badge -->
              <span
                v-if="resolvedWeapon(fav) && isInHandSlot(resolvedWeapon(fav)!)"
                class="text-2xs font-heading px-1.5 py-0.5 rounded border border-gold-dim/40 text-gold-mid bg-gold-dim/10"
              >{{ slots.mainHand === resolvedWeapon(fav)!.id ? 'MH' : 'OH' }}</span>
              <span
                v-else-if="resolvedWeapon(fav)"
                class="text-2xs font-body text-mist/30 italic"
                title="Not in any hand slot — assign in Equipment tab"
              >—</span>
              <button
                v-if="editMode"
                type="button"
                class="p-1 rounded text-mist/40 hover:text-blood-bright hover:bg-blood-base/10 transition-colors"
                title="Remove from Favorites"
                @click="removeFavorite(fav.id)"
              >
                <XIcon :size="13" />
              </button>
            </div>
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

          <!-- Fighting style badge -->
          <div
            v-if="fsBonus(fav.id).attack > 0 || fsBonus(fav.id).damage > 0 || fsBonus(fav.id).rerollLowDice"
            class="flex items-center gap-1.5 flex-wrap"
          >
            <span v-if="fsBonus(fav.id).attack > 0" class="text-2xs font-heading px-1.5 py-0.5 rounded border border-arcane-base/40 text-arcane-pale bg-arcane-deep/10">
              +{{ fsBonus(fav.id).attack }} atk
            </span>
            <span v-if="fsBonus(fav.id).damage > 0" class="text-2xs font-heading px-1.5 py-0.5 rounded border border-blood-base/40 text-blood-mid bg-blood-deep/10">
              +{{ fsBonus(fav.id).damage }} dmg
            </span>
            <span v-if="fsBonus(fav.id).rerollLowDice" class="text-2xs font-heading px-1.5 py-0.5 rounded border border-gold-dim/40 text-gold-mid bg-gold-dim/10">
              GWF
            </span>
            <span class="text-2xs font-body text-mist/40">Fighting Style</span>
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
          :spell-attack-bonus="spellAttackBonus"
          :character-level="character.combat.level"
          @remove="removeFavorite(fav.id)"
          @cast="castingFav = fav"
        />
      </div>
    </section>

    <!-- ── Spell Slots ──────────────────────────────────────────────────── -->
    <section v-if="spells.length > 0 && slotLevels.length > 0" class="space-y-2">
      <p class="label">Spell Slots</p>
      <div class="card p-3 flex flex-wrap gap-x-5 gap-y-2.5">
        <div
          v-for="lvl in slotLevels"
          :key="lvl"
          class="flex items-center gap-2"
        >
          <span class="text-2xs font-heading text-mist/60 w-5 shrink-0">{{ lvl }}</span>
          <div class="flex items-center gap-1">
            <button
              v-for="pip in maxSlots(lvl)"
              :key="pip"
              type="button"
              class="w-3.5 h-3.5 rounded border-2 transition-all duration-100 cursor-pointer hover:border-gold-mid"
              :class="pip <= maxSlots(lvl) - usedSlots(lvl) ? 'bg-gold-mid/80 border-gold-mid' : 'bg-shadow/40 border-gold-dim/60'"
              :title="pip <= maxSlots(lvl) - usedSlots(lvl) ? 'Spend slot' : 'Recover slot'"
              @click="toggleSlot(lvl, pip)"
            />
          </div>
          <span class="text-2xs font-body text-mist/50">{{ maxSlots(lvl) - usedSlots(lvl) }}/{{ maxSlots(lvl) }}</span>
        </div>
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
          :spell-attack-bonus="spellAttackBonus"
          :character-level="character.combat.level"
          @remove="removeFavorite(fav.id)"
          @cast="castingFav = fav"
        />
      </div>
    </section>

    <!-- Add to Favorites modal -->
    <AddToCombatModal
      v-if="showModal"
      :character="character"
      @close="showModal = false"
    />

    <!-- Cast spell modal -->
    <CastSpellModal
      v-if="castingSpell"
      :show="!!castingSpell"
      :spell="castingSpell"
      :character="character"
      @cast="onCastSpell"
      @close="castingFav = null"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PlusIcon, XIcon, SwordIcon, StarIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import { useRoll } from '@/shared/composables/useRoll'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useToast } from '@/shared/composables/useToast'
import { computeAllModifiers } from '@/shared/types/character'
import { computeProficiencyBonus, computeSpellAttackBonus, computeFightingStyleBonuses, addBonusToDamage } from '@/shared/lib/derivedStats'
import type { Character, CombatFavorite, InventoryItem, ResourcePool, SpellReference } from '@/shared/types/character'
import type { FightingStyleBonuses } from '@/shared/lib/derivedStats'
import AddToCombatModal from './AddToCombatModal.vue'
import CastSpellModal from './CastSpellModal.vue'
import FavoriteSpellCard from './FavoriteSpellCard.vue'
import ResourceTracker from './ResourceTracker.vue'

const props = defineProps<{ character: Character; editMode: boolean }>()
const store = useCharactersStore()
const { confirm } = useConfirm()
const { rollD20, rollDamage } = useRoll()
const toast = useToast()

const mods = computed(() => computeAllModifiers(props.character.abilityScores))
const profBonus = computed(() => computeProficiencyBonus(props.character.combat.level))
const spellAbilityMod = computed(() => {
  const ability = props.character.spellcasting?.spellcastingAbility
  if (!ability) return 0
  return mods.value[ability as keyof typeof mods.value] ?? 0
})
const spellAttackBonus = computed(() => computeSpellAttackBonus(spellAbilityMod.value, profBonus.value))

const showModal = ref(false)
const castingFav = ref<CombatFavorite | null>(null)

const castingSpell = computed((): SpellReference | null => {
  const fav = castingFav.value
  if (!fav || (fav.type !== 'cantrip' && fav.type !== 'spell')) return null
  return { index: fav.spellIndex!, name: fav.spellName!, level: fav.spellLevel!, school: fav.spellSchool }
})

const favorites = computed(() => props.character.combatFavorites ?? [])
const weapons   = computed(() => favorites.value.filter(f => f.type === 'weapon'))
const cantrips  = computed(() => favorites.value.filter(f => f.type === 'cantrip'))
const spells    = computed(() => favorites.value.filter(f => f.type === 'spell'))

// ── Fighting style bonuses ────────────────────────────────────────────────────

const slots = computed(() => props.character.equippedSlots)

const weaponFSBonuses = computed<Map<string, FightingStyleBonuses>>(() => {
  const styles = props.character.fightingStyles ?? []
  const abMods = { str: mods.value.str, dex: mods.value.dex }
  const map = new Map<string, FightingStyleBonuses>()
  for (const fav of weapons.value) {
    const item = resolvedWeapon(fav)
    map.set(fav.id, item
      ? computeFightingStyleBonuses(styles, item, slots.value, props.character.inventory, abMods)
      : { attack: 0, damage: 0, rerollLowDice: false })
  }
  return map
})

function fsBonus(favId: string): FightingStyleBonuses {
  return weaponFSBonuses.value.get(favId) ?? { attack: 0, damage: 0, rerollLowDice: false }
}

function isInHandSlot(item: InventoryItem): boolean {
  return slots.value.mainHand === item.id || slots.value.offHand === item.id
}

// ── Spell slots ───────────────────────────────────────────────────────────────

type SlotLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
const SPELL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

function slotKey(n: number) { return `level${n}` as `level${SlotLevel}` }
function maxSlots(n: number) { return props.character.spellcasting?.slotsMax[slotKey(n)] ?? 0 }
function usedSlots(n: number) { return props.character.spellcasting?.slotsUsed[slotKey(n)] ?? 0 }

const isPactCaster = computed(() => props.character.identity.class.index === 'warlock')
const pactUpcastLevel = computed<number | null>(() => {
  if (!isPactCaster.value) return null
  for (let lvl = 9; lvl >= 1; lvl--) {
    if (maxSlots(lvl) > 0) return lvl
  }
  return null
})
const slotLevels = computed(() => isPactCaster.value ? [] : SPELL_LEVELS.filter(lvl => maxSlots(lvl) > 0))

async function toggleSlot(lvl: number, pip: number) {
  const sc = props.character.spellcasting
  if (!sc) return
  const key = slotKey(lvl)
  const max = maxSlots(lvl)
  const remaining = max - usedSlots(lvl)
  const nextRemaining = pip <= remaining ? pip - 1 : pip
  const next = max - nextRemaining
  await store.update(props.character.id, {
    spellcasting: { ...sc, slotsUsed: { ...sc.slotsUsed, [key]: next } },
  })
}

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
  if (!item) return
  if (!isInHandSlot(item)) {
    toast.info(`${fav.weaponName} is not in a hand slot. Assign it in the Equipment tab.`)
    return
  }
  const bonus = fsBonus(fav.id)
  const parts: string[] = [item.attackBonus ?? '+0']
  if (bonus.attack > 0) parts.push(`+${bonus.attack} FS`)
  rollD20(parseBonus(item.attackBonus) + bonus.attack, `${fav.weaponName} Attack`, event, parts.join(' '))
}

function rollWeaponDmg(fav: CombatFavorite) {
  const item = resolvedWeapon(fav)
  if (!item?.damage) return
  if (!isInHandSlot(item)) {
    toast.info(`${fav.weaponName} is not in a hand slot. Assign it in the Equipment tab.`)
    return
  }
  const bonus = fsBonus(fav.id)
  const dmgFormula = addBonusToDamage(item.damage, bonus.damage)
  const parts: string[] = [item.damage]
  if (bonus.damage > 0) parts.push(`+${bonus.damage} FS`)
  if (bonus.rerollLowDice) parts.push('GWF')
  rollDamage(dmgFormula, `${fav.weaponName} Damage`,
    (bonus.damage > 0 || bonus.rerollLowDice) ? parts.join(' ') : undefined,
    bonus.rerollLowDice)
}

async function onResourceChange(pools: ResourcePool[]) {
  const update: Partial<Character> = { resources: pools }
  if (isPactCaster.value && pactUpcastLevel.value) {
    const sc = props.character.spellcasting
    const pool = pools.find(r => r.name === 'Pact Magic Slots')
    if (sc && pool) {
      const key = slotKey(pactUpcastLevel.value)
      update.spellcasting = { ...sc, slotsUsed: { ...sc.slotsUsed, [key]: pool.max - pool.current } }
    }
  }
  await store.update(props.character.id, update)
}

async function onCastSpell(slotLevel: number, isConcentration: boolean) {
  const sc = props.character.spellcasting
  const spellName = castingSpell.value?.name
  const concentrationUpdate = isConcentration && spellName
    ? { combat: { ...props.character.combat, concentrationSpell: spellName } }
    : {}

  if (!sc || slotLevel === 0) {
    if (isConcentration && spellName) await store.update(props.character.id, concentrationUpdate)
    return
  }
  const key = slotKey(slotLevel)
  const current = sc.slotsUsed[key]
  const max = sc.slotsMax[key]
  if (current >= max) return
  const newUsed = current + 1
  const update: Partial<Character> = {
    spellcasting: { ...sc, slotsUsed: { ...sc.slotsUsed, [key]: newUsed } },
    ...concentrationUpdate,
  }
  if (isPactCaster.value) {
    const pool = props.character.resources.find(r => r.name === 'Pact Magic Slots')
    if (pool) {
      update.resources = props.character.resources.map(r =>
        r.id === pool.id ? { ...r, current: Math.max(0, max - newUsed) } : r
      )
    }
  }
  await store.update(props.character.id, update)
}

async function removeFavorite(id: string) {
  const fav = favorites.value.find(f => f.id === id)
  const ok = await confirm({
    title: 'Remove Favorite',
    body: `Remove "${fav?.weaponName ?? fav?.spellName ?? 'this favorite'}" from combat favorites?`,
    confirmLabel: 'Remove',
    variant: 'danger',
  })
  if (!ok) return
  await store.update(props.character.id, {
    combatFavorites: favorites.value.filter(f => f.id !== id),
  })
}
</script>
