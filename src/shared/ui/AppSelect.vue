<template>
  <div class="relative inline-flex" :class="[attrs.class, { 'opacity-50 pointer-events-none': isDisabled }]">
    <select
      v-model="internalValue"
      v-bind="attrsWithoutClass"
      class="input-base appearance-none pr-9 cursor-pointer w-full"
    >
      <slot />
    </select>
    <ChevronDownIcon
      :size="14"
      class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mist/60 shrink-0"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { ChevronDownIcon } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ modelValue?: unknown }>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()

const attrs = useAttrs() as Record<string, unknown>

const isDisabled = computed(() => Boolean(attrs.disabled))

const attrsWithoutClass = computed(() => {
  const { class: _c, ...rest } = attrs
  return rest
})

const internalValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
