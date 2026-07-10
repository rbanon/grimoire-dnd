<template>
  <Teleport to="body">
    <div class="print-sheet">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <header class="ps-header">
        <span class="ps-export-badge">Export v1</span>
        <!-- Portrait -->
        <div class="ps-portrait">
          <img
            v-if="character.portrait.type === 'url'"
            :src="(character.portrait as { type: 'url'; url: string }).url"
            alt=""
            class="ps-portrait-img"
          />
          <span v-else class="ps-portrait-glyph">{{ classGlyph }}</span>
        </div>
        <!-- Identity -->
        <div class="ps-identity">
          <h1 class="ps-name">{{ character.identity.name }}</h1>
          <p class="ps-subtitle">
            {{ character.identity.race.name }}<span v-if="character.identity.subrace"> ({{ character.identity.subrace.name }})</span>
            &nbsp;·&nbsp;{{ character.identity.class.name }}<span v-if="character.identity.subclass">, {{ character.identity.subclass.name }}</span>
            &nbsp;·&nbsp;Level {{ character.combat.level }}
          </p>
          <p class="ps-meta">{{ character.identity.background.name }} · {{ character.identity.alignment }}<span v-if="character.combat.experiencePoints"> · {{ character.combat.experiencePoints }} XP</span></p>
        </div>
      </header>

      <!-- ── Combat strip ───────────────────────────────────────────────── -->
      <div class="ps-combat">
        <div class="ps-stat ps-stat-hp">
          <div class="ps-hp-inner">
            <div class="ps-ds-side">
              <div class="ps-ds-dots">
                <span v-for="i in 3" :key="i" class="ps-ds-dot-f">○</span>
              </div>
              <span class="ps-ds-side-lbl ps-ds-fail-lbl">FAIL</span>
            </div>
            <div class="ps-hp-core">
              <span class="ps-sv">___/{{ character.combat.maxHp }}</span>
              <span class="ps-sl">HP · DEATH SAVES</span>
            </div>
            <div class="ps-ds-side">
              <div class="ps-ds-dots">
                <span v-for="i in 3" :key="i" class="ps-ds-dot-s">○</span>
              </div>
              <span class="ps-ds-side-lbl ps-ds-succ-lbl">SUCC</span>
            </div>
          </div>
        </div>
        <div v-if="character.combat.tempHp" class="ps-stat">
          <span class="ps-sv ps-sv-arcane">+{{ character.combat.tempHp }}</span>
          <span class="ps-sl">TEMP HP</span>
        </div>
        <div class="ps-stat">
          <span class="ps-sv">{{ character.combat.armorClass }}</span>
          <span class="ps-sl">AC</span>
        </div>
        <div class="ps-stat">
          <span class="ps-sv">{{ fmtMod(initiativeMod) }}</span>
          <span class="ps-sl">INITIATIVE</span>
        </div>
        <div class="ps-stat">
          <span class="ps-sv">{{ speedDisplay }} ft</span>
          <span class="ps-sl">SPEED</span>
        </div>
        <div class="ps-stat">
          <span class="ps-sv">+{{ profBonus }}</span>
          <span class="ps-sl">PROF BONUS</span>
        </div>
        <div class="ps-stat">
          <span class="ps-sv">{{ passivePerception }}</span>
          <span class="ps-sl">PASS. PERC.</span>
        </div>
        <div class="ps-stat">
          <span class="ps-sv">___/{{ character.combat.level }}d{{ character.identity.class.hitDie }}</span>
          <span class="ps-sl">HIT DICE</span>
        </div>
      </div>

      <!-- ── 3-column body ──────────────────────────────────────────────── -->
      <div class="ps-body">

        <!-- Col 1: Abilities+Saves (combined) + Proficiencies + Resources -->
        <div class="ps-col">

          <h3 class="ps-sh">Abilities &amp; Saves</h3>
          <div class="ps-absa">
            <div v-for="ab in ABILITY_LIST" :key="ab.key" class="ps-absa-row">
              <span :class="saveProficient(ab.key) ? 'ps-dot-filled' : 'ps-dot-empty'">{{ saveProficient(ab.key) ? '●' : '○' }}</span>
              <span class="ps-absa-lbl">{{ ab.short }}</span>
              <span class="ps-absa-score">{{ character.abilityScores[ab.key] }}</span>
              <span class="ps-absa-amod">({{ fmtMod(mods[ab.key]) }})</span>
              <span class="ps-absa-smod">{{ fmtMod(saveMod(ab.key)) }}</span>
            </div>
          </div>

          <h3 class="ps-sh">Proficiencies &amp; Languages</h3>
          <p v-if="character.languages?.length" class="ps-text"><strong>Languages:</strong> {{ character.languages.join(', ') }}</p>
          <p v-if="character.otherProficiencies?.length" class="ps-text"><strong>Other:</strong> {{ character.otherProficiencies.join(', ') }}</p>
          <p v-if="!character.languages?.length && !character.otherProficiencies?.length" class="ps-muted">-</p>

          <template v-if="character.combat.conditions?.length">
            <h3 class="ps-sh">Conditions</h3>
            <p class="ps-text">{{ character.combat.conditions.join(', ') }}</p>
          </template>

          <template v-if="(character.combat.exhaustion ?? 0) > 0">
            <p class="ps-text ps-exh">Exhaustion {{ character.combat.exhaustion }}/6</p>
          </template>

          <template v-if="character.resources?.length">
            <h3 class="ps-sh">Class Resources</h3>
            <div v-for="r in character.resources" :key="r.id" class="ps-resource">
              <span class="ps-res-name">{{ r.name }}</span>
              <span class="ps-res-val">___/{{ r.max }}</span>
              <span class="ps-res-refresh">({{ r.refreshOn }} rest)</span>
            </div>
          </template>

        </div>

        <!-- Col 2: Skills + Proficiencies + Equipment -->
        <div class="ps-col">

          <h3 class="ps-sh">Skills</h3>
          <div class="ps-skills">
            <div v-for="sk in SKILLS" :key="sk.index" class="ps-skill">
              <span :class="skillProfClass(sk.index)">{{ skillProfDot(sk.index) }}</span>
              <span class="ps-sk-name">{{ sk.name }}</span>
              <span class="ps-sk-ab">({{ sk.ability.toUpperCase() }})</span>
              <span class="ps-sk-mod">{{ fmtMod(skillMod(sk)) }}</span>
            </div>
          </div>

          <h3 class="ps-sh">Equipment</h3>
          <div v-if="character.inventory?.length" class="ps-items">
            <div v-for="item in character.inventory" :key="item.id" class="ps-item">
              <span class="ps-item-name">{{ item.item.name }}</span>
              <span v-if="item.quantity !== 1" class="ps-item-meta">×{{ item.quantity }}</span>
              <span v-if="item.damage" class="ps-item-meta">{{ item.damage }}</span>
              <span v-if="item.attackBonus" class="ps-item-meta">{{ item.attackBonus }}</span>
              <span v-if="item.armorClass" class="ps-item-meta">AC {{ item.armorClass }}</span>
            </div>
          </div>
          <p v-else class="ps-muted">-</p>

          <div v-if="hasCurrency" class="ps-currency">
            <span v-if="character.currency.pp">{{ character.currency.pp }}pp</span>
            <span v-if="character.currency.gp">{{ character.currency.gp }}gp</span>
            <span v-if="character.currency.ep">{{ character.currency.ep }}ep</span>
            <span v-if="character.currency.sp">{{ character.currency.sp }}sp</span>
            <span v-if="character.currency.cp">{{ character.currency.cp }}cp</span>
          </div>

        </div>

        <!-- Col 3: Spellcasting or Notes -->
        <div class="ps-col">

          <template v-if="character.spellcasting">
            <h3 class="ps-sh">Spellcasting</h3>
            <div class="ps-spell-meta">
              <span>Ability: <strong>{{ character.spellcasting.spellcastingAbility.toUpperCase() }}</strong></span>
              <span>Save DC: <strong>{{ spellSaveDC }}</strong></span>
              <span>Attack: <strong>{{ fmtMod(spellAttackBonus) }}</strong></span>
            </div>

            <h4 class="ps-ssh">Spell Slots</h4>
            <div class="ps-slots">
              <template v-for="lvl in 9" :key="lvl">
                <div v-if="slotMax(lvl) > 0" class="ps-slot-row">
                  <span class="ps-slot-lv">Lv{{ lvl }}</span>
                  <span class="ps-slot-blank">___/{{ slotMax(lvl) }}</span>
                </div>
              </template>
            </div>

            <template v-if="character.spellcasting.cantripsKnown?.length">
              <h4 class="ps-ssh">Cantrips</h4>
              <div class="ps-splist">
                <span v-for="sp in character.spellcasting.cantripsKnown" :key="sp.index" class="ps-sp">{{ sp.name }}</span>
              </div>
            </template>

            <template v-if="spellsByLevel.length">
              <h4 class="ps-ssh">Spells Known / Prepared</h4>
              <template v-for="grp in spellsByLevel" :key="grp.level">
                <div class="ps-sp-lvhdr">Level {{ grp.level }}</div>
                <div class="ps-splist">
                  <span v-for="sp in grp.spells" :key="sp.index" class="ps-sp">
                    <span :class="sp.prepared ? 'ps-prepared' : 'ps-unprepared'">{{ sp.prepared ? '◆' : '◇' }}</span>{{ sp.name }}
                  </span>
                </div>
              </template>
            </template>
          </template>

          <template v-else>
            <h3 class="ps-sh">Notes</h3>
            <p class="ps-notes">{{ character.notes || '-' }}</p>
          </template>

        </div>
      </div>

      <!-- ── Footer ─────────────────────────────────────────────────────── -->
      <footer class="ps-footer">
        <span>D&amp;D 5e · Character Sheet</span>
        <span>Grimoire</span>
      </footer>

    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Character, AbilityName } from '@/shared/types/character'
import { computeModifier, computeAllModifiers } from '@/shared/types/character'
import { computeProficiencyBonus, computeSkillModifier, computeSpellSaveDC, computeSpellAttackBonus } from '@/shared/lib/derivedStats'
import { SKILLS } from '@/shared/lib/skillAbilityMap'
import { getClassGlyph } from '@/character-builder/classMeta'

const props = defineProps<{ character: Character }>()

const ABILITY_LIST: { key: AbilityName; short: string }[] = [
  { key: 'str', short: 'STR' },
  { key: 'dex', short: 'DEX' },
  { key: 'con', short: 'CON' },
  { key: 'int', short: 'INT' },
  { key: 'wis', short: 'WIS' },
  { key: 'cha', short: 'CHA' },
]

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n)
}

const classGlyph = computed(() => getClassGlyph(props.character.identity.class.index))
const profBonus   = computed(() => computeProficiencyBonus(props.character.combat.level))
const mods        = computed(() => computeAllModifiers(props.character.abilityScores))

const initiativeMod = computed(() =>
  props.character.overrides.initiative ?? computeModifier(props.character.abilityScores.dex),
)
const speedDisplay = computed(() =>
  props.character.overrides.speed ?? props.character.identity.race.speed,
)
const passivePerception = computed(() => {
  const percProf = props.character.skillProficiencies['perception'] ?? 'none'
  const base = computeModifier(props.character.abilityScores.wis)
  const bonus = percProf === 'expertise' ? profBonus.value * 2 : percProf === 'proficient' ? profBonus.value : 0
  return 10 + base + bonus
})

function saveProficient(key: AbilityName): boolean {
  return props.character.savingThrowProficiencies[key] ?? false
}
function saveMod(key: AbilityName): number {
  const base = computeModifier(props.character.abilityScores[key])
  return saveProficient(key) ? base + profBonus.value : base
}

function skillProfLevel(index: string): 'none' | 'proficient' | 'expertise' {
  return props.character.skillProficiencies[index] ?? 'none'
}
function skillProfDot(index: string): string {
  const lv = skillProfLevel(index)
  return lv === 'expertise' ? '★' : lv === 'proficient' ? '●' : '○'
}
function skillProfClass(index: string): string {
  const lv = skillProfLevel(index)
  return lv === 'expertise' ? 'ps-dot-exp' : lv === 'proficient' ? 'ps-dot-filled' : 'ps-dot-empty'
}
function skillMod(sk: { index: string; ability: AbilityName }): number {
  return computeSkillModifier(props.character.abilityScores, sk.ability, skillProfLevel(sk.index), profBonus.value)
}

const hasCurrency = computed(() => {
  const c = props.character.currency
  return c.gp > 0 || c.sp > 0 || c.cp > 0 || c.ep > 0 || c.pp > 0
})

const spellSaveDC = computed(() => {
  if (!props.character.spellcasting) return 0
  const ab = props.character.spellcasting.spellcastingAbility
  return computeSpellSaveDC(computeModifier(props.character.abilityScores[ab]), profBonus.value)
})
const spellAttackBonus = computed(() => {
  if (!props.character.spellcasting) return 0
  const ab = props.character.spellcasting.spellcastingAbility
  return computeSpellAttackBonus(computeModifier(props.character.abilityScores[ab]), profBonus.value)
})

function slotMax(lvl: number): number {
  const slots = props.character.spellcasting?.slotsMax as Record<string, number> | undefined
  return slots?.[`level${lvl}`] ?? 0
}

const spellsByLevel = computed(() => {
  if (!props.character.spellcasting) return []
  const known = props.character.spellcasting.spellsKnown ?? []
  const preparedSet = new Set((props.character.spellcasting.spellsPrepared ?? []).map(s => s.index))
  const byLevel = new Map<number, { index: string; name: string; prepared: boolean }[]>()
  for (const sp of known) {
    const arr = byLevel.get(sp.level) ?? []
    arr.push({ index: sp.index, name: sp.name, prepared: preparedSet.has(sp.index) })
    byLevel.set(sp.level, arr)
  }
  return Array.from(byLevel.entries())
    .sort(([a], [b]) => a - b)
    .map(([level, spells]) => ({ level, spells }))
})
</script>

<style>
/* Hidden on screen, shown only during print */
.print-sheet {
  display: none;
}

@media print {
  #app {
    display: none !important;
  }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
  }

  .print-sheet {
    display: block !important;
    font-family: 'Manrope', system-ui, sans-serif;
    font-size: 8pt;
    line-height: 1.35;
    color: #1c1917;
    background: #ffffff;
    width: 100%;
    /* Hard-cap to A4 content area (297mm − 2×10mm margins) to prevent blank second page */
    height: 277mm;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page {
    size: A4;
    margin: 10mm;
  }

  /* ─── Header ─────────────────────────────────────────────────────────── */
  .ps-header {
    display: flex;
    align-items: flex-start;
    gap: 10pt;
    border-bottom: 1.5pt solid #92703e;
    padding-bottom: 7pt;
    margin-bottom: 8pt;
    position: relative;
  }
  .ps-export-badge {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 5pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #d1d5db;
    border: 0.5pt solid #e5e7eb;
    border-radius: 1.5pt;
    padding: 1pt 3pt;
    line-height: 1.4;
  }
  .ps-portrait {
    width: 42pt;
    height: 42pt;
    flex-shrink: 0;
    border: 0.5pt solid #d4a84360;
    border-radius: 2pt;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #faf8f4;
  }
  .ps-portrait-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    display: block;
  }
  .ps-portrait-glyph {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 24pt;
    color: #92703e;
    opacity: 0.5;
    line-height: 1;
  }
  .ps-identity { flex: 1; min-width: 0; }
  .ps-name {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 21pt;
    font-weight: 500;
    color: #1c1917;
    margin: 0 0 3pt;
    line-height: 1.1;
    letter-spacing: 0.01em;
  }
  .ps-subtitle {
    font-size: 8.5pt;
    color: #374151;
    margin: 0 0 2pt;
  }
  .ps-meta {
    font-size: 7pt;
    color: #6b7280;
    margin: 0;
  }

  /* ─── Combat strip ───────────────────────────────────────────────────── */
  .ps-combat {
    display: flex;
    border: 0.75pt solid #d4a843;
    border-radius: 2pt;
    margin-bottom: 6pt;
    overflow: hidden;
    background: #faf8f4;
  }
  .ps-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 5pt 3pt;
    border-right: 0.5pt solid #e5dfd0;
  }
  .ps-stat:last-child { border-right: none; }
  .ps-sv {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 10pt;
    font-weight: 700;
    color: #1c1917;
    line-height: 1.2;
  }
  .ps-sv-arcane { color: #5b21b6; }
  .ps-sl {
    font-size: 5pt;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #92703e;
    line-height: 1.3;
    text-align: center;
  }

  /* ─── 3-col grid ─────────────────────────────────────────────────────── */
  .ps-body {
    display: grid;
    grid-template-columns: 26% 37% 37%;
    column-gap: 9pt;
    align-items: start;
  }
  .ps-col { padding: 0; }

  /* ─── Section headers ────────────────────────────────────────────────── */
  .ps-sh {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 7.5pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #92703e;
    border-bottom: 0.5pt solid #d4a84340;
    padding-bottom: 1.5pt;
    margin: 7pt 0 3pt;
  }
  .ps-sh:first-child { margin-top: 0; }
  .ps-ssh {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 7pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #92703e;
    margin: 5pt 0 2pt;
  }

  /* ─── HP stat box with death saves ──────────────────────────────────── */
  .ps-stat-hp { flex: 2.5; }
  .ps-hp-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 3pt;
    width: 100%;
  }
  .ps-hp-core { display: flex; flex-direction: column; align-items: center; flex: 1; }
  .ps-ds-side  { display: flex; flex-direction: column; align-items: center; gap: 1pt; }
  .ps-ds-dots  { display: flex; gap: 1.5pt; }
  .ps-ds-dot-f { font-size: 7.5pt; color: #b91c1c; line-height: 1; }
  .ps-ds-dot-s { font-size: 7.5pt; color: #166534; line-height: 1; }
  .ps-ds-side-lbl { font-size: 4pt; letter-spacing: 0.07em; text-transform: uppercase; line-height: 1.2; }
  .ps-ds-fail-lbl { color: #b91c1c; }
  .ps-ds-succ-lbl { color: #166534; }

  /* ─── Combined Abilities & Saves ─────────────────────────────────────── */
  .ps-absa { display: flex; flex-direction: column; gap: 1.5pt; }
  .ps-absa-row {
    display: flex;
    align-items: center;
    gap: 2pt;
    background: #faf8f4;
    border: 0.5pt solid #e5dfd0;
    border-radius: 1.5pt;
    padding: 1.5pt 3pt;
  }
  .ps-absa-lbl {
    font-size: 5.5pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #6b7280;
    width: 13pt;
    flex-shrink: 0;
  }
  .ps-absa-score {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 9pt;
    font-weight: 700;
    color: #1c1917;
    width: 11pt;
    text-align: center;
    flex-shrink: 0;
  }
  .ps-absa-amod {
    font-size: 6pt;
    color: #9ca3af;
    width: 15pt;
    flex-shrink: 0;
    text-align: center;
  }
  .ps-absa-smod {
    font-size: 7pt;
    font-weight: 600;
    color: #92703e;
    flex: 1;
    text-align: right;
  }

  /* ─── Prof dots ──────────────────────────────────────────────────────── */
  .ps-dot-empty  { color: #9ca3af; font-size: 5.5pt; width: 7pt; text-align: center; flex-shrink: 0; }
  .ps-dot-filled { color: #92703e; font-size: 5.5pt; width: 7pt; text-align: center; flex-shrink: 0; }
  .ps-dot-exp    { color: #d4a843; font-size: 5.5pt; width: 7pt; text-align: center; flex-shrink: 0; }
  .ps-dot-success { color: #92703e; font-size: 8pt; margin-right: 1pt; }
  .ps-dot-failure { color: #b91c1c; font-size: 8pt; margin-right: 1pt; }

  /* ─── Death saves ────────────────────────────────────────────────────── */
  .ps-ds { display: flex; flex-direction: column; gap: 2pt; }
  .ps-ds-row { display: flex; align-items: center; gap: 3pt; }
  .ps-ds-lbl { font-size: 5.5pt; color: #6b7280; width: 34pt; flex-shrink: 0; }

  /* ─── Resources ──────────────────────────────────────────────────────── */
  .ps-resource { display: flex; align-items: center; gap: 3pt; line-height: 1.4; }
  .ps-res-name { flex: 1; font-size: 7pt; color: #374151; }
  .ps-res-val { font-size: 7.5pt; font-weight: 600; color: #1c1917; }
  .ps-res-refresh { font-size: 5pt; color: #9ca3af; }

  /* ─── Misc text ──────────────────────────────────────────────────────── */
  .ps-text { font-size: 7pt; color: #374151; margin: 0; line-height: 1.4; }
  .ps-exh  { font-style: italic; color: #b91c1c; }
  .ps-muted { color: #9ca3af; font-size: 7pt; }

  /* ─── Skills ─────────────────────────────────────────────────────────── */
  .ps-skills { display: flex; flex-direction: column; gap: 1.5pt; }
  .ps-skill { display: flex; align-items: center; gap: 2pt; line-height: 1.3; }
  .ps-sk-name { flex: 1; font-size: 7pt; color: #1c1917; }
  .ps-sk-ab   { font-size: 5pt; color: #9ca3af; width: 16pt; flex-shrink: 0; }
  .ps-sk-mod  { font-size: 7pt; font-weight: 600; color: #1c1917; width: 14pt; text-align: right; flex-shrink: 0; }

  /* ─── Equipment ──────────────────────────────────────────────────────── */
  .ps-items { display: flex; flex-direction: column; gap: 1pt; }
  .ps-item { display: flex; align-items: center; gap: 3pt; line-height: 1.4; }
  .ps-item-name { flex: 1; font-size: 7pt; color: #1c1917; }
  .ps-item-meta { font-size: 6pt; color: #6b7280; }

  /* ─── Currency ───────────────────────────────────────────────────────── */
  .ps-currency { display: flex; gap: 5pt; margin-top: 2pt; flex-wrap: wrap; }
  .ps-currency span { font-size: 7pt; color: #92703e; font-weight: 600; }

  /* ─── Spellcasting ───────────────────────────────────────────────────── */
  .ps-spell-meta {
    display: flex;
    gap: 7pt;
    flex-wrap: wrap;
    font-size: 7pt;
    color: #374151;
    margin-bottom: 2pt;
  }
  .ps-spell-meta strong { color: #1c1917; }
  .ps-slots { display: flex; flex-direction: column; gap: 1.5pt; }
  .ps-slot-row { display: flex; align-items: center; gap: 2pt; }
  .ps-slot-lv    { font-size: 5.5pt; color: #6b7280; width: 11pt; flex-shrink: 0; }
  .ps-slot-blank { font-size: 7pt; color: #1c1917; font-weight: 600; letter-spacing: 0.02em; }

  .ps-splist { display: flex; flex-direction: column; gap: 1pt; }
  .ps-sp {
    font-size: 7pt;
    color: #1c1917;
    line-height: 1.3;
    display: flex;
    align-items: center;
    gap: 2pt;
  }
  .ps-sp-lvhdr {
    font-size: 5.5pt;
    color: #92703e;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 3pt;
    margin-bottom: 1pt;
  }
  .ps-prepared   { color: #92703e; font-size: 5.5pt; }
  .ps-unprepared { color: #d1d5db; font-size: 5.5pt; }

  /* ─── Notes ──────────────────────────────────────────────────────────── */
  .ps-notes {
    font-size: 7pt;
    color: #374151;
    line-height: 1.5;
    margin: 0;
    white-space: pre-wrap;
    overflow: hidden;
  }

  /* ─── Zebra striping, even rows get a warm parchment wash ──────────── */
  .ps-absa-row:nth-child(even),
  .ps-skill:nth-child(even),
  .ps-item:nth-child(even),
  .ps-sp:nth-child(even),
  .ps-resource:nth-child(even),
  .ps-slot-row:nth-child(even) {
    background: #f2ece0;
    border-radius: 1pt;
  }

  /* ─── Footer ─────────────────────────────────────────────────────────── */
  .ps-footer {
    margin-top: 5pt;
    border-top: 0.5pt solid #d4a84340;
    padding-top: 2pt;
    display: flex;
    justify-content: space-between;
    font-size: 5.5pt;
    color: #9ca3af;
    letter-spacing: 0.05em;
  }
}
</style>
