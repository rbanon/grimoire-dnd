<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <!-- Race picker -->
    <section class="space-y-4">
      <div class="rule-gold"><span>Race</span></div>

      <div v-if="racesLoading" class="flex justify-center py-8">
        <GrimoireSpinner />
      </div>
      <div v-else-if="racesError" class="text-sm text-blood-bright">Failed to load races.</div>
      <template v-else>
        <!-- 2014 Races -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <PickerCard
            v-for="race in races2014"
            :key="`2014:${race.index}`"
            :name="race.name"
            :glyph="getRaceMeta(race.index).glyph"
            :flavor="getRaceMeta(race.index).flavor"
            :tags="getRaceMeta(race.index).traits.slice(0, 2)"
            :selected="builder.draft.raceIndex === race.index && builder.draft.raceEdition === '2014'"
            :edition="race.edition"
            show-info
            @select="selectRace(race.index, race.name, race.edition)"
            @info="infoPanel.open({ kind: 'race', index: race.index, edition: race.edition })"
          />
        </div>

        <!-- 2014 / 2024 separator -->
        <div v-if="species2024.length" class="flex items-center gap-3 py-1">
          <div class="flex-1 h-px bg-shadow/50" />
          <span class="text-2xs font-heading tracking-widest uppercase text-arcane-pale/50">2024 Species</span>
          <div class="flex-1 h-px bg-shadow/50" />
        </div>

        <!-- 2024 Species -->
        <div v-if="species2024.length" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <PickerCard
            v-for="race in species2024"
            :key="`2024:${race.index}`"
            :name="race.name"
            :glyph="getRaceMeta(race.index).glyph"
            :flavor="getRaceMeta(race.index).flavor"
            :tags="getRaceMeta(race.index).traits.slice(0, 2)"
            :selected="builder.draft.raceIndex === race.index && builder.draft.raceEdition === '2024'"
            :edition="race.edition"
            show-info
            @select="selectRace(race.index, race.name, race.edition)"
            @info="infoPanel.open({ kind: 'race', index: race.index, edition: race.edition })"
          />
        </div>

        <!-- Homebrew separator + Custom race tile -->
        <div class="flex items-center gap-3 py-1">
          <div class="flex-1 h-px bg-shadow/50" />
          <span class="text-2xs font-heading tracking-widest uppercase text-arcane-pale/50">Homebrew</span>
          <div class="flex-1 h-px bg-shadow/50" />
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div
            class="flex items-center rounded border text-sm font-heading tracking-wide transition-all duration-150 cursor-pointer"
            :class="isCustom
              ? 'border-arcane-base/60 bg-arcane-deep/10 text-arcane-pale'
              : 'border-shadow border-dashed bg-abyss text-mist hover:border-arcane-base/30 hover:text-ash hover:bg-depths'"
            @click="selectCustomRace"
          >
            <span class="flex-1 px-4 py-3 text-left flex items-center gap-2">
              <PencilIcon :size="12" class="shrink-0 opacity-60" />
              Custom Race
            </span>
          </div>
        </div>
      </template>
      <p v-if="fieldErrors.race" class="mt-2 text-xs font-body text-blood-bright">
        Select a race to continue.
      </p>
    </section>

    <!-- Custom (homebrew) race form -->
    <Transition name="expand">
      <section v-if="isCustom" class="space-y-6">
        <div class="rule-gold"><span>Custom Race</span></div>

        <!-- Load a saved race from the user's collection -->
        <div v-if="auth.isAuthenticated && customContent.races.length" class="flex items-center gap-2">
          <span class="text-2xs font-heading tracking-wide uppercase text-mist shrink-0">Load a saved race</span>
          <AppSelect v-model="selectedSavedRaceId" class="flex-1 text-sm" @change="onSelectSavedRace">
            <option value="">Choose from your collection…</option>
            <option v-for="r in customContent.races" :key="r.id" :value="r.id">{{ r.name }}</option>
          </AppSelect>
        </div>

        <!-- Name -->
        <div class="space-y-1.5">
          <label class="text-2xs font-heading tracking-wide uppercase text-mist">Race Name</label>
          <input
            v-model.trim="builder.draft.raceName"
            type="text"
            maxlength="60"
            placeholder="e.g. Stormborn Aasimar"
            class="input-base w-full text-sm"
          />
          <p v-if="showValidation && !builder.draft.raceName.trim()" class="text-xs font-body text-blood-bright">
            Enter a name for your custom race.
          </p>
        </div>

        <!-- Ability score bonuses -->
        <div class="space-y-2">
          <div class="flex items-baseline justify-between gap-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Ability Score Bonuses</p>
            <span
              class="text-2xs font-heading tabular-nums"
              :class="raceAbilityTotal > 4 ? 'text-gold-mid' : 'text-arcane-pale'"
            >+{{ raceAbilityTotal }} total</span>
          </div>
          <p class="text-2xs font-body text-mist/60">
            These add straight to your character sheet. A typical race grants about +3 (e.g. +2 / +1).
          </p>
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <div
              v-for="ab in ABILITIES"
              :key="ab.key"
              class="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded border"
              :class="(builder.draft.raceAbilityBonuses[ab.key] ?? 0) > 0
                ? 'border-arcane-base/40 bg-arcane-deep/10'
                : 'border-shadow bg-depths/30'"
            >
              <span class="text-2xs font-heading tracking-[0.12em] uppercase text-mist">{{ ab.label }}</span>
              <span
                class="font-heading text-lg leading-none"
                :class="(builder.draft.raceAbilityBonuses[ab.key] ?? 0) > 0 ? 'text-arcane-pale' : 'text-mist/40'"
              >+{{ builder.draft.raceAbilityBonuses[ab.key] ?? 0 }}</span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="w-6 h-6 flex items-center justify-center rounded border text-sm font-heading transition-all"
                  :class="(builder.draft.raceAbilityBonuses[ab.key] ?? 0) > 0
                    ? 'border-shadow text-mist hover:border-blood-base/50 hover:text-blood-mid'
                    : 'border-shadow/20 text-mist/20 cursor-not-allowed'"
                  :disabled="(builder.draft.raceAbilityBonuses[ab.key] ?? 0) === 0"
                  @click="changeRaceAbility(ab.key, -1)"
                >−</button>
                <button
                  type="button"
                  class="w-6 h-6 flex items-center justify-center rounded border text-sm font-heading transition-all"
                  :class="canIncreaseRaceAbility(ab.key)
                    ? 'border-shadow text-mist hover:border-arcane-base/50 hover:text-arcane-pale'
                    : 'border-shadow/20 text-mist/20 cursor-not-allowed'"
                  :disabled="!canIncreaseRaceAbility(ab.key)"
                  @click="changeRaceAbility(ab.key, 1)"
                >+</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Size / Speed / Darkvision -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="space-y-1.5">
            <label class="text-2xs font-heading tracking-wide uppercase text-mist">Size</label>
            <div class="flex gap-1.5">
              <button
                v-for="size in SIZES"
                :key="size"
                type="button"
                class="flex-1 px-2 py-2 rounded border text-xs font-heading tracking-wide transition-all"
                :class="builder.draft.raceSizeCategory === size
                  ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-deep'
                  : 'border-shadow text-ash hover:border-gold-dim/40'"
                @click="builder.draft.raceSizeCategory = size"
              >{{ size }}</button>
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="text-2xs font-heading tracking-wide uppercase text-mist">Speed (ft.)</label>
            <input
              v-model.number="builder.draft.raceSpeed"
              type="number"
              min="0"
              max="60"
              step="5"
              class="input-base w-full text-sm"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-2xs font-heading tracking-wide uppercase text-mist">Darkvision</label>
            <div class="flex gap-1.5">
              <button
                v-for="opt in DARKVISION_OPTIONS"
                :key="opt.value"
                type="button"
                class="flex-1 px-2 py-2 rounded border text-xs font-heading tracking-wide transition-all"
                :class="builder.draft.raceDarkvision === opt.value
                  ? 'border-arcane-base/60 bg-arcane-deep/10 text-arcane-pale'
                  : 'border-shadow text-ash hover:border-arcane-base/30'"
                @click="builder.draft.raceDarkvision = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>
        </div>

        <!-- Damage resistances -->
        <div class="space-y-2">
          <p class="text-2xs font-heading tracking-wide uppercase text-mist">
            Damage Resistances <span class="normal-case font-body text-mist/50">(optional)</span>
          </p>
          <div v-if="damageTypes.length" class="flex flex-wrap gap-1.5">
            <button
              v-for="dt in damageTypes"
              :key="dt.index"
              type="button"
              class="px-2.5 py-1 rounded border text-xs font-heading tracking-wide transition-all"
              :class="isResistanceSelected(dt.index)
                ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale'
                : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone'"
              @click="toggleResistance(dt.index)"
            >{{ dt.name }}</button>
          </div>
          <p v-else class="text-xs font-body text-mist/50 italic">Loading damage types…</p>
        </div>

        <!-- Skill proficiencies -->
        <div class="space-y-2">
          <p class="text-2xs font-heading tracking-wide uppercase text-mist">
            Skill Proficiencies <span class="normal-case font-body text-mist/50">(optional)</span>
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              v-for="skill in SKILLS"
              :key="skill.index"
              type="button"
              class="text-left px-3 py-2 rounded border text-xs font-heading tracking-wide transition-all duration-100"
              :class="isRaceSkillSelected(skill.index)
                ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale'
                : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone'"
              @click="toggleRaceSkill(skill.index)"
            >
              {{ skill.name }}
              <span class="text-mist/40 font-body normal-case">{{ skill.ability.toUpperCase() }}</span>
            </button>
          </div>
        </div>

        <!-- Tool / weapon proficiencies -->
        <div class="space-y-2">
          <p class="text-2xs font-heading tracking-wide uppercase text-mist">
            Tool / Weapon Proficiencies <span class="normal-case font-body text-mist/50">(optional)</span>
          </p>
          <div class="flex gap-2">
            <input
              v-model="toolProfInput"
              type="text"
              maxlength="60"
              placeholder="e.g. Smith's tools, Longsword"
              class="input-base flex-1 text-sm"
              @keydown.enter.prevent="addToolProf"
            />
            <button
              type="button"
              class="px-3 py-2 rounded border border-shadow text-xs font-heading text-ash hover:border-arcane-base/40 hover:text-arcane-pale transition-all"
              @click="addToolProf"
            >Add</button>
          </div>
          <div v-if="builder.draft.raceCustomToolProfs.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="(prof, i) in builder.draft.raceCustomToolProfs"
              :key="`${prof}-${i}`"
              class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-shadow text-xs font-heading text-ash"
            >
              {{ prof }}
              <button type="button" class="text-mist/50 hover:text-blood-mid" aria-label="Remove proficiency" @click="removeToolProf(i)">×</button>
            </span>
          </div>
        </div>

        <!-- Bonus languages -->
        <div class="space-y-1.5">
          <label class="text-2xs font-heading tracking-wide uppercase text-mist">Bonus Languages</label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="builder.draft.raceLanguageChoices"
              type="number"
              min="0"
              max="5"
              class="input-base w-20 text-sm"
            />
            <p class="text-xs font-body text-mist/60">
              Beyond Common. You'll pick the specific languages in Step VII — Proficiencies.
            </p>
          </div>
        </div>

        <!-- Traits -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">
              Racial Traits <span class="normal-case font-body text-mist/50">(optional)</span>
            </p>
            <button
              type="button"
              class="text-2xs font-heading text-arcane-pale/80 hover:text-arcane-pale transition-all"
              @click="addTrait"
            >+ Add trait</button>
          </div>
          <div v-if="builder.draft.raceCustomTraits.length" class="space-y-2">
            <div
              v-for="(trait, i) in builder.draft.raceCustomTraits"
              :key="i"
              class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-2"
            >
              <div class="flex gap-2">
                <input
                  v-model="trait.name"
                  type="text"
                  maxlength="60"
                  placeholder="Trait name (e.g. Celestial Resistance)"
                  class="input-base flex-1 text-sm"
                />
                <button type="button" class="px-2 text-mist/50 hover:text-blood-mid" aria-label="Remove trait" @click="removeTrait(i)">×</button>
              </div>
              <textarea
                v-model="trait.desc"
                rows="2"
                maxlength="600"
                placeholder="Describe the trait…"
                class="input-base w-full text-sm resize-none"
              />
            </div>
          </div>
          <p v-else class="text-xs font-body text-mist/50 italic">
            No traits yet. Add special abilities, senses, or flavor perks for your race.
          </p>
        </div>

        <!-- Save to collection (auth only) -->
        <div v-if="auth.isAuthenticated" class="flex items-center justify-between gap-3 pt-1 border-t border-shadow/40">
          <p class="text-2xs font-body text-mist/60">Save this race to reuse it in other characters and share it with the community.</p>
          <button
            type="button"
            class="shrink-0 px-3.5 py-2 rounded border text-xs font-heading tracking-wide transition-all"
            :class="builder.draft.raceName.trim() && !savingRace
              ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale hover:bg-arcane-deep/25'
              : 'border-shadow/40 text-mist/40 cursor-not-allowed'"
            :disabled="!builder.draft.raceName.trim() || savingRace"
            @click="saveCurrentRace"
          >{{ savingRace ? 'Saving…' : (savedRace ? 'Update in collection' : 'Save to my collection') }}</button>
        </div>
        <p v-else class="text-2xs font-body text-mist/50 italic pt-1 border-t border-shadow/40">
          Sign in to save this race to your collection and reuse it later.
        </p>
      </section>
    </Transition>

    <!-- Race detail panel (SRD races only) -->
    <Transition name="expand">
      <section v-if="builder.draft.raceIndex && !isCustom" class="space-y-4">
        <div class="rule-gold"><span>{{ raceEdition === '2024' ? 'Species' : 'Race' }} Details</span></div>

        <div v-if="raceDetailLoading" class="flex justify-center py-4">
          <GrimoireSpinner />
        </div>

        <!-- 2024 species detail -->
        <template v-else-if="speciesDetail">
          <div class="flex flex-wrap gap-2">
            <span class="px-2.5 py-1 rounded border border-gold-dim/30 text-xs font-heading text-gold-dim">
              Speed {{ speciesDetail.speed }} ft
            </span>
            <span class="px-2.5 py-1 rounded border border-gold-dim/30 text-xs font-heading text-gold-dim">
              Size {{ speciesDetail.size }}
            </span>
          </div>
          <!-- 2024: no fixed ability bonuses -->
          <div class="flex items-start gap-2 px-3 py-2 rounded border border-arcane-base/20 bg-arcane-deep/10">
            <span class="text-arcane-pale/60 text-xs shrink-0 mt-0.5">✦</span>
            <p class="text-xs font-body text-arcane-pale/80">
              <strong>2024 rules:</strong> Species don't grant fixed ability score bonuses.
              Distribute your bonuses freely in the Ability Scores step.
            </p>
          </div>
          <!-- Traits -->
          <div class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Species Traits</p>
            <div v-if="traitDetailsLoading && speciesDetail.traits.length" class="flex justify-center py-2"><GrimoireSpinner /></div>
            <div v-else-if="traitDetails.length" class="space-y-2">
              <div
                v-for="trait in traitDetails"
                :key="trait.index"
                class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-1"
              >
                <p class="text-sm font-heading text-vellum">{{ trait.name }}</p>
                <p v-for="(line, i) in traitLines(trait)" :key="i" class="text-xs font-body text-ash leading-relaxed">{{ line }}</p>
              </div>
            </div>
            <p v-else class="text-xs font-body text-mist/60 italic">
              Trait details are not available for this species in the 2024 SRD API.
            </p>
          </div>
        </template>

        <!-- 2014 race detail -->
        <template v-else-if="raceDetail">
          <div class="flex flex-wrap gap-2">
            <span class="px-2.5 py-1 rounded border border-gold-dim/30 text-xs font-heading text-gold-dim">
              Speed {{ raceDetail.speed }} ft
            </span>
            <span class="px-2.5 py-1 rounded border border-gold-dim/30 text-xs font-heading text-gold-dim">
              Size {{ raceDetail.size }}
            </span>
            <span
              v-for="ab in raceDetail.ability_bonuses"
              :key="ab.ability_score.index"
              class="px-2.5 py-1 rounded border border-gold-dim/25 bg-gold-dim/8 text-xs font-heading text-gold-dim"
            >
              {{ ab.ability_score.name.slice(0, 3).toUpperCase() }} +{{ ab.bonus }}
            </span>
          </div>
          <div v-if="raceDetail.languages.length" class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Languages</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="lang in raceDetail.languages" :key="lang.index" class="px-2 py-0.5 rounded text-xs font-body text-stone border border-shadow">{{ lang.name }}</span>
            </div>
            <p v-if="raceDetail.language_desc" class="text-xs font-body text-mist/70 italic leading-relaxed">{{ raceDetail.language_desc }}</p>
          </div>
          <div class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Racial Traits</p>
            <div v-if="traitDetailsLoading && raceDetail.traits.length" class="flex justify-center py-2"><GrimoireSpinner /></div>
            <div v-else-if="traitDetails.length" class="space-y-2">
              <div v-for="trait in traitDetails" :key="trait.index" class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-1">
                <p class="text-sm font-heading text-vellum">{{ trait.name }}</p>
                <p v-for="(line, i) in traitLines(trait)" :key="i" class="text-xs font-body text-ash leading-relaxed">{{ line }}</p>
              </div>
            </div>
            <p v-else-if="!raceDetail.traits.length" class="text-xs font-body text-mist/60 italic">
              No specific racial traits listed for this race.
            </p>
          </div>
          <p v-if="raceDetail.size_description" class="text-xs font-body text-mist/60 italic leading-relaxed">{{ raceDetail.size_description }}</p>
        </template>
      </section>
    </Transition>

    <!-- Subrace / Subspecies picker -->
    <Transition name="expand">
      <section v-if="builder.draft.availableSubraces.length > 0" class="space-y-4">
        <div class="rule-gold"><span>{{ raceEdition === '2024' ? 'Subspecies' : 'Subrace' }}</span></div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="sub in builder.draft.availableSubraces"
            :key="sub.index"
            type="button"
            class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
            :class="builder.draft.subraceIndex === sub.index
              ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-deep'
              : fieldErrors.subrace
                ? 'border-blood-base/50 text-ash hover:border-blood-base/70'
                : 'border-gold-dim/25 bg-depths text-stone hover:border-gold-dim/50 hover:text-vellum hover:bg-gold-dim/5'"
            @click="selectSubrace(sub.index, sub.name)"
          >
            {{ sub.name }}
          </button>
        </div>
        <p v-if="fieldErrors.subrace" class="text-xs font-body text-blood-bright">
          Select a subrace to continue.
        </p>
      </section>
    </Transition>

    <!-- Subrace detail panel -->
    <Transition name="expand">
      <section v-if="builder.draft.subraceIndex" class="space-y-4">
        <div class="rule-gold"><span>Subrace Details</span></div>

        <div v-if="subraceDetailLoading" class="flex justify-center py-4">
          <GrimoireSpinner />
        </div>

        <template v-else-if="subraceDetail">
          <!-- Subrace ASI bonuses (2014 only) -->
          <div v-if="raceEdition === '2014' && subraceDetail.ability_bonuses.length" class="flex flex-wrap gap-2">
            <span
              v-for="ab in subraceDetail.ability_bonuses"
              :key="ab.ability_score.index"
              class="px-2.5 py-1 rounded border border-gold-dim/25 bg-gold-dim/8 text-xs font-heading text-gold-dim"
            >
              {{ ab.ability_score.name.slice(0, 3).toUpperCase() }} +{{ ab.bonus }}
            </span>
          </div>

          <!-- Subrace description -->
          <p v-if="raceEdition === '2014' && subraceDetail.desc" class="text-xs font-body text-ash leading-relaxed">
            {{ subraceDetail.desc }}
          </p>

          <!-- Subrace traits -->
          <div v-if="subraceDetail.racial_traits.length" class="space-y-2">
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Subrace Traits</p>
            <div v-if="subraceTraitDetailsLoading" class="flex justify-center py-2">
              <GrimoireSpinner />
            </div>
            <p v-else-if="!subraceTraitDetails.length" class="text-xs font-body text-mist/60 italic">
              Trait details are not available for this subspecies in the SRD API.
            </p>
            <div v-else class="space-y-2">
              <div
                v-for="trait in subraceTraitDetails"
                :key="trait.index"
                class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-1"
              >
                <p class="text-sm font-heading text-vellum">{{ trait.name }}</p>
                <p
                  v-for="(line, j) in traitLines(trait)"
                  :key="j"
                  class="text-xs font-body text-ash leading-relaxed"
                >{{ line }}</p>
              </div>
            </div>
          </div>
        </template>
      </section>
    </Transition>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { PencilIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { useBuilderStore } from '@/character-builder/builderStore'
import { getRaceMeta } from '@/character-builder/classMeta'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import { useAuthStore } from '@/auth/store'
import { useCustomContentStore } from '@/custom-content/store'
import { useToast } from '@/shared/composables/useToast'
import { SKILLS } from '@/shared/lib/skillAbilityMap'
import type { ApiRace, ApiSubrace, ApiTrait, Api2024Species, ApiReference, EditionTag } from '@/shared/types/api'
import type { AbilityScores } from '@/shared/types/character'
import type { CustomRace, CustomRaceInput } from '@/shared/types/customContent'
import PickerCard from '@/character-builder/components/PickerCard.vue'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'
import AppSelect from '@/shared/ui/AppSelect.vue'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()

const isCustom = computed(() => builder.draft.raceIndex === 'custom')

// Trait descriptions differ by edition: 2014 uses `desc` (string[]), 2024 uses
// `description` (single markdown string). Normalize to an array of lines for rendering.
function traitLines(trait: ApiTrait): string[] {
  if (trait.desc && trait.desc.length) return trait.desc
  if (trait.description) return [trait.description]
  return []
}

const fieldErrors = computed(() => ({
  race:    showValidation.value && !builder.draft.raceIndex,
  subrace: showValidation.value && builder.draft.availableSubraces.length > 0 && !builder.draft.subraceIndex,
}))

// ── Race / species lists ───────────────────────────────────────────────────────

const { data: raceList2014, isPending: racesLoading2014, isError: racesError } = useQuery({
  queryKey: ['races'],
  queryFn: () => fiveEApi.listRaces(),
  staleTime: Infinity,
})
const { data: speciesList2024, isPending: racesLoading2024 } = useQuery({
  queryKey: ['species-2024'],
  queryFn: () => fiveEApi.listSpecies(),
  staleTime: Infinity,
})

const racesLoading = computed(() => racesLoading2014.value || racesLoading2024.value)
const races2014 = computed(() =>
  (raceList2014.value?.results ?? []).map(r => ({ ...r, edition: '2014' as EditionTag }))
)
const species2024 = computed(() =>
  (speciesList2024.value?.results ?? []).map(r => ({ ...r, edition: '2024' as EditionTag }))
)

// Auto-grant languages for 2024 species (API doesn't provide language data)
const raceEdition = computed(() => builder.draft.raceEdition ?? '2014')

// ── Race detail panel (2014 race) ─────────────────────────────────────────────

const raceIndex = computed(() => builder.draft.raceIndex)

const { data: raceDetail2014, isPending: raceDetailLoading2014 } = useQuery({
  queryKey: computed(() => ['race-detail', raceIndex.value]),
  queryFn: () => fiveEApi.getRace(raceIndex.value) as Promise<ApiRace>,
  staleTime: Infinity,
  enabled: computed(() => !!raceIndex.value && !isCustom.value && raceEdition.value === '2014'),
})

const { data: speciesDetail2024, isPending: raceDetailLoading2024 } = useQuery({
  queryKey: computed(() => ['species-detail-2024', raceIndex.value]),
  queryFn: () => fiveEApi.getSpecies(raceIndex.value),
  staleTime: Infinity,
  enabled: computed(() => !!raceIndex.value && raceEdition.value === '2024'),
})

const raceDetail = computed(() => raceEdition.value === '2024' ? null : raceDetail2014.value ?? null)
const speciesDetail = computed(() => raceEdition.value === '2024' ? speciesDetail2024.value ?? null : null)
// Only the active edition's query matters — a DISABLED query reports isPending:true in
// TanStack v5, so `loading2014 || loading2024` would keep the spinner stuck forever.
const raceDetailLoading = computed(() =>
  raceEdition.value === '2024' ? raceDetailLoading2024.value : raceDetailLoading2014.value
)

const raceTraitIndices = computed(() => {
  if (raceEdition.value === '2024') return speciesDetail.value?.traits.map(t => t.index) ?? []
  return raceDetail.value?.traits.map(t => t.index) ?? []
})

// Fetch traits resiliently: a single 404 shouldn't blank the entire list.
async function fetchTraits(indices: string[], edition: EditionTag): Promise<ApiTrait[]> {
  const results = await Promise.allSettled(
    indices.map(i => edition === '2024' ? fiveEApi.getTrait2024(i) : fiveEApi.getTrait(i)),
  )
  return results
    .filter((r): r is PromiseFulfilledResult<ApiTrait> => r.status === 'fulfilled')
    .map(r => r.value)
}

const { data: traitDetailsList, isPending: traitDetailsLoading } = useQuery({
  queryKey: computed(() => ['race-traits', raceEdition.value, ...raceTraitIndices.value]),
  queryFn: () => fetchTraits(raceTraitIndices.value, raceEdition.value),
  staleTime: Infinity,
  enabled: computed(() => raceTraitIndices.value.length > 0),
})
const traitDetails = computed(() => traitDetailsList.value ?? [])

// ── Subrace / subspecies detail ───────────────────────────────────────────────

const subraceIndex = computed(() => builder.draft.subraceIndex)

const { data: subraceDetail, isPending: subraceDetailLoading } = useQuery({
  queryKey: computed(() => ['subrace-detail', subraceIndex.value, raceEdition.value]),
  queryFn: () => raceEdition.value === '2024'
    ? fiveEApi.getSubspecies(subraceIndex.value).then(d => ({ ...d, racial_traits: d.traits, ability_bonuses: [] })) as Promise<ApiSubrace>
    : fiveEApi.getSubrace(subraceIndex.value) as Promise<ApiSubrace>,
  staleTime: Infinity,
  enabled: computed(() => !!subraceIndex.value),
})

const subraceTraitIndices = computed(() => subraceDetail.value?.racial_traits.map(t => t.index) ?? [])

const { data: subraceTraitDetailsList, isPending: subraceTraitDetailsLoading } = useQuery({
  queryKey: computed(() => ['subrace-traits', raceEdition.value, ...subraceTraitIndices.value]),
  queryFn: () => fetchTraits(subraceTraitIndices.value, raceEdition.value),
  staleTime: Infinity,
  enabled: computed(() => subraceTraitIndices.value.length > 0),
})
const subraceTraitDetails = computed(() => subraceTraitDetailsList.value ?? [])

// ── Select handlers ───────────────────────────────────────────────────────────

async function selectRace(index: string, name: string, edition: EditionTag) {
  builder.draft.raceIndex = index
  builder.draft.raceName = name
  builder.draft.raceEdition = edition
  builder.draft.subraceIndex = ''
  builder.draft.subraceName = ''
  builder.draft.availableSubraces = []
  builder.draft.subraceAbilityBonuses = {}
  builder.draft.raceProfChoices = 0
  builder.draft.raceProfOptions = []
  builder.draft.selectedRaceProfs = []
  builder.draft.raceSkillProficiencies = []
  builder.draft.raceAbilityBonuses = {}
  builder.draft.raceLanguageChoices = 0

  if (edition === '2024') {
    try {
      const detail: Api2024Species = await fiveEApi.getSpecies(index)
      builder.draft.raceSpeed = detail.speed
      builder.draft.raceSizeCategory = String(detail.size ?? 'Medium')
      // 2024 species don't grant fixed ability bonuses — player distributes freely
      builder.draft.raceAbilityBonuses = {}
      // 2024 RAW: languages come from your origin, not your species — every character
      // knows Common plus two languages of their choice (3 total, same count for everyone).
      // The 2024 SRD API exposes neither species nor background languages, so auto-grant
      // only Common and offer the two origin choices here (this step always runs).
      const autoLangs = ['common']
      const prevAutoLangs = builder.draft.raceAutoLanguages ?? []
      const userChosen = builder.draft.selectedLanguages.filter(l => !prevAutoLangs.includes(l))
      builder.draft.raceAutoLanguages = autoLangs
      builder.draft.raceLanguageCount = autoLangs.length
      builder.draft.raceLanguageChoices = 2
      builder.draft.selectedLanguages = [...new Set([...autoLangs, ...userChosen])]
      builder.draft.availableSubraces = detail.subspecies.map(s => ({ index: s.index, name: s.name }))
    } catch (err) { console.warn('[StepRace] selectSpecies (2024) failed:', err) }
    return
  }

  try {
    const detail: ApiRace = await fiveEApi.getRace(index)
    builder.draft.raceSpeed = detail.speed
    builder.draft.raceSizeCategory = detail.size
    builder.draft.raceAbilityBonuses = detail.ability_bonuses.reduce((acc, ab) => {
      const key = ab.ability_score.index as keyof typeof acc
      acc[key] = (acc[key] ?? 0) + ab.bonus
      return acc
    }, {} as Record<string, number>)
    builder.draft.availableSubraces = detail.subraces.map(s => ({ index: s.index, name: s.name }))
    builder.draft.raceLanguageCount = detail.languages.length || 1
    const oldRaceLanguages = builder.draft.raceAutoLanguages ?? []
    const newRaceLanguages = detail.languages.map(l => l.index)
    const userChosenLanguages = builder.draft.selectedLanguages.filter(l => !oldRaceLanguages.includes(l))
    builder.draft.raceAutoLanguages = newRaceLanguages
    // Races like Human/Half-Elf let you choose extra language(s) on top of the fixed ones
    builder.draft.raceLanguageChoices = detail.language_options?.choose ?? 0
    builder.draft.selectedLanguages = [...new Set([...newRaceLanguages, ...userChosenLanguages])]
    builder.draft.raceSkillProficiencies = (detail.starting_proficiencies ?? [])
      .filter(p => p.index.startsWith('skill-'))
      .map(p => p.index.replace(/^skill-/, ''))
    if (detail.starting_proficiency_options) {
      builder.draft.raceProfChoices = detail.starting_proficiency_options.choose
      builder.draft.raceProfOptions = (detail.starting_proficiency_options.from?.options ?? [])
        .map(o => ({ index: o.item.index, name: o.item.name }))
    }
  } catch (err) { console.warn('[StepRace] selectRace failed:', err) }
}

async function selectSubrace(index: string, name: string) {
  builder.draft.subraceIndex = index
  builder.draft.subraceName = name
  builder.draft.subraceAbilityBonuses = {}
  if (raceEdition.value === '2024') return // 2024 subspecies have no ability bonuses
  try {
    const detail: ApiSubrace = await fiveEApi.getSubrace(index)
    builder.draft.subraceAbilityBonuses = detail.ability_bonuses.reduce((acc, ab) => {
      const key = ab.ability_score.index as keyof typeof acc
      acc[key] = (acc[key] ?? 0) + ab.bonus
      return acc
    }, {} as Record<string, number>)
  } catch (err) { console.warn('[StepRace] selectSubrace failed:', err) }
}

// ── Custom (homebrew) race ─────────────────────────────────────────────────────

const ABILITIES: { key: keyof AbilityScores; label: string }[] = [
  { key: 'str', label: 'STR' }, { key: 'dex', label: 'DEX' }, { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' }, { key: 'wis', label: 'WIS' }, { key: 'cha', label: 'CHA' },
]
const SIZES = ['Small', 'Medium', 'Large']
const DARKVISION_OPTIONS = [
  { value: 0, label: 'None' }, { value: 60, label: '60 ft.' }, { value: 120, label: '120 ft.' },
]

// Damage types for the resistance picker (same source as the sheet's Traits editor)
const { data: damageTypesData } = useQuery({
  queryKey: ['damage-types'],
  queryFn: () => fiveEApi.listDamageTypes(),
  staleTime: Infinity,
  enabled: computed(() => isCustom.value),
})
const damageTypes = computed(() =>
  (damageTypesData.value?.results ?? []).map((d: ApiReference) => ({ index: d.index, name: d.name })),
)

// Ability bonus allocator. Homebrew-friendly: 0..+3 per ability, no hard total cap (a hint
// appears past the usual ~+3 racial budget). effectiveScores sums these and caps final at 20.
const raceAbilityTotal = computed(() =>
  Object.values(builder.draft.raceAbilityBonuses).reduce((s, v) => s + (v ?? 0), 0),
)
function canIncreaseRaceAbility(key: keyof AbilityScores): boolean {
  return (builder.draft.raceAbilityBonuses[key] ?? 0) < 3
}
function changeRaceAbility(key: keyof AbilityScores, delta: number) {
  const current = builder.draft.raceAbilityBonuses[key] ?? 0
  const val = current + delta
  if (val < 0 || val > 3) return
  const next = { ...builder.draft.raceAbilityBonuses }
  if (val === 0) delete next[key]
  else next[key] = val
  builder.draft.raceAbilityBonuses = next
}

function isRaceSkillSelected(index: string): boolean {
  return builder.draft.raceSkillProficiencies.includes(index)
}
function toggleRaceSkill(index: string) {
  const cur = builder.draft.raceSkillProficiencies
  builder.draft.raceSkillProficiencies = cur.includes(index)
    ? cur.filter(s => s !== index)
    : [...cur, index]
}

function isResistanceSelected(index: string): boolean {
  return builder.draft.raceResistances.includes(index)
}
function toggleResistance(index: string) {
  const cur = builder.draft.raceResistances
  builder.draft.raceResistances = cur.includes(index)
    ? cur.filter(r => r !== index)
    : [...cur, index]
}

function addTrait() {
  builder.draft.raceCustomTraits = [...builder.draft.raceCustomTraits, { name: '', desc: '' }]
}
function removeTrait(i: number) {
  builder.draft.raceCustomTraits = builder.draft.raceCustomTraits.filter((_, idx) => idx !== i)
}

const toolProfInput = ref('')
function addToolProf() {
  const v = toolProfInput.value.trim()
  if (v && !builder.draft.raceCustomToolProfs.includes(v)) {
    builder.draft.raceCustomToolProfs = [...builder.draft.raceCustomToolProfs, v]
  }
  toolProfInput.value = ''
}
function removeToolProf(i: number) {
  builder.draft.raceCustomToolProfs = builder.draft.raceCustomToolProfs.filter((_, idx) => idx !== i)
}

function selectCustomRace() {
  builder.draft.raceIndex = 'custom'
  builder.draft.raceName = ''
  builder.draft.raceEdition = '2014'
  builder.draft.raceSpeed = 30
  builder.draft.raceSizeCategory = 'Medium'
  builder.draft.raceAbilityBonuses = {}
  // Clear any subrace/proficiency state from a previously selected SRD race
  builder.draft.subraceIndex = ''
  builder.draft.subraceName = ''
  builder.draft.availableSubraces = []
  builder.draft.subraceAbilityBonuses = {}
  builder.draft.raceProfChoices = 0
  builder.draft.raceProfOptions = []
  builder.draft.selectedRaceProfs = []
  builder.draft.raceSkillProficiencies = []
  // Homebrew-specific fields
  builder.draft.raceResistances = []
  builder.draft.raceDarkvision = 0
  builder.draft.raceCustomTraits = []
  builder.draft.raceCustomToolProfs = []
  builder.draft.savedCustomRaceId = ''
  toolProfInput.value = ''
  // Languages: everyone knows Common; extra languages are chosen in Step VII (Proficiencies)
  const prevAuto = builder.draft.raceAutoLanguages ?? []
  const userChosen = builder.draft.selectedLanguages.filter(l => !prevAuto.includes(l))
  builder.draft.raceAutoLanguages = ['common']
  builder.draft.raceLanguageCount = 1
  builder.draft.raceLanguageChoices = 2
  builder.draft.selectedLanguages = [...new Set(['common', ...userChosen])]
}

// ── Save / load custom races to the user's cloud collection ─────────────────────

const auth = useAuthStore()
const customContent = useCustomContentStore()
const savingRace = ref(false)
const selectedSavedRaceId = ref('')

onMounted(() => {
  if (auth.isAuthenticated && !customContent.loaded) customContent.loadMine()
})

function draftToCustomRaceInput(): CustomRaceInput {
  const d = builder.draft
  return {
    name: d.raceName.trim(),
    edition: '2014',
    abilityBonuses: { ...d.raceAbilityBonuses },
    size: d.raceSizeCategory,
    speed: d.raceSpeed,
    darkvision: d.raceDarkvision,
    resistances: [...d.raceResistances],
    skillProficiencies: [...d.raceSkillProficiencies],
    toolProficiencies: [...d.raceCustomToolProfs],
    languageChoices: d.raceLanguageChoices,
    traits: d.raceCustomTraits.map(t => ({ name: t.name, desc: t.desc })),
    isPublic: false,
  }
}

// The collection entry this custom race maps to: the tracked id, else a same-name race.
// Drives create-vs-update so re-saving never duplicates.
const savedRace = computed<CustomRace | null>(() => {
  const id = builder.draft.savedCustomRaceId
  if (id) {
    const byId = customContent.races.find(r => r.id === id)
    if (byId) return byId
  }
  const name = builder.draft.raceName.trim().toLowerCase()
  if (!name) return null
  return customContent.races.find(r => r.name.trim().toLowerCase() === name) ?? null
})

async function saveCurrentRace() {
  const name = builder.draft.raceName.trim()
  if (savingRace.value || !name) return
  savingRace.value = true
  try {
    const input = draftToCustomRaceInput()
    const existing = savedRace.value
    if (existing) {
      await customContent.updateRace(existing.id, input)
      builder.draft.savedCustomRaceId = existing.id
      useToast().success('Custom race updated in your collection.')
    } else {
      const created = await customContent.createRace(input)
      if (created) builder.draft.savedCustomRaceId = created.id
    }
  } finally {
    savingRace.value = false
  }
}

function applyCustomRace(race: CustomRace) {
  selectCustomRace()
  const d = builder.draft
  d.savedCustomRaceId = race.id
  d.raceName = race.name
  d.raceAbilityBonuses = { ...race.abilityBonuses }
  d.raceSizeCategory = race.size
  d.raceSpeed = race.speed
  d.raceDarkvision = race.darkvision
  d.raceResistances = [...race.resistances]
  d.raceSkillProficiencies = [...race.skillProficiencies]
  d.raceCustomToolProfs = [...race.toolProficiencies]
  d.raceLanguageChoices = race.languageChoices
  d.raceCustomTraits = race.traits.map(t => ({ name: t.name, desc: t.desc }))
}

function onSelectSavedRace() {
  const race = customContent.races.find(r => r.id === selectedSavedRaceId.value)
  if (race) applyCustomRace(race)
  selectedSavedRaceId.value = ''
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 1200px; }
</style>
