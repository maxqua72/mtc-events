<script setup>
const route = useRoute()
const router = useRouter()
const asdSlug = route.params.asd_slug

definePageMeta({ layout: 'default' })

/**
 * Gestisce il salvataggio del nuovo evento.
 * Il payload viene emesso dal componente EventEditor già formattato.
 */
const handleSave = async (payload) => {
  try {
    // Puntiamo all'endpoint POST per la creazione
    await $fetch(`/api/manager/${asdSlug}/events`, {
      method: 'POST',
      body: {
        ...payload,
        // L'ID associazione potrebbe essere gestito anche lato server, 
        // ma lo passiamo per sicurezza se l'API lo richiede.
        asd_slug: asdSlug 
      }
    })
    
    // Dopo il salvataggio, torniamo alla lista eventi
    router.push(`/${asdSlug}/manager/events`)
  } catch (e) {
    console.error("Errore durante la creazione dell'evento:", e)
    alert("Si è verificato un errore durante la creazione dell'evento. Riprova.")
  }
}

/**
 * Gestisce l'annullamento dell'operazione.
 */
const handleCancel = () => {
  router.push(`/${asdSlug}/manager/events`)
}
</script>

<template>
  <EventEditor 
    :asd-slug="asdSlug" 
    @save="handleSave"
    @cancel="handleCancel"
  />
</template>