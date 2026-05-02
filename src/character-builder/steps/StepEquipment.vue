<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-8">
    <div class="rule-gold"><span>Starting Equipment</span></div>

    <div class="grid sm:grid-cols-2 gap-4">
      <!-- Option A: Starting equipment -->
      <button
        type="button"
        class="card text-left p-5 transition-all duration-200"
        :class="builder.draft.useStartingEquipment
          ? 'border-gold-mid/50 bg-gold-dim/8'
          : 'hover:border-gold-dim/20'"
        @click="builder.draft.useStartingEquipment = true"
      >
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded border flex items-center justify-center text-lg"
            :class="builder.draft.useStartingEquipment ? 'border-gold-mid/50 bg-gold-dim/20' : 'border-shadow'"
          >⚔</div>
          <div>
            <p class="font-heading text-sm text-vellum">Starting Equipment</p>
            <p class="text-xs text-mist font-body">Gear from your class & background</p>
          </div>
          <div v-if="builder.draft.useStartingEquipment" class="ml-auto w-4 h-4 rounded-full bg-gold-mid/30 border border-gold-mid/60 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-gold-mid" />
          </div>
        </div>
        <p class="text-xs font-body text-mist leading-relaxed">
          Your class and background grant you a standard set of equipment to begin your adventure.
        </p>
      </button>

      <!-- Option B: Gold -->
      <button
        type="button"
        class="card text-left p-5 transition-all duration-200"
        :class="!builder.draft.useStartingEquipment
          ? 'border-gold-mid/50 bg-gold-dim/8'
          : 'hover:border-gold-dim/20'"
        @click="builder.draft.useStartingEquipment = false"
      >
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded border flex items-center justify-center text-lg"
            :class="!builder.draft.useStartingEquipment ? 'border-gold-mid/50 bg-gold-dim/20' : 'border-shadow'"
          >◎</div>
          <div>
            <p class="font-heading text-sm text-vellum">Gold Pieces</p>
            <p class="text-xs text-mist font-body">Buy your own equipment</p>
          </div>
          <div v-if="!builder.draft.useStartingEquipment" class="ml-auto w-4 h-4 rounded-full bg-gold-mid/30 border border-gold-mid/60 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-gold-mid" />
          </div>
        </div>
        <p class="text-xs font-body text-mist leading-relaxed">
          Start with gold pieces and purchase equipment from the item browser.
        </p>
      </button>
    </div>

    <!-- Gold input -->
    <Transition name="fade">
      <div v-if="!builder.draft.useStartingEquipment" class="card p-5 space-y-3">
        <label class="label" for="start-gold">Starting Gold (gp)</label>
        <div class="flex items-center gap-3">
          <input
            id="start-gold"
            v-model.number="builder.draft.manualGold"
            type="number"
            min="0"
            max="9999"
            class="input-base max-w-[140px] text-lg font-heading"
          />
          <span class="text-sm text-mist font-body">gold pieces</span>
        </div>
      </div>
    </Transition>

    <div class="card p-5 border-gold-dim/15 bg-depths/40">
      <p class="text-xs font-body text-mist leading-relaxed">
        <span class="text-gold-dim font-heading">Note:</span>
        Equipment can be added, removed, or modified at any time from the character sheet.
        Starting equipment from your class and background will be pre-populated automatically.
      </p>
    </div>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { useBuilderStore } from '@/character-builder/builderStore'
const builder = useBuilderStore()
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(4px); }
</style>
