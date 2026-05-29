# Grimoire — D&D 5e Character Manager

A fully-featured **Single Page Application** for creating and managing Dungeons & Dragons 5e characters. Build your hero through a step-by-step wizard, track everything on a live character sheet, and manage spells, equipment, and combat in one place.

[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

---

## Features

### Character Builder
11-step wizard covering the full character creation process:

- **Class & Subclass** — pick from all 12 SRD classes with subclass selection at the appropriate level
- **Level & Features** — set level 1–20; class features displayed per level
- **Race & Subrace** — full race details (speed, ASI bonuses, traits, languages) fetched live from the 5e API
- **Background** — skill proficiencies, tool proficiencies, and starting languages
- **Ability Scores** — point buy, standard array (with drag & drop), manual entry, or 4d6-drop-lowest roll
- **Feats & ASI** — feat picker with prerequisite filtering at every ASI level
- **Skills & Proficiencies** — class, background, and racial proficiency origins clearly distinguished
- **Spells** — level-by-level picker for known casters (Bard, Ranger, Sorcerer, Warlock); flat pool for prepared casters (Cleric, Druid, Paladin) and spellbook casters (Wizard); Warlock Pact Magic handled separately
- **Equipment** — starting gold and item selection
- **Personal Details** — appearance, personality traits, ideals, bonds, flaws, biography
- **Review & Save** — full summary before committing

### Character Sheet

- **Tactical strip** — HP (interactive ±, THP, death saves at 0), AC, Initiative, Speed, Passive Perception, Proficiency Bonus, Spell Save DC, Spell Attack Bonus
- **Dice rolling** — every stat, skill, save, attack, and damage roll supports Normal / Advantage / Disadvantage with animated dice
- **Combat tab** — hit dice pips, Short Rest (hit dice recovery) and Long Rest dialogs
- **Spells tab** — manage known, prepared, and spellbook spells; daily re-preparation for Cleric, Druid, and Paladin via **Manage Prepared** modal; cast tracking with slot usage
- **Favorites tab** — weapon attacks and favourite spells with one-click rolls
- **Equipment tab** — inventory grouped by type (Weapons, Armor, Gear); inline weapon rolls
- **Features tab** — class and racial features loaded live from the 5e API
- **Bio & Notes** — free-form text sections
- **Conditions bar** — active conditions as dismissible chips
- **Concentration tracker** — visual indicator when a concentration spell is active
- **Level Up** — subclass picker, ASI distribution, feat selection
- **Print / PDF export** — print-ready sheet via browser print dialog
- **Inline editing** — lock/unlock mode persisted across sessions

### Reference Browsers

- **Spell Browser** — searchable, filterable spell list from the SRD
- **Item Browser** — equipment reference

### Account & Sync

- Authentication via Supabase Auth
- Characters saved to the cloud and synced on login (local-first with merge strategy)
- Up to 15 characters per account

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
| Router | Vue Router v4 |
| Icons | Lucide Vue Next |
| Data | [5e SRD API](https://www.dnd5eapi.co/) |

---

## Installation

**Requirements:** Node.js 18+

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
npm run gen-types    # Regenerate Supabase types from live schema
```

**Regenerate SRD class data** (spell slots, hit dice, cantrips/spells known):
```bash
node scripts/generate-srd-data.mjs
```

---

## Project Structure

```
src/
├── app-shell/          Layout, Nav, Footer, ColorModeToggle
├── auth/               Supabase Auth store, Login, Profile pages
├── character-builder/
│   ├── builderStore.ts  Wizard state, validation, buildCharacterFromDraft
│   ├── classMeta.ts     Class metadata, spell profiles, resource tables
│   ├── steps/           11 step components (StepClass → StepReview)
│   └── pages/           CharacterBuilderPage
├── characters/
│   ├── store.ts         CRUD, cloud sync, migration
│   ├── pages/           CharacterListPage, CharacterSheetPage
│   └── components/      All sheet tabs and modals
├── spells/              SpellBrowserPage
├── items/               ItemBrowserPage
└── shared/
    ├── api/             fiveE.client.ts, supabase.client.ts
    ├── data/            srd-class-data.json (generated)
    ├── lib/             derivedStats, migrateCharacter, toJsonValue, skillAbilityMap
    └── types/           Zod schemas: character, items, api, supabase
```

---

## Deployment

Connect the repository to [Vercel](https://vercel.com) — zero configuration needed for a Vite + Vue SPA. Set the two Supabase env vars in the Vercel project settings.

---

## License

MIT — see [LICENSE](./LICENSE)

## Author

Created by Rafael Bañón
