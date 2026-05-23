<script setup>
const route = useRoute()
const router = useRouter()
const { asd_slug, id } = route.params

// Ref per fare hook all'istanza del componente EventEditor
const editorRef = ref(null)

// Flag per capire se il salvataggio è andato a buon fine (ed evitare il prompt all'uscita)
const isSaving = ref(false)

// Fetch dei dati dell'evento
const { data: event } = await useFetch(`/api/manager/${asd_slug}/events/${id}`)

const handleSave = async (payload) => {
  isSaving.value = true // Disabilita i controlli anti-abbandono
  try {
    await $fetch(`/api/manager/${asd_slug}/events/${id}`, {
      method: 'PUT',
      body: payload
    })
    router.push(`/${asd_slug}/manager/events`)
  } catch (error) {
    isSaving.value = false
    alert("Errore durante il salvataggio dell'evento")
  }
}

// 1. GESTIONE NAVIGAZIONE IN-APP (Vue Router)
onBeforeRouteLeave((to, from, next) => {
  // Se stiamo salvando o il form non è stato modificato, procediamo liberamente
  if (isSaving.value || !editorRef.value?.isDirty) {
    return next()
  }

  // Chiediamo conferma all'utente
  const confirmLeave = confirm(
    'Ci sono modifiche non salvate in questo evento. Vuoi davvero lasciare la pagina perdendo i dati?'
  )
  
  if (confirmLeave) {
    next()
  } else {
    next(false) // Blocca la navigazione interna
  }
})

// 2. GESTIONE CHIUSURA SCHEDA / REFRESH (Browser)
const handleBeforeUnload = (e) => {
  if (!isSaving.value && editorRef.value?.isDirty) {
    e.preventDefault()
    // Nota: I browser moderni mostrano un messaggio standard e ignorano il testo customizzato
    e.returnValue = 'Ci sono modifiche non salvate.' 
    return e.returnValue
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <EventEditor 
    ref="editorRef"
    :event="event" 
    :asd-slug="asd_slug" 
    @save="handleSave"
    @cancel="router.back()"
  />
</template>