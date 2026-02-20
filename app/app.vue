<script setup>
const userStore = useUserStore()

onMounted(() => {
  // Carica i dati salvati nel localStorage all'avvio dell'app
  userStore.initStore()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
