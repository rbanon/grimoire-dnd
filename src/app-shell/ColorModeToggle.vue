<template>
  <button
    class="btn-icon w-8 h-8 rounded relative overflow-hidden group"
    :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    :title="isDark ? 'Modo claro' : 'Modo oscuro'"
    @click="toggle"
  >
    <Transition name="icon-swap" mode="out-in">
      <SunIcon  v-if="isDark"  :size="15" class="text-gold-mid" />
      <MoonIcon v-else         :size="15" class="text-stone" />
    </Transition>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SunIcon, MoonIcon } from 'lucide-vue-next'
import { useColorMode } from '@/shared/composables/useColorMode'

const { mode, setMode } = useColorMode()

const isDark = computed(() =>
  mode.value === 'dark' ||
  (mode.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
)

function toggle() {
  setMode(isDark.value ? 'light' : 'dark')
}
</script>

<style scoped>
.icon-swap-enter-active,
.icon-swap-leave-active { transition: all 0.15s ease; }
.icon-swap-enter-from   { opacity: 0; transform: scale(0.7) rotate(-30deg); }
.icon-swap-leave-to     { opacity: 0; transform: scale(0.7) rotate(30deg); }
</style>
