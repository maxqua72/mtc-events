<script setup>
const props = defineProps(['asdSlug'])
const emit = defineEmits(['close', 'uploaded'])

const resourceName = ref('')
const selectedFile = ref(null)
const isUploading = ref(false)

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    // Controllo opzionale: limitiamo a 10MB per GridFS (anche se supporta di più)
    if (file.size > 10 * 1024 * 1024) {
      alert("Il file è troppo grande. Massimo 10MB.")
      e.target.value = null
      return
    }
    
    selectedFile.value = file
    // Puliamo il nome del file per suggerire il titolo (rimuove estensione e trattini)
    if (!resourceName.value) {
      resourceName.value = file.name
        .split('.').slice(0, -1).join('.')
        .replace(/[_-]/g, ' ')
    }
  }
}

const upload = async () => {
  if (!selectedFile.value || !resourceName.value) return
  
  isUploading.value = true
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('name', resourceName.value)

  try {
    // Invio al Passo 1 (POST API)
    const res = await $fetch(`/api/manager/${props.asdSlug}/resources`, {
      method: 'POST',
      body: formData
    })
    emit('uploaded', res)
    emit('close')
  } catch (e) {
    console.error(e)
    alert("Errore durante il caricamento del file nel database.")
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-chess-dark/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-white/20">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 class="font-black text-chess-dark uppercase tracking-tight">Carica Risorsa</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-chess-dark transition-colors">
          <Icon name="fa6-solid:xmark" />
        </button>
      </div>

      <div class="p-6 space-y-6">
        <div>
          <label class="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Nome da visualizzare</label>
          <input 
            v-model="resourceName" 
            type="text" 
            placeholder="Es: Regolamento ASD 2026"
            class="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-chess-gold font-bold text-chess-dark"
          />
        </div>

        <div>
          <label class="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">File (Immagine o PDF)</label>
          <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
            <div v-if="!selectedFile" class="flex flex-col items-center justify-center pt-5 pb-6">
              <Icon name="fa6-solid:cloud-arrow-up" size="24" class="text-gray-300 mb-2" />
              <p class="text-[10px] text-gray-500 font-bold uppercase">Clicca per scegliere dal dispositivo</p>
            </div>
            <div v-else class="text-center p-4">
              <Icon name="fa6-solid:file-circle-check" size="24" class="text-chess-gold mb-2" />
              <p class="text-xs font-bold text-chess-dark truncate max-w-[200px]">{{ selectedFile.name }}</p>
            </div>
            <input type="file" class="hidden" accept="image/*,.pdf" @change="handleFileChange" />
          </label>
        </div>
      </div>

      <div class="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
        <button @click="$emit('close')" class="flex-1 py-3 text-[11px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors">
          Annulla
        </button>
        <button 
          @click="upload" 
          :disabled="!selectedFile || !resourceName || isUploading"
          class="flex-[2] py-3 bg-chess-dark text-chess-gold rounded-lg text-[11px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Icon v-if="isUploading" name="fa6-solid:spinner" class="animate-spin" />
          {{ isUploading ? 'Salvataggio...' : 'Carica nel Database' }}
        </button>
      </div>
    </div>
  </div>
</template>