<template>
  <div class="rounded border border-arcane-base/25 bg-arcane-deep/10 px-4 py-3 space-y-2.5">
    <div class="flex items-baseline justify-between gap-3 flex-wrap">
      <p class="text-2xs font-heading tracking-wide uppercase text-arcane-pale">Rules</p>
      <p class="text-2xs font-body text-mist/70">Applies to the whole character.</p>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="opt in OPTIONS"
        :key="opt.value"
        type="button"
        class="px-3 py-2 rounded border text-left transition-all duration-100"
        :class="modelValue === opt.value
          ? 'border-gold-mid/60 bg-gold-dim/12 text-gold-deep'
          : 'border-shadow text-ash hover:border-gold-dim/40 hover:text-stone'"
        @click="choose(opt.value)"
      >
        <span class="block text-sm font-heading tracking-wide">{{ opt.label }}</span>
        <span class="block text-2xs font-body text-mist mt-0.5">{{ opt.hint }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfirm } from '@/shared/composables/useConfirm'
import type { EditionTag } from '@/shared/types/api'

// 2014 and 2024 are separate rulesets, not a menu to mix: each assumes the other's origin
// bonuses are absent. Choosing one filters every picker and decides which side of the math
// applies, so switching mid-build invalidates the selections made under the old one.

const props = defineProps<{ modelValue: EditionTag, hasSelections: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: EditionTag] }>()

const { confirm } = useConfirm()

const OPTIONS: { value: EditionTag, label: string, hint: string }[] = [
  { value: '2014', label: '2014 rules', hint: 'Ability increases come from your race' },
  { value: '2024', label: '2024 rules', hint: 'Ability increases come from your background' },
]

async function choose(value: EditionTag) {
  if (value === props.modelValue) return
  // Only warn once there is something to lose: on a fresh draft the switch is free.
  if (props.hasSelections) {
    const ok = await confirm({
      title: 'Switch rules?',
      body: 'Races, classes and backgrounds differ between the two rulesets, so your current '
        + 'selections cannot carry over. They will be cleared and you will pick again.',
      confirmLabel: 'Switch and clear',
      variant: 'danger',
    })
    if (!ok) return
  }
  emit('update:modelValue', value)
}
</script>
