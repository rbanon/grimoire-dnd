import { ref, readonly } from 'vue'

export type RollMode = 'normal' | 'advantage' | 'disadvantage'

export interface RollResult {
  id: number
  label: string
  die: number
  die2?: number
  modifier: number
  total: number
  isCrit: boolean
  isCritFail: boolean
  type: 'd20' | 'damage'
  formula?: string
  mode?: RollMode
  diceRolls?: number[]    // individual die results for damage rolls
  modifierParts?: string  // human-readable modifier breakdown, e.g. "+5 [+3 STR, +2 Prof]"
}

export interface PendingRoll {
  modifier: number
  label: string
  rect: DOMRect | null
  modifierParts?: string
}

// Module-level singletons — all callers share the same state
let _id = 0
const _current = ref<RollResult | null>(null)
const _pending = ref<PendingRoll | null>(null)
let _timer: ReturnType<typeof setTimeout> | null = null
const _animating = ref(false)
const _animDieSides = ref(20)
let _animTimer: ReturnType<typeof setTimeout> | null = null
const _prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function _show(r: RollResult, ms = 4500) {
  // Detect die type for animation
  if (r.type === 'damage' && r.formula) {
    const m = r.formula.match(/^(\d+)d(\d+)/)
    _animDieSides.value = m ? parseInt(m[2]) : 6
  } else {
    _animDieSides.value = 20
  }

  // Animation plays first, then result appears.
  // _animating is always true regardless of reduced-motion — CSS @media handles suppressing the keyframe.
  if (_animTimer) clearTimeout(_animTimer)
  _animating.value = true
  const delay = _prefersReducedMotion ? 150 : 500

  _animTimer = setTimeout(() => {
    _animating.value = false
    if (_timer) clearTimeout(_timer)
    _current.value = r
    _timer = setTimeout(() => { _current.value = null }, ms)
  }, delay)
}

function _evalFormula(formula: string): { total: number; rolls: number[]; flat: number } {
  const m = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
  if (!m) return { total: 0, rolls: [], flat: 0 }
  const count = parseInt(m[1])
  const sides = parseInt(m[2])
  const flat  = m[3] ? parseInt(m[3]) : 0
  const rolls: number[] = []
  let diceSum = 0
  for (let i = 0; i < count; i++) {
    const r = Math.ceil(Math.random() * sides)
    rolls.push(r)
    diceSum += r
  }
  return { total: Math.max(1, diceSum + flat), rolls, flat }
}

export function useRoll() {
  function rollD20(modifier: number, label: string, event?: MouseEvent, modifierParts?: string): void {
    const rect = event
      ? (event.currentTarget as Element | null)?.getBoundingClientRect() ?? null
      : null
    _pending.value = { modifier, label, rect, modifierParts }
  }

  function confirmRoll(mode: RollMode): RollResult | null {
    if (!_pending.value) return null
    const { modifier, label, modifierParts } = _pending.value
    _pending.value = null

    let die = Math.ceil(Math.random() * 20)
    let die2: number | undefined

    if (mode === 'advantage' || mode === 'disadvantage') {
      die2 = Math.ceil(Math.random() * 20)
      die = mode === 'advantage' ? Math.max(die, die2) : Math.min(die, die2)
    }

    const r: RollResult = {
      id: ++_id,
      label,
      die,
      die2,
      modifier,
      total: die + modifier,
      isCrit: die === 20,
      isCritFail: die === 1,
      type: 'd20',
      mode,
      modifierParts,
    }
    _show(r)
    return r
  }

  function cancelRoll(): void {
    _pending.value = null
  }

  function rollDamage(formula: string, label: string, modifierParts?: string): RollResult {
    const { total, rolls, flat } = _evalFormula(formula)
    const r: RollResult = {
      id: ++_id,
      label,
      die: total,
      modifier: flat,
      total,
      isCrit: false,
      isCritFail: false,
      type: 'damage',
      formula,
      diceRolls: rolls,
      modifierParts,
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
    pending: readonly(_pending),
    animating: readonly(_animating),
    animDieSides: readonly(_animDieSides),
    rollD20,
    confirmRoll,
    cancelRoll,
    rollDamage,
    dismiss,
  }
}
