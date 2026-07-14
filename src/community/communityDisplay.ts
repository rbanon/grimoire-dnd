// Shared display helpers for the Community section pages (classes / subclasses / races).
import type { CommunityItem, CustomRace, CustomClass, CustomSubclass } from '@/shared/types/customContent'

export const ABILITY_ORDER: readonly string[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
export const ABILITY_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}

export function statLabel(s: string | null): string {
  return s ? (ABILITY_LABELS[s] ?? s.toUpperCase()) : '-'
}

// Canonical STR->CHA order so "sort by ability" reads like a character sheet, not A-Z.
export function statRank(s: string | null): number {
  const i = s ? ABILITY_ORDER.indexOf(s) : -1
  return i === -1 ? 99 : i
}

export function statColor(s: string | null): string {
  switch (s) {
    case 'str': return 'rgb(var(--c-blood-bright))'
    case 'dex': return 'rgb(var(--c-verdant-bright))'
    case 'con': return 'rgb(var(--c-gold-mid))'
    case 'int': return 'rgb(var(--c-arcane-base))'
    case 'wis': return 'rgb(var(--c-arcane-pale))'
    case 'cha': return 'rgb(var(--c-gold-bright))'
    default: return 'rgb(var(--c-mist))'
  }
}

export function subtitle(it: CommunityItem): string {
  if (it.kind === 'race') {
    const r = it.data as CustomRace
    const parts = [r.size, `${r.speed} ft.`]
    if (r.darkvision) parts.push(`Darkvision ${r.darkvision} ft.`)
    return parts.join(' · ')
  }
  if (it.kind === 'subclass') {
    const sc = it.data as CustomSubclass
    return sc.parentClassName ? `Subclass of ${sc.parentClassName}` : 'Subclass'
  }
  const c = it.data as CustomClass
  const bits = [`d${c.hitDie}`]
  if (c.spellcasting) bits.push('Spellcaster')
  if (c.primaryAbility) bits.push(c.primaryAbility)
  return bits.join(' · ')
}

// The short right-aligned badge on each card: ability for class/race, parent class for subclass.
export function itemBadge(it: CommunityItem): string {
  if (it.kind === 'subclass') return (it.data as CustomSubclass).parentClassName || 'Subclass'
  return statLabel(it.primaryStat)
}
