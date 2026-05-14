import { ref, readonly } from 'vue'

export interface RollResult {
  id: number
  label: string
  die: number
  modifier: number
  total: number
  isCrit: boolean
  isCritFail: boolean
  type: 'd20' | 'damage'
  formula?: string
}

// Module-level singleton — all callers share the same result
let _id = 0
const _current = ref<RollResult | null>(null)
let _timer: ReturnType<typeof setTimeout> | null = null

function _show(r: RollResult, ms = 4500) {
  if (_timer) clearTimeout(_timer)
  _current.value = r
  _timer = setTimeout(() => { _current.value = null }, ms)
}

function _evalFormula(formula: string): number {
  const m = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
  if (!m) return 0
  const count = parseInt(m[1])
  const sides = parseInt(m[2])
  const flat = m[3] ? parseInt(m[3]) : 0
  let total = flat
  for (let i = 0; i < count; i++) total += Math.ceil(Math.random() * sides)
  return Math.max(1, total)
}

export function useRoll() {
  function rollD20(modifier: number, label: string): RollResult {
    const die = Math.ceil(Math.random() * 20)
    const r: RollResult = {
      id: ++_id,
      label,
      die,
      modifier,
      total: die + modifier,
      isCrit: die === 20,
      isCritFail: die === 1,
      type: 'd20',
    }
    _show(r)
    return r
  }

  function rollDamage(formula: string, label: string): RollResult {
    const total = _evalFormula(formula)
    const r: RollResult = {
      id: ++_id,
      label,
      die: total,
      modifier: 0,
      total,
      isCrit: false,
      isCritFail: false,
      type: 'damage',
      formula,
    }
    _show(r)
    return r
  }

  function dismiss() {
    if (_timer) { clearTimeout(_timer); _timer = null }
    _current.value = null
  }

  return {
    current: readonly(_current),
    rollD20,
    rollDamage,
    dismiss,
  }
}
