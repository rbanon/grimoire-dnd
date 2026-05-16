import { ref, readonly } from 'vue'

const _show = ref(false)

export function useBuilderValidation() {
  function trigger() { _show.value = true }
  function reset() { _show.value = false }
  return { showValidation: readonly(_show), trigger, reset }
}
