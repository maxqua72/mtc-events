<script setup>
const props = defineProps({
  event: { type: Object, default: null },
  asdSlug: { type: String, required: true }
})

const emit = defineEmits(['save', 'cancel'])
const isNew = computed(() => !props.event?._id)

// Inizializzazione reattiva con tutti gli attributi del tuo JSON
const form = ref({
  title: '',
  description: '',
  category: 'altro',
  is_published: false,
  // Date e Orari
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
  registration_time: '',
  // Location
  location: '',
  address: '',
  city: '',
  province: '',
  country: 'Italy',
  // Contatti
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  // Link
  link_registration: '',
  link_flyer: ''
})

// Sync dei dati quando arriva l'evento (o reset se nuovo)
watch(() => props.event, (newVal) => {
  if (newVal) {
    form.value = { 
      ...newVal,
      start_date: newVal.start_date?.$date ? newVal.start_date.$date.split('T')[0] : (newVal.start_date?.split?.('T')[0] || ''),
      end_date: newVal.end_date?.$date ? newVal.end_date.$date.split('T')[0] : (newVal.end_date?.split?.('T')[0] || ''),
      registration_time: newVal.registration_time?.$date ? newVal.registration_time.$date.split('T')[0] : (newVal.registration_time?.split?.('T')[0] || '')
    }
  }
}, { immediate: true })

const categories = ['Torneo', 'Gioco Libero', 'Corso', 'Altro']

const submitForm = () => {
  // Prepariamo l'oggetto per l'invio al backend
  emit('save', { ...form.value })
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <div class="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-40">
      <div>
        <h2 class="text-xl font-black text-chess-dark uppercase tracking-tight">
          {{ isNew ? 'Nuovo Evento' : 'Modifica Evento' }}
        </h2>
        <p class="text-xs text-gray-500 mt-1">Stai lavorando come MANAGER su: {{ form.title || 'Nuovo Titolo' }}</p>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
           <span class="text-[9px] font-black uppercase tracking-widest" :class="form.is_published ? 'text-green-600' : 'text-amber-500'">
            {{ form.is_published ? 'Pubblicato' : 'In Bozza' }}
          </span>
          <button @click="form.is_published = !form.is_published" 
                  class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors"
                  :class="form.is_published ? 'bg-green-600' : 'bg-gray-300'">
            <span class="h-3 w-3 transform rounded-full bg-white transition-transform" :class="form.is_published ? 'translate-x-6' : 'translate-x-1'" />
          </button>
        </div>

        <button @click="$emit('cancel')" class="text-[11px] font-bold text-gray-400 uppercase hover:text-gray-600 transition-colors">Annulla</button>
        <button @click="submitForm" class="bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg">
          Salva Modifiche
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-4">Dati Generali</h3>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Titolo dell'evento</label>
            <input v-model="form.title" type="text" placeholder="Inserisci il titolo..." class="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-bold text-chess-dark focus:ring-2 focus:ring-chess-gold/20 outline-none" />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descrizione estesa</label>
            <textarea v-model="form.description" rows="6" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none" placeholder="Spiega ai soci di cosa si tratta..."></textarea>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-4">Sede e Indirizzo</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome Location</label>
              <input v-model="form.location" type="text" placeholder="Es. Tennis Club Nord 2" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Indirizzo</label>
              <input v-model="form.address" type="text" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2">
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Città</label>
                <input v-model="form.city" type="text" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Prov.</label>
                <input v-model="form.province" type="text" maxlength="2" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm uppercase" />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-4">Contatti Referente</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome</label>
              <input v-model="form.contact_name" type="text" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Telefono</label>
              <input v-model="form.contact_phone" type="text" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email</label>
              <input v-model="form.contact_email" type="email" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-4">Pianificazione</h3>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Categoria</label>
            <select v-model="form.category" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-chess-dark">
              <option v-for="cat in categories" :key="cat" :value="cat.toLowerCase()">{{ cat }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Inizio Evento</label>
            <input v-model="form.start_date" type="date" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            <input v-model="form.start_time" type="time" class="w-full mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fine (Opzionale)</label>
            <input v-model="form.end_date" type="date" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            <input v-model="form.end_time" type="time" class="w-full mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div class="pt-2 border-t border-gray-100">
            <label class="block text-[10px] font-bold text-amber-600 uppercase mb-1">Termine Iscrizioni</label>
            <input v-model="form.registration_time" type="date" class="w-full p-2.5 bg-amber-50/30 border border-amber-200 rounded-lg text-sm" />
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-4">Link e Materiali</h3>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Link Iscrizione</label>
            <input v-model="form.link_registration" type="url" placeholder="https://..." class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px]" />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">URL Locandina</label>
            <input v-model="form.link_flyer" type="url" placeholder="https://..." class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px]" />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>