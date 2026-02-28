<script setup>
const route = useRoute()
const router = useRouter()
const { asd_slug, id } = route.params

definePageMeta({ layout: 'default' })

// 1. Fetch dei dati della matrice ricorrente (generator)
const { data: generator, pending, error, refresh } = await useFetch(`/api/manager/${asd_slug}/generators/${id}`)

const handleSave = async (payload) => {
  try {
    // Usiamo PATCH o PUT come definito nelle API CRUD precedenti
    await $fetch(`/api/manager/${asd_slug}/generators/${id}`, {
      method: 'PATCH',
      body: payload
    })
    
    router.push(`/${asd_slug}/manager/generators`)
  } catch (e) {
    console.error("Errore durante l'aggiornamento della matrice:", e)
    alert("Impossibile salvare le modifiche alla matrice.")
  }
}

const handleCancel = () => {
  router.push(`/${asd_slug}/manager/generators`)
}

const handleManualRolling = async ({ generator, target_date }) => {
  try {
    // 1. Prima salviamo lo stato attuale della matrice (per sicurezza)
    await handleSave(generator)

    // 2. Lanciamo il rolling manuale
    const res = await $fetch(`/api/manager/${asd_slug}/generators/${id}/rolling`, {
      method: 'POST',
      body: { target_date }
    })

    if (res.success) {
      alert(`Successo! Generati ${res.generated_count} nuovi eventi.`);
      // Ricarichiamo i dati per aggiornare l'interfaccia (es. last_rolling_date)
      refresh() 
    }
  } catch (e) {
    console.error("Errore durante il rolling:", e)
    alert("Errore durante la generazione degli eventi.")
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="pending" class="flex justify-center py-20">
      <Icon name="fa6-solid:circle-notch" class="animate-spin text-chess-gold" size="40" />
    </div>

    <div v-else-if="error" class="p-10 text-center">
      <p class="text-red-500 font-bold text-lg">Evento ricorrente non trovato.</p>
      <button @click="router.back()" class="mt-4 text-chess-gold underline font-bold uppercase text-xs">Torna indietro</button>
    </div>

    <div v-else>
      

      <GeneratorEditor 
        :initial-data="generator"
        :asd-slug="asd_slug"
        @save="handleSave"
        @cancel="handleCancel"
        @manual-rolling="handleManualRolling"
      />
    </div>
  </div>
</template>