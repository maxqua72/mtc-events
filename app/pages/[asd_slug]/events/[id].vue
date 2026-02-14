<script setup>
const route = useRoute()
const { asd_slug, id } = route.params

// Recuperiamo l'evento specifico dal server
const { data: event, error } = await useFetch(`/api/events/${id}`)
// Recuperiamo i dati dell'ASD per mantenere il brand (colori, logo)
const { data: asd } = await useFetch(`/api/asd/${asd_slug}`)

const primaryColor = computed(() => asd.value?.theme_color || '#3b82f6')

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div v-if="event" class="min-h-screen bg-slate-50 pb-20">
    <div 
      class="h-48 flex items-end p-6 text-white shadow-inner relative"
      :style="{ backgroundColor: primaryColor }"
    >
      <div class="max-w-md mx-auto w-full z-10">
        <NuxtLink :to="`/${asd_slug}`" class="mb-4 inline-block text-white/80 hover:text-white">
          ← Back to {{ asd?.name }}
        </NuxtLink>
        <h1 class="text-3xl font-black leading-tight">{{ event.title }}</h1>
      </div>
      <div class="absolute inset-0 bg-black/10"></div>
    </div>

    <main class="max-w-md mx-auto p-4 space-y-6">
      <section class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <span class="text-2xl">📅</span>
            <div>
              <p class="font-bold text-slate-900">{{ formatDate(event.start_date) }}</p>
              <p v-if="event.start_time" class="text-sm text-slate-500">
                Starts at: {{ event.start_time }} <span v-if="event.end_time">- Ends: {{ event.end_time }}</span>
              </p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <span class="text-2xl">📍</span>
            <div>
              <p class="font-bold text-slate-900">{{ event.location }}</p>
              <p class="text-sm text-slate-500">{{ event.address }}, {{ event.city }} ({{ event.province }})</p>
            </div>
          </div>

          <div v-if="event.registration_time" class="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p class="text-xs text-amber-700 font-bold uppercase tracking-wider">Registration Deadline</p>
            <p class="text-amber-900">{{ formatDate(event.registration_time) }}</p>
          </div>
        </div>
      </section>

      <section>
        <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h3>
        <p class="text-slate-700 leading-relaxed bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          {{ event.description }}
        </p>
      </section>

      <section class="grid grid-cols-1 gap-4">
        <div v-if="event.contact_name" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p class="text-xs text-slate-400 font-bold mb-1">CONTACT</p>
          <p class="font-bold text-slate-800">{{ event.contact_name }}</p>
          <p v-if="event.contact_phone" class="text-blue-600 text-sm">{{ event.contact_phone }}</p>
          <p v-if="event.contact_email" class="text-slate-500 text-sm underline">{{ event.contact_email }}</p>
        </div>

        <div class="flex flex-col gap-3 pt-4">
          <a v-if="event.link_registration" :href="event.link_registration" target="_blank"
             class="w-full py-4 rounded-2xl text-center font-bold shadow-lg transition-transform active:scale-95 text-white"
             :style="{ backgroundColor: primaryColor }">
            Register Now
          </a>
          <a v-if="event.link_flyer" :href="event.link_flyer" target="_blank"
             class="w-full py-4 bg-slate-800 text-white rounded-2xl text-center font-bold shadow-lg transition-transform active:scale-95">
            Download Flyer (PDF)
          </a>
        </div>
      </section>
    </main>
  </div>
</template>