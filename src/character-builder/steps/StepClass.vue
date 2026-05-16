<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <!-- Class picker -->
    <section class="space-y-4">
      <div class="rule-gold"><span>Class</span></div>

      <div v-if="classesLoading" class="flex justify-center py-8">
        <GrimoireSpinner label="Loading classes" />
      </div>
      <div v-else-if="classesError" class="text-sm text-blood-bright">Failed to load classes.</div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <PickerCard
          v-for="cls in classes"
          :key="cls.index"
          :name="cls.name"
          :glyph="getClassMeta(cls.index).glyph"
          :flavor="getClassMeta(cls.index).flavor"
          :tags="getClassMeta(cls.index).tags.slice(0, 2)"
          :stats="`d${getClassMeta(cls.index).hitDie}`"
          :selected="builder.draft.classIndex === cls.index"
          show-info
          @select="selectClass(cls.index, cls.name)"
          @info="infoPanel.open({ kind: 'class', index: cls.index })"
        />
      </div>

      <p v-if="showValidation && !builder.draft.classIndex" class="text-xs font-body text-blood-bright">
        Selecciona una clase para continuar.
      </p>

      <!-- Class detail panel -->
      <Transition name="fade">
        <div
          v-if="builder.draft.classIndex"
          class="card p-5 border-gold-dim/20"
          style="background: linear-gradient(135deg, rgba(212,168,67,0.04) 0%, transparent 60%)"
        >
          <div class="flex items-start gap-4 flex-wrap">
            <div class="text-3xl leading-none">{{ getClassMeta(builder.draft.classIndex).glyph }}</div>
            <div class="flex-1 min-w-0">
              <p class="font-heading text-lg text-vellum">{{ builder.draft.className }}</p>
              <p class="font-body text-sm text-ash mt-0.5">{{ getClassMeta(builder.draft.classIndex).flavor }}</p>
              <div class="flex gap-4 mt-3 text-xs font-heading text-mist">
                <span>Hit Die: <span class="text-gold-mid">d{{ builder.draft.classHitDie }}</span></span>
                <span>Primary: <span class="text-stone">{{ getClassMeta(builder.draft.classIndex).primaryAbility }}</span></span>
                <span>Saves: <span class="text-stone">{{ getClassMeta(builder.draft.classIndex).saves }}</span></span>
                <span v-if="builder.isSpellcaster" class="text-arcane-pale">✶ Spellcaster</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Subclass picker (level >= 3) -->
      <Transition name="expand">
        <div v-if="builder.draft.level >= 3 && builder.draft.availableSubclasses.length > 0" class="space-y-2">
          <label class="label mb-2">Subclass</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="sub in builder.draft.availableSubclasses"
              :key="sub.index"
              type="button"
              class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
              :class="builder.draft.subclassIndex === sub.index
                ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-pale'
                : 'border-shadow text-ash hover:border-gold-dim/25 hover:text-stone'"
              @click="toggleSubclass(sub.index, sub.name)"
            >
              {{ sub.name }}
            </button>
          </div>
          <p v-if="showValidation && !builder.draft.subclassIndex" class="text-xs font-body text-blood-bright">
            Selecciona una subclase para continuar.
          </p>
        </div>
      </Transition>
    </section>

    <!-- Level & HP -->
    <section class="space-y-4">
      <div class="rule-gold"><span>Level & Hit Points</span></div>

      <div class="grid sm:grid-cols-2 gap-6">
        <!-- Level -->
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

          <!-- XP toggle -->
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

          <!-- Manual HP input -->
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

          <!-- Max HP display -->
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

        <!-- HP Roll Modal -->
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

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useBuilderStore } from '@/character-builder/builderStore'
import { getClassMeta } from '@/character-builder/classMeta'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import type { ApiClass, ApiProfChoiceOption } from '@/shared/types/api'
import { computeProficiencyBonus } from '@/shared/lib/derivedStats'
import PickerCard from '@/character-builder/components/PickerCard.vue'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'
import HpRollModal from '@/character-builder/components/HpRollModal.vue'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()
const showRollModal = ref(false)

const conMod = computed(() => Math.floor((builder.effectiveScores.con - 10) / 2))

function openRollModal() {
  builder.draft.hpMethod = 'roll'
  showRollModal.value = true
}

function onRollConfirm(rolls: number[]) {
  builder.draft.rolledHpPerLevel = rolls
  showRollModal.value = false
}

const { data: classList, isPending: classesLoading, isError: classesError } = useQuery({
  queryKey: ['classes'],
  queryFn: () => fiveEApi.listClasses(),
  staleTime: Infinity,
})
const classes = computed(() => classList.value?.results ?? [])

const profBonus = computed(() => computeProficiencyBonus(builder.draft.level))

const hpOptions = computed(() => {
  const hd = builder.draft.classHitDie
  const avg = Math.floor(hd / 2) + 1
  const mod = conMod.value
  const conStr = mod >= 0 ? `+${mod}` : String(mod)
  return [
    { value: 'average' as const, label: 'Average', desc: `d${hd}${conStr} per level (${hd} at 1st, ${avg}${conStr} after)`, preview: `~${builder.computedMaxHp}` },
    { value: 'max'     as const, label: 'Maximum', desc: `${hd}${conStr} every level`, preview: `${builder.computedMaxHp}` },
    { value: 'roll'    as const, label: 'Roll Dice', desc: `Roll d${hd} for each level after 1st — open the dice roller`, preview: '' },
    { value: 'manual'  as const, label: 'Manual', desc: 'Enter any value directly', preview: '' },
  ]
})

async function selectClass(index: string, name: string) {
  builder.draft.classIndex = index
  builder.draft.className = name
  builder.draft.subclassIndex = ''
  builder.draft.subclassName = ''
  builder.draft.availableSubclasses = []

  const meta = getClassMeta(index)
  builder.draft.classHitDie = meta.hitDie

  builder.draft.selectedSkills = []

  try {
    const detail: ApiClass = await fiveEApi.getClass(index)
    builder.draft.classSpellcastingAbility = detail.spellcasting?.spellcasting_ability?.index ?? null
    builder.draft.availableSubclasses = detail.subclasses.map(s => ({ index: s.index, name: s.name }))

    const skillChoice = detail.proficiency_choices?.find(c =>
      c.from.options.some((o: ApiProfChoiceOption) => o.item?.index?.startsWith('skill-'))
    )
    builder.draft.classSkillChoices = skillChoice?.choose ?? 2
    builder.draft.classSkillOptions = skillChoice
      ? skillChoice.from.options
          .filter((o: ApiProfChoiceOption) => o.item?.index?.startsWith('skill-'))
          .map((o: ApiProfChoiceOption) => o.item.index.replace(/^skill-/, ''))
      : []
  } catch { /* ignore */ }
}

function toggleSubclass(index: string, name: string) {
  if (builder.draft.subclassIndex === index) {
    builder.draft.subclassIndex = ''
    builder.draft.subclassName = ''
  } else {
    builder.draft.subclassIndex = index
    builder.draft.subclassName = name
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(4px); }

.expand-enter-active, .expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 400px; }
</style>
