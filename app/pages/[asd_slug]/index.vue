<script setup>
const route = useRoute()
const slug = route.params.asd_slug

// Recuperiamo sia i dati dell'ASD che la lista eventi in parallelo
const [{ data: asd }, { data: events }] = await Promise.all([
  useFetch(`/api/asd/${slug}`),
  useFetch(`/api/asd/${slug}/events`)
])

const primaryColor = computed(() => asd.value?.theme_color || '#3b82f6')

// Funzione helper per formattare le date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<template>
  <div v-if="asd" class="min-h-screen bg-slate-50 pb-24">
    <header :style="{ backgroundColor: primaryColor }" class="text-white p-8 shadow-lg">
      <div class="max-w-md mx-auto">
        <h1 class="text-2xl font-black uppercase tracking-tight">{{ asd.name }}</h1>
        <p class="opacity-90 flex items-center gap-2 mt-1">
          📍 {{ asd.city }} ({{ asd.province }})
        </p>
      </div>
    </header>

    <main class="max-w-md mx-auto p-4">
      <h2 class="text-lg font-bold text-slate-800 mb-4 mt-4">Upcoming Events</h2>
      
      <div v-if="events && events.length > 0" class="space-y-4">
        <div 
          v-for="event in events" 
          :key="event._id" 
          class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 uppercase">
              {{ formatDate(event.start_date) }}
            </span>
            <span v-if="event.start_time" class="text-xs font-medium text-slate-400">
              Starts: {{ event.start_time }}
            </span>
          </div>

          <h3 class="text-xl font-bold text-slate-900 mb-1">{{ event.title }}</h3>
          <p class="text-slate-500 text-sm line-clamp-2 mb-4">{{ event.description }}</p>
          
          <div class="flex items-center justify-between mt-2">
            <div class="text-xs text-slate-400 italic">
              📍 {{ event.location }}
            </div>
            <NuxtLink 
              :to="`/${slug}/events/${event._id}`"
              class="text-sm font-bold p-2 px-4 rounded-xl text-white"
              :style="{ backgroundColor: primaryColor }"
            >
              Details
            </NuxtLink>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
        <p class="text-slate-400">No events found for this association.</p>
      </div>
    </main>
  </div>
</template>