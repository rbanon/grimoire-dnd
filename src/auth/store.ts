import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/shared/api/supabase.client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  // Tracks the last Supabase auth event so other stores can react to transitions.
  // 'SIGNED_IN' = actual login; 'INITIAL_SESSION' = session restore on boot; 'SIGNED_OUT' = logout.
  const lastAuthEvent = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)
  const userId = computed(() => user.value?.id ?? null)
  const userEmail = computed(() => user.value?.email ?? null)
  const nickname = computed(() => (user.value?.user_metadata?.nickname as string | undefined) || null)
  const avatarUrl = computed(() => (user.value?.user_metadata?.avatar_url as string | undefined) || null)

  async function init() {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    loading.value = false

    supabase.auth.onAuthStateChange((event, session) => {
      user.value = session?.user ?? null
      lastAuthEvent.value = event
    })
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) throw error
  }

  async function signUpWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password })
    if (error) throw error
  }

  async function sendMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
  }

  async function updateProfile(data: { nickname: string | null; avatarUrl: string | null }) {
    const { data: result, error } = await supabase.auth.updateUser({
      data: { nickname: data.nickname, avatar_url: data.avatarUrl },
    })
    if (error) throw error
    if (result.user) user.value = result.user
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  return {
    user,
    loading,
    lastAuthEvent,
    isAuthenticated,
    userId,
    userEmail,
    nickname,
    avatarUrl,
    init,
    signInWithEmail,
    signUpWithEmail,
    sendMagicLink,
    signOut,
    updateProfile,
    updatePassword,
  }
})
