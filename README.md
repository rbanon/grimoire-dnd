# Grimoire, D&D 5e Character Manager

A fully-featured **Single Page Application** for creating and managing Dungeons & Dragons 5e characters. Build your hero through a step-by-step wizard, track everything on a live character sheet, and manage spells, equipment, and combat in one place.

[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

---

## Features

### Multi-edition content, 2014 **and** 2024 SRD

Races, classes, feats, and backgrounds can be picked from **either edition**, shown side
by side with edition badges. The two SRD editions have very different data shapes, all
handled transparently:

- **Species (2024)** alongside Races (2014), 2024 adds Goliath & Orc, uses subspecies
  (Elven Lineage, Fiendish Legacy, Draconic Ancestor…), and grants no fixed ability bonuses
- **Backgrounds (2024)** apply their full ruleset: the **+2/+1 (or +1/+1/+1) ability score
  increase**, the **Origin Feat**, skill & tool proficiencies (including choices like the
  Soldier's Gaming Set), and equipment
- **Feats (2024)**, 17 feats incl. fighting styles and Epic Boons (vs. Grappler only in 2014)
- Edition-correct trait, equipment, and proficiency lookups (e.g. 2024 `description` vs 2014
  `desc`, 2024 `arrows` vs 2014 `arrow`); spells & per-level class features use 2014 data
  (2024 doesn't expose them)

### Character Builder
11-step wizard covering the full D&D 5e character creation process:

- **Class & Subclass**, all 12 SRD classes (2014 + 2024); subclass selection at the correct level per class
- **Level & Features**, set level 1-20; class features displayed per level with choice UI (fighting styles, pact boons, eldritch invocations)
- **Race / Species & Subrace**, speed, ASI bonuses, traits, languages, and racial proficiencies fetched live from the 5e API; race resistances and Darkvision auto-applied (2024 species distribute ability bonuses via the background)
- **Background**, skill & tool proficiencies and starting languages; 2024 backgrounds add ability score increase allocation, an Origin Feat, and tool-choice pickers
- **Ability Scores**, point buy, standard array (drag & drop), manual entry, or 4d6-drop-lowest roll
- **Feats & ASI**, feat picker with prerequisite filtering at every ASI level
- **Skills & Proficiencies**, class, background, and racial origins clearly distinguished
- **Spells**, three casting flows handled correctly:
  - *Known casters* (Bard, Ranger, Sorcerer, Warlock), level-by-level accordion with optional spell replacement per level
  - *Prepared casters* (Cleric, Druid, Paladin), open pool + daily preparation (ability mod + level / ½ level for Paladin)
  - *Spellbook caster* (Wizard), starting grimoire (Int mod + level spells) with daily preparation
  - *Warlock*, Pact Magic slots, Eldritch Invocations, Pact of the Tome bonus cantrips
- **Equipment**, starting equipment from the 5e API with full option group UI; packs (Explorer's Pack, Priest's Pack, etc.) automatically expanded into their individual item contents; or start with rolled gold
- **Personal Details**, appearance, personality traits, ideals, bonds, flaws, biography, portrait upload
- **Review & Save**, full summary before committing

### Character Sheet

- **Tactical strip**, HP (interactive ±, THP, death saves at 0), AC, Initiative, Speed, Passive Perception, Proficiency Bonus, Spell Save DC, Spell Attack Bonus
- **Dice rolling**, every stat, skill, save, attack, and damage roll supports Normal / Advantage / Disadvantage with animated dice
- **Combat tab**, hit dice pips, Short Rest (hit dice recovery) and Long Rest dialogs; Unarmored Defense for Monk and Barbarian
- **Spells tab**, manage known, prepared, and spellbook spells; daily re-preparation for Cleric, Druid, Paladin, and Wizard via **Prepare Spells** modal (Wizard sees only their spellbook, not the full class list); slot tracking with cast dialog
- **Favorites tab**, weapon attacks and favourite spells with one-click rolls
- **Equipment tab**, inventory grouped by type (Weapons, Armor, Gear); Main Hand / Off Hand / Armor slots; fighting style bonuses displayed inline; inline weapon rolls
- **Features tab**, class and racial features; feats with description lookup
- **Bio & Notes**, free-form text sections
- **Conditions bar**, active conditions as dismissible chips
- **Concentration tracker**, visual indicator when a concentration spell is active
- **Level Up modal**, subclass selection, ASI / feat picker, optional spell replacement (known casters), new cantrip/spell picks, spell slot preview
- **Print / PDF export**, print-ready sheet via browser print dialog
- **Inline editing**, lock/unlock mode persisted across sessions

### Reference Browsers

- **Spell Browser**, searchable, filterable spell list from the SRD with school badges and detail panel
- **Item Browser**, equipment reference
- **Monster Browser**, searchable bestiary with CR, type, and stat-block detail panel

### Account & Sync

- Authentication via Supabase Auth (email/password, magic link, password reset)
- Characters saved to the cloud and synced on login (local-first with merge strategy)
- Portrait upload to Supabase Storage (compressed JPEG)
- Up to 15 characters per account

---

## Spellcasting Rules Implemented

| Class | Type | Ability | Daily preparation |
|-------|------|---------|-------------------|
| Bard / Ranger / Sorcerer / Warlock | Known |, | Fixed list; swap 1 spell per level-up |
| Cleric / Druid | Prepared | WIS | WIS mod + level (all slots fillable) |
| Paladin | Prepared | CHA | ½ level + CHA mod |
| Wizard | Spellbook | INT | INT mod + level (from spellbook only) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 + Composition API |
| Language | TypeScript |
| Bundler | Vite 8 |
| Styles | UnoCSS (utility-first) |
| State | Pinia |
| Server state | TanStack Query v5 |
| Validation | Zod v4 |
| Backend | Supabase (Auth + Postgres + Storage) |
| Router | Vue Router v5 |
| Icons | Lucide Vue Next |
| Data | [5e SRD API](https://www.dnd5eapi.co/) |

---

## Installation

**Requirements:** Node.js 24+

```bash
# 1. Clone
git clone https://github.com/your-username/dnd-character-creator.git
cd dnd-character-creator

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 4. Start dev server
npm run dev
# http://localhost:5173
```

---

## Scripts

```bash
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run type-check   # TypeScript check (vue-tsc --noEmit)
npm run lint         # ESLint
npm test             # Unit tests (Vitest)
npm run gen-types    # Regenerate Supabase types from live schema
npm run gen-srd-index # Regenerate the Bestiary/Spells/Items browser indexes
```

**Regenerate SRD class data** (spell slots, hit dice, cantrips/spells known):
```bash
node scripts/generate-srd-data.mjs
```

**Regenerate the reference browser indexes** (Bestiary, Spells, Items). These slim,
prebaked JSON indexes let those pages filter/sort instantly and offline instead of
fetching every entry's detail one-by-one on first visit:
```bash
npm run gen-srd-index   # → src/shared/data/{monsters,spells,items}-index.json
```

---

## Project Structure

```
src/
├── app-shell/          Layout, Nav, Footer, ColorModeToggle
├── auth/               Supabase Auth store, Login, Profile pages
├── character-builder/
│   ├── builderStore.ts  Wizard state, validation, buildCharacterFromDraft
│   ├── classMeta.ts     Class/race metadata, spell profiles, resource tables, getRaceTraits
│   ├── steps/           11 step components (StepClass → StepReview)
│   └── pages/           CharacterBuilderPage
├── characters/
│   ├── store.ts         CRUD, cloud sync, schema migration
│   ├── pages/           CharacterListPage, CharacterSheetPage
│   └── components/      Sheet tabs, LevelUpModal, ManagePreparedModal, LongRestModal…
├── spells/              SpellBrowserPage
├── items/               ItemBrowserPage
└── shared/
    ├── api/             fiveE.client.ts, supabase.client.ts
    ├── data/            srd-class-data.json + monsters/spells/items-index.json (generated)
    ├── lib/             derivedStats, migrateCharacter, toJsonValue, skillAbilityMap
    └── types/           Zod schemas: character, items, api, supabase
```

---

## Deployment

Connect the repository to [Vercel](https://vercel.com), zero configuration needed for a Vite + Vue SPA. Set the two Supabase env vars in the Vercel project settings.

---

## License

MIT, see [LICENSE](./LICENSE)

## Author

Created by Rafael Bañón
