<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div>
        <h2 class="text-xl font-black text-chess-dark uppercase tracking-tight">Archivio Risorse</h2>
        <p class="text-xs text-gray-500 mt-1">Gestisci i file salvati nel database per la tua ASD.</p>
      </div>
      <button 
        @click="isUploadModalOpen = true"
        class="bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
      >
        <Icon name="fa6-solid:plus" size="14" /> Carica Nuovo
      </button>
    </div>

    <div v-if="resources && resources.length > 0" class="space-y-1">
      <div v-for="res in resources" :key="res._id"
        class="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 md:gap-6 hover:border-chess-gold/50 transition-colors group">

        <div class="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-chess-surface flex-shrink-0 border border-gray-100 flex items-center justify-center">
          <img v-if="res.type === 'image'" :src="res.url" class="w-full h-full object-cover" />
          <div v-else class="flex flex-col items-center gap-1">
            <Icon name="fa6-solid:file-pdf" size="28" class="text-red-500" />
            <span class="text-[8px] font-bold text-gray-400 uppercase">PDF</span>
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-bold uppercase tracking-tighter">
              {{ res.type }}
            </span>
            <span class="text-[10px] text-gray-400">{{ res.size }}</span>
          </div>

          <div class="h-8 flex items-center">
            <input v-if="editingId === res._id" 
              v-model="res.name" 
              @keyup.enter="saveName(res)"
              @keyup.esc="cancelEdit(res)" 
              @blur="handleBlur(res)" 
              v-focus
              class="font-bold text-chess-dark text-sm md:text-base bg-amber-50/50 border-b-2 border-chess-gold outline-none px-3 py-1 w-full max-w-lg rounded-t-md shadow-inner" 
            />

            <div v-else @click="startEditing(res)" class="group/name cursor-pointer flex items-center gap-2 w-full">
              <h4 class="font-bold text-chess-dark truncate text-sm md:text-base group-hover/name:text-chess-gold transition-colors">
                {{ res.name }}
              </h4>
              <Icon name="fa6-solid:pen" size="10" class="opacity-0 group-hover/name:opacity-100 text-chess-dark transition-opacity" />
            </div>
          </div>

          <p class="text-[10px] text-gray-400 truncate mt-1.5 font-mono bg-gray-50 p-1 px-2 rounded border border-gray-100 flex items-center gap-2">
            <Icon name="fa6-solid:id-card" size="8" /> ID: {{ res._id }}
          </p>
        </div>

        <div class="w-32 md:w-40 flex-shrink-0 border-l border-gray-100 pl-4 md:pl-6">
          <div v-if="editingId === res._id" class="flex flex-col gap-2">
            <button @mousedown.prevent="saveName(res)" class="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-[10px] font-black uppercase shadow-sm">
              <Icon name="fa6-solid:check" size="12" /> <span>Salva</span>
            </button>
            <button @mousedown.prevent="cancelEdit(res)" class="flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-400 rounded-md text-[10px] font-black uppercase border border-gray-200">
              <span>Annulla</span>
            </button>
          </div>

          <div v-else class="flex flex-col gap-2">
            <button @click="copyLink(res.url)" class="flex items-center justify-center gap-2 px-3 py-2 bg-chess-surface hover:bg-chess-gold/10 text-chess-dark rounded-md text-[10px] font-black uppercase transition-colors border border-gray-200">
              <Icon name="fa6-solid:link" size="12" /> <span class="hidden md:inline">Copia Link</span>
            </button>

            <div class="flex gap-2">
              <a :href="res.url" target="_blank" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-600 rounded-md border border-gray-200">
                <Icon name="fa6-solid:eye" size="12" />
              </a>
              <button @click="deleteResource(res._id)" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-red-500 rounded-md border border-red-100">
                <Icon name="fa6-solid:trash" size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white border-2 border-dashed border-gray-100 rounded-3xl py-20 text-center">
      <Icon name="fa6-solid:box-open" class="text-gray-100 mb-4" size="48" />
      <p class="text-gray-400 font-bold uppercase tracking-widest text-xs">L'archivio è vuoto</p>
    </div>

    <Teleport to="body">
      <ResourceUploadModal 
        v-if="isUploadModalOpen" 
        :asd-slug="asdSlug"
        @close="isUploadModalOpen = false"
        @uploaded="refresh"
      />
    </Teleport>
  </div>
</template>

<script setup>
const route = useRoute()
const asdSlug = route.params.asd_slug
const isUploadModalOpen = ref(false)
const editingId = ref(null)
const originalName = ref('')

// Recupero dati reattivo
const { data: resources, refresh } = await useFetch(`/api/manager/${asdSlug}/resources`)

const startEditing = (resource) => {
  originalName.value = resource.name
  editingId.value = resource._id
}

const saveName = async (resource) => {
  if (editingId.value === null) return
  const newName = resource.name.trim()
  
  if (newName === "" || newName === originalName.value) {
    resource.name = originalName.value
    editingId.value = null
    return
  }

  try {
    // Chiamata all'API PATCH (Passo 5)
    await $fetch(`/api/manager/${asdSlug}/resources/${resource._id}`, {
      method: 'PATCH',
      body: { name: newName }
    })
    editingId.value = null
  } catch (e) {
    alert("Errore durante la modifica del nome.")
    resource.name = originalName.value
  }
}

const cancelEdit = (resource) => {
  resource.name = originalName.value
  editingId.value = null
}

const handleBlur = (resource) => {
  setTimeout(() => {
    if (editingId.value === resource._id) saveName(resource)
  }, 150)
}

const copyLink = (url) => {
  const fullUrl = window.location.origin + url
  navigator.clipboard.writeText(fullUrl)
  // Puoi aggiungere un toast qui
  alert("Link copiato!")
}

const deleteResource = async (id) => {
  if (!confirm("Vuoi davvero eliminare questo file dal database?")) return
  
  try {
    // Chiamata all'API DELETE (Passo 4)
    await $fetch(`/api/manager/${asdSlug}/resources/${id}`, { method: 'DELETE' })
    refresh()
  } catch (e) {
    alert("Errore nell'eliminazione.")
  }
}

const vFocus = { mounted: (el) => el.focus() }
</script>