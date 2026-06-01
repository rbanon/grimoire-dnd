<template>
  <div class="space-y-8">

    <!-- ── Currency ──────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="label">Currency</p>
      <div class="flex gap-2">
        <div v-for="coin in COINS" :key="coin.key" class="card flex-1 flex items-center gap-1.5 px-2 py-1.5 min-w-0">
          <span class="text-2xs font-heading tracking-wide text-mist uppercase shrink-0">{{ coin.label }}</span>
          <input
            v-if="editMode"
            v-model.number="currencyEdit[coin.key]"
            type="number"
            min="0"
            class="w-full text-center font-heading text-sm bg-transparent outline-none text-vellum border-b border-transparent focus:border-gold-mid/50 transition-colors min-w-0"
            @blur="saveCurrency"
          />
          <span v-else class="w-full text-center font-heading text-sm text-vellum min-w-0">{{ character.currency[coin.key] }}</span>
        </div>
      </div>
    </section>

    <!-- ── Loadout ───────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <p class="label">Loadout</p>
      <div class="grid grid-cols-3 gap-2">

        <!-- Main Hand -->
        <div class="card p-3 space-y-2">
          <div class="flex items-center gap-1.5">
            <SwordIcon :size="10" class="text-gold-dim/60 shrink-0" />
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Main Hand</p>
          </div>
          <select
            class="input-base text-xs w-full"
            :value="slots.mainHand ?? ''"
            @change="onSlotSelect('mainHand', $event)"
          >
            <option value="">— Empty —</option>
            <option v-for="item in weapons" :key="item.id" :value="item.id">{{ item.item.name }}</option>
          </select>
          <div v-if="slottedFSBonus('mainHand').attack > 0 || slottedFSBonus('mainHand').damage > 0 || slottedFSBonus('mainHand').rerollLowDice" class="flex gap-1 flex-wrap">
            <span v-if="slottedFSBonus('mainHand').attack > 0" class="text-2xs font-heading px-1 py-0.5 rounded border border-arcane-base/40 text-arcane-pale bg-arcane-deep/10">+{{ slottedFSBonus('mainHand').attack }} atk</span>
            <span v-if="slottedFSBonus('mainHand').damage > 0" class="text-2xs font-heading px-1 py-0.5 rounded border border-blood-base/40 text-blood-mid bg-blood-deep/10">+{{ slottedFSBonus('mainHand').damage }} dmg</span>
            <span v-if="slottedFSBonus('mainHand').rerollLowDice" class="text-2xs font-heading px-1 py-0.5 rounded border border-gold-dim/40 text-gold-mid bg-gold-dim/10">GWF</span>
          </div>
        </div>

        <!-- Off Hand -->
        <div class="card p-3 space-y-2">
          <div class="flex items-center gap-1.5">
            <SwordIcon :size="10" class="text-mist/40 shrink-0" />
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Off Hand</p>
          </div>
          <select
            class="input-base text-xs w-full"
            :value="slots.offHand ?? ''"
            @change="onSlotSelect('offHand', $event)"
          >
            <option value="">— Empty —</option>
            <optgroup v-if="weapons.length" label="Weapons">
              <option v-for="item in weapons" :key="item.id" :value="item.id">{{ item.item.name }}</option>
            </optgroup>
            <optgroup v-if="shields.length" label="Shields">
              <option v-for="item in shields" :key="item.id" :value="item.id">{{ item.item.name }}</option>
            </optgroup>
          </select>
          <div v-if="slottedFSBonus('offHand').attack > 0" class="flex gap-1 flex-wrap">
            <span class="text-2xs font-heading px-1 py-0.5 rounded border border-arcane-base/40 text-arcane-pale bg-arcane-deep/10">+{{ slottedFSBonus('offHand').attack }} atk</span>
          </div>
        </div>

        <!-- Armor slot -->
        <div class="card p-3 space-y-2">
          <div class="flex items-center gap-1.5">
            <ShieldIcon :size="10" class="text-arcane-pale/50 shrink-0" />
            <p class="text-2xs font-heading tracking-wide uppercase text-mist">Armor</p>
          </div>
          <select
            class="input-base text-xs w-full"
            :value="slots.armor ?? ''"
            @change="onSlotSelect('armor', $event)"
          >
            <option value="">— Empty —</option>
            <option v-for="item in nonShieldArmor" :key="item.id" :value="item.id">{{ item.item.name }}</option>
          </select>
          <span v-if="effectiveAC > character.combat.armorClass" class="text-2xs font-heading px-1 py-0.5 rounded border border-verdant-base/40 text-verdant-bright bg-verdant-deep/10 self-start">+1 Defense</span>
        </div>

      </div>
    </section>

    <!-- ── Inventory ─────────────────────────────────────────────────────── -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <p class="label">
          Inventory
          <span v-if="totalWeight > 0" class="text-mist font-body normal-case tracking-normal text-xs ml-2">
            {{ totalWeight.toFixed(1).replace(/\.0$/, '') }} lb.
          </span>
        </p>
      </div>

      <!-- Item list — grouped by type -->
      <template v-if="character.inventory.length > 0">

        <!-- Weapons -->
        <div v-if="weapons.length" class="space-y-1.5">
          <div class="flex items-center gap-2">
            <SwordIcon :size="11" class="text-gold-dim/50 shrink-0" />
            <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Weapons</p>
            <span class="text-2xs font-body text-mist/40">{{ weapons.length }}</span>
          </div>
          <div
            v-for="item in weapons"
            :key="item.id"
            class="flex items-center gap-2 px-3 py-2.5 rounded border bg-abyss/50 group transition-colors"
            :class="currentSlot(item.id) ? 'border-gold-dim/40' : 'border-shadow'"
          >
            <SwordIcon :size="11" class="text-gold-dim/60 shrink-0" />
            <div class="flex-1 min-w-0">
              <span class="font-heading text-sm text-vellum">{{ item.item.name }}</span>
              <span v-if="item.attackBonus || item.damage" class="text-xs font-mono text-mist/60 ml-2">
                <span v-if="item.attackBonus" class="text-gold-mid">{{ item.attackBonus }}</span>
                <span v-if="item.attackBonus && item.damage" class="mx-1 text-mist/30">·</span>
                <span v-if="item.damage">{{ item.damage }}</span>
                <span v-if="item.damageType" class="text-mist/50 font-body text-2xs ml-1">{{ item.damageType }}</span>
              </span>
            </div>
            <!-- Slot assignment buttons / badge -->
            <template v-if="currentSlot(item.id)">
              <span class="text-2xs font-heading px-1.5 py-0.5 rounded border border-gold-dim/40 text-gold-mid bg-gold-dim/10 shrink-0">
                {{ currentSlot(item.id) === 'mainHand' ? 'MH' : 'OH' }}
              </span>
            </template>
            <template v-else>
              <button type="button" class="text-2xs font-heading px-1.5 py-0.5 rounded border border-shadow text-mist/50 hover:border-gold-dim/40 hover:text-gold-mid transition-all shrink-0 opacity-0 group-hover:opacity-100" title="Equip to Main Hand" @click="equipToSlot(item.id, 'mainHand')">→ MH</button>
              <button type="button" class="text-2xs font-heading px-1.5 py-0.5 rounded border border-shadow text-mist/50 hover:border-gold-dim/40 hover:text-gold-mid transition-all shrink-0 opacity-0 group-hover:opacity-100" title="Equip to Off Hand" @click="equipToSlot(item.id, 'offHand')">→ OH</button>
            </template>
            <span v-if="item.item.weight" class="text-xs font-body text-mist/50 shrink-0 hidden sm:inline">{{ item.item.weight }} lb.</span>
            <button type="button" class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/30 hover:text-gold-mid opacity-0 group-hover:opacity-100 transition-all" @click="infoPanel.open({ kind: 'item', index: item.item.index })"><InfoIcon :size="12" /></button>
            <button type="button" class="px-2 py-0.5 rounded border border-arcane-base/30 bg-arcane-deep/10 text-arcane-pale hover:border-arcane-base/60 hover:bg-arcane-deep/20 transition-all font-heading text-xs shrink-0" @click="(e) => rollItemAtk(item, e)">⚃ Atk</button>
            <button v-if="item.damage" type="button" class="px-2 py-0.5 rounded border border-blood-base/30 bg-blood-deep/10 text-blood-mid hover:border-blood-base/60 hover:bg-blood-deep/20 transition-all font-heading text-xs shrink-0" @click="rollItemDmg(item)">⚀ Dmg</button>
            <button type="button" class="w-6 h-6 flex items-center justify-center rounded transition-all shrink-0" :class="isWeaponFav(item.id) ? 'text-gold-mid hover:text-gold-dim' : 'text-mist/30 hover:text-gold-mid hover:bg-gold-dim/10'" @click="toggleWeaponFav(item)">
              <StarIcon :size="13" :fill="isWeaponFav(item.id) ? 'currentColor' : 'none'" />
            </button>
            <div class="flex items-center gap-1 shrink-0">
              <button v-if="editMode" type="button" class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading text-xs transition-colors" @click="adjustQuantity(item.id, -1)">−</button>
              <span class="font-heading text-sm text-stone w-5 text-center">{{ item.quantity }}</span>
              <button v-if="editMode" type="button" class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading text-xs transition-colors" @click="adjustQuantity(item.id, 1)">+</button>
            </div>
            <button v-if="editMode" type="button" class="p-1 rounded text-mist/30 hover:text-blood-bright hover:bg-blood-base/10 transition-colors opacity-0 group-hover:opacity-100" @click="removeItem(item.id)"><Trash2Icon :size="13" /></button>
          </div>
        </div>

        <!-- Armor -->
        <div v-if="armorItems.length" class="space-y-1.5" :class="weapons.length ? 'mt-5' : ''">
          <div class="flex items-center gap-2">
            <ShieldIcon :size="11" class="text-arcane-pale/50 shrink-0" />
            <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Armor</p>
            <span class="text-2xs font-body text-mist/40">{{ armorItems.length }}</span>
          </div>
          <div
            v-for="item in armorItems"
            :key="item.id"
            class="flex items-center gap-2 px-3 py-2.5 rounded border bg-abyss/50 group transition-colors"
            :class="currentSlot(item.id) ? 'border-gold-dim/40' : 'border-shadow'"
          >
            <ShieldIcon :size="11" class="text-arcane-pale/50 shrink-0" />
            <div class="flex-1 min-w-0">
              <span class="font-heading text-sm text-vellum">{{ item.item.name }}</span>
              <span v-if="item.armorClass" class="text-xs font-heading text-arcane-pale/70 ml-2">
                AC {{ item.armorClass }}
                <span v-if="item.armorType" class="text-mist/40 font-body text-2xs ml-1">{{ item.armorType }}</span>
              </span>
            </div>
            <!-- Slot badge / assign button -->
            <span v-if="currentSlot(item.id)" class="text-2xs font-heading px-1.5 py-0.5 rounded border border-gold-dim/40 text-gold-mid bg-gold-dim/10 shrink-0">
              {{ currentSlot(item.id) === 'armor' ? 'Armor' : currentSlot(item.id) === 'offHand' ? 'OH' : 'MH' }}
            </span>
            <button v-else type="button" class="text-2xs font-heading px-1.5 py-0.5 rounded border border-shadow text-mist/50 hover:border-arcane-base/40 hover:text-arcane-pale transition-all shrink-0 opacity-0 group-hover:opacity-100"
              :title="item.armorType === 'shield' ? 'Equip to Off Hand' : 'Equip to Armor slot'"
              @click="equipToSlot(item.id, item.armorType === 'shield' ? 'offHand' : 'armor')"
            >→ {{ item.armorType === 'shield' ? 'OH' : 'Armor' }}</button>
            <span v-if="item.item.weight" class="text-xs font-body text-mist/50 shrink-0 hidden sm:inline">{{ item.item.weight }} lb.</span>
            <button type="button" class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/30 hover:text-gold-mid opacity-0 group-hover:opacity-100 transition-all" @click="infoPanel.open({ kind: 'item', index: item.item.index })"><InfoIcon :size="12" /></button>
            <div class="flex items-center gap-1 shrink-0">
              <button v-if="editMode" type="button" class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading text-xs transition-colors" @click="adjustQuantity(item.id, -1)">−</button>
              <span class="font-heading text-sm text-stone w-5 text-center">{{ item.quantity }}</span>
              <button v-if="editMode" type="button" class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading text-xs transition-colors" @click="adjustQuantity(item.id, 1)">+</button>
            </div>
            <button v-if="editMode" type="button" class="p-1 rounded text-mist/30 hover:text-blood-bright hover:bg-blood-base/10 transition-colors opacity-0 group-hover:opacity-100" @click="removeItem(item.id)"><Trash2Icon :size="13" /></button>
          </div>
        </div>

        <!-- Gear -->
        <div v-if="gearItems.length" class="space-y-1.5" :class="weapons.length || armorItems.length ? 'mt-5' : ''">
          <div class="flex items-center gap-2">
            <PackageIcon :size="11" class="text-mist/40 shrink-0" />
            <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Gear</p>
            <span class="text-2xs font-body text-mist/40">{{ gearItems.length }}</span>
          </div>
          <div
            v-for="item in gearItems"
            :key="item.id"
            class="flex items-center gap-3 px-3 py-2.5 rounded border border-shadow bg-abyss/50 group"
          >
            <button type="button" class="w-3 h-3 rounded-full shrink-0 border-2 transition-colors"
              :class="item.equipped ? 'bg-gold-mid border-gold-mid hover:bg-gold-dim' : 'bg-shadow/30 border-mist/60 hover:border-mist hover:bg-shadow/50'"
              :title="item.equipped ? 'In use — click to toggle' : 'Click to mark in use'"
              @click="store.update(character.id, { inventory: character.inventory.map(i => i.id === item.id ? { ...i, equipped: !i.equipped } : i) })" />
            <PackageIcon :size="11" class="text-mist/40 shrink-0" />
            <div class="flex-1 min-w-0">
              <span class="font-heading text-sm text-vellum">{{ item.item.name }}</span>
              <span v-if="item.item.category" class="text-xs font-body text-mist/60 ml-2">{{ item.item.category }}</span>
            </div>
            <span v-if="item.item.weight" class="text-xs font-body text-mist/50 shrink-0 hidden sm:inline">{{ item.item.weight }} lb.</span>
            <button type="button" class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/30 hover:text-gold-mid opacity-0 group-hover:opacity-100 transition-all" @click="infoPanel.open({ kind: 'item', index: item.item.index })"><InfoIcon :size="12" /></button>
            <div class="flex items-center gap-1 shrink-0">
              <button v-if="editMode" type="button" class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading text-xs transition-colors" @click="adjustQuantity(item.id, -1)">−</button>
              <span class="font-heading text-sm text-stone w-5 text-center">{{ item.quantity }}</span>
              <button v-if="editMode" type="button" class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading text-xs transition-colors" @click="adjustQuantity(item.id, 1)">+</button>
            </div>
            <button v-if="editMode" type="button" class="p-1 rounded text-mist/30 hover:text-blood-bright hover:bg-blood-base/10 transition-colors opacity-0 group-hover:opacity-100" @click="removeItem(item.id)"><Trash2Icon :size="13" /></button>
          </div>
        </div>

      </template>

      <div v-if="!character.inventory.length && !showForm" class="card p-10 text-center">
        <PackageIcon :size="36" class="mx-auto text-mist/25 mb-3" />
        <p class="font-body text-ash text-sm">Inventory is empty.</p>
        <p class="font-body text-mist text-xs mt-1">Add weapons, armor, and gear to track your loadout.</p>
      </div>

      <!-- Add buttons (empty state) -->
      <div v-if="!showForm && editMode && !character.inventory.length" class="flex gap-2 flex-wrap">
        <button
          type="button"
          class="btn-secondary text-xs gap-1.5 flex-1 justify-center"
          @click="openForm('gear')"
        >
          <PlusIcon :size="13" /> Add Item
        </button>
        <button
          type="button"
          class="btn-secondary text-xs gap-1.5 flex-1 justify-center"
          @click="showPicker = true"
        >
          <BookOpenIcon :size="13" /> From SRD
        </button>
      </div>

      <!-- ── Add item form ────────────────────────────────────────────────── -->
      <div v-if="showForm && editMode" class="card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex gap-1">
            <button
              v-for="t in ITEM_TYPES"
              :key="t.id"
              type="button"
              class="px-3 py-1.5 rounded text-xs font-heading tracking-wide border transition-all"
              :class="draftType === t.id
                ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-mid'
                : 'border-shadow/40 text-mist/50 hover:border-shadow hover:text-ash'"
              @click="draftType = t.id"
            >{{ t.label }}</button>
          </div>
          <button type="button" class="text-mist hover:text-ash transition-colors" @click="closeForm">
            <XIcon :size="15" />
          </button>
        </div>

        <!-- Name -->
        <div>
          <label class="label mb-1.5 block">Name <span class="text-blood-bright">*</span></label>
          <input
            ref="nameInputEl"
            v-model="draft.name"
            type="text"
            :placeholder="draftType === 'weapon' ? 'Longsword, Handaxe…' : draftType === 'armor' ? 'Chain Mail, Leather Armor…' : 'Rope, Potion, Torch…'"
            class="input-base w-full"
            @keydown.enter="submitForm"
          />
        </div>

        <!-- WEAPON fields -->
        <template v-if="draftType === 'weapon'">
          <div>
            <label class="label mb-1.5 block">Attack Bonus</label>
            <div class="flex flex-wrap gap-2 items-end">
              <select v-model="draft.ability" class="input-base flex-1 min-w-[100px]">
                <option value="none">No modifier</option>
                <option v-for="ab in ABILITY_OPTIONS" :key="ab.value" :value="ab.value">
                  {{ ab.label }} ({{ fmt(mods[ab.value]) }})
                </option>
              </select>
              <label class="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                <input v-model="draft.proficient" type="checkbox" class="w-3.5 h-3.5 accent-gold-mid" />
                <span class="text-xs font-body text-ash">Prof (+{{ profBonus }})</span>
              </label>
              <div class="flex items-center gap-1 shrink-0">
                <span class="text-xs font-body text-mist">Flat</span>
                <input v-model.number="draft.flatBonus" type="number" class="input-base w-16 text-center" placeholder="0" />
              </div>
              <div class="px-3 py-2 rounded border border-gold-dim/30 bg-gold-dim/10 font-heading text-gold-mid text-sm shrink-0 min-w-[52px] text-center">
                {{ computedBonusDisplay }}
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label mb-1.5 block">Damage</label>
              <input
                v-model="draft.damage"
                type="text"
                placeholder="1d8+3"
                class="input-base w-full font-mono text-sm"
                :class="damageValid ? '' : 'border-blood-base/60'"
              />
              <p v-if="!damageValid" class="mt-1 text-2xs font-body text-blood-bright">
                Use dice notation like 1d8 or 2d6+3
              </p>
            </div>
            <div>
              <label class="label mb-1.5 block">Damage Type</label>
              <select v-model="draft.damageType" class="input-base w-full">
                <option value="">—</option>
                <optgroup label="Physical">
                  <option v-for="t in PHYSICAL_TYPES" :key="t" :value="t">{{ t }}</option>
                </optgroup>
                <optgroup label="Magical">
                  <option v-for="t in MAGICAL_TYPES" :key="t" :value="t">{{ t }}</option>
                </optgroup>
              </select>
            </div>
          </div>
          <div class="max-w-[200px]">
            <label class="label mb-1.5 block">Range</label>
            <input v-model="draft.range" type="text" placeholder="5 ft., 60/120 ft." class="input-base w-full" />
          </div>
          <div class="grid grid-cols-2 gap-3 max-w-xs">
            <div>
              <label class="label mb-1.5 block">Quantity</label>
              <input v-model.number="draft.quantity" type="number" min="1" class="input-base w-full" />
            </div>
            <div>
              <label class="label mb-1.5 block">Weight (lb.)</label>
              <input v-model.number="draft.weight" type="number" min="0" step="0.1" placeholder="0" class="input-base w-full" />
            </div>
          </div>
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input v-model="draft.equipped" type="checkbox" class="w-3.5 h-3.5 accent-gold-mid" />
            <span class="text-xs font-body text-ash">Start equipped</span>
          </label>
        </template>

        <!-- ARMOR fields -->
        <template v-else-if="draftType === 'armor'">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label mb-1.5 block">Armor Class</label>
              <input v-model.number="draft.armorClass" type="number" min="0" placeholder="14" class="input-base w-full" />
            </div>
            <div>
              <label class="label mb-1.5 block">Armor Type</label>
              <select v-model="draft.armorType" class="input-base w-full">
                <option value="">—</option>
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
                <option value="shield">Shield</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 max-w-xs">
            <div>
              <label class="label mb-1.5 block">Quantity</label>
              <input v-model.number="draft.quantity" type="number" min="1" class="input-base w-full" />
            </div>
            <div>
              <label class="label mb-1.5 block">Weight (lb.)</label>
              <input v-model.number="draft.weight" type="number" min="0" step="0.1" placeholder="0" class="input-base w-full" />
            </div>
          </div>
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input v-model="draft.stealthDisadvantage" type="checkbox" class="w-3.5 h-3.5 accent-gold-mid" />
            <span class="text-xs font-body text-ash">Stealth disadvantage</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input v-model="draft.equipped" type="checkbox" class="w-3.5 h-3.5 accent-gold-mid" />
            <span class="text-xs font-body text-ash">Start equipped</span>
          </label>
        </template>

        <!-- GEAR fields -->
        <template v-else>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label mb-1.5 block">Category</label>
              <input v-model="draft.category" type="text" placeholder="Gear, Tool, Consumable…" class="input-base w-full" />
            </div>
            <div>
              <label class="label mb-1.5 block">Quantity</label>
              <input v-model.number="draft.quantity" type="number" min="1" class="input-base w-full" />
            </div>
          </div>
          <div class="max-w-[150px]">
            <label class="label mb-1.5 block">Weight (lb.)</label>
            <input v-model.number="draft.weight" type="number" min="0" step="0.1" placeholder="0" class="input-base w-full" />
          </div>
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input v-model="draft.equipped" type="checkbox" class="w-3.5 h-3.5 accent-gold-mid" />
            <span class="text-xs font-body text-ash">Start equipped</span>
          </label>
        </template>

        <!-- Actions -->
        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="btn-primary text-sm gap-1.5"
            :disabled="!draft.name.trim() || !damageValid"
            @click="submitForm"
          >
            <PlusIcon :size="13" /> Add {{ ITEM_TYPES.find(t => t.id === draftType)?.label }}
          </button>
          <button type="button" class="btn-secondary text-sm" @click="closeForm">Cancel</button>
        </div>
      </div>

      <!-- Add another (when list has items) -->
      <div v-if="!showForm && character.inventory.length > 0 && editMode" class="flex gap-2 flex-wrap">
        <button
          v-for="t in ITEM_TYPES"
          :key="t.id"
          type="button"
          class="btn-secondary text-xs gap-1.5"
          @click="openForm(t.id)"
        >
          <PlusIcon :size="13" /> Add {{ t.label }}
        </button>
        <button
          type="button"
          class="btn-secondary text-xs gap-1.5"
          @click="showPicker = true"
        >
          <BookOpenIcon :size="13" /> From SRD
        </button>
      </div>

      <!-- Item picker modal -->
      <ItemPickerModal
        :show="showPicker"
        :character="character"
        :prof-bonus="profBonus"
        @close="showPicker = false"
        @add="onPickerAdd"
      />
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { PackageIcon, PlusIcon, Trash2Icon, XIcon, SwordIcon, ShieldIcon, StarIcon, InfoIcon, BookOpenIcon } from 'lucide-vue-next'
import ItemPickerModal from './ItemPickerModal.vue'
import { useCharactersStore } from '@/characters/store'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { computeAllModifiers } from '@/shared/types/character'
import { computeProficiencyBonus, computeFightingStyleBonuses, computeEffectiveAC, addBonusToDamage } from '@/shared/lib/derivedStats'
import { useRoll } from '@/shared/composables/useRoll'
import { useToast } from '@/shared/composables/useToast'
import type { Character, AbilityName, InventoryItem, CombatFavorite, EquippedSlots } from '@/shared/types/character'
import { generateId } from '@/shared/lib/uuid'

const props = defineProps<{ character: Character; editMode: boolean }>()
const store = useCharactersStore()
const { confirm } = useConfirm()
const infoPanel = useInfoPanel()
const { rollD20, rollDamage } = useRoll()
const toast = useToast()

// ── Derived stats ─────────────────────────────────────────────────────────────

const mods = computed(() => computeAllModifiers(props.character.abilityScores))
const profBonus = computed(() => computeProficiencyBonus(props.character.combat.level))
function fmt(n: number) { return n >= 0 ? `+${n}` : String(n) }

// ── Equipment slots ───────────────────────────────────────────────────────────

const slots = computed(() => props.character.equippedSlots)

function slottedItem(slot: keyof EquippedSlots): InventoryItem | null {
  const id = slots.value[slot]
  return id ? (props.character.inventory.find(i => i.id === id) ?? null) : null
}

function currentSlot(itemId: string): keyof EquippedSlots | null {
  const s = slots.value
  if (s.mainHand === itemId) return 'mainHand'
  if (s.offHand  === itemId) return 'offHand'
  if (s.armor    === itemId) return 'armor'
  return null
}

async function equipToSlot(itemId: string, slot: keyof EquippedSlots) {
  const s = { ...slots.value }
  if (s.mainHand === itemId) s.mainHand = null
  if (s.offHand  === itemId) s.offHand  = null
  if (s.armor    === itemId) s.armor    = null
  s[slot] = itemId
  const equippedIds = new Set([s.mainHand, s.offHand, s.armor].filter(Boolean) as string[])
  const inventory = props.character.inventory.map(i => ({ ...i, equipped: equippedIds.has(i.id) }))
  await store.update(props.character.id, { equippedSlots: s, inventory })
}

async function clearSlot(slot: keyof EquippedSlots) {
  const s = { ...slots.value, [slot]: null }
  const equippedIds = new Set([s.mainHand, s.offHand, s.armor].filter(Boolean) as string[])
  const inventory = props.character.inventory.map(i => ({ ...i, equipped: equippedIds.has(i.id) }))
  await store.update(props.character.id, { equippedSlots: s, inventory })
}

// ── Roll helpers ──────────────────────────────────────────────────────────────

function parseBonus(str: string | undefined): number {
  if (!str) return 0
  const m = str.match(/^([+-]?\d+)$/)
  return m ? parseInt(m[1]) : 0
}

function fsBonusFor(item: InventoryItem) {
  return computeFightingStyleBonuses(
    props.character.fightingStyles ?? [],
    item,
    slots.value,
    props.character.inventory,
    { str: mods.value.str, dex: mods.value.dex },
  )
}

function slottedFSBonus(slot: 'mainHand' | 'offHand') {
  const item = slottedItem(slot)
  return item ? fsBonusFor(item) : { attack: 0, damage: 0, rerollLowDice: false }
}

const effectiveAC = computed(() => computeEffectiveAC(
  props.character.combat.armorClass,
  props.character.fightingStyles ?? [],
  slots.value,
  props.character.inventory,
  mods.value.dex,
))

function rollItemAtk(item: InventoryItem, event: MouseEvent) {
  const slot = currentSlot(item.id)
  if (slot !== 'mainHand' && slot !== 'offHand') {
    toast.info(`${item.item.name} is not in a hand slot. Use the Loadout section above.`)
    return
  }
  const bonus = fsBonusFor(item)
  const parts: string[] = [item.attackBonus ?? '+0']
  if (bonus.attack > 0) parts.push(`+${bonus.attack} FS`)
  rollD20(parseBonus(item.attackBonus) + bonus.attack, `${item.item.name} Attack`, event, parts.join(' '))
}

function rollItemDmg(item: InventoryItem) {
  if (!item.damage) return
  const slot = currentSlot(item.id)
  if (slot !== 'mainHand' && slot !== 'offHand') {
    toast.info(`${item.item.name} is not in a hand slot. Use the Loadout section above.`)
    return
  }
  const bonus = fsBonusFor(item)
  const dmgFormula = addBonusToDamage(item.damage, bonus.damage)
  const parts: string[] = [item.damage]
  if (bonus.damage > 0) parts.push(`+${bonus.damage} FS`)
  if (bonus.rerollLowDice) parts.push('GWF')
  rollDamage(dmgFormula, `${item.item.name} Damage`,
    (bonus.damage > 0 || bonus.rerollLowDice) ? parts.join(' ') : undefined,
    bonus.rerollLowDice)
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COINS = [
  { key: 'cp' as const, label: 'CP' },
  { key: 'sp' as const, label: 'SP' },
  { key: 'ep' as const, label: 'EP' },
  { key: 'gp' as const, label: 'GP' },
  { key: 'pp' as const, label: 'PP' },
]

const ITEM_TYPES = [
  { id: 'weapon' as const, label: 'Weapon' },
  { id: 'armor'  as const, label: 'Armor'  },
  { id: 'gear'   as const, label: 'Gear'   },
]

const PHYSICAL_TYPES = ['Slashing', 'Piercing', 'Bludgeoning']
const MAGICAL_TYPES = [
  'Acid', 'Cold', 'Fire', 'Force', 'Lightning',
  'Necrotic', 'Poison', 'Psychic', 'Radiant', 'Thunder',
]
const ABILITY_OPTIONS: { value: AbilityName; label: string }[] = [
  { value: 'str', label: 'STR' }, { value: 'dex', label: 'DEX' },
  { value: 'con', label: 'CON' }, { value: 'int', label: 'INT' },
  { value: 'wis', label: 'WIS' }, { value: 'cha', label: 'CHA' },
]

// ── Currency ──────────────────────────────────────────────────────────────────

const currencyEdit = reactive({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 })

watch(
  () => props.character.currency,
  (c) => {
    currencyEdit.cp = c.cp
    currencyEdit.sp = c.sp
    currencyEdit.ep = c.ep
    currencyEdit.gp = c.gp
    currencyEdit.pp = c.pp
  },
  { immediate: true },
)

async function saveCurrency() {
  await store.update(props.character.id, { currency: { ...currencyEdit } })
}

// ── Inventory ─────────────────────────────────────────────────────────────────

const totalWeight = computed(() =>
  props.character.inventory.reduce((sum, item) => {
    return sum + (item.item.weight ?? 0) * item.quantity
  }, 0),
)

const weapons       = computed(() => props.character.inventory.filter(i => i.itemType === 'weapon'))
const armorItems    = computed(() => props.character.inventory.filter(i => i.itemType === 'armor'))
const shields       = computed(() => armorItems.value.filter(i => i.armorType === 'shield'))
const nonShieldArmor = computed(() => armorItems.value.filter(i => i.armorType !== 'shield'))
const gearItems     = computed(() => props.character.inventory.filter(i => i.itemType === 'gear'))

function onSlotSelect(slot: keyof EquippedSlots, event: Event) {
  const id = (event.target as HTMLSelectElement).value
  if (id) equipToSlot(id, slot)
  else clearSlot(slot)
}

async function adjustQuantity(itemId: string, delta: number) {
  await store.update(props.character.id, {
    inventory: props.character.inventory.map((i) =>
      i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i,
    ),
  })
}

async function removeItem(itemId: string) {
  const item = props.character.inventory.find(i => i.id === itemId)
  const ok = await confirm({
    title: 'Remove Item',
    body: `Remove "${item?.item.name ?? 'this item'}" from your inventory?`,
    confirmLabel: 'Remove',
    variant: 'danger',
  })
  if (!ok) return
  await store.update(props.character.id, {
    inventory: props.character.inventory.filter((i) => i.id !== itemId),
  })
}

// ── Weapon favorites ──────────────────────────────────────────────────────────

function isWeaponFav(itemId: string): boolean {
  return props.character.combatFavorites.some(
    f => f.type === 'weapon' && f.inventoryItemId === itemId,
  )
}

async function toggleWeaponFav(item: InventoryItem) {
  const next: CombatFavorite[] = isWeaponFav(item.id)
    ? props.character.combatFavorites.filter(
        f => !(f.type === 'weapon' && f.inventoryItemId === item.id),
      )
    : [
        ...props.character.combatFavorites,
        {
          id: generateId(),
          type: 'weapon' as const,
          inventoryItemId: item.id,
          weaponName: item.item.name,
        },
      ]
  await store.update(props.character.id, { combatFavorites: next })
}

// ── SRD item picker ───────────────────────────────────────────────────────────

const showPicker = ref(false)

function onPickerAdd(items: InventoryItem[]) {
  store.update(props.character.id, {
    inventory: [...props.character.inventory, ...items],
  })
}

// ── Add item form ─────────────────────────────────────────────────────────────

const showForm = ref(false)
const nameInputEl = ref<HTMLInputElement | null>(null)
const draftType = ref<'weapon' | 'armor' | 'gear'>('gear')

const draft = reactive({
  name: '',
  category: '',
  quantity: 1,
  weight: undefined as number | undefined,
  equipped: false,
  // weapon
  ability: 'str' as AbilityName | 'none',
  proficient: true,
  flatBonus: 0,
  damage: '',
  damageType: '',
  range: '',
  // armor
  armorClass: undefined as number | undefined,
  armorType: '' as '' | 'light' | 'medium' | 'heavy' | 'shield',
  stealthDisadvantage: false,
})

const computedBonusDisplay = computed(() => {
  const abilMod = draft.ability === 'none' ? 0 : mods.value[draft.ability as AbilityName]
  const prof = draft.proficient ? profBonus.value : 0
  const flat = draft.flatBonus || 0
  const total = abilMod + prof + flat
  return total >= 0 ? `+${total}` : String(total)
})

// Damage must be empty or valid dice notation (NdN or NdN±N) so rolls don't
// silently evaluate to 0. Only enforced for weapons.
const damageValid = computed(() => {
  if (draftType.value !== 'weapon') return true
  const d = draft.damage.trim()
  return d === '' || /^\d+d\d+([+-]\d+)?$/i.test(d)
})

function resetDraft() {
  draft.name = ''
  draft.category = ''
  draft.quantity = 1
  draft.weight = undefined
  draft.equipped = false
  draft.ability = 'str'
  draft.proficient = true
  draft.flatBonus = 0
  draft.damage = ''
  draft.damageType = ''
  draft.range = ''
  draft.armorClass = undefined
  draft.armorType = ''
  draft.stealthDisadvantage = false
}

function openForm(type: 'weapon' | 'armor' | 'gear') {
  draftType.value = type
  showForm.value = true
  nextTick(() => nameInputEl.value?.focus())
}

function closeForm() {
  showForm.value = false
  resetDraft()
}

async function submitForm() {
  if (!draft.name.trim()) return
  if (!damageValid.value) return

  const base = {
    id: generateId(),
    itemType: draftType.value,
    item: {
      index: generateId(),
      name: draft.name.trim(),
      weight: draft.weight || undefined,
    },
    quantity: Math.max(1, draft.quantity || 1),
    equipped: draft.equipped,
  }

  let newItem: InventoryItem

  if (draftType.value === 'weapon') {
    newItem = {
      ...base,
      itemType: 'weapon',
      attackBonus: computedBonusDisplay.value,
      damage: draft.damage.trim() || undefined,
      damageType: draft.damageType || undefined,
      range: draft.range.trim() || undefined,
    }
  } else if (draftType.value === 'armor') {
    newItem = {
      ...base,
      itemType: 'armor',
      armorClass: draft.armorClass || undefined,
      armorType: draft.armorType || undefined,
      stealthDisadvantage: draft.stealthDisadvantage || undefined,
    }
  } else {
    newItem = {
      ...base,
      itemType: 'gear',
      item: { ...base.item, category: draft.category.trim() || undefined },
    }
  }

  await store.update(props.character.id, {
    inventory: [...props.character.inventory, newItem],
  })
  closeForm()
}
</script>
