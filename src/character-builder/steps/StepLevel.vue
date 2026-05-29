<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-8">

    <!-- Level & HP section -->
    <section class="space-y-6">
      <div class="rule-gold"><span>Level & Hit Points</span></div>

      <!-- Row 1: Character Level | Stats panel -->
      <div class="grid sm:grid-cols-2 gap-4 items-stretch">

        <!-- Character Level -->
        <div class="level-stat-card flex flex-col items-center justify-center gap-3 pt-5 pb-7 px-4 rounded-lg border border-shadow/60 bg-depths/30">
          <p class="text-2xs font-heading text-mist uppercase tracking-widest">Character Level</p>
          <div class="flex items-center gap-4">
            <button
              type="button"
              class="btn-icon border border-shadow w-9 h-9"
              :disabled="builder.draft.level <= 1"
              @click="builder.draft.level = Math.max(1, builder.draft.level - 1)"
            >−</button>
            <span class="font-heading text-5xl leading-none text-gold-mid tabular-nums select-none w-12 text-center">{{ builder.draft.level }}</span>
            <button
              type="button"
              class="btn-icon border border-shadow w-9 h-9"
              :disabled="builder.draft.level >= 20"
              @click="builder.draft.level = Math.min(20, builder.draft.level + 1)"
            >+</button>
          </div>
        </div>

        <!-- Stats panel: Leveling | Prof Bonus | Max HP -->
        <div class="level-stat-card flex flex-col rounded-lg border border-shadow/60 bg-depths/30 overflow-hidden">

          <!-- Leveling toggle -->
          <div class="flex flex-1 items-center justify-between px-4 py-3">
            <span class="text-xs font-heading text-mist uppercase tracking-widest">Leveling</span>
            <div class="flex items-center gap-2">
              <span class="text-xs font-heading text-ash">{{ builder.draft.useMilestones ? 'Milestone' : 'XP' }}</span>
              <button
                type="button"
                class="w-9 h-5 rounded-full border transition-all duration-200 flex items-center px-0.5"
                :class="builder.draft.useMilestones
                  ? 'bg-gold-dim/30 border-gold-mid/50 justify-end'
                  : 'bg-shadow border-shadow justify-start'"
                @click="builder.draft.useMilestones = !builder.draft.useMilestones"
              >
                <div class="w-4 h-4 rounded-full transition-all duration-200"
                  :class="builder.draft.useMilestones ? 'bg-gold-mid' : 'bg-mist'" />
              </button>
            </div>
          </div>

          <!-- Prof Bonus -->
          <div class="flex flex-1 items-center justify-between px-4 py-3 border-t border-shadow/40">
            <span class="text-xs font-heading text-mist uppercase tracking-widest">Prof Bonus</span>
            <span class="font-heading text-xl leading-none text-gold-mid">+{{ profBonus }}</span>
          </div>

          <!-- Max HP -->
          <div class="flex flex-1 items-center justify-between px-4 pt-3 pb-4 border-t border-shadow/40">
            <span class="text-xs font-heading text-mist uppercase tracking-widest">Max HP</span>
            <div class="flex items-center gap-2">
              <span
                class="font-heading text-xl leading-none"
                :class="builder.computedMaxHp > 0 ? 'text-gold-mid' : 'text-mist/30'"
              >{{ builder.computedMaxHp > 0 ? builder.computedMaxHp : '—' }}</span>
              <button
                v-if="builder.draft.hpMethod === 'roll'"
                type="button"
                class="text-xs font-heading text-gold-mid border border-gold-dim/40 rounded px-2 py-0.5 hover:bg-gold-dim/10 transition-all"
                @click="openRollModal"
              >{{ builder.computedMaxHp > 0 ? 'Reroll' : 'Roll' }}</button>
              <input
                v-else-if="builder.draft.hpMethod === 'manual'"
                v-model.number="builder.draft.manualMaxHp"
                type="number"
                min="1"
                max="999"
                class="input-base w-16 text-base font-heading text-center"
              />
            </div>
          </div>

        </div>
      </div>

      <!-- Row 2: HP Method (horizontal) -->
      <div class="space-y-2">
        <label class="label">Max HP Method</label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            v-for="opt in hpOptions"
            :key="opt.value"
            type="button"
            class="flex flex-col items-start px-3 py-2.5 rounded border transition-all text-left"
            :class="builder.draft.hpMethod === opt.value
              ? 'border-gold-mid/50 bg-gold-dim/8'
              : 'border-shadow hover:border-gold-dim/20'"
            @click="selectHpMethod(opt.value)"
          >
            <div class="flex items-center gap-1.5 w-full">
              <div
                class="w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center"
                :class="builder.draft.hpMethod === opt.value ? 'border-gold-mid' : 'border-mist'"
              >
                <div v-if="builder.draft.hpMethod === opt.value" class="w-1.5 h-1.5 rounded-full bg-gold-mid" />
              </div>
              <span class="text-sm font-heading text-stone">{{ opt.label }}</span>
              <span v-if="opt.preview" class="ml-auto text-xs font-heading text-gold-mid shrink-0">{{ opt.preview }}</span>
            </div>
            <p class="text-2xs font-body text-mist mt-1 pl-[18px] leading-relaxed">{{ opt.desc }}</p>
          </button>
        </div>
      </div>
    </section>

    <!-- Row 3: Class features accordion -->
    <section v-if="builder.draft.classIndex" class="space-y-4">
      <div class="rule-gold"><span>Class Features</span></div>

      <div class="space-y-1">
        <div
          v-for="lvl in builder.draft.level"
          :key="lvl"
          class="feature-row border rounded overflow-hidden"
          :class="levelHasError(lvl) ? 'border-blood-base/50' : 'border-shadow'"
        >
          <!-- Level row header -->
          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-shadow/20"
            :class="openLevels.has(lvl) ? 'bg-shadow/20' : ''"
            @click="toggleLevel(lvl)"
          >
            <div
              class="shrink-0 w-6 h-6 rounded border flex items-center justify-center font-mono text-xs"
              :class="levelHasError(lvl)
                ? 'border-blood-base/60 text-blood-bright'
                : levelChoicesDone(lvl)
                  ? 'border-gold-mid/50 text-gold-mid'
                  : 'border-shadow text-mist'"
            >{{ lvl }}</div>
            <span
              class="flex-1 font-heading text-sm"
              :class="levelHasError(lvl) ? 'text-blood-bright' : 'text-stone'"
            >
              Level {{ lvl }}
              <span v-if="levelHasError(lvl)" class="text-2xs font-body ml-1 text-blood-mid"> — choice required</span>
            </span>
            <span class="text-mist/50 text-xs mr-1">{{ openLevels.has(lvl) ? '▲' : '▼' }}</span>
          </button>

          <!-- Level content -->
          <Transition name="expand">
            <div v-if="openLevels.has(lvl)" class="px-4 pb-4 pt-1 space-y-4 border-t border-shadow/40">

              <!-- Auto features -->
              <div v-if="getFeatures(lvl).length > 0" class="flex flex-wrap gap-1.5 pt-1">
                <span
                  v-for="feat in getFeatures(lvl)"
                  :key="feat"
                  class="px-2 py-0.5 rounded bg-shadow/60 border border-shadow/80 text-xs font-body text-ash"
                >{{ feat }}</span>
              </div>
              <p v-else-if="!hasChoices(lvl)" class="text-xs font-body text-mist/50 italic pt-1">
                No new class features at this level.
              </p>

              <!-- Choices -->
              <template v-for="(choice, key) in getChoices(lvl)" :key="key">

                <!-- Fighting Style -->
                <div v-if="choice.kind === 'fighting-style'" class="space-y-2">
                  <p
                    class="text-xs font-heading uppercase tracking-wide flex items-center gap-1.5"
                    :class="!builder.draft.levelChoices[lvl]?.[key] ? 'text-gold-mid' : 'text-mist/60'"
                  >
                    <span v-if="!builder.draft.levelChoices[lvl]?.[key]" class="text-gold-mid">◆</span>
                    Choose a Fighting Style
                  </p>
                  <div class="grid sm:grid-cols-2 gap-1.5">
                    <label
                      v-for="style in getFightingStyles(choice.classIndex)"
                      :key="style.index"
                      class="flex items-start gap-2.5 px-3 py-2.5 rounded border cursor-pointer transition-all"
                      :class="builder.draft.levelChoices[lvl]?.[key] === style.index
                        ? 'border-gold-mid/50 bg-gold-dim/10'
                        : !builder.draft.levelChoices[lvl]?.[key]
                          ? 'border-gold-dim/30 bg-gold-dim/5 hover:border-gold-mid/50 hover:bg-gold-dim/10'
                          : 'border-shadow hover:border-gold-dim/35 hover:bg-gold-dim/5'"
                      @click="setChoice(lvl, key, style.index)"
                    >
                      <div class="w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                        :class="builder.draft.levelChoices[lvl]?.[key] === style.index ? 'border-gold-mid' : 'border-mist'">
                        <div v-if="builder.draft.levelChoices[lvl]?.[key] === style.index" class="w-1.5 h-1.5 rounded-full bg-gold-mid" />
                      </div>
                      <div>
                        <p class="font-heading text-sm text-stone">{{ style.name }}</p>
                        <p class="text-xs font-body text-mist mt-0.5">{{ style.desc }}</p>
                      </div>
                    </label>
                  </div>
                  <p v-if="showValidation && !builder.draft.levelChoices[lvl]?.[key]" class="text-xs font-body text-blood-bright">
                    Select a Fighting Style to continue.
                  </p>
                </div>

                <!-- Static choice (e.g. Pact Boon) -->
                <div v-else-if="choice.kind === 'static'" class="space-y-2">
                  <p
                    class="text-xs font-heading uppercase tracking-wide flex items-center gap-1.5"
                    :class="!builder.draft.levelChoices[lvl]?.[key] ? 'text-gold-mid' : 'text-mist/60'"
                  >
                    <span v-if="!builder.draft.levelChoices[lvl]?.[key]" class="text-gold-mid">◆</span>
                    Choose a {{ choice.label }}
                  </p>
                  <div class="grid sm:grid-cols-2 gap-1.5">
                    <label
                      v-for="opt in choice.options"
                      :key="opt.index"
                      class="flex items-start gap-2.5 px-3 py-2.5 rounded border cursor-pointer transition-all"
                      :class="builder.draft.levelChoices[lvl]?.[key] === opt.index
                        ? 'border-gold-mid/50 bg-gold-dim/10'
                        : !builder.draft.levelChoices[lvl]?.[key]
                          ? 'border-gold-dim/30 bg-gold-dim/5 hover:border-gold-mid/50 hover:bg-gold-dim/10'
                          : 'border-shadow hover:border-gold-dim/35 hover:bg-gold-dim/5'"
                      @click="setChoice(lvl, key, opt.index)"
                    >
                      <div class="w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                        :class="builder.draft.levelChoices[lvl]?.[key] === opt.index ? 'border-gold-mid' : 'border-mist'">
                        <div v-if="builder.draft.levelChoices[lvl]?.[key] === opt.index" class="w-1.5 h-1.5 rounded-full bg-gold-mid" />
                      </div>
                      <div>
                        <p class="font-heading text-sm text-stone">{{ opt.name }}</p>
                        <p class="text-xs font-body text-mist mt-0.5">{{ opt.desc }}</p>
                      </div>
                    </label>
                  </div>
                  <p v-if="showValidation && !builder.draft.levelChoices[lvl]?.[key]" class="text-xs font-body text-blood-bright">
                    Select a {{ choice.label }} to continue.
                  </p>
                </div>

              </template>

              <!-- Spell note -->
              <p v-if="getSpellInfo(lvl)" class="text-xs font-body text-arcane-pale/80 italic">
                ✶ {{ getSpellInfo(lvl) }}
              </p>
            </div>
          </Transition>
        </div>
      </div>

      <p v-if="builder.draft.level < 20" class="text-xs font-body text-mist/40 text-center">
        Levels {{ builder.draft.level + 1 }}–20 unlock when you raise your level above.
      </p>
    </section>

    <HpRollModal
      :show="showRollModal"
      :hit-die="builder.draft.classHitDie"
      :level="builder.draft.level"
      :con-mod="conMod"
      @close="showRollModal = false"
      @confirm="onRollConfirm"
    />

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBuilderStore } from '@/character-builder/builderStore'
import { computeProficiencyBonus } from '@/shared/lib/derivedStats'
import { getLevelEntry, getFightingStyleOptions } from '@/character-builder/classMeta'
import type { ChoiceType } from '@/character-builder/classMeta'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import HpRollModal from '@/character-builder/components/HpRollModal.vue'

const builder = useBuilderStore()
const { showValidation } = useBuilderValidation()
const showRollModal = ref(false)

const conMod = computed(() => Math.floor((builder.effectiveScores.con - 10) / 2))
const profBonus = computed(() => computeProficiencyBonus(builder.draft.level))

function openRollModal() {
  builder.draft.hpMethod = 'roll'
  showRollModal.value = true
}

function onRollConfirm(rolls: number[]) {
  builder.draft.rolledHpPerLevel = rolls
  showRollModal.value = false
}

function selectHpMethod(value: 'average' | 'max' | 'manual' | 'roll') {
  if (value === 'roll') { openRollModal(); return }
  builder.draft.hpMethod = value
}

const hpOptions = computed(() => {
  const hd = builder.draft.classHitDie
  const lv = builder.draft.level
  const avg = Math.floor(hd / 2) + 1
  const mod = conMod.value
  const conStr = mod >= 0 ? `+${mod}` : String(mod)
  const lv1Hp = Math.max(1, hd + mod)
  const avgHp = lv1Hp + (lv - 1) * Math.max(1, avg + mod)
  const maxHp = lv * Math.max(1, hd + mod)
  return [
    { value: 'average' as const, label: 'Average', desc: `${hd}÷2+1${conStr} per level`, preview: `~${avgHp}` },
    { value: 'max'     as const, label: 'Maximum', desc: `${hd}${conStr} every level`, preview: `${maxHp}` },
    { value: 'roll'    as const, label: 'Roll Dice', desc: `Roll d${hd} per level after 1st`, preview: '' },
    { value: 'manual'  as const, label: 'Manual', desc: 'Enter any value directly', preview: '' },
  ]
})

// ── Features accordion ──────────────────────────────────────────────────────

const openLevels = ref<Set<number>>(new Set())

function rebuildOpenLevels() {
  const s = new Set<number>()
  for (let lvl = 1; lvl <= builder.draft.level; lvl++) {
    if (levelHasError(lvl)) s.add(lvl)
  }
  openLevels.value = s
}

watch(
  [() => builder.draft.classIndex, () => builder.draft.level],
  rebuildOpenLevels,
  { immediate: true },
)

function toggleLevel(lvl: number) {
  const s = new Set(openLevels.value)
  s.has(lvl) ? s.delete(lvl) : s.add(lvl)
  openLevels.value = s
}

function getFeatures(lvl: number): string[] {
  return getLevelEntry(builder.draft.classIndex, lvl)?.features ?? []
}

function getChoices(lvl: number): Record<string, ChoiceType> {
  return getLevelEntry(builder.draft.classIndex, lvl)?.choices ?? {}
}

function getSpellInfo(lvl: number): string {
  return getLevelEntry(builder.draft.classIndex, lvl)?.spellInfo ?? ''
}

function hasChoices(lvl: number): boolean {
  return Object.values(getChoices(lvl)).some(c => c.kind !== 'asi')
}

function levelChoicesDone(lvl: number): boolean {
  const choices = getChoices(lvl)
  return Object.entries(choices).every(([key, c]) => c.kind === 'asi' || !!builder.draft.levelChoices[lvl]?.[key])
}

function levelHasError(lvl: number): boolean {
  return hasChoices(lvl) && !levelChoicesDone(lvl)
}

function getFightingStyles(classIndex: string) {
  return getFightingStyleOptions(classIndex)
}

function setChoice(lvl: number, key: string, value: string) {
  if (!builder.draft.levelChoices[lvl]) {
    builder.draft.levelChoices[lvl] = {}
  }
  builder.draft.levelChoices[lvl][key] = value
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 800px; }

.level-stat-card {
  box-shadow: var(--shadow-panel);
}

.feature-row {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12), var(--shadow-card);
  transition: box-shadow 0.18s ease;
}
.feature-row:has(> button:hover) {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.16), var(--shadow-card-hover);
}
</style>
