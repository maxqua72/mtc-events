<script setup>
const route = useRoute()
const asdSlug = route.params.asd_slug

definePageMeta({ layout: 'default' })

const activeFilter = ref('Tutti')
const filters = ['Tutti', 'Tornei', 'Gioco Libero', 'Corsi', 'Altro']

// Fetch degli eventi (inclusi quelli non pubblicati per il MANAGER)
const { data: events, refresh } = await useFetch(`/api/manager/${asdSlug}/events/`)

const filteredEvents = computed(() => {
  if (!events.value) return []
  return activeFilter.value === 'Tutti'
    ? events.value
    : events.value.filter(e => e.category === activeFilter.value)
})

const deleteEvent = async (id) => {
  if (confirm('Sei sicuro di voler eliminare questo evento?')) {
    await $fetch(`/api/asd/${asdSlug}/events/${id}`, { method: 'DELETE' })
    refresh()
  }
}

// Calcoliamo quanti eventi in bozza ci sono per il filtro attuale
const draftCount = computed(() => {
  return filteredEvents.value.filter(e => !e.is_published).length
})

const publishAllFiltered = async () => {
  const targets = filteredEvents.value.filter(e => !e.is_published)

  if (targets.length === 0) return

  const confirmMsg = activeFilter.value === 'Tutti'
    ? `Vuoi pubblicare tutti i ${targets.length} eventi in bozza?`
    : `Vuoi pubblicare i ${targets.length} eventi in bozza della categoria ${activeFilter.value}?`

  if (confirm(confirmMsg)) {
    try {
      // Chiamata API batch (o loop se il backend non supporta batch)
      await $fetch(`/api/manager/${asdSlug}/events/publish-batch`, {
        method: 'POST',
        body: {
          eventIds: targets.map(e => e._id),
          category: activeFilter.value !== 'Tutti' ? activeFilter.value : null
        }
      })
      refresh() // Ricarica la lista
    } catch (err) {
      alert("Errore durante la pubblicazione massiva")
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    

    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm gap-4">
      <div>
        <h2 class="text-xl font-black text-chess-dark uppercase tracking-tight">Gestione Eventi</h2>
        <p class="text-xs text-gray-500 mt-1">Crea, modifica e monitora la pubblicazione dei tuoi eventi.</p>

      </div>

      <div class="flex items-center gap-3 w-full md:w-auto">
        <button v-if="draftCount > 0" @click="publishAllFiltered"
          class="flex-1 md:flex-none bg-green-600 text-white px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-md flex items-center justify-center gap-2">
          <Icon name="fa6-solid:cloud-arrow-up" size="14" />
          Pubblica {{ draftCount }} {{ activeFilter === 'Tutti' ? 'Bozze' : activeFilter }}
        </button>

        <NuxtLink :to="`/${asdSlug}/manager/events/new`"
          class="flex-1 md:flex-none bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2">
          <Icon name="fa6-solid:plus" size="14" /> Nuovo Evento
        </NuxtLink>
      </div>
    </div>

    <EventFilters v-model="activeFilter" :filters="filters" />

    <div v-if="filteredEvents.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-for="event in filteredEvents" :key="event._id" class="relative group">


        <EventCard :event="event" :slug="`/${asdSlug}/manager/events/${event._id}`" />

        <div class="absolute bottom-4 right-4 flex gap-2">
          <a :href="`/${asdSlug}/events/${event._id}`" target="_blank"
            class="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-chess-dark hover:text-chess-gold transition-colors border border-gray-100"
            title="Vedi Anteprima Pubblica">
            <Icon name="fa6-solid:eye" size="14" />
          </a>

          <button @click="deleteEvent(event._id)"
            class="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors border border-gray-100"
            title="Elimina">
            <Icon name="fa6-solid:trash-can" size="14" />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="bg-white border-2 border-dashed border-gray-200 rounded-3xl py-20 text-center">
      <Icon name="fa6-solid:calendar-xmark" class="text-gray-200 mb-4" size="48" />
      <p class="text-gray-400 font-bold uppercase tracking-widest text-sm">Nessun evento trovato</p>
      <button @click="activeFilter = 'Tutti'" class="text-chess-gold text-xs font-bold mt-2 underline">Resetta
        filtri</button>
    </div>
  </div>
</template>