<template>
  <div>
    <!-- ── Not found ──────────────────────────────────────────────────────────── -->
    <div v-if="!character" class="app-container py-24 text-center">
      <p class="font-body text-ash">Character not found in this tome.</p>
      <RouterLink to="/" class="btn-secondary mt-4 inline-flex">← Back to characters</RouterLink>
    </div>

    <template v-else>

      <!-- ══ HEADER ═══════════════════════════════════════════════════════════ -->
      <header class="border-b border-shadow bg-abyss relative overflow-hidden">
        <div
          class="absolute inset-0 pointer-events-none"
          style="background: linear-gradient(180deg, rgba(212,168,67,0.04) 0%, transparent 100%)"
        />
        <div class="app-container py-4 relative">
          <div class="flex items-center gap-4 flex-wrap sm:flex-nowrap">

            <!-- Portrait -->
            <div
              class="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded border border-shadow overflow-hidden relative group cursor-pointer"
              style="box-shadow: 0 0 0 1px rgba(212,168,67,0.08) inset"
              title="Change portrait"
              @click="portraitFileInput?.click()"
            >
              <img
                v-if="character.portrait.type === 'url'"
                :src="character.portrait.url"
                :alt="character.identity.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-depths text-2xl text-gold-dim/30 font-display select-none">
                {{ classGlyph }}
              </div>
              <div class="absolute inset-0 bg-abyss/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImageIcon :size="14" class="text-stone" />
              </div>
              <div class="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-gold-dim/30" />
              <div class="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-gold-dim/30" />
              <div class="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-gold-dim/30" />
              <div class="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-gold-dim/30" />
            </div>
            <input
              ref="portraitFileInput"
              type="file"
              accept="image/*"
              class="sr-only"
              @change="onPortraitChange"
            />

            <!-- Identity -->
            <div class="flex-1 min-w-0">
              <h1 class="font-display text-2xl sm:text-3xl leading-tight text-vellum truncate">
                {{ character.identity.name }}
              </h1>
              <p class="font-body text-sm text-ash mt-0.5 truncate">
                {{ character.identity.race.name }}<span v-if="character.identity.subrace">&nbsp;({{ character.identity.subrace.name }})</span>
                <span class="text-mist/40 mx-1.5">·</span>
                {{ character.identity.class.name }}<span v-if="character.identity.subclass">&nbsp;— {{ character.identity.subclass.name }}</span>
                <span class="text-mist/40 mx-1.5">·</span>
                Level {{ character.combat.level }}
              </p>
              <p class="font-body text-xs text-mist mt-0.5">
                {{ character.identity.background.name }}
                <span class="mx-1 text-mist/30">·</span>
                {{ character.identity.alignment }}
              </p>
              <div class="flex flex-wrap gap-1.5 mt-2">
                <span class="badge-gold">Lv {{ character.combat.level }}</span>
                <span v-if="character.spellcasting" class="badge-arcane">Spellcaster</span>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-xs font-heading tracking-wide transition-all"
                  :class="character.combat.inspiration
                    ? 'bg-gold-dim/20 border-gold-mid/50 text-gold-mid'
                    : 'border-shadow/40 text-mist/40 hover:border-gold-dim/30 hover:text-mist'"
                  :disabled="!editMode"
                  @click="editMode && toggleInspiration()"
                >✦ Inspiration</button>
              </div>
            </div>

            <!-- Utility buttons -->
            <div class="flex items-center gap-1 shrink-0">
              <button class="btn-secondary p-1.5" title="Export character" @click="downloadExport">
                <DownloadIcon :size="14" />
              </button>
              <button
                type="button"
                class="w-8 h-8 flex items-center justify-center rounded border transition-colors"
                :class="editMode
                  ? 'border-shadow/50 text-mist hover:text-ash hover:border-shadow'
                  : 'border-gold-dim/40 text-gold-mid hover:text-gold-bright hover:border-gold-mid/60'"
                :title="editMode ? 'Lock sheet' : 'Unlock sheet'"
                @click="editMode = !editMode"
              >
                <LockOpenIcon v-if="editMode" :size="14" />
                <LockIcon v-else :size="14" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- ══ TACTICAL STRIP ════════════════════════════════════════════════════ -->
      <section class="border-b border-shadow bg-depths/60">
        <div class="app-container py-3">

          <!-- Stat boxes row -->
          <div class="flex items-start gap-2">
            <!-- Stat grid -->
            <div
              class="grid gap-2 flex-1 min-w-0 items-start"
              :class="character.spellcasting
                ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'"
            >

            <!-- HP (special widget) -->
            <div
              class="card flex flex-col items-center p-3 min-w-0"
              :class="hpPercent < 0.25 ? 'border-blood-base/50' : ''"
            >
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">HP</p>

              <div class="flex items-center gap-1 mt-0.5">
                <button
                  v-show="editMode"
                  type="button"
                  class="w-6 h-6 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths font-heading text-lg leading-none transition-colors"
                  @click="adjustHp(-1)"
                >−</button>

                <input
                  v-if="hpEditing && editMode"
                  ref="hpInputEl"
                  v-model.number="hpInputValue"
                  type="number"
                  :min="0"
                  :max="character.combat.maxHp"
                  class="w-12 text-center font-heading text-xl bg-transparent border-b border-gold-mid/50 outline-none"
                  :class="hpPercent < 0.25 ? 'text-blood-bright' : 'text-vellum'"
                  @blur="commitHp"
                  @keydown.enter="commitHp"
                  @keydown.esc="hpEditing = false"
                />
                <button
                  v-else
                  type="button"
                  class="font-heading text-xl leading-none transition-colors"
                  :class="[
                    hpPercent < 0.25 ? 'text-blood-bright' : 'text-vellum',
                    editMode ? 'hover:text-gold-mid cursor-pointer' : 'cursor-default',
                  ]"
                  @click="editMode && startHpEdit()"
                >{{ character.combat.currentHp }}</button>

                <button
                  v-show="editMode"
                  type="button"
                  class="w-6 h-6 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths font-heading text-lg leading-none transition-colors"
                  @click="adjustHp(1)"
                >+</button>
              </div>

              <p class="text-xs text-mist leading-none">/ {{ character.combat.maxHp }}</p>

              <!-- Temp HP -->
              <div class="flex items-center gap-1 mt-1 pt-1 border-t border-shadow/30 w-full justify-center">
                <button
                  v-show="editMode"
                  type="button"
                  class="w-4 h-4 flex items-center justify-center text-mist/50 hover:text-ash font-heading text-xs transition-colors"
                  @click="adjustTempHp(-1)"
                >−</button>
                <span class="text-2xs font-heading text-mist/50">THP</span>
                <button
                  v-if="tempHpEditing && editMode"
                  type="button"
                  class="w-8 text-center bg-transparent border-b border-arcane-base/50 outline-none text-arcane-pale font-heading text-xs"
                >
                  <input
                    ref="tempHpInputEl"
                    v-model.number="tempHpValue"
                    type="number"
                    min="0"
                    class="w-8 text-center bg-transparent outline-none text-arcane-pale font-heading text-xs"
                    @blur="commitTempHp"
                    @keydown.enter="commitTempHp"
                    @keydown.esc="tempHpEditing = false"
                  />
                </button>
                <button
                  v-else
                  type="button"
                  class="font-heading text-xs transition-colors"
                  :class="[
                    character.combat.tempHp > 0 ? 'text-arcane-pale' : 'text-mist/30',
                    editMode ? 'cursor-pointer hover:text-arcane-pale/70' : 'cursor-default',
                  ]"
                  @click="editMode && startTempHpEdit()"
                >{{ character.combat.tempHp }}</button>
                <button
                  v-show="editMode"
                  type="button"
                  class="w-4 h-4 flex items-center justify-center text-mist/50 hover:text-ash font-heading text-xs transition-colors"
                  @click="adjustTempHp(1)"
                >+</button>
              </div>

              <!-- Death Saves — solo visible a 0 HP -->
              <div
                v-if="character.combat.currentHp === 0"
                class="w-full mt-2 pt-1.5 border-t border-blood-base/30"
              >
                <p class="text-2xs font-heading tracking-[0.12em] uppercase text-blood-bright/70 text-center mb-1.5">Death Saves</p>
                <div class="flex items-center justify-center gap-3">
                  <div class="flex items-center gap-0.5">
                    <button
                      v-for="pip in 3"
                      :key="`s${pip}`"
                      type="button"
                      class="w-3 h-3 rounded-full border-2 transition-all duration-100"
                      :class="[
                        pip <= deathSaves.successes ? 'bg-gold-mid border-gold-mid' : 'bg-transparent border-mist/30',
                        editMode ? 'cursor-pointer hover:border-gold-dim/60' : 'cursor-default',
                      ]"
                      @click="editMode && toggleDeathSave('successes', pip)"
                    />
                  </div>
                  <span class="text-mist/20 text-xs">|</span>
                  <div class="flex items-center gap-0.5">
                    <button
                      v-for="pip in 3"
                      :key="`f${pip}`"
                      type="button"
                      class="w-3 h-3 rounded-full border-2 transition-all duration-100"
                      :class="[
                        pip <= deathSaves.failures ? 'bg-blood-bright border-blood-bright' : 'bg-transparent border-mist/30',
                        editMode ? 'cursor-pointer hover:border-blood-base/60' : 'cursor-default',
                      ]"
                      @click="editMode && toggleDeathSave('failures', pip)"
                    />
                  </div>
                </div>
              </div>

              <!-- Exhaustion -->
              <div class="flex items-center justify-center gap-1 mt-1.5 pt-1 border-t border-shadow/30 w-full">
                <button
                  v-show="editMode"
                  type="button"
                  class="w-4 h-4 flex items-center justify-center text-mist/40 hover:text-ash font-heading text-xs transition-colors"
                  @click="adjustExhaustion(-1)"
                >−</button>
                <span class="text-2xs font-heading uppercase text-mist/50">Exh</span>
                <span
                  class="font-heading text-sm leading-none min-w-[1ch] text-center"
                  :class="(character.combat.exhaustion ?? 0) > 0 ? 'text-blood-bright' : 'text-mist/30'"
                >{{ character.combat.exhaustion ?? 0 }}</span>
                <button
                  v-show="editMode"
                  type="button"
                  class="w-4 h-4 flex items-center justify-center text-mist/40 hover:text-ash font-heading text-xs transition-colors"
                  @click="adjustExhaustion(1)"
                >+</button>
                <button
                  type="button"
                  class="w-4 h-4 flex items-center justify-center text-mist/30 hover:text-ash transition-colors ml-0.5"
                  title="Exhaustion effects"
                  @click="infoPanel.open({ kind: 'exhaustion' })"
                >
                  <InfoIcon :size="10" />
                </button>
              </div>
            </div>

            <!-- AC -->
            <div class="card flex flex-col items-center justify-center p-3 min-w-0">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">AC</p>
              <input
                v-if="acEditing && editMode"
                ref="acInputEl"
                v-model.number="acValue"
                type="number"
                min="0"
                class="w-10 text-center font-heading text-xl bg-transparent border-b border-gold-mid/50 outline-none text-vellum mt-0.5"
                @blur="commitAc"
                @keydown.enter="commitAc"
                @keydown.esc="acEditing = false"
              />
              <button
                v-else
                type="button"
                class="font-heading text-xl text-vellum mt-0.5 leading-none transition-colors"
                :class="editMode ? 'hover:text-gold-mid cursor-pointer' : 'cursor-default'"
                @click="editMode && startAcEdit()"
              >{{ character.combat.armorClass }}</button>
            </div>

            <!-- Initiative (clickable roll) -->
            <div class="card flex flex-col items-center justify-center p-3 min-w-[60px] group">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">Init</p>
              <button
                type="button"
                class="font-heading text-xl text-vellum mt-0.5 leading-none hover:text-gold-mid transition-colors"
                title="Roll Initiative"
                @click="rollD20(initiativeMod, 'Initiative', $event)"
              >{{ initiativeDisplay }}</button>
            </div>

            <!-- Speed -->
            <div class="card flex flex-col items-center justify-center p-3 min-w-0">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">Speed</p>
              <p class="font-heading text-xl text-vellum mt-0.5 leading-none">
                {{ speedDisplay }}<span class="text-xs text-mist font-body ml-0.5">ft</span>
              </p>
            </div>

            <!-- Passive Perception -->
            <div class="card flex flex-col items-center justify-center p-3 min-w-0">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">Pass. Perc</p>
              <p class="font-heading text-xl text-vellum mt-0.5 leading-none">{{ passivePerception }}</p>
            </div>

            <!-- Prof Bonus -->
            <div class="card flex flex-col items-center justify-center p-3 min-w-0">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">Prof</p>
              <p class="font-heading text-xl text-vellum mt-0.5 leading-none">+{{ profBonus }}</p>
            </div>

            <!-- Spell Save DC -->
            <div v-if="character.spellcasting" class="card flex flex-col items-center justify-center p-3 min-w-0">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">Spell DC</p>
              <p class="font-heading text-xl text-arcane-pale mt-0.5 leading-none">{{ spellSaveDC }}</p>
            </div>

            <!-- Spell Attack Bonus (clickable roll) -->
            <div v-if="character.spellcasting" class="card flex flex-col items-center justify-center p-3 min-w-0">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">Spell Atk</p>
              <button
                type="button"
                class="font-heading text-xl text-arcane-pale mt-0.5 leading-none hover:text-arcane-bright transition-colors"
                title="Roll Spell Attack"
                @click="rollD20(spellAttackBonus, 'Spell Attack', $event)"
              >{{ fmt(spellAttackBonus) }}</button>
            </div>

            </div><!-- /stat grid -->

            <!-- Rest buttons + Hit Dice -->
            <div class="flex flex-col gap-1 self-center shrink-0">
              <button
                class="btn-secondary text-xs py-1.5 px-3"
                @click="showShortRest = true"
              >Short Rest</button>
              <button
                class="btn-secondary text-xs py-1.5 px-3"
                @click="longRest"
              >Long Rest</button>
              <!-- Hit Dice indicator -->
              <div class="flex items-center justify-center gap-1 pt-0.5">
                <span class="text-2xs font-heading uppercase text-mist shrink-0">d{{ hitDie }}</span>
                <div class="flex items-center gap-0.5">
                  <div
                    v-for="pip in Math.min(character.combat.level, 10)"
                    :key="pip"
                    class="w-2 h-2 rounded-full border transition-all duration-100"
                    :class="pip <= character.combat.hitDiceRemaining
                      ? 'bg-arcane-pale border-arcane-pale'
                      : 'bg-transparent border-mist/25'"
                  />
                  <span v-if="character.combat.level > 10" class="text-2xs font-body text-mist/40 ml-0.5">+{{ character.combat.level - 10 }}</span>
                </div>
                <span class="text-2xs font-body text-mist/50">{{ character.combat.hitDiceRemaining }}/{{ character.combat.level }}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- ══ CONDITIONS BAR ════════════════════════════════════════════════════ -->
      <section class="border-b border-shadow/40 bg-depths/20">
        <div class="app-container py-2">
          <ConditionsBar :character="character" :edit-mode="editMode" />
        </div>
      </section>

      <!-- ══ MAIN BODY: two columns on lg+ ════════════════════════════════════ -->
      <div class="app-container">
        <div class="lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 pt-5 lg:pt-6">

          <!-- ── LEFT PANEL: Abilities · Saves · Skills ─────────────────────── -->
          <aside class="space-y-7 mb-8 lg:mb-0">

            <!-- Ability Scores -->
            <section>
              <p class="label mb-3">Ability Scores</p>
              <div class="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-2">
                <div
                  v-for="ab in abilityEntries"
                  :key="ab.key"
                  class="card py-3 px-2 text-center group relative overflow-hidden"
                >
                  <div
                    class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style="background: radial-gradient(ellipse at center, rgba(212,168,67,0.05) 0%, transparent 70%)"
                  />
                  <p class="relative text-2xs font-heading tracking-[0.2em] uppercase text-mist">{{ ab.label }}</p>
                  <button
                    type="button"
                    class="relative block w-full font-heading text-2xl leading-none mt-1 transition-colors"
                    :class="ab.mod >= 0 ? 'text-gold-mid hover:text-gold-bright' : 'text-blood-bright hover:text-blood-mid'"
                    :title="`Roll ${ab.label} check`"
                    @click="rollD20(ab.mod, `${ab.label} Check`, $event)"
                  >{{ ab.mod >= 0 ? `+${ab.mod}` : ab.mod }}</button>
                  <p class="relative text-sm font-body text-ash mt-1 leading-none">{{ ab.score }}</p>
                </div>
              </div>
            </section>

            <!-- Saving Throws -->
            <section>
              <p class="label mb-2">Saving Throws</p>
              <div class="space-y-0.5">
                <div
                  v-for="save in SAVES"
                  :key="save.key"
                  class="flex items-center gap-2 px-2 py-1.5 rounded group hover:bg-depths/50 transition-colors"
                >
                  <span
                    class="w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-colors"
                    :class="character.savingThrowProficiencies[save.key]
                      ? 'bg-gold-mid border-gold-mid'
                      : 'bg-transparent border-mist/40'"
                  />
                  <button
                    type="button"
                    class="font-heading text-sm w-8 shrink-0 text-left transition-colors"
                    :class="character.savingThrowProficiencies[save.key]
                      ? 'text-gold-deep hover:text-gold-dim'
                      : 'text-stone hover:text-ash'"
                    @click="rollD20(saveBonus(save.key), `${save.label} Save`, $event)"
                  >{{ fmt(saveBonus(save.key)) }}</button>
                  <span class="text-xs font-body text-ash flex-1">{{ save.label }}</span>
                  <button
                    type="button"
                    class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-mist/40 hover:text-gold-mid shrink-0"
                    :aria-label="`Roll ${save.label} saving throw`"
                    @click="rollD20(saveBonus(save.key), `${save.label} Save`, $event)"
                  >⚄</button>
                </div>
              </div>
            </section>

            <!-- Skills -->
            <section>
              <div class="flex items-center justify-between mb-2">
                <p class="label">Skills</p>
                <span class="text-2xs font-body text-mist">PP {{ passivePerception }}</span>
              </div>
              <input
                v-model="skillSearch"
                type="search"
                class="input-base text-xs py-1.5 mb-2"
                placeholder="Filter skills…"
              />
              <div class="space-y-0.5">
                <div
                  v-for="skill in filteredSkills"
                  :key="skill.index"
                  class="flex items-center gap-2 px-2 py-1 rounded group hover:bg-depths/50 transition-colors"
                >
                  <span
                    class="w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-colors"
                    :class="profClass(skill.index)"
                  />
                  <button
                    type="button"
                    class="font-heading text-sm w-8 shrink-0 text-left transition-colors"
                    :class="hasProficiency(skill.index)
                      ? 'text-gold-deep hover:text-gold-dim'
                      : 'text-stone hover:text-ash'"
                    @click="rollD20(skillBonus(skill), skill.name, $event)"
                  >{{ fmt(skillBonus(skill)) }}</button>
                  <span class="text-xs font-body text-ash flex-1 truncate">{{ skill.name }}</span>
                  <span class="text-2xs font-heading text-mist/50 shrink-0">{{ skill.ability.toUpperCase() }}</span>
                  <button
                    type="button"
                    class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-mist/40 hover:text-gold-mid shrink-0"
                    :aria-label="`Roll ${skill.name}`"
                    @click="rollD20(skillBonus(skill), skill.name, $event)"
                  >⚄</button>
                </div>
                <div v-if="filteredSkills.length === 0" class="px-2 py-3 text-xs font-body text-mist/50 italic">
                  No skills match "{{ skillSearch }}"
                </div>
              </div>
            </section>

          </aside>

          <!-- ── RIGHT PANEL: Tabs ─────────────────────────────────────────── -->
          <main class="min-w-0 pb-16">

            <!-- Tab bar -->
            <div class="border-b border-shadow mb-5">
              <div class="flex gap-0 overflow-x-auto">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  class="px-4 py-2.5 text-sm font-heading tracking-wide border-b-2 transition-all duration-150 whitespace-nowrap shrink-0"
                  :class="activeTab === tab.id
                    ? 'border-gold-mid text-gold-mid'
                    : 'border-transparent text-ash hover:text-stone hover:border-shadow'"
                  @click="activeTab = tab.id"
                >{{ tab.label }}</button>
              </div>
            </div>

            <!-- Tab content -->
            <div v-if="activeTab === 'favorites'">
              <FavoritesTab :character="character" :edit-mode="editMode" />
            </div>
            <div v-else-if="activeTab === 'spells'">
              <SpellsTab :character="character" :edit-mode="editMode" />
            </div>
            <div v-else-if="activeTab === 'equipment'">
              <EquipmentTab :character="character" :edit-mode="editMode" />
            </div>
            <div v-else-if="activeTab === 'features'">
              <FeaturesTab :character="character" />
            </div>
            <div v-else-if="activeTab === 'bio'">
              <BioTab :character="character" :edit-mode="editMode" />
            </div>
            <div v-else-if="activeTab === 'notes'">
              <p class="label mb-3">Session Notes</p>
              <textarea
                v-model="notesText"
                class="input-base w-full resize-y font-body text-sm leading-relaxed"
                rows="14"
                placeholder="Write notes about this character's adventures, session recaps, plans for next session…"
                @blur="saveNotes"
              />
            </div>
          </main>
        </div>
      </div>

    </template>

    <!-- ── Roll overlays ─────────────────────────────────────────────────────── -->
    <RollConfirm />
    <RollResult />

    <!-- ── Short rest modal ──────────────────────────────────────────────────── -->
    <ShortRestModal
      v-if="character"
      :show="showShortRest"
      :character="character"
      @close="showShortRest = false"
      @rested="onShortRested"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { DownloadIcon, ImageIcon, InfoIcon, LockIcon, LockOpenIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import { computeModifier, computeAllModifiers } from '@/shared/types/character'
import type { Character, AbilityName } from '@/shared/types/character'
import { computeProficiencyBonus, computeSpellSaveDC, computeSpellAttackBonus } from '@/shared/lib/derivedStats'
import { CLASS_META } from '@/character-builder/classMeta'
import { useDialog } from '@/shared/composables/useDialog'
import { useRoll } from '@/shared/composables/useRoll'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import ConditionsBar from '@/characters/components/ConditionsBar.vue'
import FavoritesTab from '@/characters/components/FavoritesTab.vue'
import EquipmentTab from '@/characters/components/EquipmentTab.vue'
import SpellsTab from '@/characters/components/SpellsTab.vue'
import FeaturesTab from '@/characters/components/FeaturesTab.vue'
import BioTab from '@/characters/components/BioTab.vue'
import RollResult from '@/shared/components/RollResult.vue'
import RollConfirm from '@/shared/components/RollConfirm.vue'
import ShortRestModal from '@/characters/components/ShortRestModal.vue'

const props = defineProps<{ id: string }>()
const store = useCharactersStore()
const character = computed(() => store.getById(props.id))
const dialog = useDialog()
const infoPanel = useInfoPanel()
const { rollD20 } = useRoll()

const editMode = ref(true)
const showShortRest = ref(false)

const portraitFileInput = ref<HTMLInputElement | null>(null)

function onPortraitChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !character.value) return
  if (file.size > 1_048_576) return
  const reader = new FileReader()
  reader.onload = (e) => {
    store.update(props.id, { portrait: { type: 'url', url: e.target?.result as string } })
  }
  reader.readAsDataURL(file)
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const activeTab = ref('favorites')
const tabs = [
  { id: 'favorites', label: 'Favorites' },
  { id: 'spells',    label: 'Spells'    },
  { id: 'equipment', label: 'Equipment' },
  { id: 'features',  label: 'Features'  },
  { id: 'bio',       label: 'Biography' },
  { id: 'notes',     label: 'Notes'     },
]

// ── Core derived stats ────────────────────────────────────────────────────────

const profBonus = computed(() =>
  character.value ? computeProficiencyBonus(character.value.combat.level) : 0,
)

const mods = computed(() =>
  character.value
    ? computeAllModifiers(character.value.abilityScores)
    : { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
)

const hpPercent = computed(() => {
  if (!character.value) return 1
  return character.value.combat.currentHp / character.value.combat.maxHp
})

const initiativeMod = computed(() => {
  if (!character.value) return 0
  return character.value.overrides.initiative ?? computeModifier(character.value.abilityScores.dex)
})

const initiativeDisplay = computed(() => {
  const m = initiativeMod.value
  return m >= 0 ? `+${m}` : String(m)
})

const speedDisplay = computed(() => {
  if (!character.value) return 30
  return character.value.overrides.speed ?? character.value.identity.race.speed
})

// ── Spellcasting stats ────────────────────────────────────────────────────────

const spellAbilityMod = computed(() => {
  const sc = character.value?.spellcasting
  if (!sc) return 0
  return mods.value[sc.spellcastingAbility]
})

const spellSaveDC = computed(() =>
  computeSpellSaveDC(spellAbilityMod.value, profBonus.value),
)

const spellAttackBonus = computed(() =>
  computeSpellAttackBonus(spellAbilityMod.value, profBonus.value),
)

// ── Ability entries for left panel ────────────────────────────────────────────

const abilityEntries = computed(() => {
  if (!character.value) return []
  const scores = character.value.abilityScores
  const m = computeAllModifiers(scores)
  return [
    { key: 'str', label: 'STR', score: scores.str, mod: m.str },
    { key: 'dex', label: 'DEX', score: scores.dex, mod: m.dex },
    { key: 'con', label: 'CON', score: scores.con, mod: m.con },
    { key: 'int', label: 'INT', score: scores.int, mod: m.int },
    { key: 'wis', label: 'WIS', score: scores.wis, mod: m.wis },
    { key: 'cha', label: 'CHA', score: scores.cha, mod: m.cha },
  ]
})

// ── Class glyph ───────────────────────────────────────────────────────────────

const classGlyphs: Record<string, string> = {
  barbarian: '⚔', bard: '♪', cleric: '✦', druid: '☘', fighter: '🛡',
  monk: '◎', paladin: '✚', ranger: '⌖', rogue: '◆', sorcerer: '✶',
  warlock: '⌬', wizard: '⎊',
}
const classGlyph = computed(() =>
  classGlyphs[character.value?.identity.class.name.toLowerCase() ?? ''] ?? '⚔',
)

// ── HP tracker ────────────────────────────────────────────────────────────────

const hpEditing = ref(false)
const hpInputValue = ref(0)
const hpInputEl = ref<HTMLInputElement | null>(null)

function startHpEdit() {
  if (!character.value) return
  hpInputValue.value = character.value.combat.currentHp
  hpEditing.value = true
  nextTick(() => hpInputEl.value?.select())
}

async function commitHp() {
  if (!character.value) return
  hpEditing.value = false
  const clamped = Math.max(0, Math.min(hpInputValue.value || 0, character.value.combat.maxHp))
  if (clamped === character.value.combat.currentHp) return
  await store.update(character.value.id, { combat: { ...character.value.combat, currentHp: clamped } })
}

async function adjustHp(delta: number) {
  if (!character.value) return
  const next = Math.max(0, Math.min(character.value.combat.currentHp + delta, character.value.combat.maxHp))
  if (next === character.value.combat.currentHp) return
  await store.update(character.value.id, { combat: { ...character.value.combat, currentHp: next } })
}

async function toggleInspiration() {
  if (!character.value) return
  await store.update(character.value.id, {
    combat: { ...character.value.combat, inspiration: !character.value.combat.inspiration },
  })
}

// ── AC editable ───────────────────────────────────────────────────────────────

const acEditing = ref(false)
const acValue = ref(0)
const acInputEl = ref<HTMLInputElement | null>(null)

function startAcEdit() {
  if (!character.value) return
  acValue.value = character.value.combat.armorClass
  acEditing.value = true
  nextTick(() => acInputEl.value?.select())
}

async function commitAc() {
  if (!character.value) return
  acEditing.value = false
  const next = Math.max(0, acValue.value || 0)
  if (next === character.value.combat.armorClass) return
  await store.update(character.value.id, { combat: { ...character.value.combat, armorClass: next } })
}

// ── Temp HP ───────────────────────────────────────────────────────────────────

const tempHpEditing = ref(false)
const tempHpValue = ref(0)
const tempHpInputEl = ref<HTMLInputElement | null>(null)

function startTempHpEdit() {
  if (!character.value) return
  tempHpValue.value = character.value.combat.tempHp
  tempHpEditing.value = true
  nextTick(() => tempHpInputEl.value?.select())
}

async function commitTempHp() {
  if (!character.value) return
  tempHpEditing.value = false
  const next = Math.max(0, tempHpValue.value || 0)
  if (next === character.value.combat.tempHp) return
  await store.update(character.value.id, { combat: { ...character.value.combat, tempHp: next } })
}

async function adjustTempHp(delta: number) {
  if (!character.value) return
  const next = Math.max(0, character.value.combat.tempHp + delta)
  if (next === character.value.combat.tempHp) return
  await store.update(character.value.id, { combat: { ...character.value.combat, tempHp: next } })
}

// ── Exhaustion ────────────────────────────────────────────────────────────────

async function adjustExhaustion(delta: number) {
  if (!character.value) return
  const current = character.value.combat.exhaustion ?? 0
  const next = Math.max(0, Math.min(6, current + delta))
  if (next === current) return
  await store.update(character.value.id, { combat: { ...character.value.combat, exhaustion: next } })
}

// ── Death saves ───────────────────────────────────────────────────────────────

const deathSaves = computed(() =>
  character.value?.combat.deathSaves ?? { successes: 0, failures: 0 },
)

async function toggleDeathSave(type: 'successes' | 'failures', pip: number) {
  if (!character.value) return
  const current = deathSaves.value
  const next = pip <= current[type] ? pip - 1 : pip
  await store.update(character.value.id, {
    combat: {
      ...character.value.combat,
      deathSaves: { ...current, [type]: Math.max(0, Math.min(3, next)) },
    },
  })
}

// ── Saves & Skills ────────────────────────────────────────────────────────────

const SAVES: { key: AbilityName; label: string }[] = [
  { key: 'str', label: 'Strength'     },
  { key: 'dex', label: 'Dexterity'    },
  { key: 'con', label: 'Constitution' },
  { key: 'int', label: 'Intelligence' },
  { key: 'wis', label: 'Wisdom'       },
  { key: 'cha', label: 'Charisma'     },
]

const SKILLS = [
  { index: 'acrobatics',      name: 'Acrobatics',      ability: 'dex' as AbilityName },
  { index: 'animal-handling', name: 'Animal Handling',  ability: 'wis' as AbilityName },
  { index: 'arcana',          name: 'Arcana',           ability: 'int' as AbilityName },
  { index: 'athletics',       name: 'Athletics',        ability: 'str' as AbilityName },
  { index: 'deception',       name: 'Deception',        ability: 'cha' as AbilityName },
  { index: 'history',         name: 'History',          ability: 'int' as AbilityName },
  { index: 'insight',         name: 'Insight',          ability: 'wis' as AbilityName },
  { index: 'intimidation',    name: 'Intimidation',     ability: 'cha' as AbilityName },
  { index: 'investigation',   name: 'Investigation',    ability: 'int' as AbilityName },
  { index: 'medicine',        name: 'Medicine',         ability: 'wis' as AbilityName },
  { index: 'nature',          name: 'Nature',           ability: 'int' as AbilityName },
  { index: 'perception',      name: 'Perception',       ability: 'wis' as AbilityName },
  { index: 'performance',     name: 'Performance',      ability: 'cha' as AbilityName },
  { index: 'persuasion',      name: 'Persuasion',       ability: 'cha' as AbilityName },
  { index: 'religion',        name: 'Religion',         ability: 'int' as AbilityName },
  { index: 'sleight-of-hand', name: 'Sleight of Hand',  ability: 'dex' as AbilityName },
  { index: 'stealth',         name: 'Stealth',          ability: 'dex' as AbilityName },
  { index: 'survival',        name: 'Survival',         ability: 'wis' as AbilityName },
]

const skillSearch = ref('')

const filteredSkills = computed(() => {
  const q = skillSearch.value.trim().toLowerCase()
  return q ? SKILLS.filter(s => s.name.toLowerCase().includes(q)) : SKILLS
})

function fmt(n: number) { return n >= 0 ? `+${n}` : String(n) }

function saveBonus(ability: AbilityName): number {
  if (!character.value) return 0
  const base = mods.value[ability]
  return character.value.savingThrowProficiencies[ability] ? base + profBonus.value : base
}

function skillBonus(skill: (typeof SKILLS)[number]): number {
  if (!character.value) return 0
  const base = mods.value[skill.ability]
  const prof = character.value.skillProficiencies[skill.index]
  if (prof === 'expertise')  return base + profBonus.value * 2
  if (prof === 'proficient') return base + profBonus.value
  return base
}

function hasProficiency(skillIndex: string): boolean {
  const p = character.value?.skillProficiencies[skillIndex]
  return p === 'proficient' || p === 'expertise'
}

function profClass(skillIndex: string): string {
  const p = character.value?.skillProficiencies[skillIndex]
  if (p === 'expertise')  return 'bg-arcane-pale border-arcane-pale'
  if (p === 'proficient') return 'bg-gold-mid border-gold-mid'
  return 'bg-transparent border-mist/50'
}

const passivePerception = computed(() => {
  if (!character.value) return 10
  const override = character.value.overrides.passivePerception
  if (override !== undefined) return override
  const perc = SKILLS.find(s => s.index === 'perception')!
  return 10 + skillBonus(perc)
})

// ── Notes ─────────────────────────────────────────────────────────────────────

const notesText = ref('')
watch(character, (c) => { notesText.value = c?.notes ?? '' }, { immediate: true })

async function saveNotes() {
  if (!character.value) return
  await store.update(character.value.id, { notes: notesText.value })
}

// ── Rest ──────────────────────────────────────────────────────────────────────

const hitDie = computed(() =>
  CLASS_META[character.value?.identity.class.index ?? '']?.hitDie ?? 8,
)

function onShortRested(result: { healed: number; diceSpent: number; rolls: number[]; newHp: number; newHitDice: number }) {
  const c = character.value
  if (!c) return
  showShortRest.value = false
  store.update(c.id, {
    combat: { ...c.combat, currentHp: result.newHp, hitDiceRemaining: result.newHitDice },
  })
  const items: { label: string; value: string }[] = []
  if (result.diceSpent > 0) {
    const conMod = computeModifier(c.abilityScores.con)
    const conStr = conMod >= 0 ? `+${conMod}` : String(conMod)
    items.push(
      { label: 'Rolls', value: result.rolls.map(r => `${r}${conStr}`).join(', ') },
      { label: 'HP recovered', value: `+${result.healed} (${result.newHp} / ${c.combat.maxHp})` },
    )
  } else {
    items.push({ label: 'HP recovered', value: 'None (no dice spent)' })
  }
  items.push({ label: 'Hit dice left', value: `${result.newHitDice}d${hitDie.value}` })
  dialog.open({
    title: 'Short Rest',
    body: result.diceSpent > 0
      ? 'You spend a moment to catch your breath and tend your wounds.'
      : 'You take a short rest. Some abilities may recover without spending hit dice.',
    items,
  })
}

function longRest() {
  const c = character.value
  if (!c) return
  const regained = Math.max(1, Math.floor(c.combat.level / 2))
  const newHitDice = Math.min(c.combat.level, c.combat.hitDiceRemaining + regained)
  const updates: Partial<Character> = {
    combat: {
      ...c.combat,
      currentHp: c.combat.maxHp,
      tempHp: 0,
      hitDiceRemaining: newHitDice,
      deathSaves: { successes: 0, failures: 0 },
    },
  }
  const items: { label: string; value: string }[] = [
    { label: 'HP',          value: `Restored to ${c.combat.maxHp} / ${c.combat.maxHp}` },
    { label: 'Hit Dice',    value: `+${regained} recovered (${newHitDice}d${hitDie.value})` },
    { label: 'Death Saves', value: 'Reset' },
  ]
  if (c.spellcasting) {
    updates.spellcasting = {
      ...c.spellcasting,
      slotsUsed: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    }
    items.splice(1, 0, { label: 'Spell Slots', value: 'All recovered' })
  }
  store.update(c.id, updates)
  dialog.open({
    title: 'Long Rest',
    body: 'After a full rest, you awaken refreshed and restored.',
    items,
    variant: 'success',
  })
}

// ── Export ────────────────────────────────────────────────────────────────────

function downloadExport() {
  if (!character.value) return
  const json = store.exportOne(character.value.id)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${character.value.identity.name.replace(/\s+/g, '-')}.grimoire.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
