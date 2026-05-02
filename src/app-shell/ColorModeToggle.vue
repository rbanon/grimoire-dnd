<template>
  <button
    class="btn-icon w-8 h-8 rounded relative overflow-hidden group"
    :aria-label="`Mode: ${mode}. Click to switch.`"
    @click="cycle"
  >
    <Transition name="icon-swap" mode="out-in">
      <SunIcon    v-if="mode === 'light'"  :size="15" class="text-gold-mid" />
      <MoonIcon   v-else-if="mode === 'dark'"   :size="15" class="text-arcane-pale" />
      <MonitorIcon v-else                        :size="15" class="text-ash" />
    </Transition>
  </button>
</template>

<script setup lang="ts">
import { SunIcon, MoonIcon, MonitorIcon } from 'lucide-vue-next'
import { useColorMode } from '@/shared/composables/useColorMode'

const { mode, setMode } = useColorMode()
const order = ['system', 'light', 'dark'] as const

function cycle() {
  const idx = order.indexOf(mode.value)
  setMode(order[(idx + 1) % order.length])
}
</script>

<style scoped>
.icon-swap-enter-active,
.icon-swap-leave-active { transition: all 0.15s ease; }
.icon-swap-enter-from   { opacity: 0; transform: scale(0.7) rotate(-30deg); }
.icon-swap-leave-to     { opacity: 0; transform: scale(0.7) rotate(30deg); }
</style>
