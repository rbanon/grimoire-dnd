import type { DirectiveBinding } from 'vue'

const FOCUSABLE =
  'button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'

const handlers = new WeakMap<HTMLElement, (e: KeyboardEvent) => void>()
const triggers = new WeakMap<HTMLElement, HTMLElement | null>()

function activate(el: HTMLElement) {
  triggers.set(el, document.activeElement as HTMLElement | null)

  const focusable = () =>
    Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (node) => !node.closest('[aria-hidden="true"]'),
    )

  requestAnimationFrame(() => focusable()[0]?.focus())

  const handler = (e: KeyboardEvent) => {
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

  handlers.set(el, handler)
  document.addEventListener('keydown', handler)
}

function deactivate(el: HTMLElement) {
  const handler = handlers.get(el)
  if (handler) document.removeEventListener('keydown', handler)
  handlers.delete(el)
  triggers.get(el)?.focus()
  triggers.delete(el)
}

export const vFocusTrap = {
  mounted(el: HTMLElement, binding: DirectiveBinding<boolean | undefined>) {
    if (binding.value !== false) activate(el)
  },
  updated(el: HTMLElement, binding: DirectiveBinding<boolean | undefined>) {
    if (binding.value !== false && binding.oldValue === false) activate(el)
    if (binding.value === false && binding.oldValue !== false) deactivate(el)
  },
  beforeUnmount(el: HTMLElement) {
    deactivate(el)
  },
}
