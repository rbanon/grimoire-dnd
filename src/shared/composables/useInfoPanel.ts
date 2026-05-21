import { ref, readonly } from 'vue'

export type InfoTarget =
  | { kind: 'race';       index: string }
  | { kind: 'class';      index: string }
  | { kind: 'background'; index: string }
  | { kind: 'spell';      index: string }
  | { kind: 'skill';      index: string }
  | { kind: 'alignment';  value: string }
  | { kind: 'item';       index: string }
  | { kind: 'feature';    index: string; name: string }
  | { kind: 'exhaustion' }

const _target = ref<InfoTarget | null>(null)

export function useInfoPanel() {
  return {
    target: readonly(_target),
    open(t: InfoTarget) { _target.value = t },
    close() { _target.value = null },
  }
}
