<script setup>
const props = defineProps({
  asd: { type: Object, default: null } // Se presente, siamo in modalità EDIT
})

const emit = defineEmits(['close', 'save'])

const fileInput = ref(null)
const selectedFile = ref(null) // File pronto per l'upload post-creazione
const logoPreview = ref('') // Per l'anteprima immediata locale
const isSubmitting = ref(false)

// Stato del form
const form = ref({
  name: '',
  slug: '',
  theme_color: '#1a1a1a',
  logo_url: ''
})

// Inizializzazione
onMounted(() => {
  if (props.asd) {
    form.value = { ...props.asd }
    logoPreview.value = props.asd.logo_url
  }
})

// Generazione automatica slug (solo in creazione)
const updateSlug = () => {
  if (!props.asd) {
    form.value.slug = form.value.name
      .toLowerCase()
      .trim()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '')
  }
}

// Gestione selezione file dal PC (Anteprima locale)
const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return

  selectedFile.value = file
  // Crea un URL temporaneo per vedere l'immagine subito
  logoPreview.value = URL.createObjectURL(file)
}

const save = async () => {
  isSubmitting.value = true
  try {
    // 1. Salvataggio dati ASD (Nome, Slug, Colore)
    const method = props.asd ? 'PUT' : 'POST'
    const url = props.asd ? `/api/admin/associations/${props.asd._id}` : '/api/admin/associations'
    
    const savedAsd = await $fetch(url, {
      method,
      body: form.value
    })

    // Usiamo lo slug dell'ASD (nuova o esistente) per il path delle risorse
    const targetSlug = savedAsd.slug || form.value.slug
    const asdId = savedAsd._id || props.asd._id

    // 2. Se abbiamo selezionato un file, facciamo l'upload sulle risorse della ASD
    if (selectedFile.value) {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      formData.append('name', `LOGO_${targetSlug}`)
      formData.append('is_system_logo', 'true') // Flag utile per distinguerlo dai media comuni

      const uploadRes = await $fetch(`/api/manager/${targetSlug}/resources`, {
        method: 'POST',
        body: formData
      })

      // 3. Aggiornamento finale del logo_url nell'oggetto ASD su MongoDB
      await $fetch(`/api/admin/associations/${asdId}`, {
        method: 'PUT',
        body: { logo_url: uploadRes.url }
      })
    }
    
    emit('save')
  } catch (e) {
    alert("Errore durante il salvataggio: " + e.statusMessage)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-chess-dark/80 backdrop-blur-sm" @click="$emit('close')"></div>

    <div class="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
      
      <div class="bg-chess-dark p-6 text-white flex justify-between items-center">
        <div>
          <h3 class="text-xl font-black uppercase tracking-tight">
            {{ asd ? 'Modifica ASD' : 'Nuova Associazione' }}
          </h3>
          <p class="text-chess-gold text-[10px] font-bold uppercase tracking-widest mt-1">Configurazione MANAGER Piattaforma</p>
        </div>
        <button @click="$emit('close')" class="text-white/50 hover:text-white transition-colors">
          <Icon name="fa6-solid:xmark" size="20" />
        </button>
      </div>

      <form @submit.prevent="save" class="p-8 space-y-6">
        
        <div class="space-y-2">
          <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">Nome Associazione</label>
          <input 
            v-model="form.name" 
            @input="updateSlug"
            type="text" 
            required
            placeholder="Esempio: Circolo Scacchistico"
            class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-chess-dark focus:ring-2 focus:ring-chess-gold outline-none font-bold"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">URL Slug (ID)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">/</span>
              <input 
                v-model="form.slug" 
                type="text" 
                required
                :disabled="!!asd"
                class="w-full bg-gray-50 border border-gray-200 rounded-lg pl-6 pr-4 py-3 text-chess-dark font-mono text-xs focus:ring-2 focus:ring-chess-gold outline-none disabled:opacity-50"
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">Colore Sociale</label>
            <div class="flex gap-2">
                <input v-model="form.theme_color" type="color" class="h-10 w-12 rounded border border-gray-200 cursor-pointer bg-white p-1" />
                <input v-model="form.theme_color" type="text" class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none uppercase" />
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-100 space-y-4">
          <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest block">Logo Associazione</label>
          
          <div class="flex items-center gap-5">
            <div class="w-20 h-20 shrink-0 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden p-2 relative shadow-inner">
              <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain" />
              <Icon v-else name="fa6-solid:image" size="24" class="text-gray-200" />
            </div>

            <div class="flex-1 space-y-2">
              <button type="button" @click="fileInput.click()"
                class="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase text-chess-dark hover:bg-gray-50 transition-colors shadow-sm">
                <Icon name="fa6-solid:upload" size="12" /> Seleziona Logo
              </button>
              <input type="text" v-model="form.logo_url" placeholder="O incolla URL..." 
                class="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-[10px] font-mono outline-none" />
            </div>
          </div>
          
          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileChange" />
        </div>

        <div class="pt-4 flex gap-3">
          <button type="button" @click="$emit('close')"
            class="flex-1 px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest border border-gray-200 text-gray-400 hover:bg-gray-50 transition-all">
            Annulla
          </button>
          <button type="submit" :disabled="isSubmitting"
            class="flex-1 bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg disabled:opacity-50">
            {{ isSubmitting ? 'Salvataggio...' : 'Salva ASD' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>