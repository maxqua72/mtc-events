<script setup>
const route = useRoute()
const { searchQuery } = useSearch()

const asdSlug = route.params.asd_slug

definePageMeta({ layout: 'default' })

const activeFilter = ref('all')
const filters = [
  { label: 'Tutti', value: 'all' },
  { label: 'Tornei', value: 'torneo' },
  { label: 'Gioco Libero', value: 'gioco libero' },
  { label: 'Corsi', value: 'corso' },
  { label: 'Altro', value: 'altro' }
]
/*
const filteredEvents = computed(() => {
  if (!events.value) return []
  return activeFilter.value === 'all' 
    ? events.value 
    : events.value.filter(e => e.category?.toLowerCase() === activeFilter.value)
})
*/
// Fetch degli eventi (inclusi quelli non pubblicati per il MANAGER)
const { data: events, refresh } = await useFetch(`/api/manager/${asdSlug}/events/`)

const filteredEvents = computed(() => {
  if (!events.value) return []
  
  return events.value.filter(e => {
    // Filtro per categoria
    const matchesCategory = activeFilter.value === 'all' || e.category?.toLowerCase() === activeFilter.value
    
    // Filtro per testo (searchQuery)
    // Se la query è vuota o corta, non filtra nulla per testo
    const searchTerm = searchQuery.value.toLowerCase()
    const matchesSearch = searchTerm.length < 2 || 
                         e.title?.toLowerCase().includes(searchTerm) || 
                         e.category?.toLowerCase().includes(searchTerm)

    return matchesCategory && matchesSearch
  })
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

  const confirmMsg = activeFilter.value === 'all'
    ? `Vuoi pubblicare tutti i ${targets.length} eventi in bozza?`
    : `Vuoi pubblicare i ${targets.length} eventi in bozza della categoria ${activeFilter.value}?`

  if (confirm(confirmMsg)) {
    try {
      // Chiamata API batch (o loop se il backend non supporta batch)
      await $fetch(`/api/manager/${asdSlug}/events/publish-batch`, {
        method: 'POST',
        body: {
          eventIds: targets.map(e => e._id),
          category: activeFilter.value !== 'all' ? activeFilter.value : null
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
          Pubblica {{ draftCount }} {{ activeFilter.value === 'all' ? 'Bozze' : activeFilter.label }}
        </button>

        <NuxtLink :to="`/${asdSlug}/manager/events/new`"
          class="flex-1 md:flex-none bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2">
          <Icon name="fa6-solid:plus" size="14" /> Nuovo Evento
        </NuxtLink>
      </div>
    </div>

    <ManagerTabs active="events" :asdSlug="asdSlug" />

    <div v-if="searchQuery.length >= 2" class="text-xs font-bold text-chess-gold uppercase tracking-widest px-1">
      Filtrando per: "{{ searchQuery }}"
    </div>

    <EventFilters v-model="activeFilter" :filters="filters" />

    <div v-if="filteredEvents.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-for="event in filteredEvents" :key="event._id" class="relative group">


        <EventCard :event="event" :slug="`/${asdSlug}/manager/events/${event._id}`" />

        <div class="absolute bottom-4 right-4 flex gap-2 z-30">
          <a :href="`/${asdSlug}/events/${event._id}?preview=true`" target="_blank"
            rel="noopener noreferrer"
            @click.stop
            class="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-chess-dark hover:text-chess-gold transition-colors border border-gray-100"
            title="Vedi Anteprima Pubblica">
            <Icon name="fa6-solid:eye" size="14" />
          </a>

          <button @click.stop.prevent="deleteEvent(event._id)"
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
      <button @click="activeFilter.value = 'all'" class="text-chess-gold text-xs font-bold mt-2 underline">Resetta
        filtri</button>
    </div>

    <button v-if="searchQuery.length >= 2" @click="searchQuery = ''" class="mt-2 text-chess-gold text-sm font-bold">
        Pulisci ricerca
      </button>
  </div>
</template>