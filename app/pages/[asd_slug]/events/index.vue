<script setup>
const route = useRoute()
const { searchQuery } = useSearch()

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

const { data: events } = await useFetch(`/api/asd/${route.params.asd_slug}/events`)

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

</script>

<template>
  <div class="space-y-4">

    <div v-if="searchQuery.length >= 2" class="text-xs font-bold text-chess-gold uppercase tracking-widest px-1">
      Filtrando per: "{{ searchQuery }}"
    </div>

    <EventFilters 
      v-model="activeFilter" 
      :filters="filters" 
    />

    <div v-if="filteredEvents.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <EventCard 
        v-for="event in filteredEvents" 
        :key="event._id" 
        :event="event"
        :slug="`/${route.params.asd_slug}/events/${event._id}`"
      />
    </div>

    <div v-else class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon name="fa6-solid:chess-pawn" class="text-gray-300" size="30" />
      </div>
      <p class="text-gray-400 font-medium italic">Nessun evento in programma.</p>

      
    </div>
    <button v-if="searchQuery.length >= 2" @click="searchQuery = ''" class="mt-2 text-chess-gold text-sm font-bold">
        Pulisci ricerca
      </button>
  </div>
</template>