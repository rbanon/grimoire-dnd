<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <!-- Level & HP section -->
    <section class="space-y-4">
      <div class="rule-gold"><span>Level & Hit Points</span></div>

      <div class="grid sm:grid-cols-2 gap-6">
        <!-- Level picker -->
        <div>
          <label class="label mb-2">Level (1–20)</label>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="btn-icon border border-shadow"
              :disabled="builder.draft.level <= 1"
              @click="builder.draft.level = Math.max(1, builder.draft.level - 1)"
            >−</button>
            <span class="font-heading text-2xl text-gold-mid w-10 text-center">{{ builder.draft.level }}</span>
            <button
              type="button"
              class="btn-icon border border-shadow"
              :disabled="builder.draft.level >= 20"
              @click="builder.draft.level = Math.min(20, builder.draft.level + 1)"
            >+</button>
            <div class="ml-2 flex gap-2 text-xs font-heading text-mist">
              <span>Prof Bonus: <span class="text-gold-dim">+{{ profBonus }}</span></span>
            </div>
          </div>

          <div class="flex items-center gap-2 mt-3">
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
            <span class="text-xs font-heading text-ash">
              {{ builder.draft.useMilestones ? 'Milestone leveling' : 'XP leveling' }}
            </span>
          </div>
        </div>

        <!-- HP Method -->
        <div>
          <label class="label mb-2">Max HP Method</label>
          <div class="flex flex-col gap-1.5">
            <label
              v-for="opt in hpOptions"
              :key="opt.value"
              class="flex items-center gap-3 px-3 py-2.5 rounded border cursor-pointer transition-all duration-150"
              :class="builder.draft.hpMethod === opt.value
                ? 'border-gold-mid/50 bg-gold-dim/8'
                : 'border-shadow hover:border-gold-dim/20'"
              @click="opt.value === 'roll' ? openRollModal() : null"
            >
              <input type="radio" :value="opt.value" v-model="builder.draft.hpMethod" class="sr-only" />
              <div
                class="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors"
                :class="builder.draft.hpMethod === opt.value ? 'border-gold-mid' : 'border-mist'"
              >
                <div v-if="builder.draft.hpMethod === opt.value" class="w-1.5 h-1.5 rounded-full bg-gold-mid" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-heading text-stone">{{ opt.label }}</p>
                <p class="text-xs text-mist font-body">{{ opt.desc }}</p>
              </div>
              <span v-if="opt.value !== 'manual' && opt.value !== 'roll'" class="ml-auto font-heading text-sm text-gold-mid">
                {{ opt.preview }}
              </span>
              <button
                v-if="opt.value === 'roll' && builder.draft.hpMethod === 'roll'"
                type="button"
                class="ml-auto text-xs font-heading text-gold-mid border border-gold-dim/40 rounded px-2 py-0.5 hover:bg-gold-dim/10 transition-all"
                @click.stop="openRollModal"
              >
                {{ builder.computedMaxHp > 0 ? `${builder.computedMaxHp} HP · Reroll` : 'Roll Dice' }}
              </button>
            </label>
          </div>

          <div v-if="builder.draft.hpMethod === 'manual'" class="mt-3 flex items-center gap-3">
            <label class="text-xs font-heading text-mist shrink-0" for="manual-hp">Max HP</label>
            <input
              id="manual-hp"
              v-model.number="builder.draft.manualMaxHp"
              type="number"
              min="1"
              max="999"
              class="input-base w-24 text-lg font-heading text-center"
            />
          </div>

          <div class="mt-3 text-center" v-else>
            <span class="text-xs font-heading text-mist">Computed Max HP</span>
            <p class="font-heading text-3xl" :class="builder.computedMaxHp > 0 ? 'text-gold-mid' : 'text-mist/40'">
              {{ builder.computedMaxHp > 0 ? builder.computedMaxHp : '—' }}
            </p>
            <p v-if="builder.draft.hpMethod === 'roll' && builder.computedMaxHp === 0" class="text-xs font-body text-mist mt-1">
              Click "Roll Dice" above to set HP
            </p>
          </div>
        </div>

        <HpRollModal
          :show="showRollModal"
          :hit-die="builder.draft.classHitDie"
          :level="builder.draft.level"
          :con-mod="conMod"
          @close="showRollModal = false"
          @confirm="onRollConfirm"
        />
      </div>
    </section>

    <!-- Class features accordion -->
    <section v-if="builder.draft.classIndex" class="space-y-4">
      <div class="rule-gold"><span>Class Features</span></div>

      <div class="space-y-1">
        <div
          v-for="lvl in builder.draft.level"
          :key="lvl"
          class="border rounded overflow-hidden"
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
                  <p class="text-xs font-heading text-mist/80 uppercase tracking-wide">Choose a Fighting Style</p>
                  <div class="grid sm:grid-cols-2 gap-1.5">
                    <label
                      v-for="style in getFightingStyles(choice.classIndex)"
                      :key="style.index"
                      class="flex items-start gap-2.5 px-3 py-2.5 rounded border cursor-pointer transition-all"
                      :class="builder.draft.levelChoices[lvl]?.[key] === style.index
                        ? 'border-gold-mid/50 bg-gold-dim/10'
                        : 'border-shadow hover:border-gold-dim/25'"
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
                  <p class="text-xs font-heading text-mist/80 uppercase tracking-wide">Choose a {{ choice.label }}</p>
                  <div class="grid sm:grid-cols-2 gap-1.5">
                    <label
                      v-for="opt in choice.options"
                      :key="opt.index"
                      class="flex items-start gap-2.5 px-3 py-2.5 rounded border cursor-pointer transition-all"
                      :class="builder.draft.levelChoices[lvl]?.[key] === opt.index
                        ? 'border-gold-mid/50 bg-gold-dim/10'
                        : 'border-shadow hover:border-gold-dim/25'"
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
    { value: 'average' as const, label: 'Average', desc: `d${hd}${conStr} per level (${hd} at 1st, ${avg}${conStr} after)`, preview: `~${avgHp}` },
    { value: 'max'     as const, label: 'Maximum', desc: `${hd}${conStr} every level`, preview: `${maxHp}` },
    { value: 'roll'    as const, label: 'Roll Dice', desc: `Roll d${hd} for each level after 1st — open the dice roller`, preview: '' },
    { value: 'manual'  as const, label: 'Manual', desc: 'Enter any value directly', preview: '' },
  ]
})

// ── Features accordion ──────────────────────────────────────────────────────

const openLevels = ref<Set<number>>(new Set([1]))

function rebuildOpenLevels() {
  const s = new Set<number>()
  // Always open the current highest level
  if (builder.draft.level >= 1) s.add(builder.draft.level)
  // Auto-open any level with a pending required choice
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
  // Auto-close level once all its choices are resolved
  if (levelChoicesDone(lvl)) {
    const s = new Set(openLevels.value)
    s.delete(lvl)
    openLevels.value = s
  }
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 800px; }
</style>
