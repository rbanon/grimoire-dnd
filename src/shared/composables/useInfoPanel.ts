import { ref, readonly } from 'vue'

/** Content edition. Defaults to '2014' when omitted (most SRD content is shared). */
export type InfoEdition = '2014' | '2024'

export type InfoTarget =
  | { kind: 'race';       index: string; edition?: InfoEdition }
  | { kind: 'class';      index: string; edition?: InfoEdition }
  | { kind: 'background'; index: string; edition?: InfoEdition }
  | { kind: 'spell';      index: string }
  | { kind: 'skill';      index: string }
  | { kind: 'alignment';  value: string }
  | { kind: 'item';       index: string; edition?: InfoEdition }
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
