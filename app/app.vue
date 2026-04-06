<script setup>
const userStore = useUserStore()

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
