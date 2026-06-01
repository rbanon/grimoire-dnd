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

export interface FightingStyleBonuses { attack: number; damage: number }

/**
 * Computes attack/damage bonuses for a weapon given the current equipment slots.
 *
 * Archery  — +2 attack when the weapon is in mainHand or offHand and is ranged.
 * Dueling  — +2 damage when the weapon is in mainHand, is one-handed melee, and
 *             offHand is empty or holds a shield (not another weapon).
 */
export function computeFightingStyleBonuses(
  fightingStyles: string[],
  weapon: InventoryItem,
  slots: EquippedSlots,
  inventory: InventoryItem[],
): FightingStyleBonuses {
  if (weapon.itemType !== 'weapon') return { attack: 0, damage: 0 }
  let attack = 0, damage = 0
  const inMainHand = slots.mainHand === weapon.id
  const inOffHand  = slots.offHand  === weapon.id
  const inAnySlot  = inMainHand || inOffHand

  for (const style of fightingStyles) {
    if (style === 'archery' && inAnySlot && weapon.weaponCategory === 'ranged') {
      attack += 2
    }
    if (style === 'dueling' && inMainHand) {
      const isOneHandedMelee = weapon.weaponCategory === 'melee' && weapon.handedness !== 'two-handed'
      const offHandItem = slots.offHand ? inventory.find(i => i.id === slots.offHand) : null
      const offHandIsShieldOrEmpty = !offHandItem || offHandItem.armorType === 'shield'
      if (isOneHandedMelee && offHandIsShieldOrEmpty) damage += 2
    }
  }

  return { attack, damage }
}

/**
 * Returns the displayed AC: base AC + 1 if the character has the Defense fighting
 * style and has non-shield armor in the armor slot.
 */
export function computeEffectiveAC(
  baseAC: number,
  fightingStyles: string[],
  slots: EquippedSlots,
  inventory: InventoryItem[],
): number {
  if (!fightingStyles.includes('defense')) return baseAC
  const armorItem = slots.armor ? inventory.find(i => i.id === slots.armor) : null
  if (!armorItem || armorItem.itemType !== 'armor' || armorItem.armorType === 'shield') return baseAC
  return baseAC + 1
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
