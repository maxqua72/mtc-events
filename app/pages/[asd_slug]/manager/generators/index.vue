<template>
    <div class="space-y-6">
        <div
            class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm gap-4">
            <div>
                <h2 class="text-xl font-black text-chess-dark uppercase tracking-tight">Eventi Ricorrenti</h2>
                <p class="text-xs text-gray-500 mt-1 italic text-amber-600 font-medium">
                    <Icon name="fa6-solid:robot" size="10" /> Gli eventi ricorrenti generano eventi automaticamente ogni
                    notte.
                </p>
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto">
                <button @click="triggerGlobalRolling"
                    class="flex-1 md:flex-none bg-amber-500 text-white px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md flex items-center justify-center gap-2">
                    <Icon name="fa6-solid:gears" size="14" />
                    Rolling {{ activeFilter === 'Tutti' ? 'Globale' : activeFilter }}
                </button>

                <NuxtLink :to="`/${asdSlug}/manager/generators/new`"
                    class="flex-1 md:flex-none bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2">
                    <Icon name="fa6-solid:plus" size="14" /> Nuova Matrice
                </NuxtLink>
            </div>
        </div>

        <ManagerTabs active="generators" :asdSlug="asdSlug" />

        <EventFilters v-model="activeFilter" :filters="filters" />

        <div v-if="pending" class="flex justify-center py-20">
            <Icon name="fa6-solid:circle-notch" class="animate-spin text-chess-gold" size="40" />
        </div>

        <div v-else-if="filteredGenerators?.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GeneratorCard v-for="gen in filteredGenerators" :key="gen._id" :generator="gen" :asd-slug="asdSlug"
                @delete="deleteGenerator(gen._id)" @roll="triggerSingleRolling(gen._id)" />
        </div>

        <div v-else class="bg-white border-2 border-dashed border-gray-200 rounded-3xl py-20 text-center">
            <Icon name="fa6-solid:gears" class="text-gray-200 mb-4" size="48" />
            <p class="text-gray-400 font-bold uppercase tracking-widest text-sm">Nessuna matrice configurata</p>
            <NuxtLink :to="`/${asdSlug}/manager/generators/new`"
                class="text-chess-gold text-xs font-bold mt-2 underline uppercase">Crea la prima ora</NuxtLink>
        </div>
    </div>
</template>

<script setup>
const route = useRoute()
const asdSlug = route.params.asd_slug
definePageMeta({ layout: 'default' })

// 1. Stato dei filtri (uguale a gestione eventi)
const activeFilter = ref('Tutti')
const filters = ['Tutti', 'Tornei', 'Gioco Libero', 'Corsi', 'Altro']

const { data: generators, refresh, pending } = await useFetch(`/api/manager/${asdSlug}/generators`)

// 2. Logica di filtraggio calcolata
const filteredGenerators = computed(() => {
    if (!generators.value) return []
    return activeFilter.value === 'Tutti'
        ? generators.value
        : generators.value.filter(g => g.category?.toLowerCase() === activeFilter.value.toLowerCase())
})

const triggerGlobalRolling = async () => {
    const filterLabel = activeFilter.value === 'Tutti' ? 'tutte le' : `tutte le matrici "${activeFilter.value}"`

    if (!confirm(`Lanciare la generazione per ${filterLabel}?`)) return

    try {
        // Passiamo la categoria come query parameter
        const categoryParam = activeFilter.value !== 'Tutti' ? `?category=${activeFilter.value.toLowerCase()}` : ''

        await $fetch(`/api/manager/${asdSlug}/generators/rolling${categoryParam}`, {
            method: 'POST'
        })

        alert(`Rolling per ${activeFilter.value} completato!`)
        refresh()
    } catch (err) {
        alert("Errore durante il rolling filtrato")
    }
}

const triggerSingleRolling = async (id) => {
    try {
        await $fetch(`/api/manager/${asdSlug}/generators/${id}/rolling`, { method: 'POST' })
        alert("Generazione completata!")
        refresh()
    } catch (err) { alert("Errore rolling singolo") }
}

const deleteGenerator = async (id) => {
    if (confirm('Eliminare questa matrice?')) {
        await $fetch(`/api/manager/${asdSlug}/generators/${id}`, { method: 'DELETE' })
        refresh()
    }
}
</script>