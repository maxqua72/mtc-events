<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
    <section v-if="results.events?.length > 0">
      <div class="flex items-center gap-3 mb-4">
        <Icon name="fa6-solid:calendar-check" class="text-chess-gold" size="20" />
        <h3 class="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Eventi Trovati</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NuxtLink 
          v-for="event in results.events" 
          :key="event._id"
          :to="`/${slug}/events/${event._id}`"
          @click="navigateToResult(`/${slug}/events/${event._id}`)"
          class="bg-white border border-gray-200 p-4 rounded-xl hover:border-chess-gold transition-all group flex items-center gap-4 shadow-sm"
        >
          <div class="flex-1">
            <p class="text-[10px] font-black text-chess-chocolate uppercase tracking-widest mb-1">
              {{ formatDate(event.start_date) }}
            </p>
            <h4 class="font-bold text-chess-dark group-hover:text-chess-brown transition-colors">
              {{ event.title }}
            </h4>
            <div class="flex items-center gap-1 mt-1 text-gray-400">
              <Icon name="fa6-solid:location-dot" size="10" />
              <span class="text-[11px]">{{ event.location }}</span>
            </div>
          </div>
          <Icon name="fa6-solid:chevron-right" class="text-gray-200 group-hover:text-chess-gold transition-colors" size="14" />
        </NuxtLink>
      </div>
    </section>

    <section v-if="results.members?.length > 0">
      <div class="flex items-center gap-3 mb-4">
        <Icon name="fa6-solid:users" class="text-chess-gold" size="20" />
        <h3 class="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Anagrafica Soci</h3>
      </div>
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div v-for="m in results.members" :key="m._id" class="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <p class="font-bold text-chess-dark uppercase text-sm">{{ m.surname }} {{ m.name }}</p>
              <p class="text-xs font-mono text-chess-chocolate opacity-70">{{ m.email }}</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-right">
                <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Scadenza</p>
                <p class="text-xs font-bold" :class="isExpired(m.expiry_date) ? 'text-red-500' : 'text-chess-dark'">
                  {{ new Date(m.expiry_date).toLocaleDateString() }}
                </p>
              </div>
              <span class="px-2 py-1 rounded text-[9px] font-black uppercase bg-gray-100 text-gray-600">
                {{ m.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="!results.events?.length && !results.members?.length" class="text-center py-20">
      <Icon name="fa6-solid:magnifying-glass" class="text-gray-200 mb-4" size="48" />
      <p class="text-gray-400 italic">Nessun risultato trovato per questa ricerca.</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['results', 'slug'])
const { searchQuery } = useSearch()

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase()
}

const isExpired = (date) => new Date(date) < new Date()

const navigateToResult = async (path) => {
  // 1. Navighiamo prima (programmaticamente)
  await navigateTo(path)
  
  setTimeout(() => {
    searchQuery.value = ''
  }, 100) // Diamo 100ms di vantaggio alla navigazione
}
</script>