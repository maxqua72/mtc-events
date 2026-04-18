<script setup>
const props = defineProps({
  asd: { type: Object, default: null } // Se presente, siamo in modalità EDIT
})

const emit = defineEmits(['close', 'save'])

// Riferimenti per gli input file
const fileInputLogo = ref(null)
const fileInput512 = ref(null)
const fileInput192 = ref(null)
const fileInput180 = ref(null)

// File selezionati
const selectedLogo = ref(null)
const selected512 = ref(null)
const selected192 = ref(null)
const selected180 = ref(null)

// Anteprime
const logoPreview = ref('')
const icon512Preview = ref('')
const icon192Preview = ref('')
const icon180Preview = ref('')

//const selectedFile = ref(null) // File pronto per l'upload post-creazione


const isSubmitting = ref(false)

// Stato del form
const form = ref({
  name: '',
  slug: '',
  theme_color: '#1a1a1a',
  logo_url: '',
  icon_512_url: '',
  icon_192_url: '',
  icon_180_url: ''
})

// Inizializzazione
onMounted(() => {
  if (props.asd) {
    form.value = { ...props.asd }
    logoPreview.value = props.asd.logo_url
    icon512Preview.value = props.asd.icon_512_url
    icon192Preview.value = props.asd.icon_192_url
    icon180Preview.value = props.asd.icon_180_url
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

// Stato degli errori
const errors = ref({
  logo: '',
  '512': '',
  '192': '',
  '180': ''
})

const hasErrors = computed(() => {
  return Object.values(errors.value).some(error => error !== '')
})

// Gestione selezione file dal PC (Anteprima locale)
const handleFileChange = async (e, type) => {
  const file = e.target.files[0]
  if (!file) return

  // Definiamo i requisiti minimi o esatti per tipo
  const requirements = {
    '512': { w: 512, h: 512 },
    '192': { w: 192, h: 192 },
    '180': { w: 180, h: 180 }
  }

  // Se è un'icona PWA, controlliamo le dimensioni
  if (requirements[type]) {
    const isValid = await checkImageDimensions(file, requirements[type].w, requirements[type].h)
    if (!isValid) {
      errors.value[type] = `Deve essere ${requirements[type].w}x${requirements[type].h}px`
      e.target.value = '' // Reset dell'input
      return
    }
  }

  // Crea un URL temporaneo per vedere l'immagine subito
  const url = URL.createObjectURL(file)
  
  if (type === 'logo') { selectedLogo.value = file; logoPreview.value = url }
  if (type === '512') { selected512.value = file; icon512Preview.value = url }
  if (type === '192') { selected192.value = file; icon192Preview.value = url }
  if (type === '180') { selected180.value = file; icon180Preview.value = url }
}

// Helper per leggere le dimensioni dell'immagine
const checkImageDimensions = (file, expectedW, expectedH) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      const valid = img.naturalWidth === expectedW && img.naturalHeight === expectedH
      URL.revokeObjectURL(img.src) // Pulizia memoria
      resolve(valid)
    }
    img.onerror = () => resolve(false)
  })
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
    /*
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
      */
    // 2. Funzione helper per l'upload
    // 2. Helper per l'upload con distinzione tra Logo e Icone
    const uploadFile = async (file, suffix, isMainLogo = false) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', isMainLogo ? `LOGO_${targetSlug}` : `ICON_${suffix}_${targetSlug}`)
      
      // Distinguiamo nei metadati
      if (isMainLogo) {
        formData.append('is_system_logo', 'true')
      } else {
        formData.append('is_pwa_icon', 'true')
        formData.append('icon_size', suffix) // es: '512', '192', '180'
      }

      return await $fetch(`/api/manager/${targetSlug}/resources`, { 
        method: 'POST', 
        body: formData 
      })
    }

    const updates = {}
    if (selectedLogo.value) {
      const res = await uploadFile(selectedLogo.value, 'MAIN', true)
      updates.logo_url = res.url
    }
    if (selected512.value) {
      const res = await uploadFile(selected512.value, '512')
      updates.icon_512_url = res.url
    }
    if (selected192.value) {
      const res = await uploadFile(selected192.value, '192')
      updates.icon_192_url = res.url
    }
    if (selected180.value) {
      const res = await uploadFile(selected180.value, '180')
      updates.icon_180_url = res.url
    }

    // 3. Aggiornamento finale se ci sono stati upload
    if (Object.keys(updates).length > 0) {
      await $fetch(`/api/admin/associations/${asdId}`, { method: 'PUT', body: updates })
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

        <!-- LOGO ASSOCIAZIONE-->
        <div class="pt-4 border-t border-gray-100 space-y-4">
          <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest block">Logo Associazione</label>
          
          <div class="flex items-center gap-5">
            <div class="w-20 h-20 shrink-0 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden p-2 relative shadow-inner">
              <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain" />
              <Icon v-else name="fa6-solid:image" size="24" class="text-gray-200" />
            </div>

            <div class="flex-1 space-y-2">
              <button type="button" @click="fileInputLogo.click()"
                class="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase text-chess-dark hover:bg-gray-50 transition-colors shadow-sm">
                <Icon name="fa6-solid:upload" size="12" /> Seleziona Logo
              </button>
              <input type="text" v-model="form.logo_url" placeholder="O incolla URL..." 
                class="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-[10px] font-mono outline-none" />
            </div>
          </div>
          
          <input type="file" ref="fileInputLogo" class="hidden" accept="image/*" @change="e => handleFileChange(e,'logo')" />
        </div>
      
        <!-- ICONE PER PWA-->
      
      <div class="pt-4 border-t border-gray-100 space-y-6">
        <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest block">Dimensioni Reali Icone PWA</label>

        <div class="flex flex-wrap items-end gap-8 overflow-x-auto pb-4">
          
          <div class="space-y-2 flex flex-col items-center">
            <div 
              class="bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm transition-all"
              style="width: 128px; height: 128px;" 
            >
              <img v-if="icon512Preview || form.icon_512_url" :src="icon512Preview || form.icon_512_url" class="w-full h-full object-cover" />
              <span v-else class="text-[10px] font-bold text-gray-300">512px</span>
            </div>
            <button type="button" @click="fileInput512.click()" class="text-[8px] font-black uppercase bg-white border border-gray-200 px-3 py-1 rounded-full hover:bg-gray-50">Upload 512</button>
            <p v-if="errors['512']" class="text-[9px] font-bold text-red-500 animate-pulse text-center">
              {{ errors['512'] }}
            </p>
            <input type="file" ref="fileInput512" class="hidden" accept="image/png" @change="e => handleFileChange(e, '512')" />
          </div>

          <div class="space-y-2 flex flex-col items-center">
            <div 
              class="bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm"
              style="width: 48px; height: 48px;" 
            >
              <img v-if="icon192Preview || form.icon_192_url" :src="icon192Preview || form.icon_192_url" class="w-full h-full object-cover" />
              <span v-else class="text-[8px] font-bold text-gray-300">192</span>
            </div>
            <button type="button" @click="fileInput192.click()" class="text-[8px] font-black uppercase bg-white border border-gray-200 px-3 py-1 rounded-full hover:bg-gray-50">Upload 192</button>
            <p v-if="errors['192']" class="text-[9px] font-bold text-red-500 animate-pulse text-center">
              {{ errors['192'] }}
            </p>
            <input type="file" ref="fileInput192" class="hidden" accept="image/png" @change="e => handleFileChange(e, '192')" />
          </div>

          <div class="space-y-2 flex flex-col items-center">
            <div 
              class="bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm"
              style="width: 45px; height: 45px;" 
            >
              <img v-if="icon180Preview || form.icon_180_url" :src="icon180Preview || form.icon_180_url" class="w-full h-full object-cover" />
              <span v-else class="text-[8px] font-bold text-gray-300">180</span>
            </div>
            <button type="button" @click="fileInput180.click()" class="text-[8px] font-black uppercase bg-white border border-gray-200 px-3 py-1 rounded-full hover:bg-gray-50">Upload 180</button>
            <p v-if="errors['180']" class="text-[9px] font-bold text-red-500 animate-pulse text-center">
              {{ errors['180'] }}
            </p>
            <input type="file" ref="fileInput180" class="hidden" accept="image/png" @change="e => handleFileChange(e, '180')" />
          </div>

        </div>
        
      </div>

      <!-- BOTTONI -->

        <div class="pt-4 flex gap-3">
          <button type="button" @click="$emit('close')"
            class="flex-1 px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest border border-gray-200 text-gray-400 hover:bg-gray-50 transition-all">
            Annulla
          </button>
          <button type="submit" :disabled="isSubmitting || hasErrors"
            class="flex-1 bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg disabled:opacity-50">
            {{ isSubmitting ? 'Salvataggio...' : 'Salva ASD' }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>