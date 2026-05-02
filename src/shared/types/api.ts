// 5e-bits API DTOs — these mirror the external API shape
// Do NOT use these directly in the UI; normalize into domain models first.

export interface ApiReference {
  index: string
  name: string
  url: string
}

export interface ApiReferenceList {
  count: number
  results: ApiReference[]
}

// ── Classes ──────────────────────────────────────────────────────────────────

export interface ApiClass {
  index: string
  name: string
  hit_die: number
  proficiency_choices: ApiProficiencyChoice[]
  proficiencies: ApiReference[]
  saving_throws: ApiReference[]
  starting_equipment: ApiStartingEquipment[]
  starting_equipment_options: ApiEquipmentOption[]
  class_levels: string
  multi_classing: unknown
  subclasses: ApiReference[]
  spellcasting?: ApiSpellcasting
  url: string
}

export interface ApiProficiencyChoice {
  desc: string
  choose: number
  type: string
  from: { option_set_type: string; options: unknown[] }
}

export interface ApiSpellcasting {
  level: number
  spellcasting_ability: ApiReference
  info: { name: string; desc: string[] }[]
}

export interface ApiStartingEquipment {
  equipment: ApiReference
  quantity: number
}

export interface ApiEquipmentOption {
  desc: string
  choose: number
  type: string
  from: unknown
}

// ── Races ─────────────────────────────────────────────────────────────────────

export interface ApiRace {
  index: string
  name: string
  speed: number
  ability_bonuses: { ability_score: ApiReference; bonus: number }[]
  alignment: string
  age: string
  size: string
  size_description: string
  starting_proficiencies: ApiReference[]
  languages: ApiReference[]
  language_desc: string
  traits: ApiReference[]
  subraces: ApiReference[]
  url: string
}

export interface ApiSubrace {
  index: string
  name: string
  race: ApiReference
  desc: string
  ability_bonuses: { ability_score: ApiReference; bonus: number }[]
  starting_proficiencies: ApiReference[]
  languages: ApiReference[]
  racial_traits: ApiReference[]
  url: string
}

// ── Backgrounds ───────────────────────────────────────────────────────────────

export interface ApiBackground {
  index: string
  name: string
  starting_proficiencies: ApiReference[]
  language_options: ApiProficiencyChoice
  starting_equipment: ApiStartingEquipment[]
  starting_equipment_options: ApiEquipmentOption[]
  feature: { name: string; desc: string[] }
  personality_traits: unknown
  ideals: unknown
  bonds: unknown
  flaws: unknown
  url: string
}

// ── Spells ────────────────────────────────────────────────────────────────────

export interface ApiSpell {
  index: string
  name: string
  desc: string[]
  higher_level: string[]
  range: string
  components: string[]
  material: string
  area_of_effect?: { type: string; size: number }
  ritual: boolean
  duration: string
  concentration: boolean
  casting_time: string
  level: number
  attack_type?: string
  damage?: { damage_type?: ApiReference; damage_at_slot_level?: Record<string, string> }
  school: ApiReference
  classes: ApiReference[]
  subclasses: ApiReference[]
  url: string
}

// ── Equipment ─────────────────────────────────────────────────────────────────

export interface ApiEquipment {
  index: string
  name: string
  equipment_category: ApiReference
  gear_category?: ApiReference
  weapon_category?: string
  weapon_range?: string
  category_range?: string
  cost: { quantity: number; unit: string }
  weight?: number
  properties?: ApiReference[]
  damage?: { damage_dice: string; damage_type: ApiReference }
  two_handed_damage?: { damage_dice: string; damage_type: ApiReference }
  range?: { normal: number; long?: number }
  throw_range?: { normal: number; long: number }
  armor_category?: string
  armor_class?: { base: number; dex_bonus: boolean; max_bonus?: number }
  str_minimum?: number
  stealth_disadvantage?: boolean
  tool_category?: string
  speed?: { quantity: number; unit: string }
  capacity?: string
  special?: string[]
  contents?: { item: ApiReference; quantity: number }[]
  url: string
}

export interface ApiMagicItem {
  index: string
  name: string
  equipment_category: ApiReference
  rarity: { name: string }
  variants: ApiReference[]
  variant: boolean
  desc: string[]
  url: string
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface SpellQueryParams {
  name?: string
  level?: number | number[]
  school?: string
  class?: string
}

// NOTE: Equipment and magic items do NOT support server-side query params.
// All filtering for these resources must be done client-side after fetching
// the full list.

// ── Skills ────────────────────────────────────────────────────────────────────

export interface ApiSkill {
  index: string
  name: string
  desc: string[]
  ability_score: ApiReference
  url: string
}
