<template>
  <Transition name="fade-slide">
    <div v-if="isVisible" class="fixed bottom-0 left-0 right-0 z-[200] p-4 md:p-6">
      <div class="max-w-4xl mx-auto bg-chess-dark/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-5 md:p-6 flex flex-col md:flex-row items-center gap-4">
        
        <div class="flex items-center gap-4 flex-1">
          <div class="hidden md:flex w-12 h-12 rounded-xl bg-chess-gold/10 items-center justify-center border border-chess-gold/20">
            <Icon name="fa6-solid:shield-halved" class="text-chess-gold text-xl" />
          </div>
          <div>
            <p class="text-white text-[13px] md:text-sm font-medium leading-relaxed">
              Utilizziamo <span class="text-chess-gold">cookie tecnici</span> e strumenti locali per garantirti la migliore esperienza di navigazione e sicurezza. 
              Non effettuiamo profilazione né tracciamento pubblicitario.
            </p>
            <div class="flex gap-4 mt-1">
              <NuxtLink to="/legal/privacy" class="text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-white transition-colors underline decoration-chess-gold/30">Privacy Policy</NuxtLink>
              <NuxtLink to="/legal/cookies" class="text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-white transition-colors underline decoration-chess-gold/30">Cookie Policy</NuxtLink>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <button 
            @click="accept" 
            class="flex-1 md:flex-none px-8 py-3 bg-white text-chess-dark rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-chess-gold transition-all duration-300 shadow-lg active:scale-95"
          >
            Accetto
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const isVisible = ref(false)

onMounted(() => {
  // Controlliamo il flag nel localStorage come concordato
  const consent = localStorage.getItem('mtc_consent_given')
  if (!consent) {
    // Piccolo delay per non aggredire l'utente appena carica la pagina
    setTimeout(() => {
      isVisible.value = true
    }, 1000)
  }
})

const accept = () => {
  localStorage.setItem('mtc_consent_given', 'true')
  isVisible.value = false
}
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>