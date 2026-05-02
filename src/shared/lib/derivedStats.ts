import type { AbilityScores } from '../types/character'
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

// Spellcasting
export function computeSpellSaveDC(spellAbilityMod: number, profBonus: number): number {
  return 8 + spellAbilityMod + profBonus
}

export function computeSpellAttackBonus(spellAbilityMod: number, profBonus: number): number {
  return spellAbilityMod + profBonus
}
