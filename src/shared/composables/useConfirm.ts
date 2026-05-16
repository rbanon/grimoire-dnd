import { ref, readonly } from 'vue'

export interface ConfirmConfig {
  title: string
  body: string
  confirmLabel?: string
  variant?: 'danger' | 'default'
}

let _resolve: ((value: boolean) => void) | null = null
const _config = ref<ConfirmConfig | null>(null)

export function useConfirm() {
  function confirm(config: ConfirmConfig): Promise<boolean> {
    _config.value = config
    return new Promise(resolve => { _resolve = resolve })
  }
  function accept() { _config.value = null; _resolve?.(true); _resolve = null }
  function cancel() { _config.value = null; _resolve?.(false); _resolve = null }
  return { config: readonly(_config), confirm, accept, cancel }
}
