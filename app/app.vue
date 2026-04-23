<script setup>
const userStore = useUserStore()
const pwaStore = usePwaStore()

if (import.meta.client) {
  // 1. Inizializza subito piattaforma e stato standalone
  pwaStore.initPwaDetection()

  // 2. Ascolta l'evento prima che svanisca
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ Evento intercettato in app.vue')
    e.preventDefault()
    pwaStore.deferredPrompt = e
  })

  // 3. Opzionale: pulisci se installata con altri metodi
  window.addEventListener('appinstalled', () => {
    pwaStore.isAlreadyStandalone = true
    pwaStore.deferredPrompt = null
  })
}

let lastRefresh = 0
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    const now = Date.now()
    // Aggiorna solo se sono passati almeno 30 secondi dall'ultimo refresh
    if (now - lastRefresh > 30000) {
      console.log('PWA riattivata: sincronizzazione dati globale...')
      
      // Questo comando di Nuxt rinfresca TUTTI i useFetch e useAsyncData 
      // attivi nella pagina corrente
      refreshNuxtData()
      lastRefresh = now
    }
  }
}

onMounted(() => {
  // Carica i dati salvati nel localStorage all'avvio dell'app
  userStore.initStore()

  document.addEventListener('visibilitychange', handleVisibilityChange)
  // Opzionale: gestisce anche il ritorno online se cade la connessione
  window.addEventListener('online', refreshNuxtData)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('online', refreshNuxtData)
})

useHead({
  link: [
    // Aggiungi manualmente il link al manifest
    { rel: 'manifest', href: '/manifest.webmanifest' }
  ]
})
</script>


<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <!-- <PwaUpdateBanner /> -->
      <FcmHandler />
    </ClientOnly>
    
  </div>
</template>
