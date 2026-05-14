import { ref, readonly } from 'vue'

export interface DialogConfig {
  title: string
  body: string
  items?: { label: string; value: string }[]
  variant?: 'default' | 'success' | 'danger'
}

const _config = ref<DialogConfig | null>(null)

export function useDialog() {
  return {
    config: readonly(_config),
    open(c: DialogConfig) { _config.value = c },
    close() { _config.value = null },
  }
}
