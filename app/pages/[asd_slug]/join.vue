<template>
  <div class="min-h-screen bg-chess-dark flex flex-col items-center justify-center p-6 text-center">
    
    <div v-if="status === 'processing'" class="animate-pulse space-y-8">
      <div class="w-24 h-24 border-4 border-chess-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
      <div class="space-y-3">
        <h2 class="text-white text-xl font-black uppercase tracking-widest">Verifica Iscrizione</h2>
        <p class="text-chess-gold/60 text-sm italic">Stiamo convalidando la tua tessera digitale...</p>
      </div>
    </div>

    <div v-if="status === 'success'" class="space-y-8 animate-in zoom-in duration-500">
      <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.4)]">
        <Icon name="fa6-solid:check" class="text-white text-4xl" />
      </div>
      <div class="space-y-2">
        <h2 class="text-white text-2xl font-black uppercase tracking-tight">Benvenuto, {{ memberData?.name }}!</h2>
        <p class="text-chess-gold text-sm font-bold uppercase tracking-widest">Accesso Socio Verificato</p>
      </div>
      <p class="text-white/60 text-sm max-w-xs mx-auto">
        Il tuo profilo è stato collegato correttamente. Verrai reindirizzato agli eventi tra pochi istanti.
      </p>
    </div>

    <div v-if="status === 'error'" class="space-y-8 animate-in fade-in duration-500">
      <div class="w-24 h-24 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto">
        <Icon name="fa6-solid:xmark" class="text-red-500 text-4xl" />
      </div>
      <div class="space-y-2">
        <h2 class="text-white text-xl font-black uppercase tracking-tight">Link Non Valido</h2>
        <p class="text-red-400 text-xs font-bold uppercase tracking-widest">{{ errorMessage }}</p>
      </div>
      <button @click="navigateTo(`/${asd_slug}/events`)" class="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
        Torna al Portale
      </button>
    </div>

  </div>
</template>

<script setup>
const route = useRoute()
const asd_slug = route.params.asd_slug
const token = route.query.t
const userStore = useUserStore()

const status = ref('processing') // 'processing' | 'success' | 'error'
const memberData = ref(null)
const errorMessage = ref('')

definePageMeta({
  layout: false
})

onMounted(async () => {
  if (!token) {
    status.value = 'error'
    errorMessage.value = 'Token di accesso mancante.'
    return
  }

  try {
    // 1. Chiamata all'API di validazione che abbiamo appena creato
    const data = await $fetch(`/api/asd/${asd_slug}/join`, {
      params: { t: token }
    })

    // 2. Aggiornamento dello UserStore con i dati reali del socio
    memberData.value = data
    userStore.setAsdProfile(asd_slug, data)
    
    status.value = 'success'

    // 3. Redirect dopo un breve momento di gloria
    setTimeout(() => {
      navigateTo(`/${asd_slug}/events`)
    }, 2500)

  } catch (e) {
    status.value = 'error'
    errorMessage.value = e.statusMessage || 'Errore durante la verifica.'
  }
})
</script>

<style scoped>
/* Aggiungiamo un tocco di eleganza */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>