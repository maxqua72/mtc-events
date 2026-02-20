<template>
  <div class="min-h-screen bg-chess-dark flex flex-col items-center justify-center p-6 text-center">
    
    <div class="flex flex-col items-center">
      <div class="relative w-36 h-36 md:w-48 md:h-48 rounded-full flex items-center justify-center p-2 mb-10 shadow-[0_0_50px_rgba(0,0,0,0.3)]"
        :style="{ backgroundColor: asdStore.info?.theme_color || '#ffffff' }">
        
        <div class="absolute inset-0 rounded-full bg-chess-gold/20 blur-2xl -z-10 animate-pulse"></div>
        
        <img v-if="asdStore.info?.logo_url" 
             :src="asdStore.info.logo_url" 
             class="w-full h-full object-contain rounded-full" 
        />
        <Icon v-else 
              name="fa6-solid:chess-knight" 
              class="text-chess-dark text-6xl md:text-7xl" 
        />
      </div>

      <div class="space-y-4">
        <h1 class="text-white text-xl md:text-2xl font-black tracking-[0.1em] leading-tight">
          {{ asdStore.info?.name || 'Caricamento' }}
        </h1>
        
        
      </div>
    </div>

    <div class="absolute bottom-20 w-40 h-1 bg-white/5 overflow-hidden rounded-full">
      <div class="loading-progress h-full bg-chess-gold"></div>
    </div>
  </div>
</template>

<script setup>
const asdStore = useAsdStore()
const route = useRoute()
const slug = route.params.asd_slug

definePageMeta({
  layout: false
})

onMounted(() => {
  // Ho mantenuto i tuoi 3.8 secondi per un'esposizione prolungata del brand
  setTimeout(() => {
    navigateTo(`/${slug}/events`)
  }, 1800)
})
</script>

<style scoped>


.loading-progress {
  width: 0%;
  /* Sincronizzata con il tempo del setTimeout (3.8s) */
  animation: progress 1.8s linear forwards;
}

@keyframes entrance {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes logo-pop {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes progress {
  from { width: 0%; }
  to { width: 100%; }
}
</style>