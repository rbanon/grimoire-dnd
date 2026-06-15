import { watchEffect, type Ref } from 'vue'

const FOCUSABLE =
  'button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'

/**
 * Traps keyboard focus inside `panelRef` while `active` is true.
 * Moves focus to the first focusable child on activation and restores
 * focus to the previously focused element on deactivation.
 */
export function useFocusTrap(panelRef: Ref<HTMLElement | null>, active: Ref<boolean>) {
  watchEffect((onCleanup) => {
    if (!active.value || !panelRef.value) return

    const panel = panelRef.value
    const trigger = document.activeElement as HTMLElement | null

    const focusable = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.closest('[aria-hidden="true"]'),
      )

    // Auto-focus first focusable element
    const firstEl = focusable()[0]
    requestAnimationFrame(() => firstEl?.focus())

    function onKeydown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const els = focusable()
      if (!els.length) { e.preventDefault(); return }
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { last.focus(); e.preventDefault() }
      } else {
        if (document.activeElement === last) { first.focus(); e.preventDefault() }
      }
    }

    document.addEventListener('keydown', onKeydown)
    onCleanup(() => {
      document.removeEventListener('keydown', onKeydown)
      trigger?.focus()
    })
  })
}
