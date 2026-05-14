<template>
  <button
    class="btn-icon w-8 h-8 rounded relative overflow-hidden group opacity-30 cursor-not-allowed"
    aria-label="Dark mode temporarily disabled"
    title="Dark mode coming soon"
    disabled
  >
    <Transition name="icon-swap" mode="out-in">
      <SunIcon  v-if="mode === 'light'" :size="15" class="text-gold-mid" />
      <MoonIcon v-else                 :size="15" class="text-arcane-pale" />
    </Transition>
  </button>
</template>

<script setup lang="ts">
import { SunIcon, MoonIcon } from 'lucide-vue-next'
import { useColorMode } from '@/shared/composables/useColorMode'

const { mode } = useColorMode()
</script>

<style scoped>
.icon-swap-enter-active,
.icon-swap-leave-active { transition: all 0.15s ease; }
.icon-swap-enter-from   { opacity: 0; transform: scale(0.7) rotate(-30deg); }
.icon-swap-leave-to     { opacity: 0; transform: scale(0.7) rotate(30deg); }
</style>
