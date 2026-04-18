<template>
    
  <div class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
    <div 
      class="absolute inset-0 bg-chess-dark/90 backdrop-blur-sm"
      @click="closeModal"
    ></div>

    <div class="relative w-full max-w-sm bg-[#1e1e1e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div class="p-6 space-y-6">
        
        <div class="flex justify-between items-start">
          <div class="space-y-1">
            <h3 class="text-white text-xl font-black uppercase tracking-tight">Installa su iOS</h3>
            <p class="text-chess-coral/60 text-xs font-bold uppercase">Segui questi 3 semplici passi</p>
          </div>
          <button @click="closeModal" class="text-white/20 hover:text-white transition-colors">
            <Icon name="fa6-solid:xmark" class="text-xl" />
          </button>
        </div>

        <div class="space-y-6 py-4">
          <div class="flex items-center gap-4 text-left">
            <div class="flex-shrink-0 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-chess-coral font-black">
              1
            </div>
            <p class="text-white/80 text-sm">
              Tocca il tasto <strong class="text-white">Condividi</strong> nella barra di Safari (l'icona con il quadrato e la freccia <Icon name="fa6-solid:arrow-up-from-bracket" class="text-blue-400" />).
            </p>
          </div>

          <div class="flex items-center gap-4 text-left">
            <div class="flex-shrink-0 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-chess-coral font-black">
              2
            </div>
            <p class="text-white/80 text-sm">
              Scorri verso il basso e seleziona <strong class="text-white text-xs uppercase">"Aggiungi alla schermata Home"</strong>.
            </p>
          </div>

          <div class="flex items-center gap-4 text-left">
            <div class="flex-shrink-0 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-chess-coral font-black">
              3
            </div>
            <p class="text-white/80 text-sm">
              Premi <strong class="text-blue-400">Aggiungi</strong> nell'angolo in alto a destra.
            </p>
          </div>
        </div>

        <button 
          @click="closeModal"
          class="w-full py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
        >
          Ho capito
        </button>
      </div>

      <div class="hidden sm:hidden flex justify-center pb-2">
        <Icon name="fa6-solid:chevron-down" class="text-chess-coral animate-bounce" />
      </div>
    </div>
  </div>
  
</template>

<script setup>
const pwaStore = usePwaStore()
const emit = defineEmits(['close'])

const closeModal = () => {
  // 1. Notifichiamo il genitore (se serve ancora)
  emit('close')
  // 2. Aggiorniamo lo store globale per far sparire il componente
  pwaStore.showInstallGuidance = false
}
</script>

<style scoped>
/* Effetto fade-in per lo sfondo */
.animate-in {
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
</style>