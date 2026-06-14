# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/), and the project
adheres to [Semantic Versioning](https://semver.org/).

## [0.4.1] — 2026-06-14

### Fixed
- **`auth.init()` colgado**: wrapeado en `try/finally` — `loading = false` se garantiza aunque
  `loadProfile()` falle por error de red (antes el router guard quedaba bloqueado indefinidamente).
- **Cinco non-null assertions** en `campaigns/detailStore` (`createSession`, `createPartyMember`,
  `createNpc`, `createNote`, `createKeyObject`) reemplazadas por guards explícitos con `throw`.
- **`importFromJson` byte count**: usaba `json.length` (caracteres) en vez de
  `TextEncoder().encode(json).length` (bytes) — el límite de 5 MB era impreciso con Unicode.
- **`importFromJson` contador incorrecto**: devolvía `imported: toAdd.length` aunque algunos
  personajes fueran descartados por el límite de 15 — ahora devuelve `Math.min(toAdd.length, remaining)`.
- **`makeDefaultCharacter` Zod v4 bug**: `savingThrowProficiencies: {}` fallaba silenciosamente
  en producción (`z.record(AbilityNameSchema, z.boolean())` requiere las 6 claves en Zod v4);
  ahora inicializa `{ str: false, dex: false, con: false, int: false, wis: false, cha: false }`.
- **Error boundary**: `app.config.errorHandler` ahora muestra un toast al usuario en errores
  fatales de Vue (antes solo hacía `console.error`).
- **Funciones deprecated eliminadas**: `listFeats` y `getFeat` en `fiveE.client.ts` no tenían
  callers; eliminadas para evitar confusión con las variantes `2014`/`2024`.
- **`gen-types` project ID hardcodeado**: el script ahora usa `$SUPABASE_PROJECT_ID` desde env
  en lugar del ID del proyecto fijo; añadido a `.env.example`.

### Changed
- **PWA**: `registerType` cambiado de `autoUpdate` a `prompt`; se muestra un banner de
  "New version available → Reload" para que el usuario controle cuándo recarga.
- **Cleanup de caché localStorage**: al arrancar, `main.ts` elimina entradas de prefijos viejos
  de la API 5e (`dnd5e:0:*` y anteriores) para evitar acumulación de versiones antiguas.

### Tests
- `src/characters/store.test.ts` — 20 tests cubriendo `create`, `update`, `remove`, `duplicate`,
  `importFromJson` (validación + límite de 15), `loadFromCloud` y `getById`.

## [0.4.0] — 2026-06-05

### Added — Multi-edition 2014 + 2024 SRD content
- Races/Species, classes, feats, and backgrounds can be selected from **either the 2014 or
  2024 SRD**, shown side by side with edition badges and a separator between groups.
- **2024 Species**: Goliath & Orc added; subspecies support (Elven Lineage, Fiendish Legacy,
  Draconic Ancestor, Giant Ancestry, Gnomish Lineage); auto-granted languages (the 2024 API
  exposes none); informational note that species grant no fixed ability bonuses.
- **2024 Backgrounds** (Acolyte, Criminal, Sage, Soldier) with their full ruleset applied:
  - **Ability Score Increase** allocator (+2/+1 or +1/+1/+1) folded into effective scores.
  - **Origin Feat** granted and shown on the sheet (with description lookup).
  - Skill & tool proficiencies, including **tool-choice pickers** (e.g. Soldier → choose a
    Gaming Set).
- **2024 Feats**: 17 feats incl. fighting styles and Epic Boons, with edition-aware
  description and prerequisite rendering.
- `API_REFERENCE.local.md` — full reference of the 2014 vs 2024 API shapes.

### Changed
- Race/class/background pickers use a 3-column grid with a labelled separator between the
  2014 and 2024 groups.
- Step II (Level): removed the XP / Milestone leveling toggle.
- `getBackground2024` normalizes the very different 2024 background shape into the shared
  `ApiBackground` so every consumer works uniformly.
- Save errors are now shown as clear human-readable messages instead of a raw Zod JSON array.

### Fixed
- **2024 trait descriptions** were blank — 2024 traits use `description` (string) vs 2014
  `desc` (string[]); both render now, resiliently (a single trait 404 no longer blanks the list).
- **Species Details** panel was stuck on a spinner for 2024 species (a disabled per-edition
  query reported `isPending`); the loading flag now reflects only the active edition.
- **Equipment 404s** for 2024 items (e.g. 2024 `arrows` vs 2014 `arrow`): items, categories,
  and the picker now fetch from the edition that owns each ref's URL.
- **Dragonborn** damage resistance now maps the 2024 `draconic-ancestor-*` subspecies (was
  keyed only for 2014).
- **Tiefling** resistance follows the 2024 Fiendish Legacy (Abyssal→poison, Chthonic→necrotic,
  Infernal→fire); 2014 stays fire.
- Various 2024 data-shape guards (missing `feature`, `starting_proficiencies`, optional feat
  `prerequisites`) and a `sizeCategory` fallback that previously blocked saving.

## [0.3.0]

- Class mechanics display (Sneak Attack, Rage, Bardic/Martial Arts dice), Defenses & Senses
  and Resource Tracker on the sheet; saving UX overlay; AC badge fixes.
- D&D 5e rules audit fixes: Wizard spellbook caster, Paladin prepared caster, spell
  replacement on level-up, race resistances/senses, ritual casting, exhaustion on long rest,
  Warlock short-rest slots, Unarmored Defense, retroactive CON HP.
