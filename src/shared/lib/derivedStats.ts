import type { AbilityScores, InventoryItem } from '../types/character'
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
 * Computes the attack and damage bonuses from fighting styles for a given weapon.
 * `equippedWeapons` = all weapons currently marked equipped in inventory (used for
 * Dueling's "no other weapons" condition). Uses favorites as the active-weapon proxy.
 *
 * Implemented styles:
 *   Archery  — +2 attack with ranged weapons
 *   Dueling  — +2 damage with a one-handed melee weapon and no other equipped weapon
 */
export function computeFightingStyleBonuses(
  fightingStyles: string[],
  weapon: InventoryItem,
  equippedWeapons: InventoryItem[],
): FightingStyleBonuses {
  if (weapon.itemType !== 'weapon') return { attack: 0, damage: 0 }
  let attack = 0, damage = 0

  for (const style of fightingStyles) {
    if (style === 'archery' && weapon.weaponCategory === 'ranged') {
      attack += 2
    }
    if (style === 'dueling') {
      const isOneHandedMelee = weapon.weaponCategory === 'melee' && weapon.handedness !== 'two-handed'
      const otherEquipped = equippedWeapons.some(w => w.id !== weapon.id)
      if (isOneHandedMelee && !otherEquipped) damage += 2
    }
  }

  return { attack, damage }
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
