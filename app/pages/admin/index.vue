<script setup>
definePageMeta({ layout: 'default' })

// Fetch iniziale delle ASD
const { data: associations, refresh } = await useFetch('/api/admin/associations')

// Stati per il Modal ASD
const showAsdModal = ref(false)
const selectedAsd = ref(null)

// Stati per il Modal MANAGER
const showManagerModal = ref(false)
const asdForManager = ref(null)

// --- Logica ASD ---
const openCreateModal = () => {
    selectedAsd.value = null
    showAsdModal.value = true
}

const editAsd = (asd) => {
    selectedAsd.value = asd
    showAsdModal.value = true
}

const deleteAsd = async (id) => {
    if (confirm('ATTENZIONE: Eliminando l\'ASD verranno cancellati anche tutti i suoi eventi, manager e soci. Procedere?')) {
        await $fetch(`/api/admin/associations/${id}`, { method: 'DELETE' })
        refresh()
    }
}


// --- Logica MANAGER ---
const handleAddManager = (asd) => {
    console.log("Aggiunta manager per ASD:", asd._id);
    asdForManager.value = asd
    showManagerModal.value = true
}

const handleRemoveManager = async (asdId, email) => {
    if (confirm(`Rimuovere i permessi per ${email}?`)) {
        try {
            await $fetch(`/api/admin/associations/${asdId}/managers?email=${email}`, { method: 'DELETE' })
            refresh()
        } catch (err) {
            alert("Errore durante la rimozione: " + (err.statusMessage || "Errore sconosciuto"))
        }
    }
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div>
                <h2 class="text-xl font-black text-chess-dark uppercase tracking-tight">Gestione Associazioni</h2>
                <p class="text-xs text-gray-500 mt-1">Configura le ASD e assegna i MANAGER globali.</p>
            </div>
            <button @click="openCreateModal"
                class="bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                <Icon name="fa6-solid:plus" size="14" /> Nuova ASD
            </button>
        </div>

        <div v-if="associations?.length > 0" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AsdCard v-for="asd in associations" :key="asd._id" :asd="asd" @edit="editAsd" @delete="deleteAsd"
                @add-manager="handleAddManager" @remove-manager="handleRemoveManager" />
        </div>

        <div v-else class="bg-white border-2 border-dashed border-gray-200 rounded-xl py-20 text-center">
            <Icon name="fa6-solid:chess-board" class="text-gray-200 mb-4" size="48" />
            <p class="text-gray-400 font-bold uppercase tracking-widest text-sm">Nessuna ASD configurata</p>
        </div>

        <Teleport to="body">
            <AsdModal v-if="showAsdModal" :asd="selectedAsd" @close="showAsdModal = false"
                @save="refresh(); showAsdModal = false" />

            <ManagerModal v-if="showManagerModal" :asd="asdForManager" @close="showManagerModal = false"
                @saved="refresh" />
        </Teleport>
    </div>
</template>