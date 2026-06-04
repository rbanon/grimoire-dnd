<template>
  <Teleport to="body">
    <Transition name="levelup-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown.esc="handleEsc"
      >
        <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="!saving && handleEsc()" />

        <div
          role="dialog"
          aria-modal="true"
          class="relative w-full max-w-md bg-void border border-shadow rounded-lg shadow-2xl flex flex-col"
          style="max-height: 85vh"
        >
          <div class="h-0.5 w-full bg-gold-mid shrink-0" />

          <!-- Step progress -->
          <div v-if="steps.length > 1" class="flex items-center justify-center gap-2 pt-3 shrink-0">
            <div
              v-for="(s, i) in steps"
              :key="s"
              class="rounded-full transition-all duration-200"
              :class="i === currentStepIndex
                ? 'w-4 h-1.5 bg-gold-mid'
                : i < currentStepIndex
                  ? 'w-1.5 h-1.5 bg-gold-dim/50'
                  : 'w-1.5 h-1.5 bg-shadow'"
            />
          </div>

          <!-- ─────────────────────────── STEP: HP ─────────────────────────── -->
          <div v-if="currentStep === 'hp'" class="px-5 py-4 space-y-5 overflow-y-auto flex-1">

            <div>
              <p class="font-heading text-base tracking-wide text-gold-mid">
                Level Up
                <span class="font-body text-sm text-mist font-normal ml-1.5">
                  {{ character.identity.class.name }} {{ character.combat.level }} → {{ newLevel }}
                </span>
              </p>
              <p class="text-xs font-body text-mist/70 mt-0.5">{{ character.identity.name }}</p>
            </div>

            <p v-if="atMaxLevel" class="text-sm font-body text-mist italic text-center py-3">
              This character has reached the maximum level (20).
            </p>

            <!-- HP gain -->
            <section v-else class="space-y-2">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Hit Points Gained</p>
              <div class="grid grid-cols-3 gap-2">
                <!-- Roll -->
                <button
                  type="button"
                  class="flex flex-col items-start px-2.5 py-3 rounded border transition-all"
                  :class="hpChoice === 'roll'
                    ? 'border-gold-mid/60 bg-depths/60'
                    : 'border-shadow bg-depths/20 hover:border-shadow/80'"
                  @click="selectRoll"
                >
                  <span class="text-2xs font-heading uppercase tracking-wider text-mist mb-2">Roll</span>
                  <span
                    class="font-heading text-2xl leading-none"
                    :class="hpChoice === 'roll' ? 'text-gold-mid' : 'text-ash'"
                  >{{ rollDisplay }}</span>
                  <span class="text-2xs font-body text-mist mt-1.5 leading-tight">
                    {{ rawDie === null
                      ? `d${hitDie}`
                      : `${rawDie}${conMod >= 0 ? '+' : ''}${conMod}` }}
                  </span>
                </button>
                <!-- Average -->
                <button
                  type="button"
                  class="flex flex-col items-start px-2.5 py-3 rounded border transition-all"
                  :class="hpChoice === 'average'
                    ? 'border-gold-mid/60 bg-depths/60'
                    : 'border-shadow bg-depths/20 hover:border-shadow/80'"
                  @click="hpChoice = 'average'"
                >
                  <span class="text-2xs font-heading uppercase tracking-wider text-mist mb-2">Average</span>
                  <span
                    class="font-heading text-2xl leading-none"
                    :class="hpChoice === 'average' ? 'text-gold-mid' : 'text-ash'"
                  >+{{ averageHp }}</span>
                  <span class="text-2xs font-body text-mist mt-1.5 leading-tight">
                    ⌀{{ Math.floor(hitDie / 2) + 1 }}{{ conMod >= 0 ? '+' : '' }}{{ conMod }}
                  </span>
                </button>
                <!-- Manual -->
                <div
                  class="flex flex-col items-start px-2.5 py-3 rounded border transition-all cursor-pointer"
                  :class="hpChoice === 'manual'
                    ? 'border-gold-mid/60 bg-depths/60'
                    : 'border-shadow bg-depths/20 hover:border-shadow/80'"
                  @click="hpChoice = 'manual'"
                >
                  <span class="text-2xs font-heading uppercase tracking-wider text-mist mb-2">Manual</span>
                  <input
                    v-if="hpChoice === 'manual'"
                    v-model.number="manualHp"
                    type="number"
                    min="1"
                    class="w-full bg-transparent border-b border-gold-mid/50 outline-none font-heading text-2xl text-gold-mid leading-none pb-px"
                    @click.stop
                    @keydown.stop
                  />
                  <span v-else class="font-heading text-2xl leading-none text-ash">—</span>
                  <span class="text-2xs font-body text-mist mt-1.5 leading-tight">any value</span>
                </div>
              </div>
              <p v-if="hpChoice !== null" class="text-center text-xs font-body text-stone">
                Max HP: {{ character.combat.maxHp }}
                <span class="mx-1 text-mist/40">→</span>
                <span class="text-gold-mid font-heading">{{ character.combat.maxHp + hpGained }}</span>
              </p>
            </section>

            <!-- Spell slots -->
            <section v-if="character.spellcasting && slotsChanged" class="space-y-2">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Spell Slots Updated</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="slot in newSlotsDisplay"
                  :key="slot.label"
                  class="px-2 py-0.5 rounded border text-2xs font-heading"
                  :class="slot.increased
                    ? 'border-arcane-base/60 text-arcane-pale bg-arcane-base/10'
                    : 'border-shadow text-mist'"
                >{{ slot.label }}: {{ slot.count }}</span>
              </div>
            </section>

            <!-- Features gained -->
            <section v-if="featuresGained.length" class="space-y-1.5">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Features Gained</p>
              <ul class="space-y-1">
                <li
                  v-for="f in featuresGained"
                  :key="f"
                  class="flex items-start gap-2 text-xs font-body text-ash"
                >
                  <span class="text-gold-dim/50 shrink-0 mt-px">◆</span>
                  {{ f }}
                </li>
              </ul>
            </section>

            <!-- Upcoming steps hint -->
            <p v-if="steps.length > 1" class="text-2xs font-body text-mist/40 text-center">
              Next:
              <template v-for="(s, i) in steps.slice(1)" :key="s">
                <span v-if="i > 0"> · </span>
                <span v-if="s === 'subclass'">pick subclass</span>
                <span v-else-if="s === 'asi'">ASI or Feat</span>
                <span v-else-if="s === 'replace'">replace a spell (optional)</span>
                <span v-else-if="s === 'cantrips'">pick {{ deltaCantrips }} cantrip{{ deltaCantrips > 1 ? 's' : '' }}</span>
                <span v-else-if="s === 'spells'">pick {{ deltaSpells }} spell{{ deltaSpells > 1 ? 's' : '' }}</span>
              </template>
            </p>

          </div>

          <!-- ─────────────────────── STEP: Subclass ─────────────────────── -->
          <template v-else-if="currentStep === 'subclass'">
            <div class="px-5 py-4 border-b border-shadow shrink-0">
              <p class="font-heading text-base text-gold-mid">Choose Subclass</p>
              <p class="text-2xs font-body text-mist mt-0.5">{{ character.identity.class.name }} · Level {{ newLevel }}</p>
            </div>
            <div class="overflow-y-auto flex-1 px-4 py-3 space-y-2">
              <div v-if="subclassLoading" class="flex justify-center py-10">
                <GrimoireSpinner label="Loading subclasses…" />
              </div>
              <template v-else>
                <div
                  v-for="sub in availableSubclasses"
                  :key="sub.index"
                  class="flex items-start gap-3 px-4 py-3 rounded border cursor-pointer transition-all"
                  :class="selectedSubclass?.index === sub.index
                    ? 'border-gold-mid/60 bg-gold-dim/15'
                    : 'border-shadow hover:border-gold-dim/30 hover:bg-depths/40'"
                  @click="selectedSubclass = { index: sub.index, name: sub.name }"
                >
                  <div
                    class="mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                    :class="selectedSubclass?.index === sub.index ? 'border-gold-mid bg-gold-mid/30' : 'border-mist/40'"
                  >
                    <span v-if="selectedSubclass?.index === sub.index" class="w-1.5 h-1.5 rounded-full bg-gold-mid block" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-heading text-sm" :class="selectedSubclass?.index === sub.index ? 'text-gold-mid' : 'text-ash'">{{ sub.name }}</p>
                    <p v-if="selectedSubclass?.index === sub.index && subclassDetail" class="text-2xs font-body text-mist/70 mt-1 leading-relaxed">
                      {{ subclassDetail.subclass_flavor }}
                    </p>
                  </div>
                </div>
              </template>
            </div>
          </template>

          <!-- ──────────────────────── STEP: ASI / Feat ──────────────────── -->
          <template v-else-if="currentStep === 'asi'">
            <!-- Header -->
            <div class="px-5 py-4 border-b border-shadow shrink-0">
              <p class="font-heading text-base text-gold-mid">Improvement — Level {{ newLevel }}</p>
              <p class="text-2xs font-body text-mist mt-0.5">
                <template v-if="featChoice === 'asi'">
                  Allocate {{ asiPointsRemaining }} point{{ asiPointsRemaining !== 1 ? 's' : '' }} remaining
                  <span v-if="asiPointsRemaining === 0" class="ml-1 text-gold-mid/70">✓ Done</span>
                </template>
                <template v-else>
                  Choose a feat
                  <span v-if="selectedFeat" class="ml-1 text-gold-mid/70">✓ {{ selectedFeat.name }}</span>
                </template>
              </p>
            </div>

            <!-- ASI / Feat toggle -->
            <div class="px-5 pt-4 pb-0 shrink-0 flex gap-2">
              <button
                type="button"
                class="flex-1 px-3 py-2 rounded border text-sm font-heading tracking-wide transition-all"
                :class="featChoice === 'asi'
                  ? 'border-gold-mid/50 bg-gold-dim/10 text-gold-deep'
                  : 'border-shadow text-ash hover:border-gold-dim/20'"
                @click="setFeatChoice('asi')"
              >Ability Score Improvement</button>
              <button
                type="button"
                class="flex-1 px-3 py-2 rounded border text-sm font-heading tracking-wide transition-all"
                :class="featChoice === 'feat'
                  ? 'border-gold-mid/50 bg-gold-dim/10 text-gold-deep'
                  : 'border-shadow text-ash hover:border-gold-dim/20'"
                @click="setFeatChoice('feat')"
              >Take a Feat</button>
            </div>

            <!-- ASI allocation -->
            <div v-if="featChoice === 'asi'" class="overflow-y-auto flex-1 px-5 py-4 space-y-2">
              <div v-for="key in ASI_ABILITIES" :key="key" class="flex items-center gap-3 py-1">
                <span class="text-2xs font-heading tracking-[0.15em] uppercase text-mist w-8 shrink-0">{{ ASI_LABELS[key] }}</span>
                <span class="font-heading text-sm text-stone w-5 text-right">{{ asiCurrentScore(key) }}</span>
                <span class="font-heading text-sm w-5 text-center" :class="(asiAllocations[key] ?? 0) > 0 ? 'text-gold-mid' : 'text-mist/20'">
                  {{ (asiAllocations[key] ?? 0) > 0 ? `+${asiAllocations[key]}` : '—' }}
                </span>
                <span class="text-2xs font-body text-mist/40">→</span>
                <span class="font-heading text-sm w-5" :class="(asiAllocations[key] ?? 0) > 0 ? 'text-vellum' : 'text-ash'">
                  {{ asiCurrentScore(key) + (asiAllocations[key] ?? 0) }}
                </span>
                <span v-if="asiCurrentScore(key) + (asiAllocations[key] ?? 0) >= 20" class="text-2xs font-body text-gold-dim/50">max</span>
                <div class="flex gap-1 ml-auto shrink-0">
                  <button
                    type="button"
                    class="w-7 h-7 flex items-center justify-center rounded border font-heading text-sm transition-all"
                    :class="canAsiDecrement(key) ? 'border-shadow hover:border-mist/60 text-mist hover:text-ash' : 'border-shadow/30 text-mist/25 cursor-not-allowed'"
                    :disabled="!canAsiDecrement(key)"
                    @click="asiDecrement(key)"
                  >−</button>
                  <button
                    type="button"
                    class="w-7 h-7 flex items-center justify-center rounded border font-heading text-sm transition-all"
                    :class="canAsiIncrement(key) ? 'border-shadow hover:border-gold-dim/60 text-mist hover:text-gold-dim' : 'border-shadow/30 text-mist/25 cursor-not-allowed'"
                    :disabled="!canAsiIncrement(key)"
                    @click="asiIncrement(key)"
                  >+</button>
                </div>
              </div>
            </div>

            <!-- Feat picker -->
            <template v-else>
              <div class="px-5 py-3 border-b border-shadow shrink-0 space-y-2">
                <input
                  v-model="featSearch"
                  type="text"
                  placeholder="Search feats…"
                  class="input-base w-full text-sm"
                  autofocus
                />
                <p class="text-2xs font-body text-mist/50">Shows feats from 2014 and 2024 SRD.</p>
              </div>
              <div class="overflow-y-auto flex-1 px-4 py-3 space-y-1">
                <div v-if="featsLoading" class="flex justify-center py-10">
                  <GrimoireSpinner label="Loading feats…" />
                </div>
                <p v-else-if="filteredFeats.length === 0" class="text-sm font-body text-mist text-center py-8 italic">
                  {{ featSearch ? 'No feats match your search.' : 'No feats meet your current prerequisites.' }}
                </p>
                <template v-else>
                  <div
                    v-for="feat in filteredFeats"
                    :key="feat.index"
                    class="px-3 py-2.5 rounded border cursor-pointer transition-all space-y-0.5"
                    :class="selectedFeat?.index === feat.index
                      ? 'border-gold-mid/60 bg-gold-dim/15'
                      : 'border-shadow hover:border-gold-dim/30 hover:bg-depths/40'"
                    @click="selectedFeat = { index: feat.index, name: feat.name, edition: feat.edition }"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                        :class="selectedFeat?.index === feat.index ? 'border-gold-mid bg-gold-mid/30' : 'border-mist/40'"
                      >
                        <span v-if="selectedFeat?.index === feat.index" class="w-1.5 h-1.5 rounded-full bg-gold-mid block" />
                      </div>
                      <p class="font-heading text-sm flex-1" :class="selectedFeat?.index === feat.index ? 'text-gold-mid' : 'text-ash'">
                        {{ feat.name }}
                      </p>
                      <span class="text-2xs font-heading text-arcane-pale/50 shrink-0">2024 SRD</span>
                    </div>
                  </div>

                  <!-- Description + prerequisites for selected feat -->
                  <Transition name="feat-desc">
                    <div
                      v-if="selectedFeat"
                      class="rounded border border-gold-dim/20 bg-depths/40 px-3 py-3 space-y-1.5"
                    >
                      <div v-if="selectedFeatLoading" class="space-y-1.5">
                        <div class="h-3 skeleton rounded-sm w-2/5" />
                        <div class="h-3 skeleton rounded-sm w-4/5" />
                        <div class="h-3 skeleton rounded-sm w-3/5" />
                      </div>
                      <template v-else-if="selectedFeatData">
                        <div class="flex items-center gap-2">
                          <p class="font-heading text-sm text-gold-mid">{{ selectedFeatData.name }}</p>
                          <span
                            class="text-2xs font-heading px-1.5 py-0.5 rounded border shrink-0"
                            :class="selectedFeat?.edition === '2024'
                              ? 'border-arcane-base/30 text-arcane-pale/70 bg-arcane-deep/10'
                              : 'border-gold-dim/30 text-gold-dim/70 bg-gold-dim/8'"
                          >{{ selectedFeat?.edition }} SRD</span>
                        </div>
                        <div v-if="formatPrerequisites(selectedFeatData)" class="flex items-start gap-2">
                          <span class="text-2xs font-heading tracking-wide uppercase text-mist/60 shrink-0 mt-px">Requires</span>
                          <span class="font-body text-xs text-stone">{{ formatPrerequisites(selectedFeatData) }}</span>
                        </div>
                        <!-- 2014: desc[] array -->
                        <template v-if="'desc' in selectedFeatData">
                          <p v-for="(line, i) in (selectedFeatData as any).desc" :key="i" class="font-body text-xs text-ash leading-relaxed">{{ line }}</p>
                        </template>
                        <!-- 2024: description string -->
                        <p v-else class="font-body text-xs text-ash leading-relaxed whitespace-pre-line">{{ (selectedFeatData as any).description }}</p>
                      </template>
                    </div>
                  </Transition>
                </template>
              </div>
            </template>
          </template>

          <!-- ───────────────────── STEP: Replace Spell ─────────────────── -->
          <template v-else-if="currentStep === 'replace'">
            <div class="px-5 py-4 border-b border-shadow shrink-0">
              <p class="font-heading text-base text-arcane-pale">Replace a Spell <span class="text-mist text-xs font-body ml-1 font-normal">Optional</span></p>
              <p class="text-2xs font-body text-mist mt-0.5">{{ character.identity.class.name }} · Level {{ newLevel }} · you may swap one known spell</p>
            </div>

            <!-- Phase 1: pick which spell to remove -->
            <template v-if="!replaceFromSpell && !replacePickerOpen">
              <p class="px-5 pt-4 pb-1 text-xs font-body text-mist/70 shrink-0">Select a spell to replace, or click Next to skip.</p>
              <div class="overflow-y-auto flex-1 px-4 py-2 space-y-1">
                <div
                  v-for="s in replaceableSpells"
                  :key="s.index"
                  class="flex items-center gap-3 px-3 py-2.5 rounded border cursor-pointer transition-all border-shadow hover:border-arcane-base/30 hover:bg-arcane-deep/10"
                  @click="replaceFromSpell = s; replacePickerOpen = true; replaceSpellLevel = s.level"
                >
                  <div class="flex-1 min-w-0">
                    <p class="font-heading text-sm text-ash">{{ s.name }}</p>
                    <p class="text-2xs font-body text-mist">Spell Level {{ s.level }}</p>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/30 transition-all"
                    title="View details"
                    @click.stop="infoPanel.open({ kind: 'spell', index: s.index })"
                  ><InfoIcon :size="12" /></button>
                </div>
              </div>
            </template>

            <!-- Phase 2: pick replacement spell -->
            <template v-else>
              <!-- "Replacing X" bar -->
              <div class="px-5 pt-3 pb-0 shrink-0 flex items-center gap-2">
                <span class="text-xs font-body text-mist">Replacing:</span>
                <span class="font-heading text-sm text-arcane-pale/60 line-through">{{ replaceFromSpell?.name }}</span>
                <button
                  type="button"
                  class="ml-auto text-xs font-body text-mist/50 hover:text-ash transition-colors"
                  @click="replaceFromSpell = null; replaceToSpell = null; replacePickerOpen = false"
                >Cancel</button>
              </div>
              <!-- Level tabs -->
              <div class="flex border-b border-shadow overflow-x-auto shrink-0 scrollbar-none mt-2">
                <button
                  v-for="lvl in replaceAvailableLevels"
                  :key="lvl"
                  type="button"
                  class="px-3.5 py-2.5 text-xs font-heading tracking-wide whitespace-nowrap transition-colors shrink-0 border-b-2"
                  :class="replaceSpellLevel === lvl
                    ? 'border-arcane-base text-arcane-pale'
                    : 'border-transparent text-mist hover:text-ash'"
                  @click="replaceSpellLevel = lvl; replaceSearch = ''"
                >Level {{ lvl }}</button>
              </div>
              <div class="px-5 py-3 border-b border-shadow shrink-0">
                <input v-model="replaceSearch" type="text" placeholder="Search spells…" class="input-base w-full text-sm" />
              </div>
              <div class="overflow-y-auto flex-1 px-4 py-3 space-y-1">
                <div v-if="replaceSpellLoading" class="flex justify-center py-10">
                  <GrimoireSpinner label="Loading spells…" />
                </div>
                <p v-else-if="replaceFilteredSpells.length === 0" class="text-sm font-body text-mist text-center py-8">No spells found.</p>
                <template v-else>
                  <div
                    v-for="s in replaceFilteredSpells"
                    :key="s.index"
                    class="flex items-center gap-3 px-3 py-2.5 rounded border transition-all cursor-pointer"
                    :class="replaceToSpell?.index === s.index
                      ? 'border-arcane-base/60 bg-arcane-deep/20'
                      : 'border-shadow hover:border-arcane-base/30 hover:bg-arcane-deep/10'"
                    @click="replaceToSpell = { index: s.index, name: s.name }"
                  >
                    <div class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                      :class="replaceToSpell?.index === s.index ? 'border-arcane-base bg-arcane-deep/40' : 'border-mist/40'"
                    >
                      <span v-if="replaceToSpell?.index === s.index" class="text-arcane-pale text-[10px] leading-none">✓</span>
                    </div>
                    <p class="font-heading text-sm flex-1"
                      :class="replaceToSpell?.index === s.index ? 'text-arcane-pale' : 'text-ash'"
                    >{{ s.name }}</p>
                    <button
                      type="button"
                      class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/30 transition-all"
                      title="View details"
                      @click.stop="infoPanel.open({ kind: 'spell', index: s.index })"
                    ><InfoIcon :size="12" /></button>
                  </div>
                </template>
              </div>
            </template>
          </template>

          <!-- ──────────────────────── STEP: Cantrips ──────────────────────── -->
          <template v-else-if="currentStep === 'cantrips'">
            <div class="px-5 py-4 border-b border-shadow shrink-0">
              <p class="font-heading text-base text-arcane-pale">
                Choose Cantrip{{ deltaCantrips > 1 ? 's' : '' }}
              </p>
              <p class="text-2xs font-body text-mist mt-0.5">
                {{ character.identity.class.name }} ·
                <span :class="remainingCantrips === 0 ? 'text-gold-mid' : ''">
                  {{ selectedCantrips.length }}/{{ deltaCantrips }} selected
                </span>
              </p>
            </div>
            <div class="px-5 py-3 border-b border-shadow shrink-0">
              <input
                v-model="cantripSearch"
                type="text"
                placeholder="Search cantrips…"
                class="input-base w-full text-sm"
                autofocus
              />
            </div>
            <div class="overflow-y-auto flex-1 px-4 py-3 space-y-1">
              <div v-if="cantripLoading" class="flex justify-center py-10">
                <GrimoireSpinner label="Loading cantrips…" />
              </div>
              <p v-else-if="filteredCantrips.length === 0" class="text-sm font-body text-mist text-center py-8">
                No cantrips found.
              </p>
              <template v-else>
                <div
                  v-for="c in filteredCantrips"
                  :key="c.index"
                  class="flex items-center gap-3 px-3 py-2.5 rounded border transition-all"
                  :class="isCantripKnown(c.index) || isCantripBlocked(c.index)
                    ? 'border-shadow opacity-40 cursor-not-allowed'
                    : isCantripSelected(c.index)
                      ? 'border-arcane-base/60 bg-arcane-deep/20 cursor-pointer'
                      : 'border-shadow hover:border-arcane-base/30 hover:bg-arcane-deep/10 cursor-pointer'"
                  @click="!isCantripKnown(c.index) && !isCantripBlocked(c.index) && toggleCantrip(c)"
                >
                  <div
                    class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                    :class="isCantripSelected(c.index) ? 'border-arcane-base bg-arcane-deep/40' : 'border-mist/40'"
                  >
                    <span v-if="isCantripSelected(c.index)" class="text-arcane-pale text-[10px] leading-none">✓</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p
                      class="font-heading text-sm"
                      :class="isCantripSelected(c.index) ? 'text-arcane-pale' : 'text-ash'"
                    >{{ c.name }}</p>
                    <p v-if="isCantripKnown(c.index)" class="text-2xs font-body text-mist">Already known</p>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/30 transition-all"
                    title="View details"
                    @click.stop="infoPanel.open({ kind: 'spell', index: c.index })"
                  ><InfoIcon :size="12" /></button>
                </div>
              </template>
            </div>
          </template>

          <!-- ───────────────────────── STEP: Spells ──────────────────────── -->
          <template v-else-if="currentStep === 'spells'">
            <div class="px-5 py-4 border-b border-shadow shrink-0">
              <p class="font-heading text-base text-arcane-pale">
                Choose Spell{{ deltaSpells > 1 ? 's' : '' }}
              </p>
              <p class="text-2xs font-body text-mist mt-0.5">
                {{ character.identity.class.name }} ·
                <span :class="remainingSpells === 0 ? 'text-gold-mid' : ''">
                  {{ selectedSpells.length }}/{{ deltaSpells }} selected
                </span>
              </p>
            </div>
            <!-- Level tabs -->
            <div class="flex border-b border-shadow overflow-x-auto shrink-0 scrollbar-none">
              <button
                v-for="lvl in availableSpellLevels"
                :key="lvl"
                type="button"
                class="px-3.5 py-2.5 text-xs font-heading tracking-wide whitespace-nowrap transition-colors shrink-0 border-b-2"
                :class="selectedSpellLevel === lvl
                  ? 'border-arcane-base text-arcane-pale'
                  : 'border-transparent text-mist hover:text-ash'"
                @click="selectedSpellLevel = lvl; spellSearch = ''"
              >Level {{ lvl }}</button>
            </div>
            <div class="px-5 py-3 border-b border-shadow shrink-0">
              <input
                v-model="spellSearch"
                type="text"
                placeholder="Search spells…"
                class="input-base w-full text-sm"
              />
            </div>
            <div class="overflow-y-auto flex-1 px-4 py-3 space-y-1">
              <div v-if="spellLoading" class="flex justify-center py-10">
                <GrimoireSpinner label="Loading spells…" />
              </div>
              <p v-else-if="filteredSpells.length === 0" class="text-sm font-body text-mist text-center py-8">
                No spells found.
              </p>
              <template v-else>
                <div
                  v-for="s in filteredSpells"
                  :key="s.index"
                  class="flex items-center gap-3 px-3 py-2.5 rounded border transition-all"
                  :class="isSpellKnown(s.index) || isSpellBlocked(s.index)
                    ? 'border-shadow opacity-40 cursor-not-allowed'
                    : isSpellSelected(s.index)
                      ? 'border-arcane-base/60 bg-arcane-deep/20 cursor-pointer'
                      : 'border-shadow hover:border-arcane-base/30 hover:bg-arcane-deep/10 cursor-pointer'"
                  @click="!isSpellKnown(s.index) && !isSpellBlocked(s.index) && toggleSpell(s)"
                >
                  <div
                    class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                    :class="isSpellSelected(s.index) ? 'border-arcane-base bg-arcane-deep/40' : 'border-mist/40'"
                  >
                    <span v-if="isSpellSelected(s.index)" class="text-arcane-pale text-[10px] leading-none">✓</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p
                      class="font-heading text-sm"
                      :class="isSpellSelected(s.index) ? 'text-arcane-pale' : 'text-ash'"
                    >{{ s.name }}</p>
                    <p v-if="isSpellKnown(s.index)" class="text-2xs font-body text-mist">Already known</p>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/30 transition-all"
                    title="View details"
                    @click.stop="infoPanel.open({ kind: 'spell', index: s.index })"
                  ><InfoIcon :size="12" /></button>
                </div>
              </template>
            </div>
          </template>

          <!-- ──────────────────────────── Footer ──────────────────────────── -->
          <div class="px-5 py-4 border-t border-shadow shrink-0 flex gap-2">
            <button type="button" class="flex-1 btn-secondary text-sm" :disabled="saving" @click="back">
              {{ currentStepIndex === 0 ? 'Cancel' : '← Back' }}
            </button>
            <button
              type="button"
              class="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
              :disabled="!canAdvance || saving"
              @click="next"
            >
              <span v-if="saving" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              {{ saving ? 'Saving…' : (isLastStep ? (atMaxLevel ? 'Close' : 'Level Up') : 'Next →') }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { InfoIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { computeModifier } from '@/shared/types/character'
import type { Character, SpellReference, AbilityScores } from '@/shared/types/character'
import {
  CLASS_META, CLASS_LEVELS,
  getSpellSlots, getSpellProfile, getAsiLevels, getMaxSpellLevel, getSubclassLevel,
} from '@/character-builder/classMeta'
import type { SpellSlotsMax } from '@/character-builder/classMeta'
import { fiveEApi } from '@/shared/api/fiveE.client'
import type { ApiFeat, Api2024Feat } from '@/shared/types/api'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const props = defineProps<{ show: boolean; character: Character; saving?: boolean }>()
const emit = defineEmits<{
  close: []
  leveled: [updates: Partial<Character>]
}>()

const infoPanel = useInfoPanel()
const classIndex = computed(() => props.character.identity.class.index)
const hitDie = computed(() => CLASS_META[classIndex.value]?.hitDie ?? 8)
const conMod = computed(() => computeModifier(props.character.abilityScores.con))
const newLevel = computed(() => Math.min(20, props.character.combat.level + 1))
const atMaxLevel = computed(() => props.character.combat.level >= 20)

// ── Spell profile deltas ──────────────────────────────────────────────────────

const profile = computed(() => getSpellProfile(classIndex.value))

const deltaCantrips = computed(() => {
  if (!profile.value) return 0
  const lvl = props.character.combat.level
  return Math.max(0,
    (profile.value.cantripsKnown[newLevel.value - 1] ?? 0)
    - (profile.value.cantripsKnown[lvl - 1] ?? 0),
  )
})

const deltaSpells = computed(() => {
  if (!profile.value?.spellsKnown) return 0
  const lvl = props.character.combat.level
  return Math.max(0,
    (profile.value.spellsKnown[newLevel.value - 1] ?? 0)
    - (profile.value.spellsKnown[lvl - 1] ?? 0),
  )
})

// ── Spell replacement (known-casters: Bard, Sorcerer, Warlock, Ranger) ────────

const canReplaceSpell = computed(() =>
  profile.value?.castingType === 'known' &&
  newLevel.value > 1 &&
  (props.character.spellcasting?.spellsKnown.length ?? 0) > 0,
)

// Ref: spell the user chose to swap out (null = no replacement this level)
const replaceFromSpell = ref<SpellReference | null>(null)
// Ref: the new spell selected as replacement
const replaceToSpell   = ref<{ index: string; name: string } | null>(null)

const replaceSearch      = ref('')
const replaceSpellLevel  = ref(1)
const replacePickerOpen  = ref(false)

const replaceableSpells = computed((): SpellReference[] =>
  props.character.spellcasting?.spellsKnown.filter(s => s.level > 0) ?? [],
)

const replaceAvailableLevels = computed(() => {
  const max = getMaxSpellLevel(classIndex.value, newLevel.value)
  return Array.from({ length: max }, (_, i) => i + 1)
})

const { data: replaceSpellData, isPending: replaceSpellLoading } = useQuery({
  queryKey: computed(() => ['spells', classIndex.value, replaceSpellLevel.value]),
  queryFn: () => fiveEApi.listSpells({ class: classIndex.value, level: replaceSpellLevel.value }),
  staleTime: Infinity,
  enabled: computed(() => props.show && canReplaceSpell.value && replacePickerOpen.value),
})

const replaceFilteredSpells = computed(() => {
  const q = replaceSearch.value.trim().toLowerCase()
  const known = new Set(props.character.spellcasting?.spellsKnown.map(s => s.index) ?? [])
  const all = (replaceSpellData.value?.results ?? []).filter(s => !known.has(s.index))
  return q ? all.filter(s => s.name.toLowerCase().includes(q)) : all
})

// ── Subclass ──────────────────────────────────────────────────────────────────

const needsSubclass = computed(() =>
  newLevel.value === getSubclassLevel(classIndex.value) && !props.character.identity.subclass,
)

const selectedSubclass = ref<{ index: string; name: string } | null>(null)

const { data: classData, isPending: subclassLoading } = useQuery({
  queryKey: computed(() => ['class', classIndex.value]),
  queryFn: () => fiveEApi.getClass(classIndex.value),
  staleTime: Infinity,
  enabled: computed(() => props.show && needsSubclass.value),
})

const availableSubclasses = computed(() => classData.value?.subclasses ?? [])

const { data: subclassDetail } = useQuery({
  queryKey: computed(() => ['subclass-detail', selectedSubclass.value?.index ?? '']),
  queryFn: () => fiveEApi.getSubclass(selectedSubclass.value!.index),
  staleTime: Infinity,
  enabled: computed(() => !!selectedSubclass.value),
})

// ── ASI ───────────────────────────────────────────────────────────────────────

const isAsiLevel = computed(() => getAsiLevels(classIndex.value).includes(newLevel.value))
const ASI_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
type AbilityKey = typeof ASI_ABILITIES[number]
const ASI_LABELS: Record<AbilityKey, string> = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' }

const asiAllocations = ref<Partial<Record<AbilityKey, number>>>({})
const asiPointsUsed = computed(() => Object.values(asiAllocations.value).reduce((s, v) => s + (v ?? 0), 0))
const asiPointsRemaining = computed(() => 2 - asiPointsUsed.value)

function asiCurrentScore(key: AbilityKey): number {
  return props.character.abilityScores[key]
}
function canAsiIncrement(key: AbilityKey): boolean {
  const total = asiCurrentScore(key) + (asiAllocations.value[key] ?? 0)
  return asiPointsRemaining.value > 0 && total < 20
}
function canAsiDecrement(key: AbilityKey): boolean {
  return (asiAllocations.value[key] ?? 0) > 0
}
function asiIncrement(key: AbilityKey) {
  if (!canAsiIncrement(key)) return
  asiAllocations.value = { ...asiAllocations.value, [key]: (asiAllocations.value[key] ?? 0) + 1 }
}
function asiDecrement(key: AbilityKey) {
  if (!canAsiDecrement(key)) return
  const next = (asiAllocations.value[key] ?? 0) - 1
  const updated = { ...asiAllocations.value }
  if (next === 0) delete updated[key]
  else updated[key] = next
  asiAllocations.value = updated
}
const asiCanProceed = computed(() =>
  asiPointsRemaining.value === 0 || !ASI_ABILITIES.some(k => canAsiIncrement(k)),
)

// ── Feat picker — merged 2014 + 2024 ─────────────────────────────────────────

const FEAT_PREREQUISITES_2014: Record<string, { ability_score: { index: string; name: string }; minimum_score: number }[]> = {
  athlete:             [{ ability_score: { index: 'str', name: 'Strength' },     minimum_score: 13 }],
  'defensive-duelist': [{ ability_score: { index: 'dex', name: 'Dexterity' },   minimum_score: 13 }],
  grappler:            [{ ability_score: { index: 'str', name: 'Strength' },     minimum_score: 13 }],
  'inspiring-leader':  [{ ability_score: { index: 'cha', name: 'Charisma' },    minimum_score: 13 }],
  'keen-mind':         [{ ability_score: { index: 'int', name: 'Intelligence' }, minimum_score: 13 }],
  linguist:            [{ ability_score: { index: 'int', name: 'Intelligence' }, minimum_score: 13 }],
  observant:           [{ ability_score: { index: 'int', name: 'Intelligence' }, minimum_score: 13 }],
  skulker:             [{ ability_score: { index: 'dex', name: 'Dexterity' },   minimum_score: 13 }],
}

const featChoice   = ref<'asi' | 'feat'>('asi')
const selectedFeat = ref<{ index: string; name: string; edition: '2014' | '2024' } | null>(null)
const featSearch   = ref('')

const { data: featData2014, isPending: featsLoading2014 } = useQuery({
  queryKey: ['feats-2014'],
  queryFn: () => fiveEApi.listFeats2014(),
  staleTime: Infinity,
  enabled: computed(() => props.show && isAsiLevel.value),
})
const { data: featData2024, isPending: featsLoading2024 } = useQuery({
  queryKey: ['feats-2024'],
  queryFn: () => fiveEApi.listFeats2024(),
  staleTime: Infinity,
  enabled: computed(() => props.show && isAsiLevel.value),
})
const featsLoading = computed(() => featsLoading2014.value || featsLoading2024.value)
const allFeats = computed(() => [
  ...(featData2014.value?.results ?? []).map(f => ({ ...f, edition: '2014' as const, key: `2014:${f.index}` })),
  ...(featData2024.value?.results ?? []).map(f => ({ ...f, edition: '2024' as const, key: `2024:${f.index}` })),
])

function featMeetsPrerequisites(featIndex: string, edition: '2014' | '2024'): boolean {
  if (edition === '2024') return true // 2024 prerequisites shown from API, not pre-filtered
  const prerequisites = FEAT_PREREQUISITES_2014[featIndex]
  if (!prerequisites || prerequisites.length === 0) return true
  return prerequisites.every(
    prereq => props.character.abilityScores[prereq.ability_score.index as keyof AbilityScores] >= prereq.minimum_score,
  )
}

const filteredFeats = computed(() => {
  const q = featSearch.value.toLowerCase().trim()
  const list = q ? allFeats.value.filter(f => f.name.toLowerCase().includes(q)) : allFeats.value
  return list.filter(f => featMeetsPrerequisites(f.index, f.edition))
})

// Fetch 2014 or 2024 detail based on selected feat edition
const { data: selectedFeat2014Data, isPending: selectedFeatLoading2014 } = useQuery({
  queryKey: computed(() => ['feat-2014', selectedFeat.value?.index]),
  queryFn:  () => fiveEApi.getFeat2014(selectedFeat.value!.index),
  staleTime: Infinity,
  enabled: computed(() => !!selectedFeat.value?.index && selectedFeat.value.edition === '2014'),
})
const { data: selectedFeat2024Data, isPending: selectedFeatLoading2024 } = useQuery({
  queryKey: computed(() => ['feat-2024', selectedFeat.value?.index]),
  queryFn:  () => fiveEApi.getFeat2024(selectedFeat.value!.index),
  staleTime: Infinity,
  enabled: computed(() => !!selectedFeat.value?.index && selectedFeat.value.edition === '2024'),
})
const selectedFeatLoading = computed(() => selectedFeatLoading2014.value || selectedFeatLoading2024.value)
const selectedFeatData = computed(() =>
  selectedFeat.value?.edition === '2014' ? selectedFeat2014Data.value ?? null
  : selectedFeat.value?.edition === '2024' ? selectedFeat2024Data.value ?? null
  : null,
)

function formatPrerequisites(feat: typeof selectedFeatData.value): string {
  if (!feat) return ''
  if ('desc' in feat) {
    // ApiFeat (2014)
    return (feat as ApiFeat).prerequisites.map(p => {
      if (p.ability_score && p.minimum_score != null) return `${p.ability_score.name} ${p.minimum_score}+`
      if (p.proficiency) return `Proficiency: ${p.proficiency.name}`
      if (p.minimum_level) return `Level ${p.minimum_level}+`
      return ''
    }).filter(Boolean).join(' · ')
  }
  // Api2024Feat
  const f = feat as Api2024Feat
  const parts: string[] = []
  if (f.prerequisites.minimum_level) parts.push(`Level ${f.prerequisites.minimum_level}+`)
  if (f.prerequisite_options?.desc) parts.push(f.prerequisite_options.desc)
  return parts.join(' · ')
}

function setFeatChoice(choice: 'asi' | 'feat') {
  featChoice.value = choice
  if (choice === 'feat') asiAllocations.value = {}
  else selectedFeat.value = null
}

// ── Stepper ───────────────────────────────────────────────────────────────────

type Step = 'hp' | 'subclass' | 'asi' | 'replace' | 'cantrips' | 'spells'

const steps = computed((): Step[] => {
  if (atMaxLevel.value) return ['hp']
  const s: Step[] = ['hp']
  if (needsSubclass.value) s.push('subclass')
  if (isAsiLevel.value) s.push('asi')
  if (canReplaceSpell.value) s.push('replace')
  if (deltaCantrips.value > 0) s.push('cantrips')
  if (deltaSpells.value > 0) s.push('spells')
  return s
})

const currentStepIndex = ref(0)
const currentStep = computed((): Step => steps.value[currentStepIndex.value] ?? 'hp')
const isLastStep = computed(() => currentStepIndex.value === steps.value.length - 1)

const canAdvance = computed(() => {
  if (atMaxLevel.value) return true
  if (currentStep.value === 'hp') {
    if (hpChoice.value === null) return false
    if (hpChoice.value === 'manual') return (manualHp.value || 0) >= 1
    return true
  }
  if (currentStep.value === 'subclass') return selectedSubclass.value !== null
  if (currentStep.value === 'asi') return featChoice.value === 'feat' ? selectedFeat.value !== null : asiCanProceed.value
  if (currentStep.value === 'replace') return true  // optional step
  if (currentStep.value === 'cantrips') return remainingCantrips.value === 0
  if (currentStep.value === 'spells') return remainingSpells.value === 0
  return true
})

function back() {
  if (currentStepIndex.value > 0) currentStepIndex.value--
  else emit('close')
}

function next() {
  if (!canAdvance.value) return
  if (isLastStep.value) confirm()
  else currentStepIndex.value++
}

function handleEsc() {
  if (props.saving) return
  if (currentStepIndex.value > 0) currentStepIndex.value--
  else emit('close')
}

// ── HP ────────────────────────────────────────────────────────────────────────

const hpChoice = ref<'roll' | 'average' | 'manual' | null>(null)
const rawDie = ref<number | null>(null)
const rolledHp = ref(0)
const manualHp = ref(1)

const averageHp = computed(() => Math.max(1, Math.floor(hitDie.value / 2) + 1 + conMod.value))

const hpGained = computed(() => {
  if (hpChoice.value === 'average') return averageHp.value
  if (hpChoice.value === 'roll') return rolledHp.value
  if (hpChoice.value === 'manual') return Math.max(1, manualHp.value || 1)
  return 0
})

const rollDisplay = computed(() => {
  if (hpChoice.value !== 'roll' || rawDie.value === null) return `d${hitDie.value}`
  return `+${rolledHp.value}`
})

function selectRoll() {
  rawDie.value = Math.ceil(Math.random() * hitDie.value)
  rolledHp.value = Math.max(1, rawDie.value + conMod.value)
  hpChoice.value = 'roll'
}

// ── Spell slots ───────────────────────────────────────────────────────────────

const newSlots = computed((): SpellSlotsMax =>
  getSpellSlots(classIndex.value, newLevel.value),
)

const slotsChanged = computed(() => {
  const sc = props.character.spellcasting
  if (!sc) return false
  const keys: (keyof SpellSlotsMax)[] = ['level1','level2','level3','level4','level5','level6','level7','level8','level9']
  return keys.some(k => newSlots.value[k] !== sc.slotsMax[k])
})

const newSlotsDisplay = computed(() => {
  const sc = props.character.spellcasting
  const entries: Array<{ k: keyof SpellSlotsMax; label: string }> = [
    { k: 'level1', label: 'Lv 1' }, { k: 'level2', label: 'Lv 2' }, { k: 'level3', label: 'Lv 3' },
    { k: 'level4', label: 'Lv 4' }, { k: 'level5', label: 'Lv 5' }, { k: 'level6', label: 'Lv 6' },
    { k: 'level7', label: 'Lv 7' }, { k: 'level8', label: 'Lv 8' }, { k: 'level9', label: 'Lv 9' },
  ]
  return entries
    .map(({ k, label }) => ({ label, count: newSlots.value[k], increased: !!sc && newSlots.value[k] > sc.slotsMax[k] }))
    .filter(x => x.count > 0)
})

// ── Features / notes ──────────────────────────────────────────────────────────

const featuresGained = computed((): string[] =>
  CLASS_LEVELS[classIndex.value]?.[newLevel.value]?.features ?? [],
)

// ── Cantrips step ─────────────────────────────────────────────────────────────

const cantripSearch = ref('')
const selectedCantrips = ref<{ index: string; name: string }[]>([])

const { data: cantripData, isPending: cantripLoading } = useQuery({
  queryKey: computed(() => ['cantrips', classIndex.value]),
  queryFn: () => fiveEApi.listSpells({ level: 0, class: classIndex.value }),
  staleTime: Infinity,
  enabled: computed(() => props.show && deltaCantrips.value > 0),
})

const filteredCantrips = computed(() => {
  const q = cantripSearch.value.trim().toLowerCase()
  const all = cantripData.value?.results ?? []
  return q ? all.filter(c => c.name.toLowerCase().includes(q)) : all
})

const knownCantripIndices = computed(() =>
  props.character.spellcasting?.cantripsKnown.map(s => s.index) ?? [],
)
const remainingCantrips = computed(() => deltaCantrips.value - selectedCantrips.value.length)

function isCantripKnown(index: string) { return knownCantripIndices.value.includes(index) }
function isCantripSelected(index: string) { return selectedCantrips.value.some(c => c.index === index) }
function isCantripBlocked(index: string) { return !isCantripSelected(index) && remainingCantrips.value <= 0 }
function toggleCantrip(c: { index: string; name: string }) {
  if (isCantripSelected(c.index)) selectedCantrips.value = selectedCantrips.value.filter(x => x.index !== c.index)
  else selectedCantrips.value.push(c)
}

// ── Spells step ───────────────────────────────────────────────────────────────

const spellSearch = ref('')
const selectedSpells = ref<{ index: string; name: string; level: number }[]>([])
const selectedSpellLevel = ref(1)

const availableSpellLevels = computed(() => {
  const max = getMaxSpellLevel(classIndex.value, newLevel.value)
  return Array.from({ length: max }, (_, i) => i + 1)
})

const { data: spellData, isPending: spellLoading } = useQuery({
  queryKey: computed(() => ['spells', classIndex.value, selectedSpellLevel.value]),
  queryFn: () => fiveEApi.listSpells({ class: classIndex.value, level: selectedSpellLevel.value }),
  staleTime: Infinity,
  enabled: computed(() => props.show && deltaSpells.value > 0),
})

const filteredSpells = computed(() => {
  const q = spellSearch.value.trim().toLowerCase()
  const all = spellData.value?.results ?? []
  return q ? all.filter(s => s.name.toLowerCase().includes(q)) : all
})

const knownSpellIndices = computed(() =>
  props.character.spellcasting?.spellsKnown.map(s => s.index) ?? [],
)
const remainingSpells = computed(() => deltaSpells.value - selectedSpells.value.length)

function isSpellKnown(index: string) { return knownSpellIndices.value.includes(index) }
function isSpellSelected(index: string) { return selectedSpells.value.some(s => s.index === index) }
function isSpellBlocked(index: string) { return !isSpellSelected(index) && remainingSpells.value <= 0 }
function toggleSpell(s: { index: string; name: string }) {
  if (isSpellSelected(s.index)) selectedSpells.value = selectedSpells.value.filter(x => x.index !== s.index)
  else selectedSpells.value.push({ index: s.index, name: s.name, level: selectedSpellLevel.value })
}

// ── Reset on open ─────────────────────────────────────────────────────────────

watch(() => props.show, (v) => {
  if (!v) return
  currentStepIndex.value = 0
  hpChoice.value = null
  rawDie.value = null
  rolledHp.value = 0
  manualHp.value = 1
  selectedSubclass.value = null
  asiAllocations.value = {}
  featChoice.value = 'asi'
  selectedFeat.value = null
  featSearch.value = ''
  selectedCantrips.value = []
  selectedSpells.value = []
  cantripSearch.value = ''
  spellSearch.value = ''
  selectedSpellLevel.value = availableSpellLevels.value[0] ?? 1
  replaceFromSpell.value = null
  replaceToSpell.value = null
  replaceSearch.value = ''
  replacePickerOpen.value = false
  replaceSpellLevel.value = replaceAvailableLevels.value[0] ?? 1
})

// ── Confirm ───────────────────────────────────────────────────────────────────

function confirm() {
  if (atMaxLevel.value) { emit('close'); return }

  const c = props.character
  const updates: Partial<Character> = {
    combat: {
      ...c.combat,
      level: newLevel.value,
      maxHp: c.combat.maxHp + hpGained.value,
      hitDiceRemaining: c.combat.hitDiceRemaining + 1,
    },
  }

  // Subclass
  if (selectedSubclass.value) {
    updates.identity = {
      ...c.identity,
      subclass: { index: selectedSubclass.value.index, name: selectedSubclass.value.name },
    }
  }

  // ASI — apply allocations to ability scores (only when not taking a feat)
  if (featChoice.value === 'asi' && Object.keys(asiAllocations.value).length > 0) {
    const newScores = { ...c.abilityScores }
    for (const [key, delta] of Object.entries(asiAllocations.value) as [AbilityKey, number][]) {
      newScores[key] = Math.min(20, newScores[key] + delta)
    }
    updates.abilityScores = newScores
  }

  // Features — class features at this level + feat (if chosen)
  const classFeatures = featuresGained.value
    .filter(f => f.length > 0)
    .map(name => ({
      id: crypto.randomUUID(),
      name,
      source: `${c.identity.class.name} Level ${newLevel.value}`,
      description: '',
    }))
  const featFeature = featChoice.value === 'feat' && selectedFeat.value
    ? [{ id: crypto.randomUUID(), name: selectedFeat.value.name, source: `Level ${newLevel.value} Feat`, description: '' }]
    : []
  if (classFeatures.length > 0 || featFeature.length > 0) {
    updates.features = [...c.features, ...classFeatures, ...featFeature]
  }

  // Spells
  if (c.spellcasting) {
    const addedCantrips: SpellReference[] = selectedCantrips.value.map(ct => ({
      index: ct.index, name: ct.name, level: 0,
    }))
    const addedSpells: SpellReference[] = selectedSpells.value.map(s => ({
      index: s.index, name: s.name, level: s.level,
    }))
    // Apply optional spell replacement for known-casters
    let updatedKnown = [...c.spellcasting.spellsKnown, ...addedSpells]
    if (replaceFromSpell.value && replaceToSpell.value) {
      updatedKnown = updatedKnown.filter(s => s.index !== replaceFromSpell.value!.index)
      updatedKnown.push({
        index: replaceToSpell.value.index,
        name: replaceToSpell.value.name,
        level: replaceSpellLevel.value,
      })
    }
    updates.spellcasting = {
      ...c.spellcasting,
      slotsMax: newSlots.value,
      cantripsKnown: [...c.spellcasting.cantripsKnown, ...addedCantrips],
      spellsKnown:   updatedKnown,
    }
  }

  emit('leveled', updates)
}
</script>

<style scoped>
.levelup-fade-enter-active,
.levelup-fade-leave-active { transition: opacity 0.15s ease; }
.levelup-fade-enter-from,
.levelup-fade-leave-to { opacity: 0; }
.levelup-fade-enter-from .relative { transform: scale(0.95); }
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
.feat-desc-enter-active, .feat-desc-leave-active { transition: all 0.2s ease; }
.feat-desc-enter-from, .feat-desc-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
