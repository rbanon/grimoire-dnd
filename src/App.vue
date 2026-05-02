<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useColorMode } from './shared/composables/useColorMode'
import { useAuthStore } from './auth/store'

const { init } = useColorMode()
const auth = useAuthStore()

onMounted(() => {
  init()
  auth.init()
})
</script>
