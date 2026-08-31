// Single source of truth for how a spell school is presented. Before this there were four
// copies across the spell browser and the three sheet cards, on two different palettes, so
// the same spell could be gold in one screen and amber in another.
//
// Colors are theme tokens (--c-school-*, defined for both themes in assets/grimoire.css),
// not literals, so a school reads correctly on parchment and on dark. The letter is the
// standard D&D abbreviation set, where Evocation is V so it does not collide with
// Enchantment: color alone is never enough, for colorblind readers or for hues that sit
// close together on a small badge.

const SCHOOL_LETTERS: Record<string, string> = {
  abjuration:    'A',
  conjuration:   'C',
  divination:    'D',
  enchantment:   'E',
  evocation:     'V',
  illusion:      'I',
  necromancy:    'N',
  transmutation: 'T',
}

/** The eight SRD schools, display-cased, in the order filters should list them. */
export const SCHOOL_NAMES = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
] as const

function schoolKey(school?: string | null): string {
  return (school ?? '').trim().toLowerCase()
}

/** Whether a name matches one of the eight known schools. */
export function isKnownSchool(school?: string | null): boolean {
  return schoolKey(school) in SCHOOL_LETTERS
}

/**
 * The school's color as a CSS value, optionally at partial alpha for borders and fills.
 * Falls back to muted text for anything unrecognized, homebrew included.
 */
export function schoolColor(school?: string | null, alpha = 1): string {
  const key = schoolKey(school)
  const token = key in SCHOOL_LETTERS ? `--c-school-${key}` : '--c-mist'
  return alpha === 1 ? `rgb(var(${token}))` : `rgb(var(${token}) / ${alpha})`
}

/** Single-letter abbreviation, the redundant cue that carries when color does not. */
export function schoolLetter(school?: string | null): string {
  return SCHOOL_LETTERS[schoolKey(school)] ?? '?'
}

/** Text + border colors for the school badge used on the spell cards. */
export function schoolBadgeStyle(school?: string | null): Record<string, string> {
  return { color: schoolColor(school), borderColor: schoolColor(school, 0.4) }
}

/** Filled square holding the school letter, used in the browser's grid and table. */
export function schoolChipStyle(school?: string | null): Record<string, string> {
  return {
    color: schoolColor(school),
    background: schoolColor(school, 0.14),
    borderColor: schoolColor(school, 0.35),
  }
}
