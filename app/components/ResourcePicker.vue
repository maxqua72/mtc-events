<script setup>
const props = defineProps(['asdSlug'])
const emit = defineEmits(['select', 'close'])

// Carichiamo le risorse con lo stato di caricamento (pending)
const { data: resources, pending, error } = await useFetch(`/api/manager/${props.asdSlug}/resources`, {
  transform: (res) => res.filter(r => r.type === 'image')
})

// Gestione dell'errore di caricamento immagine (fallback)
const handleImageError = (e) => {
  e.target.src = '/img/default-event.png' // Assicurati di avere un'immagine di fallback
}
</script>

<template>
  <div class="fixed inset-0 bg-chess-dark/90 backdrop-blur-sm z-[150] flex items-center justify-center p-4 md:p-8" @click.self="$emit('close')">
    
    <div class="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/20">
      
      <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h3 class="text-lg font-black text-chess-dark uppercase tracking-tight">Libreria Immagini</h3>
          <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Seleziona una risorsa per la copertina</p>
        </div>
        <button @click="$emit('close')" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-chess-dark transition-all">
          <Icon name="fa6-solid:xmark" size="20" />
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        
        <div v-if="pending" class="flex flex-col items-center justify-center py-20">
          <Icon name="fa6-solid:spinner" size="32" class="animate-spin text-chess-gold mb-4" />
          <p class="text-[10px] font-black uppercase text-gray-400 tracking-widest">Accesso al Database...</p>
        </div>

        <div v-else-if="error || !resources?.length" class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Icon name="fa6-solid:image-slash" size="32" class="text-gray-200" />
          </div>
          <p class="text-gray-400 text-sm font-bold uppercase tracking-tight">Nessuna immagine disponibile</p>
          <p class="text-[10px] text-gray-400 mt-2 max-w-[200px]">Carica prima i file nella sezione "Archivio Risorse" o caricali direttamente dall'editor.</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div 
            v-for="res in resources" :key="res._id"
            @click="$emit('select', res)"
            class="aspect-video rounded-xl border-2 border-gray-100 hover:border-chess-gold cursor-pointer overflow-hidden group relative bg-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <img 
              :src="res.url" 
              @error="handleImageError"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              loading="lazy"
            />
            
            <div class="absolute inset-0 bg-chess-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <div class="bg-chess-gold text-chess-dark w-10 h-10 flex items-center justify-center rounded-full shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                 <Icon name="fa6-solid:check" />
               </div>
            </div>

            <div class="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <p class="text-[9px] text-white font-black truncate uppercase tracking-tighter">{{ res.name }}</p>
              <p class="text-[8px] text-chess-gold/80 font-mono">{{ res.size }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-gray-50 border-t border-gray-100 text-center">
        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
          Tip: Puoi caricare nuove immagini direttamente dalla pagina Archivio Risorse
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d4d4d4;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #b5b5b5;
}
</style>