import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/shared/api/supabase.client'

interface UserProfile {
  display_name: string | null
  avatar_url: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const loading = ref(true)
  // Tracks the last Supabase auth event so other stores can react to transitions.
  // 'SIGNED_IN' = actual login; 'INITIAL_SESSION' = session restore on boot; 'SIGNED_OUT' = logout.
  const lastAuthEvent = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)
  const userId = computed(() => user.value?.id ?? null)
  const userEmail = computed(() => user.value?.email ?? null)
  const nickname = computed(() => profile.value?.display_name || null)
  const avatarUrl = computed(() => profile.value?.avatar_url || null)

  async function loadProfile(id: string) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', id)
      .single()
    profile.value = data
  }

  async function init() {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    if (user.value) await loadProfile(user.value.id)
    loading.value = false

    supabase.auth.onAuthStateChange(async (event, session) => {
      user.value = session?.user ?? null
      lastAuthEvent.value = event
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        profile.value = null
      }
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
    profile.value = null
  }

  async function updateProfile(data: { nickname: string | null; avatarUrl: string | null }) {
    if (!userId.value) throw new Error('Not authenticated')
    const { error } = await supabase.from('profiles').upsert({
      id: userId.value,
      display_name: data.nickname,
      avatar_url: data.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    profile.value = { display_name: data.nickname, avatar_url: data.avatarUrl }
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
