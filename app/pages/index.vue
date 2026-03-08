<template>
  <div class="fixed inset-0 z-[9999] bg-chess-dark flex flex-col items-center justify-center p-6 text-center">
    
    <div class="absolute inset-0 bg-[#1a1a1a]"></div>

    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" 
         style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 30px 30px;">
    </div>

    <div class="relative z-10 w-full max-w-xs">
      
      <div v-if="status === 'checking'" class="space-y-6 animate-pulse">
        <div class="w-16 h-16 border-4 border-chess-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div class="space-y-2">
          <p class="text-chess-gold text-xs font-black uppercase tracking-[0.2em]">MTC Events</p>
          <p class="text-white/40 text-[10px] font-bold uppercase tracking-widest">Identificazione profilo...</p>
        </div>
      </div>

      <div v-if="status === 'empty'" class="space-y-8 animate-in zoom-in-95 duration-700">
        <div class="space-y-4">
          <div class="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-2xl">
            <Icon name="fa6-solid:chess-board" class="text-chess-gold/30 text-4xl" />
          </div>
          <h2 class="text-white text-xl font-black uppercase tracking-tight">Nessun Calendario Attivo</h2>
          <p class="text-white/40 text-sm leading-relaxed font-medium">
            Questa App è un portale riservato. Per accedere, devi aver visitato il link della tua associazione o scansionato un codice autorizzato.
          </p>
        </div>
        
        <div class="p-5 bg-chess-iron/30 rounded-2xl border border-white/5 backdrop-blur-md">
          <p class="text-[10px] text-chess-gold font-black uppercase tracking-widest leading-loose">
            <Icon name="fa6-solid:circle-info" class="mr-1" /> 
            Controlla le comunicazioni della tua ASD per il link di accesso.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
// Rimuove l'header e il footer di default per questa pagina
definePageMeta({
  layout: 'blank' // Specifichiamo il nome del file creato in layouts/
})
const userStore = useUserStore()
const status = ref('checking') // 'checking' | 'empty'

onMounted(async () => {
  // 1. Aspettiamo un attimo per l'idratazione dello store (opzionale ma sicuro)
  await nextTick()
  userStore.initStore()

  // 2. Controllo Staff (Admin/Manager)
  if (userStore.auth) {
    if (userStore.auth.is_admin) return navigateTo('/admin')
    if (userStore.auth.managed_asds?.length > 0) {
      return navigateTo(`/${userStore.auth.managed_asds[0].asd_slug}/manager/dashboard`)
    }
  }

  // 3. Controllo Socio/Visitatore
  if (userStore.followedAsds && userStore.followedAsds.length > 0) {
    // Reindirizza all'ultima ASD visitata
    const lastVisited = userStore.followedAsds[userStore.followedAsds.length - 1]
    return navigateTo(`/${lastVisited}/events`)
  }

  // 4. Se arriviamo qui, l'utente è "orfano" di dati
  status.value = 'empty' 
})
</script>