<template>
  <Transition name="update-slide">
    <div v-if="$pwa !== undefined && $pwa.needRefresh" 
         class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-sm bg-chess-iron border border-chess-gold/30 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 backdrop-blur-xl">
      
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 bg-chess-gold/10 rounded-xl flex items-center justify-center shrink-0">
          <Icon name="fa6-solid:rotate" class="text-chess-gold animate-spin-slow" />
        </div>
        <div class="text-left">
          <h4 class="text-white text-xs font-black uppercase tracking-widest">Aggiornamento Pronto</h4>
          <p class="text-white/50 text-[10px] font-bold leading-relaxed mt-1">
            È disponibile una nuova versione dell'app con miglioramenti e correzioni.
          </p>
        </div>
      </div>

      <div class="flex gap-2">
        <button @click="$pwa.updateServiceWorker()" 
                class="flex-1 bg-chess-gold hover:bg-yellow-500 text-chess-dark py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-chess-gold/10">
          Aggiorna Ora
        </button>
        <button @click="$pwa.cancelPrompt()" 
                class="px-4 py-3 rounded-xl border border-white/5 text-white/30 text-[10px] font-bold uppercase hover:bg-white/5 transition-all">
          Dopo
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const { $pwa } = useNuxtApp()

// Creiamo un riferimento che sarà vero solo sul client e se pwa è definito
const showBanner = computed(() => {
  if (import.meta.server) return false
  return $pwa && $pwa.needRefresh
})
</script>

<style scoped>
.update-slide-enter-active, .update-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.update-slide-enter-from, .update-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, 100px);
}

.animate-spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>