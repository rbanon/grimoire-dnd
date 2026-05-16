<template>

  <!-- ── Resume screen ───────────────────────────────────────────────────── -->
  <div
    v-if="resumeScreen"
    class="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 bg-void"
  >
    <div class="w-full max-w-sm border border-gold-dim/25 rounded bg-abyss overflow-hidden">

      <!-- Header stripe -->
      <div class="h-0.5 bg-arcane-bright" />

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
              :style="{ width: `${((builder.draft.currentStep - 1) / builder.totalSteps) * 100}%` }"
            />
          </div>
          <p class="font-mono text-2xs text-mist tracking-wide">
            Step {{ builder.draft.currentStep }} of {{ builder.totalSteps }} — {{ currentDraftStepName }}
          </p>
        </div>

        <div class="space-y-2">
          <button class="btn-primary w-full justify-center gap-2" @click="resumeScreen = false">
            <BookOpenIcon :size="14" /> Continue Draft
          </button>
          <button class="btn-secondary w-full justify-center gap-2 text-arcane-bright border-arcane-bright/30 hover:border-arcane-bright/60" @click="startFresh">
            <PlusIcon :size="14" /> Start Fresh
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Builder ──────────────────────────────────────────────────────────── -->
  <div v-else class="min-h-[calc(100vh-60px)] flex flex-col bg-void">

    <!-- Mobile progress bar -->
    <div class="md:hidden h-px bg-shadow">
      <div
        class="h-full bg-gold-mid transition-all duration-500"
        :style="{ width: `${(builder.draft.currentStep / builder.totalSteps) * 100}%` }"
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
            Step {{ builder.draft.currentStep }} of {{ builder.totalSteps }}
          </p>
        </div>

        <!-- Progress line -->
        <div class="h-px bg-shadow">
          <div
            class="h-full bg-gold-mid transition-all duration-500"
            :style="{ width: `${(builder.draft.currentStep / builder.totalSteps) * 100}%` }"
          />
        </div>

        <!-- Step list -->
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <button
            v-for="(step, i) in visibleSteps"
            :key="step.id"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-all duration-150 relative"
            :class="getStepClass(i + 1)"
            @click="tryGoTo(i + 1)"
          >
            <!-- Number / check -->
            <div
              class="shrink-0 w-5 h-5 rounded border flex items-center justify-center font-mono text-2xs transition-all"
              :class="getStepBubbleClass(i + 1)"
            >
              <CheckIcon v-if="isCompleted(i + 1)" :size="10" />
              <span v-else class="leading-none">{{ ROMAN[i] }}</span>
            </div>
            <!-- Label -->
            <span class="font-body text-xs leading-tight" :class="getStepLabelClass(i + 1)">
              {{ step.label }}
            </span>
          </button>
        </nav>

        <!-- Sidebar footer -->
        <div class="px-4 py-3 border-t border-shadow">
          <button
            class="font-mono text-2xs tracking-wide text-mist hover:text-arcane-bright transition-colors uppercase"
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
              {{ ROMAN[builder.draft.currentStep - 1] }} · Step {{ builder.draft.currentStep }}
            </p>
            <h1 class="font-display text-xl text-vellum leading-tight mt-0.5">
              {{ currentStepDef?.label }}
            </h1>
          </div>

          <!-- Error pill -->
          <div
            v-if="showErrors && stepErrors.length"
            class="ml-auto flex items-center gap-1.5 font-body text-xs text-arcane-bright bg-arcane-bright/8 border border-arcane-bright/25 rounded px-3 py-1.5"
          >
            <AlertCircleIcon :size="13" />
            {{ stepErrors[0] }}
          </div>

          <!-- Character name preview -->
          <div v-else-if="builder.draft.name" class="ml-auto hidden sm:block text-right">
            <p class="font-mono text-2xs tracking-widest uppercase text-mist">Character</p>
            <p class="font-display text-sm text-vellum">{{ builder.draft.name }}</p>
          </div>
        </div>

        <!-- Step content -->
        <div class="flex-1 overflow-y-auto bg-void">
          <Transition :name="transitionName" mode="out-in">
            <component :is="currentStepComponent" :key="builder.draft.currentStep" class="h-full" />
          </Transition>
        </div>

        <!-- Bottom nav -->
        <div class="border-t border-shadow bg-abyss px-6 py-4">
          <p
            v-if="builder.saveError && builder.draft.currentStep === builder.totalSteps"
            role="alert"
            class="font-body text-xs text-arcane-bright text-center mb-2"
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
                  <p class="text-xs font-heading text-blood-bright mb-1">Obligatorio antes de continuar:</p>
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
              {{ builder.draft.currentStep }} / {{ builder.totalSteps }}
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
                v-if="builder.draft.currentStep === builder.totalSteps"
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
                class="btn-primary gap-2 px-6"
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChevronLeftIcon, ChevronRightIcon, CheckIcon,
  AlertCircleIcon, BookmarkIcon, BookOpenIcon, PlusIcon, XIcon,
} from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import StepIdentity from '@/character-builder/steps/StepIdentity.vue'
import StepClass from '@/character-builder/steps/StepClass.vue'
import StepAbilities from '@/character-builder/steps/StepAbilities.vue'
import StepProficiencies from '@/character-builder/steps/StepProficiencies.vue'
import StepEquipment from '@/character-builder/steps/StepEquipment.vue'
import StepSpells from '@/character-builder/steps/StepSpells.vue'
import StepReview from '@/character-builder/steps/StepReview.vue'

const builder = useBuilderStore()
const router = useRouter()
const { confirm } = useConfirm()
const { trigger: triggerValidation, reset: resetValidation } = useBuilderValidation()
const showErrors = ref(false)
const showToast = ref(false)
const prevStep = ref(1)
const resumeScreen = ref(false)
let _toastTimer: ReturnType<typeof setTimeout> | null = null

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

const allSteps = [
  { id: 'identity',      label: 'Identity',       hint: 'Name, race, background', component: StepIdentity },
  { id: 'class',         label: 'Class & Level',  hint: 'Choose your path',       component: StepClass },
  { id: 'abilities',     label: 'Ability Scores', hint: 'Point buy or manual',    component: StepAbilities },
  { id: 'proficiencies', label: 'Proficiencies',  hint: 'Skills and languages',   component: StepProficiencies },
  { id: 'equipment',     label: 'Equipment',      hint: 'Starting gear',          component: StepEquipment },
  { id: 'spells',        label: 'Spells',         hint: 'Cantrips and spells',    component: StepSpells },
  { id: 'review',        label: 'Review',         hint: 'Confirm and create',     component: StepReview },
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

function isCompleted(step: number) {
  return step < builder.draft.currentStep && (builder.stepErrors[step]?.length === 0)
}

function getStepClass(step: number) {
  if (step === builder.draft.currentStep) return 'bg-arcane-bright/8 border-l-2 border-arcane-bright ml-[-1px]'
  if (step < builder.draft.currentStep) return 'hover:bg-shadow/40 cursor-pointer'
  return 'cursor-not-allowed opacity-40'
}

function getStepBubbleClass(step: number) {
  if (isCompleted(step)) return 'border-gold-mid/60 bg-gold-mid/15 text-gold-dim'
  if (step === builder.draft.currentStep) return 'border-arcane-bright/60 bg-arcane-bright/10 text-arcane-base'
  return 'border-shadow text-mist bg-transparent'
}

function getStepLabelClass(step: number) {
  if (step === builder.draft.currentStep) return 'text-vellum font-medium'
  if (step < builder.draft.currentStep) return 'text-ash'
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
  try {
    const id = await builder.save()
    router.push(`/characters/${id}`)
  } catch { /* saveError shown in template */ }
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
</style>
