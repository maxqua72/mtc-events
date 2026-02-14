<script setup>
const route = useRoute()

definePageMeta({ layout: 'default' })

const activeFilter = ref('Tutti')
const filters = ['Tutti', 'Tornei', 'Gioco Libero', 'Corsi', 'Altro']

const { data: events } = await useFetch(`/api/asd/${route.params.asd_slug}/events`)

const filteredEvents = computed(() => {
  if (!events.value) return []
  return activeFilter.value === 'Tutti' 
    ? events.value 
    : events.value.filter(e => e.category === activeFilter.value)
})
</script>

<template>
  <div class="space-y-4">
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
  </div>
</template>