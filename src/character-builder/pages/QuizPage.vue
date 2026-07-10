<template>
  <div class="app-container py-10 max-w-2xl">

    <!-- Header -->
    <RouterLink to="/characters/new" class="no-underline inline-flex items-center gap-1.5 group mb-4">
      <ChevronLeftIcon :size="13" class="text-mist group-hover:text-ash transition-colors" />
      <span class="font-mono text-2xs text-mist group-hover:text-ash transition-colors tracking-wide">Creation modes</span>
    </RouterLink>
    <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist mb-2">Guided Quiz · Levels 1–3</p>
    <h1 class="font-display text-4xl text-vellum leading-tight mb-6">Find Your Character</h1>

    <!-- Progress -->
    <div v-if="!result" class="mb-6">
      <div class="h-0.5 bg-shadow rounded-full overflow-hidden mb-2">
        <div class="h-full bg-verdant-base transition-all duration-300" :style="{ width: `${(current / QUIZ.length) * 100}%` }" />
      </div>
      <p class="font-mono text-2xs text-mist tracking-wide">Question {{ current + 1 }} of {{ QUIZ.length }}</p>
    </div>

    <!-- Question -->
    <Transition name="q-fade" mode="out-in">
      <div v-if="!result" :key="current" class="space-y-4">
        <h2 class="font-display text-2xl text-vellum leading-snug">{{ QUIZ[current].prompt }}</h2>
        <div class="space-y-2.5">
          <button
            v-for="(opt, i) in QUIZ[current].options"
            :key="i"
            type="button"
            class="w-full text-left px-5 py-4 rounded-lg border border-shadow bg-abyss hover:border-verdant-base/50 hover:bg-verdant-deep/10 transition-all duration-150 flex items-center gap-3 group"
            @click="choose(i)"
          >
            <span class="shrink-0 w-6 h-6 rounded-full border border-shadow group-hover:border-verdant-base/60 flex items-center justify-center font-mono text-2xs text-mist group-hover:text-verdant-base transition-colors">
              {{ ['A', 'B', 'C', 'D'][i] }}
            </span>
            <span class="font-body text-base text-ash group-hover:text-vellum transition-colors">{{ opt.label }}</span>
          </button>
        </div>
        <button
          v-if="current > 0"
          type="button"
          class="mt-2 font-mono text-2xs text-mist hover:text-ash tracking-wide transition-colors"
          @click="back"
        >← Previous question</button>
      </div>

      <!-- Result -->
      <div v-else class="space-y-5">
        <div class="text-center">
          <p class="font-mono text-2xs tracking-[0.2em] uppercase text-verdant-base mb-2">Your match</p>
          <h2 class="font-display text-3xl text-vellum leading-tight">{{ result.title }}</h2>
          <p class="font-body text-sm text-mist mt-1">{{ result.subtitle }}</p>
        </div>

        <div class="rounded-lg border border-shadow bg-abyss p-5" :style="{ 'border-left': `3px solid ${statColor(result.primaryStat)}` }">
          <p class="font-body text-sm text-ash leading-relaxed">{{ result.blurb }}</p>
          <div class="flex items-center gap-2 mt-3">
            <span class="text-2xs font-mono px-1.5 py-0.5 rounded border" :style="{ 'border-color': statColor(result.primaryStat), color: statColor(result.primaryStat) }">
              {{ result.primaryAbility }}
            </span>
            <span class="text-2xs font-mono tracking-wide uppercase px-1.5 py-0.5 rounded border border-gold-dim/30 text-gold-dim">Lvl {{ result.level }}</span>
            <span v-if="result.isSpellcaster" class="text-2xs font-heading text-arcane-pale">✶ Spellcaster</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button type="button" class="btn-primary gap-2 flex-1 justify-center" @click="createHero">
            <SparklesIcon :size="14" /> Create this hero
          </button>
          <button type="button" class="btn-secondary gap-2" @click="retake">
            <RotateCcwIcon :size="14" /> Retake
          </button>
        </div>
        <p class="text-center text-2xs font-body text-mist/60">You'll open in the builder — tweak anything before saving.</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeftIcon, SparklesIcon, RotateCcwIcon } from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'
import { QUIZ, presetForAnswers } from '@/character-builder/quiz'
import type { CharacterPreset } from '@/character-builder/presets'

const router = useRouter()
const builder = useBuilderStore()

const current = ref(0)
const answers = ref<Record<string, number>>({})
const result = ref<CharacterPreset | null>(null)

function choose(optionIndex: number) {
  answers.value[QUIZ[current.value].id] = optionIndex
  if (current.value < QUIZ.length - 1) {
    current.value++
  } else {
    result.value = presetForAnswers(answers.value)
  }
}

function back() {
  if (current.value > 0) current.value--
}

function retake() {
  answers.value = {}
  current.value = 0
  result.value = null
}

function createHero() {
  if (!result.value) return
  builder.applyDraft(result.value.draft, 1)
  router.push({ path: '/characters/new/builder', query: { from: 'quiz' } })
}

function statColor(s: string): string {
  switch (s) {
    case 'str': return 'rgb(var(--c-blood-bright))'
    case 'dex': return 'rgb(var(--c-verdant-bright))'
    case 'con': return 'rgb(var(--c-gold-mid))'
    case 'int': return 'rgb(var(--c-arcane-base))'
    case 'wis': return 'rgb(var(--c-arcane-pale))'
    case 'cha': return 'rgb(var(--c-gold-bright))'
    default: return 'rgb(var(--c-mist))'
  }
}
</script>

<style scoped>
.q-fade-enter-active, .q-fade-leave-active { transition: all 0.2s ease; }
.q-fade-enter-from { opacity: 0; transform: translateX(12px); }
.q-fade-leave-to { opacity: 0; transform: translateX(-12px); }
</style>
