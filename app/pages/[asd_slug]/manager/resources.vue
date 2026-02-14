<template>
    <div class="space-y-4">

        <div class="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div>
                <h2 class="text-xl font-black text-chess-dark uppercase tracking-tight">Archivio Risorse</h2>
                <p class="text-xs text-gray-500 mt-1">Gestisci i file permanenti per i tuoi eventi e corsi.</p>
            </div>
            <button @click="triggerFileInput"
                class="bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                <Icon name="fa6-solid:cloud-arrow-up" size="16" /> Carica Nuovo File
            </button>
            <input type="file" ref="fileInput" class="hidden" @change="handleFileUpload" />
        </div>

        <div class="space-y-1">
            <div v-for="res in resources" :key="res.id"
                class="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 md:gap-6 hover:border-chess-gold/50 transition-colors group">

                <div
                    class="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-chess-surface flex-shrink-0 border border-gray-100 flex items-center justify-center">
                    <NuxtImg v-if="res.type === 'image'" :src="res.url" class="w-full h-full object-cover" />
                    <div v-else-if="res.type === 'pdf'" class="flex flex-col items-center gap-1">
                        <Icon name="fa6-solid:file-pdf" size="28" class="text-red-500" />
                        <span class="text-[8px] font-bold text-gray-400 uppercase">Preview PDF</span>
                    </div>
                </div>

                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span
                            class="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-bold uppercase tracking-tighter">
                            {{ res.type }}
                        </span>
                        <span class="text-[10px] text-gray-400">{{ res.size }}</span>
                    </div>

                    <div class="h-8 flex items-center">
                        <input v-if="editingId === res.id" v-model="res.name" @keyup.enter="saveName(res)"
                            @keyup.esc="cancelEdit(res)" @blur="handleBlur(res)" v-focus
                            class="font-bold text-chess-dark text-sm md:text-base bg-amber-50/50 border-b-2 border-chess-gold outline-none px-3 py-1 w-full max-w-lg rounded-t-md shadow-inner transition-all" />

                        <div v-else @click="startEditing(res)"
                            class="group/name cursor-pointer flex items-center gap-2 w-full">
                            <h4
                                class="font-bold text-chess-dark truncate text-sm md:text-base group-hover/name:text-chess-gold transition-colors">
                                {{ res.name }}
                            </h4>
                            <Icon name="fa6-solid:pen" size="10"
                                class="opacity-40 md:opacity-0 md:group-hover/name:opacity-100 text-chess-dark transition-opacity flex-shrink-0" />
                        </div>
                    </div>

                    <p
                        class="text-[10px] text-gray-400 truncate mt-1.5 font-mono bg-gray-50 p-1 px-2 rounded border border-gray-100 flex items-center gap-2">
                        <Icon name="fa6-solid:link" size="8" /> {{ res.url }}
                    </p>
                </div>

                <div class="w-32 md:w-40 flex-shrink-0 border-l border-gray-100 pl-4 md:pl-6">
  <div v-if="editingId === res.id" class="flex flex-col gap-2">
    <button 
      @mousedown.prevent="saveName(res)"
      class="flex items-center justify-center gap-2 px-3 py-2 !bg-green-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm hover:!bg-green-700 active:!bg-green-800 transition-colors border-none"
    >
      <Icon name="fa6-solid:check" size="12" class="text-white" /> 
      <span class="text-white">Conferma</span>
    </button>
    
    <button 
      @mousedown.prevent="cancelEdit(res)"
      class="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-md text-[10px] font-black uppercase tracking-wider border border-red-200 hover:bg-red-100 transition-colors"
    >
      <Icon name="fa6-solid:xmark" size="12" class="text-red-600" /> 
      <span>Annulla</span>
    </button>
  </div>

  <div v-else class="flex flex-col gap-2">
    <button @click="copyLink(res.url)"
      class="flex items-center justify-center gap-2 px-3 py-2 bg-chess-surface hover:bg-chess-gold/10 text-chess-dark rounded-md text-[10px] font-black uppercase tracking-wider transition-colors border border-gray-200">
      <Icon name="fa6-solid:copy" size="12" /> 
      <span class="hidden md:inline">Copia Link</span>
    </button>

    <div class="flex gap-2">
      <a :href="res.url" target="_blank"
        class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border border-gray-200">
        <Icon name="fa6-solid:eye" size="12" />
      </a>
      <button @click="deleteResource(res.id)"
        class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-red-500 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border border-red-100">
        <Icon name="fa6-solid:trash" size="12" />
      </button>
    </div>
  </div>
</div>
            </div>
        </div>
    </div>
</template>

<script setup>
const fileInput = ref(null)
const editingId = ref(null)
const originalName = ref('') // Supporto per logica ESC

const resources = ref([
    { id: 1, name: 'Locandina Gioco Libero', url: '/img/torneo.png', type: 'image', size: '1.2MB' },
    { id: 2, name: 'Regolamento Interno ASD', url: '#', type: 'pdf', size: '450KB' },
    { id: 3, name: 'Banner Corsi 2026', url: '/img/corsi.png', type: 'image', size: '2.1MB' },
])

// --- LOGICA EDITING ---

const startEditing = (resource) => {
    originalName.value = resource.name // Salva il nome prima di iniziare
    editingId.value = resource.id
}

const saveName = (resource) => {
    if (editingId.value === null) return // Evita doppie chiamate (blur + enter)

    if (resource.name.trim() === "") {
        resource.name = originalName.value // Ripristina se vuoto
    }

    editingId.value = null
    console.log(`Aggiornato nel DB: ${resource.name}`)
}

const cancelEdit = (resource) => {
    resource.name = originalName.value // Ripristina il valore iniziale
    editingId.value = null
}

// Direttiva focus automatica
const vFocus = {
    mounted: (el) => el.focus()
}

const handleBlur = (resource) => {
    // Aspettiamo un attimo per vedere se è stato cliccato il tasto "Annulla"
    // tramite mousedown. Se editingId è ancora questo, salviamo.
    setTimeout(() => {
        if (editingId.value === resource.id) {
            saveName(resource);
        }
    }, 100);
}

// --- LOGICA FILE ---

const triggerFileInput = () => fileInput.value.click()

const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    console.log('Upload avviato per:', file.name)
}

const copyLink = (url) => {
    navigator.clipboard.writeText(url)
    // Qui potresti aggiungere un feedback visivo (toast)
}

const deleteResource = (id) => {
    if (confirm("Sei sicuro di voler eliminare questa risorsa?")) {
        resources.value = resources.value.filter(r => r.id !== id)
    }
}
</script>