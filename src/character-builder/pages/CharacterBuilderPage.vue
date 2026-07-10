<template>

  <!-- ── Resume screen ───────────────────────────────────────────────────── -->
  <div
    v-if="resumeScreen"
    class="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 bg-void"
  >
    <div class="w-full max-w-sm border border-gold-dim/25 rounded bg-abyss overflow-hidden">

      <!-- Header stripe -->
      <div class="h-0.5 bg-gold-mid" />

      <div class="p-7 space-y-5">
        <div>
          <p class="font-mono text-2xs tracking-[0.2em] uppercase text-mist mb-1.5">Draft found</p>
          <h2 class="font-display text-2xl text-vellum">
            {{ builder.draft.name || 'Unnamed Character' }}
          </h2>
          <p v-if="builder.draft.raceName || builder.draft.className" class="font-body text-sm text-ash mt-0.5">
            {{ [builder.draft.raceName, builder.draft.className].filter(Boolean).join(' · ') }}
          </p>
        </div>

        <!-- Progress -->
        <div class="space-y-1.5">
          <div class="h-0.5 bg-shadow rounded-full overflow-hidden">
            <div
              class="h-full bg-gold-mid transition-all duration-500"
              :style="{ width: `${((visibleCurrentStep - 1) / builder.totalSteps) * 100}%` }"
            />
          </div>
          <p class="font-mono text-2xs text-mist tracking-wide">
            Step {{ visibleCurrentStep }} of {{ builder.totalSteps }} — {{ currentDraftStepName }}
          </p>
        </div>

        <div class="space-y-2">
          <button class="btn-primary w-full justify-center gap-2" @click="resumeScreen = false">
            <BookOpenIcon :size="14" /> Continue Draft
          </button>
          <button class="btn-secondary w-full justify-center gap-2" @click="startFresh">
            <PlusIcon :size="14" /> Start Fresh
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Builder ──────────────────────────────────────────────────────────── -->
  <div v-else class="h-full flex flex-col bg-void">

    <!-- Mobile progress bar -->
    <div class="md:hidden h-px bg-shadow">
      <div
        class="h-full bg-gold-mid transition-all duration-500"
        :style="{ width: `${(visibleCurrentStep / builder.totalSteps) * 100}%` }"
      />
    </div>

    <div class="flex flex-1 overflow-hidden">

      <!-- ── Sidebar ──────────────────────────────────────────────────────── -->
      <aside class="hidden md:flex flex-col w-56 shrink-0 border-r border-shadow bg-depths">

        <!-- Sidebar header -->
        <div class="px-5 pt-5 pb-4 border-b border-shadow">
          <RouterLink to="/" class="inline-flex items-center gap-1.5 group mb-3">
            <span class="font-mono text-2xs text-mist group-hover:text-ash transition-colors tracking-wide">← Back</span>
          </RouterLink>
          <h2 class="font-display text-sm text-vellum">New Character</h2>
          <p class="font-mono text-2xs tracking-widest uppercase text-mist mt-0.5">
            Step {{ visibleCurrentStep }} of {{ builder.totalSteps }}
          </p>
        </div>

        <!-- Progress line -->
        <div class="h-px bg-shadow">
          <div
            class="h-full bg-gold-mid transition-all duration-500"
            :style="{ width: `${(visibleCurrentStep / builder.totalSteps) * 100}%` }"
          />
        </div>

        <!-- Step list -->
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <button
            v-for="(step, i) in visibleSteps"
            :key="step.id"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-all duration-150 relative"
            :class="getStepClass(step.number)"
            @click="tryGoTo(step.number)"
          >
            <!-- Number / check -->
            <div
              class="shrink-0 w-5 h-5 rounded border flex items-center justify-center font-mono text-2xs transition-all"
              :class="getStepBubbleClass(step.number)"
            >
              <CheckIcon v-if="isCompleted(step.number)" :size="10" />
              <span v-else class="leading-none">{{ ROMAN[i] }}</span>
            </div>
            <!-- Label -->
            <span class="font-body text-xs leading-tight" :class="getStepLabelClass(step.number)">
              {{ step.label }}
            </span>
          </button>
        </nav>

        <!-- Sidebar footer -->
        <div class="px-4 py-3 border-t border-shadow">
          <button
            class="font-mono text-2xs tracking-wide text-mist hover:text-blood-bright transition-colors uppercase"
            @click="confirmDiscard"
          >Discard draft</button>
        </div>
      </aside>

      <!-- ── Main content ─────────────────────────────────────────────────── -->
      <div class="flex-1 flex flex-col overflow-hidden">

        <!-- Step header -->
        <div class="border-b border-shadow bg-abyss px-6 py-4 flex items-center gap-4">
          <div>
            <p class="font-mono text-2xs tracking-widest uppercase text-mist">
              {{ ROMAN[visibleCurrentStep - 1] }} · Step {{ visibleCurrentStep }}
            </p>
            <h1 class="font-display text-xl text-vellum leading-tight mt-0.5">
              {{ currentStepDef?.label }}
            </h1>
          </div>

          <div class="ml-auto flex items-center gap-3">
            <!-- Error pill -->
            <div
              v-if="showErrors && stepErrors.length"
              class="flex items-center gap-1.5 font-body text-xs text-arcane-bright bg-arcane-bright/8 border border-arcane-bright/25 rounded px-3 py-1.5"
            >
              <AlertCircleIcon :size="13" />
              {{ stepErrors[0] }}
            </div>

            <!-- Character name preview -->
            <div v-else-if="builder.draft.name" class="hidden sm:block text-right">
              <p class="font-mono text-2xs tracking-widest uppercase text-mist">Character</p>
              <p class="font-display text-sm text-vellum">{{ builder.draft.name }}</p>
            </div>

          </div>
        </div>

        <!-- Step content -->
        <div class="flex-1 overflow-y-auto bg-void relative">
          <Transition :name="transitionName" mode="out-in">
            <component :is="currentStepComponent" :key="builder.draft.currentStep" class="h-full" />
          </Transition>
        </div>

        <!-- Bottom nav -->
        <div class="shrink-0 border-t border-shadow bg-abyss px-6 py-4">
          <p
            v-if="builder.saveError && visibleCurrentStep === builder.totalSteps"
            role="alert"
            class="font-body text-xs text-blood-bright text-center mb-2"
          >{{ builder.saveError }}</p>

          <!-- Validation toast -->
          <Transition name="val-toast">
            <div
              v-if="showToast && stepErrors.length"
              class="mb-3 px-4 py-3 rounded border border-blood-base/40 bg-blood-deep/20"
            >
              <div class="flex items-start gap-2">
                <AlertCircleIcon :size="13" class="text-blood-bright shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-heading text-blood-bright mb-1">Please complete the required fields to proceed.</p>
                  <ul class="space-y-0.5">
                    <li
                      v-for="err in stepErrors"
                      :key="err"
                      class="text-xs font-body text-blood-mid/90 flex items-start gap-1"
                    >
                      <span class="text-blood-base shrink-0 mt-px">·</span> {{ err }}
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  class="shrink-0 text-mist hover:text-ash transition-colors"
                  @click="showToast = false"
                >
                  <XIcon :size="13" />
                </button>
              </div>
            </div>
          </Transition>

          <div class="flex items-center justify-between gap-4">
            <div class="md:hidden font-mono text-xs text-mist tracking-wide">
              {{ visibleCurrentStep }} / {{ builder.totalSteps }}
            </div>
            <div class="hidden md:block" />

            <div class="flex items-center gap-2.5">
              <button
                v-if="builder.draft.currentStep > 1"
                class="btn-secondary gap-2"
                @click="handleBack"
              >
                <ChevronLeftIcon :size="14" /> Back
              </button>

              <button
                v-if="visibleCurrentStep === builder.totalSteps"
                class="btn-primary gap-2 px-6"
                :disabled="builder.saving"
                @click="handleSave"
              >
                <span v-if="builder.saving" class="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <BookmarkIcon v-else :size="14" />
                {{ builder.saving ? 'Saving…' : 'Create Character' }}
              </button>
              <button
                v-else
                class="btn-primary gap-2 px-6 transition-opacity"
                :class="{ 'opacity-40': !builder.canAdvance }"
                @click="handleNext"
              >
                Next <ChevronRightIcon :size="14" />
              </button>
            </div>
          </div>
        </div>

      </div>


    </div>
  </div>

  <!-- Full-screen saving overlay — fixed so it covers sidebar, header and step content -->
  <Teleport to="body">
    <Transition name="fade-overlay">
      <div
        v-if="navigating"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-void/95"
      >
        <GrimoireSpinner label="Saving character…" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ChevronLeftIcon, ChevronRightIcon, CheckIcon,
  AlertCircleIcon, BookmarkIcon, BookOpenIcon, PlusIcon, XIcon,
} from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import StepClass from '@/character-builder/steps/StepClass.vue'
import StepLevel from '@/character-builder/steps/StepLevel.vue'
import StepRace from '@/character-builder/steps/StepRace.vue'
import StepBackground from '@/character-builder/steps/StepBackground.vue'
import StepAbilities from '@/character-builder/steps/StepAbilities.vue'
import StepFeats from '@/character-builder/steps/StepFeats.vue'
import StepSkills from '@/character-builder/steps/StepProficiencies.vue'
import StepEquipment from '@/character-builder/steps/StepEquipment.vue'
import StepSpells from '@/character-builder/steps/StepSpells.vue'
import StepPersonal from '@/character-builder/steps/StepPersonal.vue'
import StepReview from '@/character-builder/steps/StepReview.vue'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const builder = useBuilderStore()
const router = useRouter()
const route = useRoute()
const { confirm } = useConfirm()
const { trigger: triggerValidation, reset: resetValidation } = useBuilderValidation()
const showErrors = ref(false)
const showToast = ref(false)
const prevStep = ref(1)
const resumeScreen = ref(false)
const navigating = ref(false)
let _toastTimer: ReturnType<typeof setTimeout> | null = null

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

const allSteps = [
  { id: 'class',      number: 1,  label: 'Class & Subclass',      component: StepClass },
  { id: 'level',      number: 2,  label: 'Level & Features',       component: StepLevel },
  { id: 'race',       number: 3,  label: 'Race & Subrace',         component: StepRace },
  { id: 'background', number: 4,  label: 'Background',             component: StepBackground },
  { id: 'abilities',  number: 5,  label: 'Ability Scores',         component: StepAbilities },
  { id: 'feats',      number: 6,  label: 'Feats & ASI',            component: StepFeats },
  { id: 'skills',     number: 7,  label: 'Skills & Proficiencies', component: StepSkills },
  { id: 'spells',     number: 8,  label: 'Spells',                 component: StepSpells },
  { id: 'equipment',  number: 9,  label: 'Equipment',              component: StepEquipment },
  { id: 'personal',   number: 10, label: 'Personal Details',       component: StepPersonal },
  { id: 'review',     number: 11, label: 'Review',                 component: StepReview },
]

const visibleSteps = computed(() =>
  builder.isSpellcaster ? allSteps : allSteps.filter(s => s.id !== 'spells'),
)

const currentStepDef = computed(() =>
  visibleSteps.value.find(s => s.number === builder.draft.currentStep)
)
const currentStepComponent = computed(() => currentStepDef.value?.component ?? StepReview)

// Visible index (1-based) of the current step — used for "Step X of Y" display
const visibleCurrentStep = computed(() =>
  visibleSteps.value.findIndex(s => s.number === builder.draft.currentStep) + 1
)
const currentDraftStepName = computed(() => currentStepDef.value?.label ?? '')
const stepErrors = computed(() => builder.stepErrors[builder.draft.currentStep] ?? [])
const transitionName = computed(() =>
  builder.draft.currentStep > prevStep.value ? 'slide-left' : 'slide-right',
)

onMounted(() => {
  // Preset/quiz flows prefill the draft in-memory and arrive with ?from=… so we
  // open straight into that prepared character instead of prompting to resume.
  if (route.query.from) return
  const hasDraft = builder.loadDraft()
  if (hasDraft) resumeScreen.value = true
})

function isCompleted(stepNumber: number) {
  return stepNumber < builder.draft.currentStep && (builder.stepErrors[stepNumber]?.length === 0)
}

function getStepClass(stepNumber: number) {
  if (stepNumber === builder.draft.currentStep) return 'bg-gold-mid/8 border-l-2 border-gold-mid ml-[-1px]'
  if (stepNumber < builder.draft.currentStep) return 'hover:bg-shadow/40 cursor-pointer'
  return 'cursor-not-allowed opacity-40'
}

function getStepBubbleClass(stepNumber: number) {
  if (isCompleted(stepNumber)) return 'border-gold-mid/60 bg-gold-mid/15 text-gold-dim'
  if (stepNumber === builder.draft.currentStep) return 'border-gold-mid bg-gold-mid/20 text-gold-mid ring-2 ring-gold-mid/25'
  return 'border-shadow text-mist bg-transparent'
}

function getStepLabelClass(stepNumber: number) {
  if (stepNumber === builder.draft.currentStep) return 'text-vellum font-medium'
  if (stepNumber < builder.draft.currentStep) return 'text-ash'
  return 'text-mist'
}

function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

function clearValidation() {
  showErrors.value = false
  showToast.value = false
  resetValidation()
  if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null }
}

function tryGoTo(step: number) {
  if (step < builder.draft.currentStep) {
    clearValidation()
    prevStep.value = builder.draft.currentStep
    builder.goTo(step)
  }
}

function handleNext() {
  if (!builder.canAdvance) {
    showErrors.value = true
    triggerValidation()
    showToast.value = true
    if (_toastTimer) clearTimeout(_toastTimer)
    _toastTimer = setTimeout(() => { showToast.value = false }, 7000)
    return
  }
  clearValidation()
  prevStep.value = builder.draft.currentStep
  builder.next()
  scrollTop()
}

function handleBack() {
  clearValidation()
  prevStep.value = builder.draft.currentStep
  builder.back()
  scrollTop()
}

async function handleSave() {
  navigating.value = true
  await nextTick() // let the overlay render before blocking the microtask queue
  try {
    const id = await builder.save()
    const failure = await router.replace(`/characters/${id}`)
    // NavigationFailure resolves (doesn't reject) — component stays mounted
    if (failure) {
      navigating.value = false
    } else {
      // Clear draft after navigation so step transitions don't fire under the overlay
      builder.clearDraft()
    }
  } catch {
    // save() threw or router.replace() rejected — reset spinner
    navigating.value = false
  }
}

function startFresh() {
  builder.clearDraft()
  resumeScreen.value = false
}

async function confirmDiscard() {
  const ok = await confirm({
    title: 'Discard Draft',
    body: 'Discard this character draft? Your progress will be lost.',
    confirmLabel: 'Discard',
    variant: 'danger',
  })
  if (ok) {
    builder.clearDraft()
    router.push('/')
  }
}
</script>

<style scoped>
.slide-left-enter-active,  .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-left-enter-from  { opacity: 0; transform: translateX(20px); }
.slide-left-leave-to    { opacity: 0; transform: translateX(-20px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-20px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(20px); }

.val-toast-enter-active, .val-toast-leave-active { transition: all 0.2s ease; }
.val-toast-enter-from, .val-toast-leave-to { opacity: 0; transform: translateY(6px); }

.fade-overlay-enter-active, .fade-overlay-leave-active { transition: opacity 0.15s ease; }
.fade-overlay-enter-from, .fade-overlay-leave-to { opacity: 0; }
</style>
