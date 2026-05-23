<script setup>
const props = defineProps({
    event: { type: Object, default: null },
    asdSlug: { type: String, required: true },
    isGenerator: { type: Boolean, default: false }
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
    // Programma dettagliato
    program: [],
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
    link_flyer: '',
    circuit: 'none',
    registration_sections: []
})

// Stato per salvare la fotografia iniziale del form
const initialFormSnapshot = ref('')

// Stato locale per l'inserimento rapido di una sottosezione
const newSection = ref({
    name: '',
    link: ''
})

// Stato locale per l'inserimento di un nuovo slot nel programma
const newSchedule = ref({
    date: '',
    start_time: '',
    end_time: '',
    description: ''
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
            registration_time: newVal.registration_time?.$date ? newVal.registration_time.$date.split('T')[0] : (newVal.registration_time?.split?.('T')[0] || ''),
            // Assicuriamoci che program sia sempre un array se presente sul DB o inizializzato vuoto
            // Normalizziamo le date all'interno del programma per l'input di tipo HTML <input type="date">
            program: Array.isArray(newVal.program)
                ? newVal.program.map(item => ({
                    ...item,
                    date: item.date?.$date ? item.date.$date.split('T')[0] : (item.date?.split?.('T')[0] || '')
                }))
                : [],
            // Carica le sezioni se esistono nel DB, altrimenti array vuoto
            registration_sections: Array.isArray(newVal.registration_sections) ? [...newVal.registration_sections] : []
        }
    }
}, { immediate: true, deep: true })

// Un piccolo watch separato che scatta UNA SOLA VOLTA 
// quando il form viene popolato dal tuo watch principale
const unwatchSnapshot = watch(
    () => form.value,
    (newFormVal) => {
        // Se il form è stato popolato (es. ha preso il titolo o altri dati dal backend, oppure è rimasto vuoto per un nuovo evento)
        if (newFormVal.title || props.event?._id || initialFormSnapshot.value === '') {
            initialFormSnapshot.value = JSON.stringify(newFormVal)
            // Smettiamo di osservare per non sovrascrivere lo stato iniziale mentre l'utente digita
            unwatchSnapshot() 
        }
    },
    { deep: true }
)

const categories = ['Torneo', 'Gioco Libero', 'Corso', 'Altro']

const circuits = [
    { id: 'none', label: 'Nessuno' },
    { id: 'fide', label: 'FIDE (Federazione)' },
    { id: 'fsi', label: 'FSI (Federazione)' },
    { id: 'uisp', label: 'UISP' },
    { id: 'internal', label: 'Interno dell\'Associazione' }
]

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

const uiTexts = computed(() => {
    if (props.isGenerator) {
        return {
            title: isNew.value ? 'Nuovo Evento Ricorrente' : 'Modifica Evento Ricorrente',
            subtitle: (isNew.value ? 'Stai definendo il modello per la generazione automatica degli eventi.' : 'Le modifiche influenzeranno solo i futuri eventi generati.') + ' In bozza la generazione automatica è disabilitata.',
            saveLabel: isNew.value ? 'Salva Modello' : ' Salva modifiche'
        }
    }
    return {
        title: isNew.value ? 'Nuovo Evento' : 'Modifica Evento',
        subtitle: `Stai lavorando come MANAGER su: ${form.value.title || 'Nuovo Titolo'}`,
        saveLabel: isNew.value ? 'Salva Evento' : ' Salva modifiche'
    }
})

// Funzioni per la gestione del Programma
const addScheduleItem = () => {
    if (!newSchedule.value.date || !newSchedule.value.start_time || !newSchedule.value.description.trim()) {
        alert('Data, Ora di Inizio e Descrizione sono obbligatorie per aggiungere un appuntamento.')
        return
    }

    // Aggiunge l'elemento all'array del form
    form.value.program.push({
        date: newSchedule.value.date,
        start_time: newSchedule.value.start_time,
        end_time: newSchedule.value.end_time || null,
        description: newSchedule.value.description.trim()
    })

    // Ordina automaticamente il programma per data e ora di inizio
    sortProgram()

    // Reset del form di inserimento rapido
    newSchedule.value = {
        date: form.value.start_date || '', // Pre-popola con la data di inizio evento per comodità
        start_time: '',
        end_time: '',
        description: ''
    }
}

const removeScheduleItem = (index) => {
    form.value.program.splice(index, 1)
}

const sortProgram = () => {
    form.value.program.sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.start_time}:00.000Z`)
        const dateTimeB = new Date(`${b.date}T${b.start_time}:00.000Z`)
        return dateTimeA - dateTimeB
    })
}

// Funzione helper per formattare le date nel riepilogo del programma (es. Sab 3/5)
const formatDateLabel = (dateStr) => {
    if (!dateStr) return ''

    // Per sicurezza, se è una stringa YYYY-MM-DD pura, forziamo il mezzogiorno UTC prima di passarlo al costruttore Date
    const normalizedDate = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00.000Z`
    const d = new Date(normalizedDate)

    const giornoSettimana = d.getUTCDay()
    const giornoMese = d.getUTCDate()
    const mese = d.getUTCMonth() + 1

    const giorni = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    return `${giorni[giornoSettimana]} ${giornoMese}/${mese}`
}


// AGGIUNTA: Funzioni per gestire le sezioni/tornei paralleli
const addRegistrationSection = () => {
    if (!newSection.value.name.trim() || !newSection.value.link.trim()) {
        alert('Nome della sezione e Link di iscrizione sono obbligatori.')
        return
    }

    form.value.registration_sections.push({
        name: newSection.value.name.trim(),
        link: newSection.value.link.trim()
    })

    // Reset input
    newSection.value = { name: '', link: '' }
}

const removeRegistrationSection = (index) => {
    form.value.registration_sections.splice(index, 1)
}

// Computed che calcola se il form è cambiato rispetto alla fotografia iniziale
const isDirty = computed(() => {
    if (!initialFormSnapshot.value) return false
    return initialFormSnapshot.value !== JSON.stringify(form.value)
})

// Esponiamo isDirty al componente padre (la pagina Nuxt)
defineExpose({
    isDirty
})

</script>

<template>
    <div class="space-y-6 pb-20">

        <div class="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm sticky top-[64px] z-40">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

                <div class="w-full sm:w-auto">
                    <h2 class="text-lg md:text-xl font-black text-chess-dark uppercase tracking-tight">
                        {{ uiTexts.title }}
                    </h2>
                    <p class="text-[10px] text-xs text-gray-500 mt-1">
                        {{ uiTexts.subtitle }}
                    </p>
                </div>

                <div
                    class="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-gray-100">

                    <div
                        class="flex items-center justify-between sm:justify-start gap-2 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200 w-full sm:w-auto">
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

                    <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <button @click="$emit('cancel')"
                            class="text-[11px] font-bold text-gray-400 uppercase hover:text-gray-600 transition-colors px-2">
                            Annulla
                        </button>

                        <button @click="submitForm"
                            class="bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg sm:w-auto">
                            {{ uiTexts.saveLabel }}
                        </button>
                    </div>
                </div>


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

                <div v-if="$slots['additional-fields']" class="lg:col-span-2">
                    <slot name="additional-fields" />
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
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Circuito /
                            Affiliazione</label>
                        <div class="relative">
                            <select v-model="form.circuit"
                                class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-chess-dark appearance-none focus:ring-2 focus:ring-chess-gold/20 outline-none">
                                <option v-for="c in circuits" :key="c.id" :value="c.id">
                                    {{ c.label }}
                                </option>
                            </select>
                            <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                <Icon name="fa6-solid:chevron-down" size="10" />
                            </div>
                        </div>
                        <p class="mt-1.5 text-[9px] text-gray-400 italic">
                            Il logo del circuito apparirà sulla card dell'evento accanto al titolo.
                        </p>
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

                <!-- PROGRAMMA -->
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em]">Programma Evento</h3>

                    <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5 text-left">
                        <p class="text-[9px] font-black uppercase text-gray-400 tracking-wider">Aggiungi Appuntamento
                        </p>

                        <div>
                            <label class="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Data</label>
                            <input v-model="newSchedule.date" type="date"
                                class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" />
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Inizio</label>
                                <input v-model="newSchedule.start_time" type="time"
                                    class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" />
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Fine <span
                                        class="text-gray-400 font-normal">(Opz.)</span></label>
                                <input v-model="newSchedule.end_time" type="time"
                                    class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Descrizione
                                Attività</label>
                            <input v-model="newSchedule.description" type="text"
                                placeholder="Es. Primo Turno, Premiazione..."
                                class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                                @keyup.enter="addScheduleItem" />
                        </div>

                        <button type="button" @click="addScheduleItem"
                            class="w-full mt-1 py-2 bg-chess-dark text-chess-gold rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-chess-dark/90 transition-colors flex items-center justify-center gap-1">
                            <Icon name="fa6-solid:plus" size="10" /> Inserisci nel Programma
                        </button>
                    </div>

                    <div v-if="form.program.length > 0" class="space-y-2 max-h-60 overflow-y-auto pr-1">
                        <div v-for="(item, index) in form.program" :key="index"
                            class="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm group hover:border-chess-gold/30 transition-all">
                            <div class="flex-1 min-w-0 pr-2">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <span
                                        class="text-[9px] font-black bg-chess-chocolate/5 text-chess-chocolate px-1.5 py-0.5 rounded uppercase">
                                        {{ formatDateLabel(item.date) }}
                                    </span>
                                    <span class="text-[10px] font-bold text-chess-dark">
                                        {{ item.start_time }}<template v-if="item.end_time"> - {{ item.end_time
                                            }}</template>
                                    </span>
                                </div>
                                <p class="text-xs text-gray-600 mt-0.5 font-medium truncate">
                                    {{ item.description }}
                                </p>
                            </div>
                            <button type="button" @click="removeScheduleItem(index)"
                                class="text-gray-300 hover:text-red-500 p-1 transition-colors">
                                <Icon name="fa6-solid:trash-can" size="12" />
                            </button>
                        </div>
                    </div>

                    <p v-else class="text-[10px] text-gray-400 italic text-center py-2">
                        Nessun appuntamento inserito nel programma.
                    </p>
                </div>

                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-4">Link e Materiali
                    </h3>

                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">URL Locandina / Bando
                            (PDF)</label>
                        <input v-model="form.link_flyer" type="url" placeholder="https://..."
                            class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-chess-dark outline-none focus:ring-2 focus:ring-chess-gold/20" />
                    </div>

                    <div class="pt-2 border-t border-gray-100 space-y-3">
                        <div class="flex justify-between items-center">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase">Iscrizioni</label>
                            <span class="text-[9px] font-bold px-2 py-0.5 rounded uppercase"
                                :class="form.registration_sections.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'">
                                {{ form.registration_sections.length > 0 ? 'Multi-Categoria' : 'Link Singolo' }}
                            </span>
                        </div>

                        <div v-if="form.registration_sections.length === 0">
                            <input v-model="form.link_registration" type="url"
                                placeholder="Link unico di iscrizione (es. Vesus, Federscacchi...)"
                                class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-chess-dark outline-none focus:ring-2 focus:ring-chess-gold/20" />
                            <p class="mt-1 text-[9px] text-gray-400 italic">Compila qui se il torneo o l'evento ha una
                                sola pagina di
                                iscrizione.</p>
                        </div>

                        <div v-else
                            class="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium flex items-center gap-2">
                            <Icon name="fa6-solid:circle-info" class="text-amber-500 shrink-0" size="14" />
                            <span>Avendo aggiunto delle categorie specifiche qui sotto, il link unico principale verrà
                                ignorato.</span>
                        </div>

                        <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-left mt-2">
                            <p class="text-[9px] font-black uppercase text-gray-400 tracking-wider">Configura Categorie
                                multiple
                                (Opzionale)</p>
                            <div class="grid grid-cols-1 gap-2">
                                <input v-model="newSection.name" type="text"
                                    placeholder="Nome (Es. Open A, Torneo B-Under 16...)"
                                    class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold" />
                                <input v-model="newSection.link" type="url"
                                    placeholder="Link iscrizione specifico per questa sezione..."
                                    class="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                                    @keyup.enter="addRegistrationSection" />
                            </div>
                            <button type="button" @click="addRegistrationSection"
                                class="w-full py-1.5 bg-chess-chocolate/10 text-chess-chocolate hover:bg-chess-chocolate/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1">
                                <Icon name="fa6-solid:plus" size="9" /> Aggiungi questa Categoria
                            </button>
                        </div>

                        <div v-if="form.registration_sections.length > 0" class="space-y-1.5 pt-1">
                            <div v-for="(sec, idx) in form.registration_sections" :key="idx"
                                class="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <div class="min-w-0 pr-2">
                                    <p class="text-xs font-black text-chess-dark truncate">{{ sec.name }}</p>
                                    <p class="text-[9px] text-gray-400 truncate italic font-mono">{{ sec.link }}</p>
                                </div>
                                <button type="button" @click="removeRegistrationSection(idx)"
                                    class="text-gray-300 hover:text-red-500 p-1 transition-colors">
                                    <Icon name="fa6-solid:xmark" size="12" />
                                </button>
                            </div>
                        </div>
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