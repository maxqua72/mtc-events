<script setup>
const props = defineProps({
  asd: { type: Object, required: true } // L'ASD a cui aggiungere il manager
})

const emit = defineEmits(['close', 'saved'])

const email = ref('')
const name = ref('')
const userExists = ref(false)
const searchPerformed = ref(false)
const isSubmitting = ref(false)

// 1. Cerca se l'utente esiste già nel sistema
const checkUser = async () => {
  if (!email.value.includes('@')) return
  
  try {
    const user = await $fetch(`/api/admin/users/search?email=${email.value}`)
    if (user) {
      name.value = user.name
      userExists.value = true
    } else {
      userExists.value = false
      name.value = '' // Pronto per inserimento manuale
    }
    searchPerformed.value = true
  } catch (e) {
    searchPerformed.value = true
    userExists.value = false
  }
}

// 2. Salva il legame MANAGER
const saveManager = async () => {
  isSubmitting.value = true
  try {
    await $fetch(`/api/admin/associations/${props.asd._id}/managers`, {
      method: 'POST',
      body: {
        email: email.value,
        name: name.value,
        role: 'MANAGER' // Come richiesto dalle istruzioni
      }
    })
    emit('saved')
    emit('close')
  } catch (e) {
    alert(e.statusMessage || "Errore nel salvataggio")
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-chess-dark/90 backdrop-blur-md" @click="$emit('close')"></div>

    <div class="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
      
      <div class="bg-chess-gold p-6 text-chess-dark flex justify-between items-center">
        <div>
          <h3 class="text-lg font-black uppercase tracking-tight">Aggiungi MANAGER</h3>
          <p class="text-[10px] font-bold uppercase opacity-70">Associazione: {{ asd.name }}</p>
        </div>
        <button @click="$emit('close')" class="hover:rotate-90 transition-transform">
          <Icon name="fa6-solid:xmark" size="20" />
        </button>
      </div>

      <div class="p-8 space-y-6">
        <div class="space-y-2">
          <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">Email Utente</label>
          <div class="flex gap-2">
            <input 
              v-model="email" 
              type="email" 
              placeholder="cerca@email.it"
              class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-chess-gold"
              @blur="checkUser"
            />
            <button @click="checkUser" class="bg-gray-100 px-4 rounded-lg hover:bg-gray-200 transition-colors">
              <Icon name="fa6-solid:magnifying-glass" size="14" class="text-chess-dark" />
            </button>
          </div>
        </div>

        <div v-if="searchPerformed" class="space-y-4 animate-in slide-in-from-top-2">
          <div class="space-y-2">
            <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">Nome Completo</label>
            <input 
              v-model="name" 
              type="text" 
              :disabled="userExists"
              placeholder="Inserisci nome e cognome"
              class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-bold outline-none disabled:opacity-60"
            />
            <p v-if="userExists" class="text-[9px] text-green-600 font-bold flex items-center gap-1">
              <Icon name="fa6-solid:circle-check" /> Utente già registrato nel sistema
            </p>
            <p v-else class="text-[9px] text-amber-600 font-bold flex items-center gap-1">
              <Icon name="fa6-solid:user-plus" /> Nuovo utente: verrà creato un profilo
            </p>
          </div>

          <button 
            @click="saveManager"
            :disabled="isSubmitting || !name"
            class="w-full bg-chess-dark text-chess-gold py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {{ isSubmitting ? 'Elaborazione...' : 'Conferma Assegnazione' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>