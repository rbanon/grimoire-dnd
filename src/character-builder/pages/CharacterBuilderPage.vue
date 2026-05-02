<template>
  <!-- ── Resume / new character screen ─────────────────────────────────────── -->
  <div
    v-if="resumeScreen"
    class="min-h-[calc(100vh-60px)] flex items-center justify-center px-4"
  >
    <div class="card corner-ornament w-full max-w-md p-8 space-y-6">
      <div class="text-center space-y-1">
        <p class="text-2xs font-heading tracking-widest text-gold-dim uppercase">Draft found</p>
        <h2 class="font-display text-2xl text-vellum">
          {{ builder.draft.name || 'Unnamed Character' }}
        </h2>
        <p v-if="builder.draft.raceName || builder.draft.className" class="text-sm text-mist font-body">
          {{ [builder.draft.raceName, builder.draft.className].filter(Boolean).join(' · ') }}
        </p>
      </div>

      <!-- Progress -->
      <div class="bg-depths rounded p-4 space-y-2">
        <div class="h-1 bg-shadow rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-gold-dim to-gold-mid"
            :style="{ width: `${((builder.draft.currentStep - 1) / builder.totalSteps) * 100}%` }"
          />
        </div>
        <p class="text-2xs text-mist font-heading">
          Step {{ builder.draft.currentStep }} of {{ builder.totalSteps }} — {{ currentDraftStepName }}
        </p>
      </div>

      <div class="flex flex-col gap-3">
        <button class="btn-primary gap-2 justify-center" @click="resumeScreen = false">
          <BookOpenIcon :size="15" />
          Continue Draft
        </button>
        <button class="btn-secondary gap-2 justify-center text-blood-bright hover:text-blood-bright" @click="startFresh">
          <PlusIcon :size="15" />
          Start Fresh
        </button>
      </div>
    </div>
  </div>

  <!-- ── Builder ────────────────────────────────────────────────────────────── -->
  <div v-else class="min-h-[calc(100vh-60px)] flex flex-col">

    <!-- Top progress bar (mobile) -->
    <div class="md:hidden h-0.5 bg-shadow">
      <div
        class="h-full bg-gradient-to-r from-gold-dim to-gold-mid transition-all duration-500"
        :style="{ width: `${(builder.draft.currentStep / builder.totalSteps) * 100}%` }"
      />
    </div>

    <div class="flex flex-1 overflow-hidden">

      <!-- ── Sidebar ─────────────────────────────────────────────────────── -->
      <aside
        class="hidden md:flex flex-col w-56 shrink-0 border-r border-shadow bg-abyss"
        style="background: linear-gradient(180deg, #0d1120 0%, #080b12 100%)"
      >
        <!-- Sidebar header -->
        <div class="px-5 pt-6 pb-4 border-b border-shadow/60">
          <RouterLink to="/" class="flex items-center gap-2 group mb-1">
            <span class="text-gold-dim/60 text-xs group-hover:text-gold-mid transition-colors">←</span>
            <span class="text-xs font-heading tracking-widest uppercase text-mist group-hover:text-ash transition-colors">Your tome</span>
          </RouterLink>
          <h2 class="font-display text-sm tracking-wider text-vellum mt-3">New Character</h2>
          <p class="text-2xs font-heading tracking-widest text-mist uppercase mt-0.5">
            Step {{ builder.draft.currentStep }} of {{ builder.totalSteps }}
          </p>
        </div>

        <!-- Step list -->
        <nav class="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
          <button
            v-for="(step, i) in visibleSteps"
            :key="step.id"
            class="relative flex items-start gap-3 px-3 py-2.5 rounded text-left group transition-all duration-150"
            :class="getStepClass(i + 1)"
            @click="tryGoTo(i + 1)"
          >
            <!-- Step number / check -->
            <div
              class="shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-heading transition-all duration-200"
              :class="getStepBubbleClass(i + 1)"
            >
              <CheckIcon v-if="isCompleted(i + 1)" :size="11" />
              <span v-else class="leading-none">{{ ROMAN[i] }}</span>
            </div>

            <!-- Label -->
            <div class="min-w-0 pt-0.5">
              <p class="text-xs font-heading tracking-wide leading-tight" :class="getStepLabelClass(i + 1)">
                {{ step.label }}
              </p>
              <p v-if="builder.draft.currentStep === i + 1" class="text-2xs text-mist mt-0.5 leading-tight">
                {{ step.hint }}
              </p>
            </div>

            <!-- Connecting line (not on last) -->
            <div
              v-if="i < visibleSteps.length - 1"
              class="absolute left-[1.375rem] top-[2.25rem] w-px h-[calc(100%_-_0.5rem)]"
              :class="i + 1 < builder.draft.currentStep ? 'bg-gold-dim/50' : 'bg-shadow'"
            />
          </button>
        </nav>

        <!-- Sidebar footer -->
        <div class="px-4 py-4 border-t border-shadow/60">
          <button
            class="w-full text-xs font-heading tracking-wide text-mist hover:text-blood-bright transition-colors text-left py-1"
            @click="confirmDiscard"
          >
            Discard draft
          </button>
        </div>
      </aside>

      <!-- ── Main content ────────────────────────────────────────────────── -->
      <div class="flex-1 flex flex-col overflow-hidden">

        <!-- Step header -->
        <div class="border-b border-shadow bg-depths/40 px-6 py-4 flex items-center gap-4">
          <div>
            <p class="text-caption text-gold-dim">
              {{ ROMAN[(builder.draft.currentStep - 1)] }} · Step {{ builder.draft.currentStep }}
            </p>
            <h1 class="font-display text-xl text-vellum tracking-wide leading-tight">
              {{ currentStepDef?.label }}
            </h1>
          </div>

          <!-- Errors -->
          <div
            v-if="showErrors && stepErrors.length"
            class="ml-auto flex items-center gap-2 text-xs text-blood-bright bg-blood-deep/30 border border-blood-base/25 rounded px-3 py-1.5"
          >
            <AlertCircleIcon :size="13" />
            {{ stepErrors[0] }}
          </div>

          <!-- Character name preview (if set) -->
          <div v-else-if="builder.draft.name" class="ml-auto hidden sm:block">
            <span class="text-2xs text-mist font-heading tracking-wider">Character</span>
            <p class="text-sm font-heading text-ash">{{ builder.draft.name }}</p>
          </div>
        </div>

        <!-- Step content — scrollable -->
        <div class="flex-1 overflow-y-auto">
          <Transition :name="transitionName" mode="out-in">
            <component
              :is="currentStepComponent"
              :key="builder.draft.currentStep"
              class="h-full"
            />
          </Transition>
        </div>

        <!-- Bottom nav bar -->
        <div class="border-t border-shadow bg-abyss px-6 py-4 flex items-center justify-between gap-4">
          <!-- Mobile step indicator -->
          <div class="md:hidden text-xs font-heading tracking-wider text-mist">
            {{ builder.draft.currentStep }} / {{ builder.totalSteps }}
          </div>

          <div class="hidden md:block" />

          <div class="flex items-center gap-3">
            <button
              v-if="builder.draft.currentStep > 1"
              class="btn-secondary gap-2"
              @click="builder.back()"
            >
              <ChevronLeftIcon :size="15" />
              Back
            </button>

            <!-- Save on last step -->
            <button
              v-if="builder.draft.currentStep === builder.totalSteps"
              class="btn-primary gap-2 px-6"
              :disabled="builder.saving"
              @click="handleSave"
            >
              <span v-if="builder.saving" class="w-4 h-4 border-2 border-void/60 border-t-transparent rounded-full animate-spin" />
              <BookmarkIcon v-else :size="15" />
              {{ builder.saving ? 'Saving…' : 'Create Character' }}
            </button>
            <button
              v-else
              class="btn-primary gap-2 px-6"
              @click="handleNext"
            >
              Next
              <ChevronRightIcon :size="15" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChevronLeftIcon, ChevronRightIcon, CheckIcon,
  AlertCircleIcon, BookmarkIcon, BookOpenIcon, PlusIcon,
} from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'
import StepIdentity from '@/character-builder/steps/StepIdentity.vue'
import StepClass from '@/character-builder/steps/StepClass.vue'
import StepAbilities from '@/character-builder/steps/StepAbilities.vue'
import StepProficiencies from '@/character-builder/steps/StepProficiencies.vue'
import StepEquipment from '@/character-builder/steps/StepEquipment.vue'
import StepSpells from '@/character-builder/steps/StepSpells.vue'
import StepReview from '@/character-builder/steps/StepReview.vue'

const builder = useBuilderStore()
const router = useRouter()
const showErrors = ref(false)
const prevStep = ref(1)
const resumeScreen = ref(false)

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

const allSteps = [
  { id: 'identity',      label: 'Identity',       hint: 'Name, race, background, alignment', component: StepIdentity },
  { id: 'class',         label: 'Class & Level',  hint: 'Choose your path',                   component: StepClass },
  { id: 'abilities',     label: 'Ability Scores', hint: 'Point buy, standard, or manual',     component: StepAbilities },
  { id: 'proficiencies', label: 'Proficiencies',  hint: 'Skills and languages',               component: StepProficiencies },
  { id: 'equipment',     label: 'Equipment',      hint: 'Starting gear and gold',             component: StepEquipment },
  { id: 'spells',        label: 'Spells',         hint: 'Choose cantrips and spells',         component: StepSpells },
  { id: 'review',        label: 'Review',         hint: 'Confirm and create',                 component: StepReview },
]

const visibleSteps = computed(() =>
  builder.isSpellcaster ? allSteps : allSteps.filter(s => s.id !== 'spells'),
)

const currentStepDef = computed(() => visibleSteps.value[builder.draft.currentStep - 1])
const currentStepComponent = computed(() => currentStepDef.value?.component ?? StepReview)
const currentDraftStepName = computed(() => visibleSteps.value[builder.draft.currentStep - 1]?.label ?? '')

const stepErrors = computed(() => builder.stepErrors[builder.draft.currentStep] ?? [])

const transitionName = computed(() =>
  builder.draft.currentStep > prevStep.value ? 'slide-left' : 'slide-right',
)

onMounted(() => {
  const hasDraft = builder.loadDraft()
  if (hasDraft) resumeScreen.value = true
})

function isCompleted(step: number): boolean {
  return step < builder.draft.currentStep && (builder.stepErrors[step]?.length === 0)
}

function getStepClass(step: number): string {
  if (step === builder.draft.currentStep) return 'bg-gold-dim/10 border border-gold-dim/20'
  if (step < builder.draft.currentStep) return 'hover:bg-shadow/40 cursor-pointer'
  return 'cursor-not-allowed opacity-50'
}

function getStepBubbleClass(step: number): string {
  if (isCompleted(step)) return 'bg-gold-dim/30 text-gold-mid border border-gold-dim/40'
  if (step === builder.draft.currentStep) return 'bg-gold-dim/20 text-gold-mid border border-gold-dim/40'
  return 'bg-shadow text-mist border border-shadow'
}

function getStepLabelClass(step: number): string {
  if (step === builder.draft.currentStep) return 'text-gold-pale'
  if (step < builder.draft.currentStep) return 'text-stone'
  return 'text-mist'
}

function tryGoTo(step: number) {
  if (step < builder.draft.currentStep) {
    prevStep.value = builder.draft.currentStep
    builder.goTo(step)
  }
}

function handleNext() {
  if (!builder.canAdvance) {
    showErrors.value = true
    return
  }
  showErrors.value = false
  prevStep.value = builder.draft.currentStep
  builder.next()
}

async function handleSave() {
  const id = await builder.save()
  router.push(`/characters/${id}`)
}

function startFresh() {
  builder.clearDraft()
  resumeScreen.value = false
}

function confirmDiscard() {
  if (confirm('Discard this character draft? Your progress will be lost.')) {
    builder.clearDraft()
    router.push('/')
  }
}
</script>

<style scoped>
/* Step slide transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from  { opacity: 0; transform: translateX(24px); }
.slide-left-leave-to    { opacity: 0; transform: translateX(-24px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-24px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(24px); }
</style>
