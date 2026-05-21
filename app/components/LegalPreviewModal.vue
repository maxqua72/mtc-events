<template>
  <Transition name="fade">
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Overlay con sfocatura -->
      <div class="absolute inset-0 bg-chess-dark/90 backdrop-blur-sm" @click="close"></div>

      <!-- Modal Container -->
      <div class="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <!-- Header: Stile Chess Dark -->
        <div class="bg-chess-dark p-8 text-white flex flex-col items-center relative">
          
          <p class="text-[14px] font-bold uppercase tracking-[0.2em] mt-1 text-chess-gold">{{ title }}</p>
          
          <!-- Pulsante chiusura rapida in alto a destra -->
          <button @click="close" class="absolute top-6 right-6 text-white/30 hover:text-chess-gold transition-colors">
            <Icon name="fa6-solid:xmark" size="20" />
          </button>
        </div>

        <!-- Body: Rendering HTML (Simulazione PWA) -->
        <div class="flex-1 overflow-y-auto p-8 bg-gray-50/50">

          <div v-if="fileUrl" class="mb-4 flex justify-center">
            <a 
              :href="fileUrl" 
              target="_blank"
              class="flex items-center gap-3 px-6 py-3 bg-chess-gold/10 border border-chess-gold/20 rounded-2xl text-chess-dark hover:bg-chess-gold/20 transition-all group"
            >
              <Icon name="fa6-solid:file-pdf" class="text-chess-gold text-lg group-hover:scale-110 transition-transform" />
              <span class="text-[10px] font-black uppercase tracking-widest">Scarica in PDF</span>
            </a>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
             <div class="prose prose-sm max-w-none 
                        prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4
                        prose-headings:text-chess-dark prose-headings:uppercase prose-headings:font-black prose-headings:tracking-tight
                        prose-strong:text-chess-dark"
                  v-html="content">
            </div>
          </div>
        </div>

        <!-- Footer: Pulsante Chiudi -->
        <button 
          @click="close"
          class="w-full py-5 text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-chess-dark hover:bg-gray-50 transition-all border-t border-gray-100 bg-white"
        >
          Chiudi Anteprima
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  content: String,
  title: String,
  fileUrl: String
})

const emit = defineEmits(['update:modelValue'])

const close = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Custom scrollbar per mantenere lo stile pulito */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
</style>