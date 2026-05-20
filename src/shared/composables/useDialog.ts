import { ref, computed } from 'vue'

export interface DialogConfig {
  title: string
  body: string
  items?: { label: string; value: string }[]
  variant?: 'default' | 'success' | 'danger'
}

const _queue = ref<DialogConfig[]>([])

export function useDialog() {
  const config = computed(() => _queue.value[0] ?? null)
  return {
    config,
    open(c: DialogConfig) { _queue.value.push(c) },
    close() { _queue.value.shift() },
  }
}
