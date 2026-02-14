<script setup>
const route = useRoute()
const asdSlug = route.params.asd_slug

const { data: asd } = await useFetch(`/api/manager/${asdSlug}/info`)
const { data: events, refresh } = await useFetch(`/api/manager/${asdSlug}/events`)

const showModal = ref(false)
const isEditing = ref(false)

const eventForm = ref({
  title: '', description: '', start_date: '', end_date: '',
  start_time: '', end_time: '', location: '', city: '',
  contact_name: '', contact_email: '', link_registration: ''
})

const openAddModal = () => {
  isEditing.value = false
  eventForm.value = { title: '', description: '', country: 'Italy' }
  showModal.value = true
}

// 1. Funzione per aprire il modal in modalità MODIFICA
const openEditModal = (event) => {
  isEditing.value = true
  // Copiamo i dati dell'evento nel form
  eventForm.value = { 
    ...event,
    _id: event._id.toString(),
    // Formattiamo le date per gli input HTML date/time
    start_date: new Date(event.start_date).toISOString().split('T')[0],
    end_date: event.end_date ? new Date(event.end_date).toISOString().split('T')[0] : ''
  }
  showModal.value = true
}

// 2. Funzione per ELIMINARE
const deleteEvent = async (id) => {
  if (!confirm('Sei sicuro di voler eliminare questo evento?')) return

  try {
    await $fetch(`/api/manager/${asdSlug}/events`, {
      method: 'DELETE',
      body: { id }
    })
    await refresh() // Ricarica la lista
  } catch (e) {
    alert('Errore durante l\'eliminazione')
  }
}

const saveEvent = async () => {
  try {
    await $fetch(`/api/manager/${asdSlug}/events`, {
      method: 'POST',
      body: eventForm.value
    })
    alert('Evento salvato!')
    showModal.value = false
    refresh()
  } catch (e) {
    alert('Errore nel salvataggio')
  }
}

const formatDate = (d) => new Date(d).toLocaleDateString('it-IT')
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <nav class="bg-white border-b p-6 flex justify-between items-center shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-8 h-8 rounded-lg" :style="{ backgroundColor: asd?.theme_color }"></div>
        <h1 class="font-black italic text-xl uppercase tracking-tighter">{{ asd?.name }} <span class="text-slate-300 mx-2">/</span> Eventi</h1>
      </div>
      <button @click="openAddModal" class="bg-slate-900 text-white px-6 py-2 rounded-full font-bold text-xs">+ NUOVO EVENTO</button>
    </nav>

    <main class="p-8 max-w-6xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="ev in events" :key="ev._id" class="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-4">
              <span class="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                {{ formatDate(ev.start_date) }}
              </span>
              <span class="text-slate-400 text-xs font-bold">{{ ev.start_time }} - {{ ev.end_time }}</span>
            </div>
            <h3 class="text-xl font-black italic text-slate-900 mb-2">{{ ev.title }}</h3>
            <p class="text-slate-500 text-sm line-clamp-2 mb-4">{{ ev.description }}</p>
            <div class="flex items-center gap-2 text-slate-400 text-xs mb-6">
              <span class="font-bold text-slate-600">{{ ev.location }}</span> • {{ ev.city }}
            </div>
          </div>
          <div class="flex gap-3 border-t pt-4">
            <button @click="openEditModal(ev)"
                class="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-slate-900">Modifica</button>
            <button @click="deleteEvent(ev._id)"
                class="flex-1 py-2 text-xs font-bold text-red-400 hover:text-red-600">Elimina</button>
          </div>
        </div>
      </div>

      <div v-if="!events?.length" class="text-center py-20 text-slate-400 italic">
        Nessun evento in programma. Clicca su "+ Nuovo Evento" per iniziare.
      </div>
    </main>

    <div v-if="showModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white p-10 rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 class="text-3xl font-black italic mb-6">Crea Evento</h2>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Titolo Evento</label>
            <input v-model="eventForm.title" class="w-full p-4 bg-slate-50 rounded-2xl border-none ring-2 ring-transparent focus:ring-slate-200">
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Data Inizio</label>
            <input v-model="eventForm.start_date" type="date" class="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm">
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Ora Inizio</label>
            <input v-model="eventForm.start_time" type="time" class="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm">
          </div>
          <div class="col-span-2 space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Luogo / Sede</label>
            <input v-model="eventForm.location" placeholder="es. Palestra Comunale" class="w-full p-4 bg-slate-50 rounded-2xl border-none">
          </div>
        </div>

        <div class="flex gap-4 mt-10">
          <button @click="showModal = false" class="flex-1 py-4 font-bold text-slate-400">Annulla</button>
          <button @click="saveEvent" class="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl">SALVA EVENTO</button>
        </div>
      </div>
    </div>
  </div>
</template>