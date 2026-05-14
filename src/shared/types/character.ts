import { z } from 'zod'

// ─── Primitives ───────────────────────────────────────────────────────────────

export const AlignmentSchema = z.enum([
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
  'Unaligned',
])
export type Alignment = z.infer<typeof AlignmentSchema>

export const AbilityNameSchema = z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha'])
export type AbilityName = z.infer<typeof AbilityNameSchema>

export const DiceSchema = z.string().regex(/^\d+d\d+([+-]\d+)?$/) // e.g. "2d6+3"

// ─── Ability Scores ───────────────────────────────────────────────────────────

export const AbilityScoresSchema = z.object({
  str: z.number().int().min(1).max(30),
  dex: z.number().int().min(1).max(30),
  con: z.number().int().min(1).max(30),
  int: z.number().int().min(1).max(30),
  wis: z.number().int().min(1).max(30),
  cha: z.number().int().min(1).max(30),
})
export type AbilityScores = z.infer<typeof AbilityScoresSchema>

// Derived — computed, not stored
export interface AbilityModifiers {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

export function computeModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function computeAllModifiers(scores: AbilityScores): AbilityModifiers {
  return {
    str: computeModifier(scores.str),
    dex: computeModifier(scores.dex),
    con: computeModifier(scores.con),
    int: computeModifier(scores.int),
    wis: computeModifier(scores.wis),
    cha: computeModifier(scores.cha),
  }
}

// ─── Snapshots of SRD data embedded in character ─────────────────────────────

export const ClassSnapshotSchema = z.object({
  index: z.string(),
  name: z.string(),
  hitDie: z.number().int(),
  spellcastingAbility: z.string().nullable(),
})
export type ClassSnapshot = z.infer<typeof ClassSnapshotSchema>

export const SubclassSnapshotSchema = z.object({
  index: z.string(),
  name: z.string(),
  subclassFlavor: z.string().optional(),
})
export type SubclassSnapshot = z.infer<typeof SubclassSnapshotSchema>

export const RaceSnapshotSchema = z.object({
  index: z.string(),
  name: z.string(),
  speed: z.number().int(),
  sizeCategory: z.string(),
  abilityBonuses: z.record(AbilityNameSchema, z.number()).optional(),
})
export type RaceSnapshot = z.infer<typeof RaceSnapshotSchema>

export const SubraceSnapshotSchema = z.object({
  index: z.string(),
  name: z.string(),
  abilityBonuses: z.record(AbilityNameSchema, z.number()).optional(),
})
export type SubraceSnapshot = z.infer<typeof SubraceSnapshotSchema>

export const BackgroundSnapshotSchema = z.object({
  index: z.string(),
  name: z.string(),
  skillProficiencies: z.array(z.string()).optional(),
})
export type BackgroundSnapshot = z.infer<typeof BackgroundSnapshotSchema>

// ─── Portrait ─────────────────────────────────────────────────────────────────

export const PortraitMetadataSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('url'), url: z.string().url() }),
  z.object({ type: z.literal('local-preview') }), // in-memory only, not serialized
])
export type PortraitMetadata = z.infer<typeof PortraitMetadataSchema>

// ─── Identity ─────────────────────────────────────────────────────────────────

export const CharacterIdentitySchema = z.object({
  name: z.string().min(1).max(120),
  race: RaceSnapshotSchema,
  subrace: SubraceSnapshotSchema.nullable(),
  class: ClassSnapshotSchema,
  subclass: SubclassSnapshotSchema.nullable(),
  background: BackgroundSnapshotSchema,
  alignment: AlignmentSchema,
  age: z.string().max(40).optional(),
  gender: z.string().max(80).optional(),
  height: z.string().max(40).optional(),
  weight: z.string().max(40).optional(),
  eyes: z.string().max(40).optional(),
  skin: z.string().max(40).optional(),
  hair: z.string().max(40).optional(),
  appearanceNotes: z.string().max(2000).optional(),
})
export type CharacterIdentity = z.infer<typeof CharacterIdentitySchema>

// ─── Personality ──────────────────────────────────────────────────────────────

export const CharacterPersonalitySchema = z.object({
  personalityTraits: z.string().max(1000).optional(),
  ideals: z.string().max(500).optional(),
  bonds: z.string().max(500).optional(),
  flaws: z.string().max(500).optional(),
  biography: z.string().max(5000).optional(),
})
export type CharacterPersonality = z.infer<typeof CharacterPersonalitySchema>

// ─── Skills & Proficiencies ───────────────────────────────────────────────────

export const ProficiencyLevelSchema = z.enum(['none', 'proficient', 'expertise'])
export type ProficiencyLevel = z.infer<typeof ProficiencyLevelSchema>

export const SkillProficienciesSchema = z.record(z.string(), ProficiencyLevelSchema)
export type SkillProficiencies = z.infer<typeof SkillProficienciesSchema>

export const SavingThrowProficienciesSchema = z.record(AbilityNameSchema, z.boolean())
export type SavingThrowProficiencies = z.infer<typeof SavingThrowProficienciesSchema>

// ─── Combat ───────────────────────────────────────────────────────────────────

export const DeathSavesSchema = z.object({
  successes: z.number().int().min(0).max(3),
  failures: z.number().int().min(0).max(3),
})
export type DeathSaves = z.infer<typeof DeathSavesSchema>

export const CombatStatsSchema = z.object({
  level: z.number().int().min(1).max(20),
  experiencePoints: z.number().int().min(0).optional(),
  useMilestones: z.boolean().default(false),
  maxHp: z.number().int().min(1),
  currentHp: z.number().int(),
  tempHp: z.number().int().min(0).default(0),
  armorClass: z.number().int().min(0),
  initiative: z.number().int().optional(), // manual override; else computed from dex mod
  speed: z.number().int().min(0).optional(), // manual override; else from race
  inspiration: z.boolean().default(false),
  hitDiceRemaining: z.number().int().min(0),
  deathSaves: DeathSavesSchema.optional(),
  conditions: z.array(z.string()).default([]),
  exhaustion: z.number().int().min(0).max(6).default(0),
  concentrationSpell: z.string().nullable().default(null),
})
export type CombatStats = z.infer<typeof CombatStatsSchema>

// ─── Inventory ────────────────────────────────────────────────────────────────

export const CurrencySchema = z.object({
  cp: z.number().int().min(0).default(0),
  sp: z.number().int().min(0).default(0),
  ep: z.number().int().min(0).default(0),
  gp: z.number().int().min(0).default(0),
  pp: z.number().int().min(0).default(0),
})
export type Currency = z.infer<typeof CurrencySchema>

export const ItemSnapshotSchema = z.object({
  index: z.string(),
  name: z.string(),
  category: z.string().optional(),
  weight: z.number().optional(),
  cost: z
    .object({
      quantity: z.number(),
      unit: z.string(),
    })
    .optional(),
})
export type ItemSnapshot = z.infer<typeof ItemSnapshotSchema>

export const InventoryItemSchema = z.object({
  id: z.string().uuid(),
  item: ItemSnapshotSchema,
  quantity: z.number().int().min(0).default(1),
  equipped: z.boolean().default(false),
  notes: z.string().max(500).optional(),
})
export type InventoryItem = z.infer<typeof InventoryItemSchema>

// ─── Attacks ──────────────────────────────────────────────────────────────────

export const AttackSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  attackBonus: z.string().optional(), // e.g. "+5", "prof+str"
  damage: z.string().optional(), // e.g. "1d8+3"
  damageType: z.string().optional(),
  range: z.string().optional(),
  notes: z.string().max(500).optional(),
})
export type Attack = z.infer<typeof AttackSchema>

// ─── Spells ───────────────────────────────────────────────────────────────────

export const SpellReferenceSchema = z.object({
  index: z.string(),
  name: z.string(),
  level: z.number().int().min(0).max(9),
  school: z.string().optional(),
})
export type SpellReference = z.infer<typeof SpellReferenceSchema>

export const FavoriteSpellEntrySchema = z.object({
  index: z.string(),
  name: z.string(),
  level: z.number().int().min(0).max(9),
  school: z.string().optional(),
  addedAt: z.string().datetime(),
})
export type FavoriteSpellEntry = z.infer<typeof FavoriteSpellEntrySchema>

export const SpellSlotsByLevelSchema = z.object({
  level1: z.number().int().min(0).default(0),
  level2: z.number().int().min(0).default(0),
  level3: z.number().int().min(0).default(0),
  level4: z.number().int().min(0).default(0),
  level5: z.number().int().min(0).default(0),
  level6: z.number().int().min(0).default(0),
  level7: z.number().int().min(0).default(0),
  level8: z.number().int().min(0).default(0),
  level9: z.number().int().min(0).default(0),
})
export type SpellSlotsByLevel = z.infer<typeof SpellSlotsByLevelSchema>

export const SpellcastingStateSchema = z.object({
  spellcastingAbility: AbilityNameSchema,
  spellSaveDC: z.number().int().optional(), // manual override; else computed
  spellAttackBonus: z.number().int().optional(), // manual override; else computed
  slotsMax: SpellSlotsByLevelSchema,
  slotsUsed: SpellSlotsByLevelSchema,
  spellsKnown: z.array(SpellReferenceSchema),
  spellsPrepared: z.array(SpellReferenceSchema),
  cantripsKnown: z.array(SpellReferenceSchema),
  ritualCasting: z.boolean().default(false),
})
export type SpellcastingState = z.infer<typeof SpellcastingStateSchema>

// ─── Features & Traits ────────────────────────────────────────────────────────

export const TraitFeatureSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  source: z.string().optional(), // "Race", "Class", "Background", "Custom"
  description: z.string(),
})
export type TraitFeature = z.infer<typeof TraitFeatureSchema>

// ─── Full Character ───────────────────────────────────────────────────────────

export const CURRENT_SCHEMA_VERSION = '1.0' as const

export const CharacterSchema = z.object({
  // Meta
  id: z.string().uuid(),
  schemaVersion: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Content
  portrait: PortraitMetadataSchema.default({ type: 'none' }),
  identity: CharacterIdentitySchema,
  personality: CharacterPersonalitySchema,
  abilityScores: AbilityScoresSchema,
  combat: CombatStatsSchema,
  skillProficiencies: SkillProficienciesSchema,
  savingThrowProficiencies: SavingThrowProficienciesSchema,
  languages: z.array(z.string()),
  otherProficiencies: z.array(z.string()),
  resistances: z.array(z.string()),
  immunities: z.array(z.string()),
  vulnerabilities: z.array(z.string()),
  senses: z.array(z.string()),
  attacks: z.array(AttackSchema),
  inventory: z.array(InventoryItemSchema),
  currency: CurrencySchema,
  spellcasting: SpellcastingStateSchema.nullable(),
  favoriteSpells: z.array(FavoriteSpellEntrySchema),
  features: z.array(TraitFeatureSchema),
  notes: z.string().max(10000).optional(),

  // Overrides — user-specified values that override computed defaults
  overrides: z
    .object({
      initiative: z.number().int().optional(),
      speed: z.number().int().optional(),
      proficiencyBonus: z.number().int().optional(),
      passivePerception: z.number().int().optional(),
    })
    .default({}),
})
export type Character = z.infer<typeof CharacterSchema>

// ─── Summary (for list views) ─────────────────────────────────────────────────

export interface CharacterSummary {
  id: string
  name: string
  race: string
  className: string
  level: number
  portraitUrl: string | null
  updatedAt: string
}

export function toCharacterSummary(c: Character): CharacterSummary {
  return {
    id: c.id,
    name: c.identity.name,
    race: c.identity.subrace?.name ?? c.identity.race.name,
    className: c.identity.subclass?.name ?? c.identity.class.name,
    level: c.combat.level,
    portraitUrl: c.portrait.type === 'url' ? c.portrait.url : null,
    updatedAt: c.updatedAt,
  }
}

// ─── Import/Export Envelopes ──────────────────────────────────────────────────

export const CharacterExportEnvelopeSchema = z.object({
  $schema: z.literal('dnd-creator:character:v1'),
  exportedAt: z.string().datetime(),
  data: CharacterSchema,
})
export type CharacterExportEnvelope = z.infer<typeof CharacterExportEnvelopeSchema>

export const CharacterCollectionExportEnvelopeSchema = z.object({
  $schema: z.literal('dnd-creator:characters:v1'),
  exportedAt: z.string().datetime(),
  count: z.number().int(),
  data: z.array(CharacterSchema),
})
export type CharacterCollectionExportEnvelope = z.infer<
  typeof CharacterCollectionExportEnvelopeSchema
>

// ─── Local Draft Metadata ─────────────────────────────────────────────────────

export const LocalDraftMetadataSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  step: z.number().int().min(1).max(7),
  savedAt: z.string().datetime(),
})
export type LocalDraftMetadata = z.infer<typeof LocalDraftMetadataSchema>

// ─── Favorite spell behavior documentation ───────────────────────────────────
//
// Favorite spells are embedded in the character JSON (not a separate table).
// Rationale: characters are the unit of export/import, and favorites are per-character.
// Embedding keeps export/import atomic and avoids join complexity for a MVP.
//
// If a favorited spell is removed from the active spell list (e.g. no longer prepared):
//   MVP: favorites are retained as-is — the star icon is still shown in the favorites
//        section even if the spell is not in the known/prepared list.
//   Future: add a visual "orphaned" indicator and a "clean up favorites" action.
