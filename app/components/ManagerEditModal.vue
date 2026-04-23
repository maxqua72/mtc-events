<script setup>
const props = defineProps({
  asd: { type: Object, required: true },
  managerEmail: { type: String, required: true }
})

const emit = defineEmits(['close', 'updated'])

const manager = ref(null)
const loading = ref(true)

// Campi del form (si popoleranno dopo il caricamento)
const name = ref('')
const email = ref('')
const isSubmitting = ref(false)

// Sincronizziamo i campi di input quando il manager viene caricato
watch(manager, (newVal) => {
  if (newVal) {
    name.value = newVal.name
    email.value = newVal.email
  }
}, { immediate: true })

// Verifica se ci sono modifiche rispetto ai dati caricati dal DB
const hasChanges = computed(() => {
  if (!manager.value) return false
  return name.value !== manager.value.name || email.value !== manager.value.email
})

// Formattazione token 3-3-3 usando la utility che abbiamo creato
const formattedToken = computed(() => {
  if (!manager.value?.manager_token) return '---'
  return manager.value.manager_token.match(/.{1,3}/g).join('-')
})

const handleUpdate = async () => {
  isSubmitting.value = true
  try {
    await $fetch(`/api/admin/associations/${props.asd._id}/managers`, {
      method: 'PATCH',
      body: { 
        oldEmail: manager.value.email, 
        newEmail: email.value.toLowerCase().trim(), 
        name: name.value.trim() 
      }
    })
    alert("Dati aggiornati con successo")
    emit('updated') // Aggiorna la lista nella pagina principale
    // Aggiorniamo i dati locali per resettare hasChanges senza chiudere
    manager.value.name = name.value
    manager.value.email = email.value
  } catch (e) {
    alert(e.statusMessage || "Errore nell'aggiornamento")
  } finally {
    isSubmitting.value = false
  }
}

const regenerateToken = async () => {
  if (!confirm("Rigenerare il token? Il vecchio codice non funzionerà più.")) return
  try {
    const res = await $fetch(`/api/admin/associations/${props.asd._id}/managers/regenerate-token`, {
      method: 'POST',
      body: { email: manager.value.email }
    })
    manager.value.manager_token = res.manager_token
    alert("Nuovo token generato con successo")
  } catch (e) {
    alert("Errore nella rigenerazione")
  }
}

const sendEmail = async () => {
  try {
    await $fetch(`/api/admin/associations/${props.asd._id}/managers/send-invite`, {
      method: 'POST',
      body: { email: manager.value.email }
    })
    alert("Email inviata con successo!")
  } catch (e) {
    alert("Errore nell'invio email")
  }
}

onMounted(async () => {
  try {
    manager.value = await $fetch(`/api/admin/associations/${props.asd._id}/managers/details`, {
      params: { email: props.managerEmail, asdId: props.asd._id }
    })
  }catch (e) {
    alert("Impossibile caricare i dettagli del manager")
    emit('close')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-chess-dark/95 backdrop-blur-md" @click="$emit('close')"></div>
    
    <div class="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
      <div class="bg-chess-dark p-6 text-white flex justify-between items-center">
        <div v-if="!loading">
          <h3 class="text-lg font-black uppercase tracking-tight text-chess-gold">Gestione Manager</h3>
          <p class="text-[10px] font-bold uppercase opacity-60">{{ manager?.email }}</p>
        </div>
        <button @click="$emit('close')" class="hover:text-chess-gold transition-colors">
          <Icon name="fa6-solid:xmark" size="20" />
        </button>
      </div>

      <div class="p-8 space-y-8">
        <div class="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center space-y-3">
          <label class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Codice di Accesso</label>
          <div class="text-3xl font-mono font-black tracking-widest text-chess-dark">
            {{ formattedToken }}
          </div>
          <div class="flex justify-center gap-4 pt-2">
            <button @click="regenerateToken" class="text-[10px] font-black uppercase text-chess-chocolate hover:text-chess-dark flex items-center gap-1">
              <Icon name="fa6-solid:rotate" /> Rigenera
            </button>
            <button @click="sendEmail" class="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Icon name="fa6-solid:paper-plane" /> Invia Email
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">Nome Visualizzato</label>
            <input v-model="name" type="text" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-chess-gold" />
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">Email di Accesso</label>
            <input v-model="email" type="email" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-chess-gold" />
        </div>
          
          <button @click="handleUpdate" :disabled="isSubmitting || !hasChanges"
            class="w-full bg-chess-dark text-chess-gold py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg disabled:opacity-30 transition-all">
            Salva Modifiche
          </button>
        </div>
      </div>
    </div>
  </div>
</template>