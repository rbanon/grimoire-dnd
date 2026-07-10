<template>
  <div class="app-container py-8 max-w-2xl mx-auto flex flex-col gap-6">

    <!-- ── Header ────────────────────────────────────────────────────────── -->
    <div>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1.5 text-sm font-body text-mist hover:text-gold-mid transition-colors mb-5 group"
      >
        <ChevronLeftIcon :size="14" class="group-hover:-translate-x-0.5 transition-transform duration-150" />
        Back to characters
      </RouterLink>
      <h1 class="font-display text-3xl text-vellum tracking-wider">Your Profile</h1>
      <p class="font-body text-sm text-ash mt-1">{{ auth.userEmail }}</p>
    </div>

    <!-- ── Identity card ─────────────────────────────────────────────────── -->
    <section class="card p-6 corner-ornament flex flex-col gap-5">
      <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist">Identity</p>

      <!-- Avatar -->
      <div class="flex items-center gap-5">
        <!-- Clickable circle -->
        <button
          type="button"
          class="relative w-20 h-20 rounded-full border-2 overflow-hidden shrink-0 flex items-center justify-center group transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-mid focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          :class="avatarPreview ? 'border-gold-mid/50' : 'border-gold-dim/30 bg-depths'"
          :disabled="uploading"
          title="Upload profile photo"
          @click="fileInput?.click()"
        >
          <img
            v-if="avatarPreview"
            :src="avatarPreview"
            alt="Your avatar"
            class="w-full h-full object-cover"
          />
          <span v-else class="font-heading text-2xl text-gold-mid select-none">{{ initials }}</span>

          <!-- Hover overlay -->
          <div
            class="absolute inset-0 bg-abyss/60 flex items-center justify-center transition-opacity duration-150"
            :class="uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
          >
            <span v-if="uploading" class="w-5 h-5 border-2 border-gold-mid border-t-transparent rounded-full animate-spin" />
            <CameraIcon v-else :size="18" class="text-gold-mid" />
          </div>
        </button>

        <!-- Hidden file input -->
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="sr-only"
          @change="onFileSelected"
        />

        <!-- Side info -->
        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="btn-secondary text-sm px-4 py-1.5 gap-2"
            :disabled="uploading"
            @click="fileInput?.click()"
          >
            <UploadIcon :size="13" />
            Upload photo
          </button>
          <button
            v-if="avatarPreview"
            type="button"
            class="btn-ghost text-xs text-mist hover:text-blood-bright px-2 py-1 self-start"
            :disabled="uploading"
            @click="removeAvatar"
          >
            Remove
          </button>
          <p class="text-xs font-body text-mist">JPG, PNG, WebP or GIF · max 1 MB</p>
          <p v-if="avatarFileError" class="text-xs font-body text-blood-bright">{{ avatarFileError }}</p>
        </div>
      </div>

      <div class="divider" />

      <!-- Nickname -->
      <div>
        <label for="nickname" class="label">Display name</label>
        <input
          id="nickname"
          v-model="nicknameInput"
          type="text"
          maxlength="20"
          placeholder="How should we call you?"
          class="input-base"
          autocomplete="nickname"
        />
        <p class="text-xs font-body text-mist mt-1.5">
          Max 20 characters. Shown in the navbar.
        </p>
      </div>

      <!-- Email (read-only) -->
      <div>
        <label class="label">Email address</label>
        <p
          class="w-full rounded border border-shadow bg-depths px-3.5 py-2 text-base font-body text-ash cursor-default select-all"
          aria-readonly="true"
        >
          {{ auth.userEmail }}
        </p>
      </div>

      <!-- Save -->
      <div class="flex items-center gap-3 pt-1">
        <button
          class="btn-primary gap-2"
          :disabled="savingProfile"
          @click="saveProfile"
        >
          <span v-if="savingProfile" class="w-3.5 h-3.5 border-2 border-void border-t-transparent rounded-full animate-spin" />
          <SaveIcon v-else :size="13" />
          Save changes
        </button>

        <Transition name="fade-right">
          <span v-if="profileSaved" class="flex items-center gap-1 text-sm font-body text-verdant-bright">
            <CheckIcon :size="13" />
            Saved
          </span>
        </Transition>
      </div>

      <p v-if="profileError" class="text-sm font-body text-blood-bright -mt-1">{{ profileError }}</p>
    </section>

    <!-- ── Custom content card ────────────────────────────────────────────── -->
    <section class="card p-6 corner-ornament flex flex-col gap-5">
      <div class="flex items-center justify-between gap-3">
        <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist">Custom Races &amp; Classes</p>
        <RouterLink
          to="/characters/new"
          class="text-xs font-heading text-arcane-pale/80 hover:text-arcane-pale transition-colors"
        >+ New in builder</RouterLink>
      </div>

      <!-- Races -->
      <div class="flex flex-col gap-2">
        <p class="label">Races</p>
        <div v-if="!customContent.loaded" class="text-sm font-body text-mist">Loading…</div>
        <p v-else-if="!customContent.races.length" class="text-sm font-body text-mist italic">
          No custom races yet. Create one in the character builder's Race step.
        </p>
        <div
          v-for="race in customContent.races"
          :key="race.id"
          class="flex items-center gap-3 rounded border border-shadow bg-depths/30 px-3.5 py-2.5"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-heading text-vellum truncate">{{ race.name }}</p>
            <p class="text-2xs font-body text-mist">{{ raceSummary(race) }}</p>
            <p
              v-if="race.source"
              class="text-2xs font-body italic truncate"
              :class="customContent.sourceUpdates[race.id] ? 'text-gold-mid' : 'text-arcane-pale/60'"
            >
              {{ customContent.sourceUpdates[race.id] ? '↑ Update available from' : '↓ Copied from' }}
              {{ race.source.authorName || 'the community' }}
            </p>
          </div>
          <button
            v-if="customContent.sourceUpdates[race.id]"
            type="button"
            class="shrink-0 px-2 py-1 rounded border border-gold-mid/50 bg-gold-dim/15 text-gold-deep text-2xs font-heading tracking-wide hover:bg-gold-dim/25 transition-all"
            title="The original has a newer version, replace your copy with it"
            @click="updateFromSource(race)"
          >Update</button>
          <button
            type="button"
            class="shrink-0 px-2 py-1 rounded border text-2xs font-heading tracking-wide transition-all"
            :class="race.isPublic
              ? 'border-verdant-base/50 bg-verdant-deep/15 text-verdant-bright'
              : 'border-shadow text-mist hover:text-ash'"
            :title="race.isPublic ? 'Shared to the community, click to make private' : 'Private, click to share'"
            @click="togglePublic(race)"
          >{{ race.isPublic ? 'Public' : 'Private' }}</button>
          <button
            type="button"
            class="shrink-0 p-1.5 text-mist/60 hover:text-blood-bright transition-colors"
            aria-label="Delete custom race"
            @click="removeRace(race)"
          >
            <Trash2Icon :size="14" />
          </button>
        </div>
      </div>

      <!-- Classes -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <p class="label">Classes</p>
          <button
            type="button"
            class="text-xs font-heading text-arcane-pale/80 hover:text-arcane-pale transition-colors"
            @click="openNewClass"
          >+ New class</button>
        </div>
        <p v-if="!customContent.classes.length" class="text-sm font-body text-mist italic">
          No custom classes yet. Create one to reuse and share it.
        </p>
        <div
          v-for="cls in customContent.classes"
          :key="cls.id"
          class="flex items-center gap-3 rounded border border-shadow bg-depths/30 px-3.5 py-2.5"
        >
          <button type="button" class="flex-1 min-w-0 text-left" @click="openEditClass(cls)">
            <p class="text-sm font-heading text-vellum truncate">{{ cls.name }}</p>
            <p class="text-2xs font-body text-mist">
              d{{ cls.hitDie }} · {{ cls.primaryAbility || '-' }}<template v-if="cls.spellcasting"> · Spellcaster</template>
            </p>
            <p
              v-if="cls.source"
              class="text-2xs font-body italic truncate"
              :class="customContent.sourceUpdates[cls.id] ? 'text-gold-mid' : 'text-arcane-pale/60'"
            >
              {{ customContent.sourceUpdates[cls.id] ? '↑ Update available from' : '↓ Copied from' }}
              {{ cls.source.authorName || 'the community' }}
            </p>
          </button>
          <button
            v-if="customContent.sourceUpdates[cls.id]"
            type="button"
            class="shrink-0 px-2 py-1 rounded border border-gold-mid/50 bg-gold-dim/15 text-gold-deep text-2xs font-heading tracking-wide hover:bg-gold-dim/25 transition-all"
            title="The original has a newer version, replace your copy with it"
            @click="updateFromSource(cls)"
          >Update</button>
          <button
            type="button"
            class="shrink-0 px-2 py-1 rounded border text-2xs font-heading tracking-wide transition-all"
            :class="cls.isPublic
              ? 'border-verdant-base/50 bg-verdant-deep/15 text-verdant-bright'
              : 'border-shadow text-mist hover:text-ash'"
            :title="cls.isPublic ? 'Shared to the community, click to make private' : 'Private, click to share'"
            @click="togglePublicClass(cls)"
          >{{ cls.isPublic ? 'Public' : 'Private' }}</button>
          <button
            type="button"
            class="shrink-0 p-1.5 text-mist/60 hover:text-blood-bright transition-colors"
            aria-label="Delete custom class"
            @click="removeClass(cls)"
          >
            <Trash2Icon :size="14" />
          </button>
        </div>
      </div>

      <!-- Subclasses -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <p class="label">Subclasses</p>
          <button
            type="button"
            class="text-xs font-heading text-arcane-pale/80 hover:text-arcane-pale transition-colors"
            @click="openNewSubclass"
          >+ New subclass</button>
        </div>
        <p v-if="!customContent.subclasses.length" class="text-sm font-body text-mist italic">
          No custom subclasses yet. Create one for any class, SRD or your own.
        </p>
        <div
          v-for="sc in customContent.subclasses"
          :key="sc.id"
          class="flex items-center gap-3 rounded border border-shadow bg-depths/30 px-3.5 py-2.5"
        >
          <button type="button" class="flex-1 min-w-0 text-left" @click="openEditSubclass(sc)">
            <p class="text-sm font-heading text-vellum truncate">{{ sc.name }}</p>
            <p class="text-2xs font-body text-mist">
              {{ sc.parentClassName || sc.parentClass }} · {{ Object.keys(sc.featuresByLevel).length }} feature level{{ Object.keys(sc.featuresByLevel).length === 1 ? '' : 's' }}
            </p>
            <p
              v-if="sc.source"
              class="text-2xs font-body italic truncate"
              :class="customContent.sourceUpdates[sc.id] ? 'text-gold-mid' : 'text-arcane-pale/60'"
            >
              {{ customContent.sourceUpdates[sc.id] ? '↑ Update available from' : '↓ Copied from' }}
              {{ sc.source.authorName || 'the community' }}
            </p>
          </button>
          <button
            v-if="customContent.sourceUpdates[sc.id]"
            type="button"
            class="shrink-0 px-2 py-1 rounded border border-gold-mid/50 bg-gold-dim/15 text-gold-deep text-2xs font-heading tracking-wide hover:bg-gold-dim/25 transition-all"
            title="The original has a newer version, replace your copy with it"
            @click="updateFromSource(sc)"
          >Update</button>
          <button
            type="button"
            class="shrink-0 px-2 py-1 rounded border text-2xs font-heading tracking-wide transition-all"
            :class="sc.isPublic
              ? 'border-verdant-base/50 bg-verdant-deep/15 text-verdant-bright'
              : 'border-shadow text-mist hover:text-ash'"
            :title="sc.isPublic ? 'Shared to the community, click to make private' : 'Private, click to share'"
            @click="togglePublicSubclass(sc)"
          >{{ sc.isPublic ? 'Public' : 'Private' }}</button>
          <button
            type="button"
            class="shrink-0 p-1.5 text-mist/60 hover:text-blood-bright transition-colors"
            aria-label="Delete custom subclass"
            @click="removeSubclass(sc)"
          >
            <Trash2Icon :size="14" />
          </button>
        </div>
      </div>
    </section>

    <CustomClassModal :show="showClassModal" :edit-id="editClassId" @close="showClassModal = false" />
    <CustomSubclassModal :show="showSubclassModal" :edit-id="editSubclassId" @close="showSubclassModal = false" />

    <!-- ── Security card ──────────────────────────────────────────────────── -->
    <section class="card p-6 corner-ornament flex flex-col gap-5">
      <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist">Security</p>

      <!-- New password -->
      <div>
        <label for="new-password" class="label">New password</label>
        <div class="relative">
          <input
            id="new-password"
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            minlength="8"
            placeholder="Minimum 8 characters"
            class="input-base pr-10"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-ash transition-colors p-0.5"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <EyeOffIcon v-if="showPassword" :size="15" />
            <EyeIcon v-else :size="15" />
          </button>
        </div>
        <p v-if="newPassword && newPassword.length < 8" class="text-xs font-body text-blood-bright mt-1">
          Password must be at least 8 characters.
        </p>
      </div>

      <!-- Confirm password -->
      <div>
        <label for="confirm-password" class="label">Confirm new password</label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          minlength="8"
          placeholder="Repeat your new password"
          class="input-base"
          autocomplete="new-password"
        />
        <p v-if="passwordMismatch" class="text-xs font-body text-blood-bright mt-1">
          Passwords do not match.
        </p>
      </div>

      <!-- Save -->
      <div class="flex items-center gap-3 pt-1">
        <button
          class="btn-primary gap-2"
          :disabled="savingPassword || !canSavePassword"
          @click="savePassword"
        >
          <span v-if="savingPassword" class="w-3.5 h-3.5 border-2 border-void border-t-transparent rounded-full animate-spin" />
          <ShieldIcon v-else :size="13" />
          Update password
        </button>

        <Transition name="fade-right">
          <span v-if="passwordSaved" class="flex items-center gap-1 text-sm font-body text-verdant-bright">
            <CheckIcon :size="13" />
            Password updated
          </span>
        </Transition>
      </div>

      <p v-if="passwordError" class="text-sm font-body text-blood-bright -mt-1">{{ passwordError }}</p>
    </section>

    <!-- ── Session card ───────────────────────────────────────────────────── -->
    <section class="card p-6 flex items-center justify-between gap-4">
      <div>
        <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist mb-1">Session</p>
        <p class="text-sm font-body text-ash">Sign out from all active sessions.</p>
      </div>
      <button class="btn-danger shrink-0" @click="auth.signOut">Sign out</button>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ChevronLeftIcon, SaveIcon, CheckIcon, ShieldIcon,
  EyeIcon, EyeOffIcon, CameraIcon, UploadIcon, Trash2Icon,
} from 'lucide-vue-next'
import { useAuthStore } from '@/auth/store'
import { useCustomContentStore } from '@/custom-content/store'
import { validateAvatarFile, uploadAvatar } from '@/shared/lib/uploadAvatar'
import type { CustomRace, CustomClass, CustomSubclass } from '@/shared/types/customContent'
import CustomClassModal from '@/custom-content/components/CustomClassModal.vue'
import CustomSubclassModal from '@/custom-content/components/CustomSubclassModal.vue'

const auth = useAuthStore()

// ── Custom content (races & classes) ────────────────────────────────────────
const customContent = useCustomContentStore()
onMounted(async () => {
  if (!auth.isAuthenticated) return
  await customContent.loadMine()
  // After loading the user's copies, check which originals have a newer version.
  customContent.refreshSourceUpdates()
})

// Overwrite a copied race/class/subclass with the original's latest version (destructive to edits).
async function updateFromSource(item: CustomRace | CustomClass | CustomSubclass) {
  const from = item.source?.authorName || 'the community'
  if (!confirm(`Update "${item.name}" to the latest version from ${from}? This replaces your copy, any changes you made to it will be lost.`)) return
  try { await customContent.resyncFromSource(item.id) } catch { /* toast shown by store */ }
}

// Custom subclass editor modal (create / edit)
const showSubclassModal = ref(false)
const editSubclassId = ref<string | null>(null)
function openNewSubclass() { editSubclassId.value = null; showSubclassModal.value = true }
function openEditSubclass(sc: CustomSubclass) { editSubclassId.value = sc.id; showSubclassModal.value = true }
async function togglePublicSubclass(sc: CustomSubclass) {
  try { await customContent.setSubclassPublic(sc.id, !sc.isPublic) } catch { /* toast shown by store */ }
}
async function removeSubclass(sc: CustomSubclass) {
  if (!confirm(`Delete custom subclass "${sc.name}"? This cannot be undone.`)) return
  try { await customContent.removeSubclass(sc.id) } catch { /* toast shown by store */ }
}

// Custom class editor modal (create / edit)
const showClassModal = ref(false)
const editClassId = ref<string | null>(null)
function openNewClass() { editClassId.value = null; showClassModal.value = true }
function openEditClass(cls: CustomClass) { editClassId.value = cls.id; showClassModal.value = true }
async function togglePublicClass(cls: CustomClass) {
  try { await customContent.setClassPublic(cls.id, !cls.isPublic) } catch { /* toast shown by store */ }
}
async function removeClass(cls: CustomClass) {
  if (!confirm(`Delete custom class "${cls.name}"? This cannot be undone.`)) return
  try { await customContent.removeClass(cls.id) } catch { /* toast shown by store */ }
}

function raceSummary(race: CustomRace): string {
  const parts = Object.entries(race.abilityBonuses)
    .filter(([, v]) => (v ?? 0) !== 0)
    .map(([k, v]) => `${k.toUpperCase()} +${v}`)
  parts.push(race.size, `${race.speed} ft.`)
  if (race.darkvision > 0) parts.push(`Darkvision ${race.darkvision}`)
  return parts.join(' · ')
}

async function togglePublic(race: CustomRace) {
  try { await customContent.setRacePublic(race.id, !race.isPublic) } catch { /* toast shown by store */ }
}

async function removeRace(race: CustomRace) {
  if (!confirm(`Delete custom race "${race.name}"? This cannot be undone.`)) return
  try { await customContent.removeRace(race.id) } catch { /* toast shown by store */ }
}

// ── Avatar & identity ──────────────────────────────────────────────────────

const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const pendingBlobUrl = ref<string | null>(null)
const avatarRemoved = ref(false)
const avatarFileError = ref('')
const uploading = ref(false)

const avatarPreview = computed(() => {
  if (avatarRemoved.value) return ''
  if (pendingBlobUrl.value) return pendingBlobUrl.value
  return auth.avatarUrl ?? ''
})

const nicknameInput = ref(auth.nickname ?? '')

const initials = computed(() => {
  const name = nicknameInput.value.trim() || auth.userEmail?.split('@')[0] || ''
  return name.slice(0, 2).toUpperCase() || '?'
})

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarFileError.value = ''
  const err = validateAvatarFile(file)
  if (err) { avatarFileError.value = err; return }
  // Revoke previous blob URL to free memory
  if (pendingBlobUrl.value) URL.revokeObjectURL(pendingBlobUrl.value)
  pendingFile.value = file
  pendingBlobUrl.value = URL.createObjectURL(file)
  avatarRemoved.value = false
}

function removeAvatar() {
  if (pendingBlobUrl.value) { URL.revokeObjectURL(pendingBlobUrl.value); pendingBlobUrl.value = null }
  pendingFile.value = null
  avatarRemoved.value = true
  avatarFileError.value = ''
}

onUnmounted(() => {
  if (pendingBlobUrl.value) URL.revokeObjectURL(pendingBlobUrl.value)
})

// ── Profile save ───────────────────────────────────────────────────────────

const savingProfile = ref(false)
const profileSaved = ref(false)
const profileError = ref('')

async function saveProfile() {
  savingProfile.value = true
  profileError.value = ''
  profileSaved.value = false
  try {
    let finalAvatarUrl: string | null = auth.avatarUrl

    if (avatarRemoved.value) {
      finalAvatarUrl = null
    } else if (pendingFile.value) {
      uploading.value = true
      finalAvatarUrl = await uploadAvatar(pendingFile.value, auth.userId!)
      // Clean up blob URL, we now have the real Supabase URL
      if (pendingBlobUrl.value) { URL.revokeObjectURL(pendingBlobUrl.value); pendingBlobUrl.value = null }
      pendingFile.value = null
    }

    await auth.updateProfile({
      nickname: nicknameInput.value.trim() || null,
      avatarUrl: finalAvatarUrl,
    })
    profileSaved.value = true
    avatarRemoved.value = false
    setTimeout(() => (profileSaved.value = false), 3000)
  } catch (e) {
    profileError.value = e instanceof Error ? e.message : 'Could not save profile. Try again.'
  } finally {
    savingProfile.value = false
    uploading.value = false
  }
}

// ── Password ───────────────────────────────────────────────────────────────

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const savingPassword = ref(false)
const passwordSaved = ref(false)
const passwordError = ref('')

const passwordMismatch = computed(() =>
  confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value,
)

const canSavePassword = computed(() =>
  newPassword.value.length >= 8 && !passwordMismatch.value,
)

async function savePassword() {
  if (!canSavePassword.value) return
  savingPassword.value = true
  passwordError.value = ''
  passwordSaved.value = false
  try {
    await auth.updatePassword(newPassword.value)
    passwordSaved.value = true
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => (passwordSaved.value = false), 3000)
  } catch (e) {
    passwordError.value = e instanceof Error ? e.message : 'Could not update password. Try again.'
  } finally {
    savingPassword.value = false
  }
}
</script>

<style scoped>
.fade-right-enter-active,
.fade-right-leave-active { transition: all 0.2s ease; }
.fade-right-enter-from,
.fade-right-leave-to { opacity: 0; transform: translateX(-6px); }
</style>
