<script setup>
const route = useRoute()
const { asd_slug, id } = route.params

// Recuperiamo i dati dell'evento dall'API pubblica
const { data: event, pending, error } = await useFetch(`/api/events/${id}`)

// Recuperiamo i dati dell'ASD per mantenere il brand (colori, logo)
const { data: asd } = await useFetch(`/api/asd/${asd_slug}`)

// Logica per l'immagine di copertina (identica all'editor per coerenza)
const eventImage = computed(() => {
    if (event.value?.image_url) return event.value.image_url
    const category = event.value?.category?.toLowerCase()
    if (category === 'torneo') return '/img/torneo.png'
    if (category === 'corso') return '/img/corsi.png'
    return '/img/default-event.png'
})

const circuitLogo = computed(() => {
    if (!event.value?.circuit || event.value.circuit === 'none') return null

    if (event.value.circuit === 'fsi') return '/img/Logo_FSI_opt.svg'
    if (event.value.circuit === 'uisp') return '/img/Logo_UISP_opt.png'
    if (event.value.circuit === 'fide') return '/img/Logo_FIDE.webp'

    // Se interno, usiamo il logo dell'ASD caricato dalla fetch
    if (event.value.circuit === 'internal') {
        return asd.value?.logo_url || asd.value?.logo
    }
    return null
})

// Formattazione data leggibile
const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

// Funzione helper per le icone dei circuiti
const getCircuitLabel = (id) => {
    const circuits = {
        fide: 'FIDE (Federazione Internazionale)',
        fsi: 'FSI (Federazione Scacchistica Italiana)',
        uisp: 'UISP',
        internal: 'Evento Interno'
    }
    return circuits[id] || null
}

definePageMeta({ layout: 'default' })
</script>

<template>
    <div v-if="pending" class="flex justify-center py-20">
        <Icon name="fa6-solid:circle-notch" class="animate-spin text-chess-gold" size="48" />
    </div>

    <div v-else-if="error || !event" class="text-center py-20">
        <Icon name="fa6-solid:circle-exclamation" class="text-red-500 mb-4" size="48" />
        <h1 class="text-2xl font-black text-chess-dark uppercase">Evento non trovato</h1>
        <NuxtLink :to="`/${asd_slug}/events`" class="text-chess-gold font-bold underline mt-4 block">Torna agli eventi
        </NuxtLink>
    </div>

    <div v-else class="max-w-5xl mx-auto space-y-8 pb-20">
        <div
            class="relative h-[200px] md:h-[300px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-chess-dark">
            <img :src="eventImage" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-chess-dark/90 via-chess-dark/20 to-transparent"></div>



            <div class="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                <div class="flex items-center gap-4 mb-4">

                    <div v-if="circuitLogo" class="shrink-0">
                        <div
                            class="h-10 w-10 md:h-12 md:w-12 bg-white rounded-full shadow-xl flex items-center justify-center p-2 overflow-hidden">
                            <img :src="circuitLogo" class="max-w-full max-h-full object-contain" alt="Logo Circuito" />
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <span
                            class="bg-chess-gold text-chess-dark px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center">
                            {{ event.category }}
                        </span>

                        <span v-if="event.circuit !== 'none'"
                            class="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/30 flex items-center">
                            {{ getCircuitLabel(event.circuit) }}
                        </span>
                    </div>
                </div>

                <h1
                    class="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none event-title">
                    {{ event.title }}
                </h1>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-4">
                <section class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <h2
                        class="text-xs font-black text-chess-gold uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        Informazioni
                    </h2>
                    <div class="prose prose-chess max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {{ event.description || 'Nessuna descrizione fornita.' }}
                    </div>
                </section>

                <section class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <h2
                        class="text-xs font-black text-chess-gold uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        Dove si svolge
                    </h2>
                    <div class="flex items-start gap-4">
                        <div
                            class="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-chess-dark shrink-0">
                            <Icon name="fa6-solid:map-location-dot" size="20" />
                        </div>
                        <div>
                            <p class="font-black text-chess-dark text-lg uppercase">{{ event.location }}</p>
                            <p class="text-gray-500 italic">{{ event.address }}, {{ event.city }} ({{ event.province }})
                            </p>
                            <a :href="`https://www.google.com/maps/search/?api=1&query=${event.address}+${event.city}`"
                                target="_blank"
                                class="inline-block mt-3 text-xs font-bold text-chess-gold hover:underline uppercase">
                                Apri in Google Maps
                            </a>
                        </div>
                    </div>
                </section>

                <a v-if="event.link_flyer" :href="event.link_flyer" target="_blank"
                    class="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl group hover:bg-red-500 transition-colors">
                    <div class="flex items-center gap-3 text-red-600 group-hover:text-white">
                        <Icon name="fa6-solid:file-pdf" size="24" />
                        <span class="text-xs font-black uppercase">Scarica Locandina</span>
                    </div>
                    <Icon name="fa6-solid:download" class="text-red-400 group-hover:text-white" />
                </a>
            </div>

            <div class="space-y-4">
                <div class="bg-chess-dark p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">

                    <div class="space-y-6 relative z-10">
                        <div>
                            <label
                                class="block text-[10px] font-black text-chess-gold uppercase tracking-widest mb-2">Data
                                e Ora</label>
                            <p class="text-lg font-bold">{{ formatDate(event.start_date) }}</p>
                            <p class="text-3xl font-black italic text-chess-gold">{{ event.start_time }}</p>
                        </div>

                        <div v-if="event.registration_time" class="pt-4 border-t border-white/10">
                            <label
                                class="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Chiusura
                                Iscrizioni</label>
                            <p class="text-sm font-bold">{{ formatDate(event.registration_time) }}</p>
                        </div>

                        <div class="pt-4">
                            <a v-if="event.link_registration" :href="event.link_registration" target="_blank"
                                class="block w-full bg-chess-gold text-chess-dark text-center py-4 rounded-xl font-black uppercase tracking-tighter hover:scale-105 transition-transform shadow-lg">
                                Iscriviti Ora
                            </a>
                            <div v-else
                                class="text-center p-4 bg-white/5 rounded-xl border border-white/10 italic text-xs text-gray-400">
                                Contatta l'organizzazione per iscriverti
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Organizzatore</h3>
                    <div class="space-y-3">
                        <div v-if="event.contact_name" class="flex items-center gap-3">
                            <Icon name="fa6-solid:user" class="text-chess-gold" />
                            <span class="text-sm font-bold text-chess-dark">{{ event.contact_name }}</span>
                        </div>
                        <div v-if="event.contact_phone" class="flex items-center gap-3">
                            <Icon name="fa6-solid:phone" class="text-chess-gold" />
                            <a :href="`tel:${event.contact_phone}`"
                                class="text-sm text-gray-600 hover:text-chess-gold">{{ event.contact_phone }}</a>
                        </div>
                        <div v-if="event.contact_email" class="flex items-center gap-3">
                            <Icon name="fa6-solid:envelope" class="text-chess-gold" />
                            <a :href="`mailto:${event.contact_email}`"
                                class="text-sm text-gray-600 hover:text-chess-gold truncate">{{ event.contact_email
                                }}</a>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    </div>
</template>

<style scoped>
.prose-chess {
    font-size: 0.95rem;
}

/* Ombra personalizzata per il titolo dell'evento */
.event-title {
    text-shadow:
        2px 2px 4px rgba(0, 0, 0, 0.8),
        /* Ombra stretta e definita per i bordi */
        0px 0px 20px rgba(0, 0, 0, 0.5);
    /* Sfumatura larga per staccare dallo sfondo */
}
</style>