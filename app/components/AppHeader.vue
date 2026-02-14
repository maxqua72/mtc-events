<template>
  <header class="w-full h-16 bg-chess-dark text-white border-b border-white/10 sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between shadow-lg">
    <div class="flex items-center gap-4">
      <div class="w-9 h-9 rounded bg-white/5 border border-chess-gold/50 flex items-center justify-center overflow-hidden">
        <img v-if="info?.logo_url" :src="info.logo_url" class="w-full h-full object-contain" />
        <Icon v-else name="fa6-solid:chess-knight" class="text-chess-gold text-lg" />
      </div>
      
      <h1 class="font-bold text-xs md:text-sm uppercase tracking-[0.15em] text-white">
        {{ info?.name }}
      </h1>
    </div>

    <div class="hidden md:block flex-1 max-w-sm mx-8">
      <div class="relative">
        <Icon name="fa6-solid:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size="14" />
        <input 
          type="text" 
          placeholder="Cerca nel club..." 
          class="w-full bg-white/5 border border-white/10 rounded-md py-1.5 pl-10 text-xs text-white focus:bg-white/10 focus:border-chess-gold focus:ring-0 transition-all outline-none"
        >
      </div>
    </div>

    <button v-if="isManager" class="md:hidden p-2 text-chess-gold">
      <Icon name="fa6-solid:bars" size="20" />
    </button>
  </header>
</template>

<script setup>
defineProps({
  info: Object,
  isManager: Boolean
})
</script>