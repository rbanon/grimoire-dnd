<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useColorMode } from './shared/composables/useColorMode'

const { init } = useColorMode()

onMounted(() => {
  init()
})
</script>
