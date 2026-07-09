<template>
  <header class="sticky top-0 z-40 border-b border-shadow/80 bg-abyss/90 backdrop-blur-md">
    <!-- Gold top accent line -->
    <div class="h-0.5 bg-gradient-to-r from-transparent via-gold-mid/60 to-transparent" />

    <nav class="app-container h-[64px] flex items-center justify-between gap-4">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-3 group shrink-0">
        <div class="relative w-7 h-7 flex items-center justify-center">
          <!-- Rotating geometric ornament -->
          <div
            class="absolute inset-0 border border-gold-dim/40 rotate-45 group-hover:rotate-[90deg] transition-transform duration-500"
            style="border-radius: 2px"
          />
          <span class="relative text-gold-mid text-sm leading-none select-none">⚔</span>
        </div>
        <span class="font-display text-base tracking-[0.2em] text-vellum uppercase group-hover:text-gold-dim transition-colors duration-300">
          Grimoire<span class="tracking-[0.2em] text-gold-dim/70 text-xs"> v{{ version }}</span>
        </span>
        
      </RouterLink>
      
      <!-- Desktop nav links -->
      <div class="hidden lg:flex items-center gap-1">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          custom
          v-slot="{ isExactActive, href, navigate }"
        >
          <a
            :href="href"
            :class="isExactActive ? 'nav-link-active' : 'nav-link'"
            @click="navigate"
          >
            <component :is="link.icon" :size="14" class="shrink-0" />
            {{ link.label }}
            <LockIcon
              v-if="link.authRequired && !auth.isAuthenticated"
              :size="10"
              class="text-mist ml-0.5"
            />
          </a>
        </RouterLink>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-2">
        <ColorModeToggle class="hidden sm:flex" />

        <template v-if="auth.isAuthenticated">
          <RouterLink to="/profile" class="nav-link text-sm hidden sm:flex min-w-0 overflow-hidden">
            <!-- Avatar circle: initials always rendered as fallback; image layered on top -->
            <div class="w-6 h-6 rounded-full border border-gold-mid/50 bg-gold-base/80 overflow-hidden shrink-0 flex items-center justify-center relative">
              <span class="text-void text-xs font-heading leading-none">{{ initials }}</span>
              <img
                v-if="auth.avatarUrl"
                :src="auth.avatarUrl"
                alt=""
                class="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <span class="hidden lg:inline max-w-[140px] truncate">{{ displayName }}</span>
          </RouterLink>
          <button class="btn-ghost text-xs px-2.5 py-1 border border-shadow hover:border-gold-dim/60" @click="auth.signOut">
            Sign out
          </button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn-secondary px-4 py-1.5 text-xs">
            Sign in
          </RouterLink>
        </template>

        <!-- Mobile hamburger -->
        <button
          class="lg:hidden btn-icon"
          aria-label="Toggle menu"
          @click="mobileOpen = !mobileOpen"
        >
          <MenuIcon v-if="!mobileOpen" :size="18" />
          <XIcon v-else :size="18" />
        </button>
      </div>
    </nav>

    <!-- Mobile menu -->
    <Transition name="nav-slide">
      <div
        v-if="mobileOpen"
        class="lg:hidden border-t border-shadow bg-abyss px-4 py-3 flex flex-col gap-0.5"
      >
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link justify-start py-2.5"
          @click="mobileOpen = false"
        >
          <component :is="link.icon" :size="14" />
          {{ link.label }}
          <LockIcon
            v-if="link.authRequired && !auth.isAuthenticated"
            :size="10"
            class="ml-auto text-mist"
          />
        </RouterLink>

        <!-- Profile & sign out (authenticated only) -->
        <template v-if="auth.isAuthenticated">
          <div class="mt-2 pt-2 border-t border-shadow flex flex-col gap-0.5">
            <RouterLink
              to="/profile"
              class="nav-link justify-start py-2.5"
              @click="mobileOpen = false"
            >
              <UserCircleIcon :size="14" />
              Profile
              <span class="ml-auto text-xs font-body text-mist truncate max-w-[120px]">{{ displayName }}</span>
            </RouterLink>
            <button
              class="nav-link justify-start py-2.5 text-blood-bright/80 hover:text-blood-bright w-full"
              @click="auth.signOut(); mobileOpen = false"
            >
              Sign out
            </button>
          </div>
        </template>

        <div class="mt-2 pt-2 border-t border-shadow flex items-center gap-2">
          <ColorModeToggle />
          <span class="text-xs text-mist font-heading tracking-wider">Theme</span>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { version } from '../../package.json'
import { UsersIcon, SparklesIcon, ShieldIcon, BookOpenIcon, SkullIcon, GlobeIcon, MenuIcon, XIcon, LockIcon, UserCircleIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/auth/store'
import ColorModeToggle from './ColorModeToggle.vue'

const auth = useAuthStore()
const mobileOpen = ref(false)

const displayName = computed(() => {
  if (auth.nickname) return auth.nickname
  const email = auth.userEmail ?? ''
  return email.split('@')[0] || email
})

const initials = computed(() => displayName.value.slice(0, 2).toUpperCase())

const navLinks = [
  { to: '/',          label: 'Characters', icon: UsersIcon,     authRequired: false },
  { to: '/spells',    label: 'Spells',     icon: SparklesIcon,  authRequired: false },
  { to: '/items',     label: 'Items',      icon: ShieldIcon,    authRequired: false },
  { to: '/monsters',  label: 'Bestiary',   icon: SkullIcon,     authRequired: false },
  { to: '/community', label: 'Community',   icon: GlobeIcon,     authRequired: false },
  { to: '/campaigns', label: 'Campaigns',  icon: BookOpenIcon,  authRequired: true  },
]
</script>

<style scoped>
.nav-slide-enter-active,
.nav-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-slide-enter-from,
.nav-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
