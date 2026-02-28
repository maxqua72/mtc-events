<template>
  <div class="flex gap-6 border-b border-gray-200 mb-6">
    <NuxtLink 
      :to="`/${asdSlug}/manager/events`"
      class="pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2"
      :class="active === 'events' ? 'border-chess-gold text-chess-dark' : 'border-transparent text-gray-400 hover:text-gray-600'"
    >
      Calendario Eventi
    </NuxtLink>
    <NuxtLink 
      :to="`/${asdSlug}/manager/generators`"
      class="pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2"
      :class="active === 'generators' ? 'border-chess-gold text-chess-dark' : 'border-transparent text-gray-400 hover:text-gray-600'"
    >
      Eventi Ricorrenti
    </NuxtLink>
  </div>
</template>

<script setup>
defineProps(['active', 'asdSlug'])
</script>