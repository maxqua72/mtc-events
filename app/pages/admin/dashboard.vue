<script setup>
// Caricamento iniziale delle associazioni con i relativi manager
const { data: associations, refresh } = await useFetch('/api/admin/associations')

const newAsd = ref({ name: '', slug: '', theme_color: '#3b82f6' })
const showManagerModal = ref(false)
const selectedAsd = ref(null)
const managerEmail = ref('')

// Funzione per creare una nuova ASD
const createAsd = async () => {
    try {
        const { data, error } = await useFetch('/api/admin/associations', {
            method: 'POST',
            body: newAsd.value
        })

        if (error.value) {
            alert('Errore: ' + error.value.statusMessage)
        } else {
            alert('ASD creata!')
            await refresh() // Ricarica la lista dal server
            newAsd.value = { name: '', slug: '', theme_color: '#3b82f6' } // Reset form
        }
    } catch (e) {
        console.error('Errore durante la creazione:', e)
    }
}

// Funzione per gestire l'uscita
const logout = () => {
    localStorage.removeItem('user_auth')
    navigateTo('/admin/login')
}

// Gestione Modal per assegnazione Manager
const openManagerModal = (asd) => {
    selectedAsd.value = asd
    showManagerModal.value = true
}

const assignManager = async () => {
    if (!managerEmail.value) return
    
    try {
        await $fetch('/api/admin/managers', {
            method: 'POST',
            body: {
                email: managerEmail.value,
                association_id: selectedAsd.value._id
            }
        })
        
        alert('Manager assegnato!')
        await refresh() // Aggiorna la lista per vedere il nuovo manager apparire
        showManagerModal.value = false
        managerEmail.value = ''
    } catch (e) {
        alert(e.statusMessage || 'Errore durante l\'assegnazione')
    }
}
</script>

<template>
    <div class="min-h-screen bg-slate-100 p-8">
        <div v-if="showManagerModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div class="bg-white p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl">
                <h3 class="font-black text-xl mb-2 italic">Nomina Manager</h3>
                <p class="text-slate-500 text-sm mb-6">Associa un gestore a <b>{{ selectedAsd?.name }}</b></p>

                <input v-model="managerEmail" type="email" placeholder="Email del gestore"
                    class="w-full p-4 bg-slate-100 rounded-2xl mb-4 outline-none focus:ring-2 ring-blue-500 border-none text-sm">

                <div class="flex gap-3">
                    <button @click="showManagerModal = false" class="flex-1 py-3 font-bold text-slate-400">Annulla</button>
                    <button @click="assignManager"
                        class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100">Conferma</button>
                </div>
            </div>
        </div>

        <div class="max-w-4xl mx-auto">
            <header class="mb-12 flex justify-between items-center">
                <div>
                    <h1 class="text-4xl font-black text-slate-900 italic tracking-tight">Platform Admin</h1>
                    <p class="text-slate-500 font-medium">Controllo globale della rete</p>
                </div>
                <button @click="logout" class="px-6 py-2 bg-white text-red-500 rounded-full text-xs font-black shadow-sm border border-slate-200 hover:bg-red-50 transition-colors">
                    ESCI
                </button>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <section class="md:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 h-fit">
                    <h2 class="text-xl font-black mb-6 text-slate-800 italic">Nuova ASD</h2>
                    <div class="space-y-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Nome</label>
                            <input v-model="newAsd.name" placeholder="es. Tennis Club"
                                class="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm focus:ring-2 ring-slate-200 outline-none">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Slug URL</label>
                            <input v-model="newAsd.slug" placeholder="es. tennis-club"
                                class="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm focus:ring-2 ring-slate-200 outline-none">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Colore Brand</label>
                            <input v-model="newAsd.theme_color" type="color"
                                class="w-full h-12 p-1 bg-slate-50 rounded-2xl border-none cursor-pointer">
                        </div>
                        <button @click="createAsd" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all">
                            CREA ASSOCIAZIONE
                        </button>
                    </div>
                </section>

                <section class="md:col-span-2 space-y-6">
                    <h2 class="text-xl font-black text-slate-800 italic ml-2">Associazioni Attive</h2>
                    
                    <div v-for="asd in associations" :key="asd._id"
                        class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 transition-all hover:shadow-md">
                        <div class="flex justify-between items-start mb-6">
                            <div>
                                <h3 class="font-black text-2xl text-slate-900 tracking-tight">{{ asd.name }}</h3>
                                <p class="text-xs font-bold text-blue-500 uppercase tracking-widest">/{{ asd.slug }}</p>
                            </div>
                            <div class="flex gap-2">
                                <NuxtLink :to="`/${asd.slug}/manager/dashboard`"
                                    class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase transition-colors">
                                    Manage
                                </NuxtLink>
                                <button @click="openManagerModal(asd)"
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-100 transition-all">
                                    + Manager
                                </button>
                            </div>
                        </div>

                        <div class="pt-4 border-t border-slate-100">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Staff di Gestione</p>
                            <div v-if="asd.managers && asd.managers.length > 0" class="flex flex-wrap gap-2">
                                <div v-for="manager in asd.managers" :key="manager.email"
                                    class="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-100">
                                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span class="text-xs font-bold text-slate-600">{{ manager.email }}</span>
                                </div>
                            </div>
                            <p v-else class="text-xs italic text-slate-400 ml-1">Nessun manager assegnato a questa struttura</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>