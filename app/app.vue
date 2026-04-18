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

onMounted(() => {
  // Carica i dati salvati nel localStorage all'avvio dell'app
  userStore.initStore()
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
