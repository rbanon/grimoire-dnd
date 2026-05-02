import { ref } from 'vue'
import { storageGet, storageSet } from '../lib/storage'
import { z } from 'zod'

type ColorMode = 'light' | 'dark' | 'system'

const mode = ref<ColorMode>('system')

function applyMode(m: ColorMode) {
  const isDark =
    m === 'dark' || (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

export function useColorMode() {
  function init() {
    const stored = storageGet('color-mode', z.enum(['light', 'dark', 'system']))
    mode.value = stored ?? 'system'
    applyMode(mode.value)

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (mode.value === 'system') applyMode('system')
    })
  }

  function setMode(m: ColorMode) {
    mode.value = m
    storageSet('color-mode', m)
    applyMode(m)
  }

  return { mode, init, setMode }
}
