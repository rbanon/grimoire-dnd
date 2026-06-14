<template>
  <RouterView />

  <Transition name="pwa-banner">
    <div
      v-if="needRefresh"
      class="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 z-50 bg-abyss border border-gold-dim/40 rounded-lg p-4 shadow-2xl flex items-start gap-3"
    >
      <div class="flex-1 min-w-0">
        <p class="font-heading text-sm text-ash">New version available</p>
        <p class="font-body text-2xs text-mist/70 mt-0.5">Reload to get the latest updates.</p>
      </div>
      <button class="btn-primary text-xs shrink-0" @click="updateServiceWorker()">Reload</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useColorMode } from './shared/composables/useColorMode'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { init } = useColorMode()
onMounted(() => { init() })

const { needRefresh, updateServiceWorker } = useRegisterSW()
</script>

<style scoped>
.pwa-banner-enter-active,
.pwa-banner-leave-active { transition: opacity 0.2s, transform 0.2s; }
.pwa-banner-enter-from,
.pwa-banner-leave-to   { opacity: 0; transform: translateY(8px); }
</style>
