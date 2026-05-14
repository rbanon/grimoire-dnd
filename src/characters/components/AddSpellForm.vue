<template>
  <div class="flex items-center gap-2 mt-2">
    <input
      ref="inputEl"
      v-model="name"
      type="text"
      :placeholder="label"
      class="input-base flex-1 text-sm"
      @keydown.enter="submit"
      @keydown.esc="$emit('cancel')"
    />
    <button
      type="button"
      class="btn-primary text-xs px-3"
      :disabled="!name.trim()"
      @click="submit"
    >Add</button>
    <button
      type="button"
      class="btn-secondary text-xs px-3"
      @click="$emit('cancel')"
    >Cancel</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{ label: string }>()
const emit = defineEmits<{ submit: [name: string]; cancel: [] }>()

const name = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

onMounted(() => inputEl.value?.focus())

function submit() {
  if (!name.value.trim()) return
  emit('submit', name.value.trim())
  name.value = ''
}
</script>
