import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import 'virtual:uno.css'
import './assets/grimoire.css'

import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './auth/store'
import { useToast } from './shared/composables/useToast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24h default
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(VueQueryPlugin, { queryClient })

app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue]', info, err)
  useToast().error('Something went wrong. Refresh the page if the issue persists.')
}

// Clean up stale 5e API cache entries from old prefix versions (e.g. dnd5e:0:*)
const CURRENT_5E_PREFIX = 'dnd5e:1:'
Object.keys(localStorage)
  .filter(k => k.startsWith('dnd5e:') && !k.startsWith(CURRENT_5E_PREFIX))
  .forEach(k => localStorage.removeItem(k))

// Initialize auth before mount so the router guard has the correct session state
// on the very first navigation. Supabase reads from localStorage cache, so this
// resolves in < 1ms in practice and causes no visible delay.
useAuthStore().init().finally(() => app.mount('#app'))
