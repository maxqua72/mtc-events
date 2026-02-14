<template>
  <nav class="md:hidden fixed bottom-0 w-full bg-chess-dark text-white border-t border-white/10 h-16 flex justify-around items-center px-4 z-50">
    <button class="flex flex-col items-center gap-1 text-chess-gold">
      <Icon name="fa6-solid:calendar-check" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">Eventi</span>
    </button>
    <button class="flex flex-col items-center gap-1 text-white/50">
      <Icon name="fa6-solid:magnifying-glass" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">Cerca</span>
    </button>
    <button v-if="isManager" class="flex flex-col items-center gap-1 text-white/50">
      <Icon name="fa6-solid:user-gear" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">Admin</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  isManager: Boolean
})
</script>