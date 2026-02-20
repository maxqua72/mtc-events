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

const showPicker = ref(false)
const fileInput = ref(null)

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

const previewImage = computed(() => {
    // 1. Se c'è un URL specifico definito dal manager
    if (form.value.image_url) return form.value.image_url

    // 2. Fallback sulle immagini statiche in public/img basate sulla categoria
    const category = form.value.category?.toLowerCase()
    if (category === 'torneo') return '/img/torneo.png'
    if (category === 'corso') return '/img/corsi.png'

    return '/img/default-event.png'
})

const openResourcePicker = () => {
    // Qui chiameremo il modal dell'archivio ASD che abbiamo implementato
    alert("Apertura Archivio Risorse ASD...")
}

// Gestione Upload dal File System (Possibilità 3)
const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', `EVENT_IMG_${Date.now()}`)
    // Aggiungiamo un flag per dire che NON deve apparire nella libreria generale
    formData.append('is_event_private', 'true') 

    try {
        const res = await $fetch(`/api/manager/${props.asdSlug}/resources`, {
            method: 'POST',
            body: formData
        })
        form.value.image_url = res.url
        form.value.resource_id = res._id
    } catch (err) {
        alert("Errore durante l'upload temporaneo")
    }
}

// Selezione dalla Libreria (Possibilità 2)
const handleLibrarySelect = (res) => {
    form.value.image_url = res.url
    form.value.resource_id = res._id
    showPicker.value = false
}

// Reset all'immagine di Default (Possibilità 1)
const resetToDefault = () => {
    form.value.image_url = ''
    form.value.resource_id = null
}
</script>

<template>
    <div class="space-y-6 pb-20">
        <div
            class="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-[64px] z-40">
            <div>
                <h2 class="text-xl font-black text-chess-dark uppercase tracking-tight">
                    {{ isNew ? 'Nuovo Evento' : 'Modifica Evento' }}
                </h2>
                <p class="text-xs text-gray-500 mt-1">Stai lavorando come MANAGER su: {{ form.title || 'Nuovo Titolo' }}
                </p>
            </div>

            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <span class="text-[9px] font-black uppercase tracking-widest"
                        :class="form.is_published ? 'text-green-600' : 'text-amber-500'">
                        {{ form.is_published ? 'Pubblicato' : 'In Bozza' }}
                    </span>
                    <button @click="form.is_published = !form.is_published"
                        class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors"
                        :class="form.is_published ? 'bg-green-600' : 'bg-gray-300'">
                        <span class="h-3 w-3 transform rounded-full bg-white transition-transform"
                            :class="form.is_published ? 'translate-x-6' : 'translate-x-1'" />
                    </button>
                </div>

                <button @click="$emit('cancel')"
                    class="text-[11px] font-bold text-gray-400 uppercase hover:text-gray-600 transition-colors">Annulla</button>
                <button @click="submitForm"
                    class="bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg">
                    Salva Modifiche
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-4">Dati Generali
                    </h3>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Titolo
                            dell'evento</label>
                        <input v-model="form.title" type="text" placeholder="Inserisci il titolo..."
                            class="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-bold text-chess-dark focus:ring-2 focus:ring-chess-gold/20 outline-none" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descrizione
                            estesa</label>
                        <textarea v-model="form.description" rows="6"
                            class="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none"
                            placeholder="Spiega ai soci di cosa si tratta..."></textarea>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-4">Sede e Indirizzo
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome
                                Location</label>
                            <input v-model="form.location" type="text" placeholder="Es. Tennis Club Nord 2"
                                class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Indirizzo</label>
                            <input v-model="form.address" type="text"
                                class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                        </div>
                        <div class="grid grid-cols-3 gap-2">
                            <div class="col-span-2">
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Città</label>
                                <input v-model="form.city" type="text"
                                    class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Prov.</label>
                                <input v-model="form.province" type="text" maxlength="2"
                                    class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm uppercase" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-4">Contatti
                        Referente</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome</label>
                            <input v-model="form.contact_name" type="text"
                                class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Telefono</label>
                            <input v-model="form.contact_phone" type="text"
                                class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email</label>
                            <input v-model="form.contact_email" type="email"
                                class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-4">Pianificazione
                    </h3>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Categoria</label>
                        <select v-model="form.category"
                            class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-chess-dark">
                            <option v-for="cat in categories" :key="cat" :value="cat.toLowerCase()">{{ cat }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Inizio Evento</label>
                        <input v-model="form.start_date" type="date"
                            class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                        <input v-model="form.start_time" type="time"
                            class="w-full mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fine (Opzionale)</label>
                        <input v-model="form.end_date" type="date"
                            class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                        <input v-model="form.end_time" type="time"
                            class="w-full mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div class="pt-2 border-t border-gray-100">
                        <label class="block text-[10px] font-bold text-amber-600 uppercase mb-1">Termine
                            Iscrizioni</label>
                        <input v-model="form.registration_time" type="date"
                            class="w-full p-2.5 bg-amber-50/30 border border-amber-200 rounded-lg text-sm" />
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-4">Link e Materiali
                    </h3>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Link Iscrizione</label>
                        <input v-model="form.link_registration" type="url" placeholder="https://..."
                            class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px]" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">URL Locandina</label>
                        <input v-model="form.link_flyer" type="url" placeholder="https://..."
                            class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px]" />
                    </div>
                </div>


                <section class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em]">Immagine
                            Copertina</h3>
                        <span v-if="!form.image_url"
                            class="text-[9px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded">Default</span>
                        <span v-else
                            class="text-[9px] font-bold text-chess-gold uppercase bg-chess-dark px-2 py-0.5 rounded">Personalizzata</span>
                    </div>

                    <div
                        class="h-48 w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-100 relative shadow-inner">
                        <img :src="previewImage" class="w-full h-full object-cover"
                            :class="{ 'opacity-50 grayscale-[0.5]': !form.image_url }" />
                        <div v-if="!form.image_url"
                            class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <Icon name="fa6-solid:image" size="24" class="text-gray-300 mb-2" />
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Anteprima Default
                                {{ form.category }}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <button type="button" @click="fileInput.click()"
                            class="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase text-chess-dark hover:bg-gray-50 transition-colors">
                            <Icon name="fa6-solid:upload" size="12" /> Carica File
                        </button>

                        <button type="button" @click="showPicker = true"
                            class="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase text-chess-dark hover:bg-gray-50 transition-colors">
                            <Icon name="fa6-solid:images" size="12" /> Dalla Libreria
                        </button>

                        <button v-if="form.image_url" type="button" @click="resetToDefault"
                            class="col-span-2 flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                            <Icon name="fa6-solid:trash-can" size="10" /> Rimuovi personalizzazione
                        </button>
                    </div>

                    <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />

                    <Teleport to="body">
                        <ResourcePicker v-if="showPicker" :asd-slug="asdSlug" @close="showPicker = false"
                            @select="handleLibrarySelect" />
                    </Teleport>
                </section>


            </div>

        </div>
    </div>
</template>