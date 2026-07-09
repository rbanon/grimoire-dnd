import type { AbilityName } from '@/shared/types/character'

// Canonical ability order — used to break ties consistently (STR > DEX > … > CHA).
export const ABILITY_ORDER: readonly AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export const ABILITY_LABEL: Record<AbilityName, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}

/**
 * The ability a custom race most boosts — its highest bonus, ties broken by
 * canonical order. Returns null when no ability has a positive bonus.
 * Used for the denormalized `primary_stat` column that the Community page sorts by.
 */
export function racePrimaryStat(bonuses: Partial<Record<AbilityName, number>>): AbilityName | null {
  let best: AbilityName | null = null
  let bestVal = 0
  for (const key of ABILITY_ORDER) {
    const v = bonuses[key] ?? 0
    if (v > bestVal) { bestVal = v; best = key }
  }
  return best
}

/**
 * Normalize a class's free-form primary-ability string (e.g. 'Strength or Dexterity',
 * 'Dexterity · Wisdom') to the first canonical ability key it mentions. Null if none match.
 */
export function classPrimaryStat(primaryAbility: string): AbilityName | null {
  const s = primaryAbility.toLowerCase()
  for (const key of ABILITY_ORDER) {
    if (s.includes(ABILITY_LABEL[key].toLowerCase()) || new RegExp(`\\b${key}\\b`).test(s)) return key
  }
  return null
}
