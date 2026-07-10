import { z } from 'zod'
import { AbilityNameSchema } from '@/shared/types/character'

// A homebrew trait/feature: a name + free-text description. Shared by races and classes.
export const CustomTraitSchema = z.object({
  name: z.string().max(60),
  desc: z.string().max(600),
})
export type CustomTrait = z.infer<typeof CustomTraitSchema>

// Provenance for content copied from the community. A copy is always an INDEPENDENT snapshot
// (own id/owner, no live link) — this just records where it came from, for attribution and to
// detect when the original has a newer version. Absent on originally-authored content.
export const ContentSourceSchema = z.object({
  id: z.string(),                                 // the original's id (may be private/deleted later)
  authorName: z.string().nullable().default(null),
  updatedAt: z.string(),                          // the original's updatedAt at copy time
})
export type ContentSource = z.infer<typeof ContentSourceSchema>

// ─── Custom Race ───────────────────────────────────────────────────────────────
// The full authored definition of a homebrew race. Richer than the RaceSnapshot
// baked onto a character — this is what gets saved to `custom_races.data` and reused.

export const CustomRaceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(60),
  edition: z.enum(['2014', '2024']).default('2014'),
  // Partial map ability -> bonus (only boosted abilities present). z.record with an enum key
  // requires ALL keys in Zod v4, so use partialRecord for the "some abilities" case.
  abilityBonuses: z.partialRecord(AbilityNameSchema, z.number()).default({}),
  size: z.string().default('Medium'),
  speed: z.number().int().min(0).max(120).default(30),
  darkvision: z.number().int().min(0).default(0),
  resistances: z.array(z.string()).default([]),
  skillProficiencies: z.array(z.string()).default([]),
  toolProficiencies: z.array(z.string()).default([]),
  languageChoices: z.number().int().min(0).max(10).default(0),
  traits: z.array(CustomTraitSchema).default([]),
  isPublic: z.boolean().default(false),
  source: ContentSourceSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type CustomRace = z.infer<typeof CustomRaceSchema>

// The editable subset a user authors (id/userId/timestamps are managed by the store).
export type CustomRaceInput = Pick<CustomRace,
  'name' | 'edition' | 'abilityBonuses' | 'size' | 'speed' | 'darkvision'
  | 'resistances' | 'skillProficiencies' | 'toolProficiencies' | 'languageChoices'
  | 'traits' | 'isPublic' | 'source'>

// ─── Custom Class ──────────────────────────────────────────────────────────────
// Authored in Phase 4 (full editor). Defined here so the store/tables can hold it.

export const CustomClassSpellcastingSchema = z.object({
  castingType: z.enum(['known', 'prepared', 'spellbook']),
  ability: AbilityNameSchema,
  // Slot progression drives the spell-slot table: full (Wizard), half (Paladin/Ranger),
  // third (Eldritch Knight), or pact (Warlock). Custom classes are detailed for levels 1–3.
  casterProgression: z.enum(['full', 'half', 'third', 'pact']).default('full'),
  // Cantrips / spells known at levels 1–3 (the supported range for custom classes).
  cantripsKnown: z.array(z.number().int()).default([0, 0, 0]),
  spellsKnown: z.array(z.number().int()).optional(),
  spellList: z.string().optional(), // SRD class index to source the spell list from
})
export type CustomClassSpellcasting = z.infer<typeof CustomClassSpellcastingSchema>

export const CustomClassSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(60),
  edition: z.enum(['2014', '2024']).default('2014'),
  description: z.string().max(1000).optional(),
  hitDie: z.number().int().default(8),
  primaryAbility: z.string().default(''),
  saves: z.array(AbilityNameSchema).default([]),
  armorProficiencies: z.array(z.string()).default([]),
  weaponProficiencies: z.array(z.string()).default([]),
  toolProficiencies: z.array(z.string()).default([]),
  skillChoices: z.number().int().min(0).default(2),
  skillOptions: z.array(z.string()).default([]),
  spellcasting: CustomClassSpellcastingSchema.nullable().default(null),
  // Per-level feature text, keyed by level string ("1".."3").
  featuresByLevel: z.record(z.string(), z.array(CustomTraitSchema)).default({}),
  isPublic: z.boolean().default(false),
  source: ContentSourceSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type CustomClass = z.infer<typeof CustomClassSchema>

export type CustomClassInput = Omit<CustomClass, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

// A community listing row (denormalized columns + author name), for the Community page.
export interface CommunityItem {
  id: string
  userId: string
  kind: 'race' | 'class'
  name: string
  edition: string
  primaryStat: string | null
  authorName: string | null
  updatedAt: string
  data: CustomRace | CustomClass
}
