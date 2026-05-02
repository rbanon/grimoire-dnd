<template>
  <div class="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-24">
    <!-- Ornamental number -->
    <div class="relative mb-8">
      <span class="font-display text-[10rem] leading-none text-gold-dim/10 select-none tracking-wider">404</span>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="font-display text-5xl text-gold-dim/40 tracking-widest">404</div>
      </div>
    </div>

    <h1 class="font-display text-2xl text-vellum mb-3 tracking-wide">Lost in the Astral Plane</h1>
    <p class="font-body text-ash max-w-sm leading-relaxed mb-8">
      The path you sought leads only to void and stars. Perhaps the scroll was misread.
    </p>
    <RouterLink to="/" class="btn-primary">
      Return to your tome
    </RouterLink>
  </div>
</template>
