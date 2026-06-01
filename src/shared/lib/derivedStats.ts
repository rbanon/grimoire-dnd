import type { AbilityScores, EquippedSlots, InventoryItem } from '../types/character'
import { computeModifier } from '../types/character'

export function computeProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1
}

export function computePassiveScore(skill: number, mod: number, prof: boolean, profBonus: number): number {
  return 10 + mod + (prof ? profBonus : 0) + skill
}

export function computePassivePerception(
  wisScore: number,
  perceptionProficient: boolean,
  profBonus: number,
): number {
  return 10 + computeModifier(wisScore) + (perceptionProficient ? profBonus : 0)
}

export function computeSkillModifier(
  scores: AbilityScores,
  abilityKey: keyof AbilityScores,
  profLevel: 'none' | 'proficient' | 'expertise',
  profBonus: number,
): number {
  const base = computeModifier(scores[abilityKey])
  if (profLevel === 'proficient') return base + profBonus
  if (profLevel === 'expertise') return base + profBonus * 2
  return base
}

// ── Fighting Style Bonuses ────────────────────────────────────────────────────

export interface FightingStyleBonuses {
  attack: number
  damage: number
  rerollLowDice: boolean  // Great Weapon Fighting: reroll 1s and 2s on damage dice
}

const NO_BONUS: FightingStyleBonuses = { attack: 0, damage: 0, rerollLowDice: false }

/** True if the weapon is likely ranged: explicit category OR a range string longer than 5 ft. */
function isLikelyRanged(weapon: InventoryItem): boolean {
  if (weapon.weaponCategory === 'ranged') return true
  if (weapon.weaponCategory === 'melee')  return false
  // Infer from range field for manually-added weapons (e.g. "60/120 ft." → ranged).
  // Thrown weapons (javelin, handaxe) have a range but are melee — exclude them.
  if (weapon.range) {
    if (/thrown/i.test(weapon.range)) return false
    const m = weapon.range.match(/^(\d+)/)
    return m ? parseInt(m[1]) > 5 : false
  }
  return false
}

/**
 * Computes all fighting-style bonuses for a weapon given the current equipment slots.
 *
 * Archery           — +2 attack, ranged weapon in any hand slot
 * Dueling           — +2 damage, one-handed melee in main hand, off hand empty or shield
 * Great Weapon Fght — reroll 1s and 2s on damage dice, two-handed weapon in main hand
 * Two-Weapon Fght   — add ability modifier to off-hand damage (pass abilityMods)
 * Defense           — handled separately in computeEffectiveAC
 * Protection        — reaction-based, not applicable to rolls
 */
export function computeFightingStyleBonuses(
  fightingStyles: string[],
  weapon: InventoryItem,
  slots: EquippedSlots,
  inventory: InventoryItem[],
  abilityMods?: { str: number; dex: number },
): FightingStyleBonuses {
  if (weapon.itemType !== 'weapon') return { ...NO_BONUS }
  let attack = 0, damage = 0, rerollLowDice = false
  const inMainHand = slots.mainHand === weapon.id
  const inOffHand  = slots.offHand  === weapon.id
  const inAnySlot  = inMainHand || inOffHand
  const ranged     = isLikelyRanged(weapon)
  // weaponCategory undefined → treat as melee for melee-specific styles
  const isMelee    = !ranged
  const isTwoHanded = weapon.handedness === 'two-handed'

  for (const style of fightingStyles) {

    // Archery: +2 attack with ranged weapons (infer from range field if no explicit category)
    if (style === 'archery' && inAnySlot && ranged) {
      attack += 2
    }

    // Dueling: +2 damage, one-handed melee in main hand, off hand empty or shield only
    if (style === 'dueling' && inMainHand && isMelee && !isTwoHanded) {
      const offHandItem = slots.offHand ? inventory.find(i => i.id === slots.offHand) : null
      const offHandIsShieldOrEmpty = !offHandItem || offHandItem.armorType === 'shield'
      if (offHandIsShieldOrEmpty) damage += 2
    }

    // Great Weapon Fighting: reroll 1s and 2s on damage, two-handed weapon in main hand
    if (style === 'great-weapon' && inMainHand && isTwoHanded) {
      rerollLowDice = true
    }

    // Two-Weapon Fighting: add ability modifier to off-hand damage (melee only).
    // 5e adds the modifier regardless of sign or zero, so no `!== 0` guard.
    if (style === 'two-weapon' && inOffHand && isMelee && !isTwoHanded && abilityMods) {
      damage += Math.max(abilityMods.str, abilityMods.dex)
    }
  }

  return { attack, damage, rerollLowDice }
}

/** Infers armor category from base AC when armorType is missing (D&D 5e SRD ranges). */
function inferArmorType(baseAC: number): 'light' | 'medium' | 'heavy' {
  if (baseAC >= 16) return 'heavy'   // chain mail 16, splint 17, plate 18
  if (baseAC >= 13) return 'medium'  // chain shirt 13, scale 14, half plate 15
  return 'light'                     // leather 11, studded 12
}

/**
 * Computes the displayed AC from the current equipment slots:
 *   - Armor slot present  → armor base AC + DEX modifier (capped per armor type)
 *   - Off Hand = shield   → +2
 *   - Defense style + armor worn → +1
 *   - No armor slotted    → falls back to baseAC (manual or unarmored value)
 */
export function computeEffectiveAC(
  baseAC: number,
  fightingStyles: string[],
  slots: EquippedSlots,
  inventory: InventoryItem[],
  dexMod: number,
): number {
  const armorItem = slots.armor ? inventory.find(i => i.id === slots.armor) : null

  let ac: number
  if (armorItem?.armorClass != null) {
    // Fall back to inferring the type from the base AC when armorType is missing
    // (old items / manual entries) so heavy armor isn't wrongly given full DEX.
    const type = armorItem.armorType ?? inferArmorType(armorItem.armorClass)
    if (type === 'heavy')        ac = armorItem.armorClass
    else if (type === 'medium')  ac = armorItem.armorClass + Math.min(dexMod, 2)
    else                         ac = armorItem.armorClass + dexMod   // light
  } else {
    ac = baseAC  // unarmored or no armor slotted
  }

  // Shield in off-hand
  const offHandItem = slots.offHand ? inventory.find(i => i.id === slots.offHand) : null
  if (offHandItem?.armorType === 'shield') ac += 2

  // Defense fighting style
  if (fightingStyles.includes('defense') && armorItem) ac += 1

  return ac
}

/** Adds a flat numeric bonus to a damage dice expression (e.g. "1d8+3" + 2 → "1d8+5"). */
export function addBonusToDamage(damage: string, bonus: number): string {
  if (bonus === 0) return damage
  const match = damage.match(/^(.+?)([+-]\d+)$/)
  if (match) {
    const total = parseInt(match[2]) + bonus
    return total === 0 ? match[1] : `${match[1]}${total >= 0 ? '+' : ''}${total}`
  }
  return bonus > 0 ? `${damage}+${bonus}` : `${damage}${bonus}`
}

// Spellcasting
export function computeSpellSaveDC(spellAbilityMod: number, profBonus: number): number {
  return 8 + spellAbilityMod + profBonus
}

export function computeSpellAttackBonus(spellAbilityMod: number, profBonus: number): number {
  return spellAbilityMod + profBonus
}
