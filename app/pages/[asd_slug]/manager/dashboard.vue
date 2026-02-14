<script setup>
const route = useRoute()
const asdSlug = route.params.asd_slug

// Stato per il Modal e il nuovo socio
const showAddMemberModal = ref(false)
const isSubmitting = ref(false)
const newMember = ref({
    email: '',
    name: '',
    expiry_date: ''
})

// Stato per capire se stiamo creando o modificando
const isEditing = ref(false)
const editingMemberId = ref(null)

// Recuperiamo i dati dell'ASD e la lista dei soci (members)
const { data: asd } = await useFetch(`/api/manager/${asdSlug}/info`)
const { data: members, refresh: refreshMembers } = await useFetch(`/api/manager/${asdSlug}/memberships`)

// Logica per il colore della scadenza
const getStatusClass = (expiryDate) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    if (expiry < now) return 'bg-red-100 text-red-600' // Scaduto

    const diffTime = expiry - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays <= 30) return 'bg-orange-100 text-orange-600' // In scadenza (30 gg)

    return 'bg-green-100 text-green-600' // Regolare
}

const addMember = async () => {
    if (!newMember.value.email || !newMember.value.expiry_date) {
        alert('Email e Data Scadenza sono obbligatorie')
        return
    }

    isSubmitting.value = true
    try {
        await $fetch(`/api/manager/${asdSlug}/memberships`, {
            method: 'POST',
            body: {
                email: newMember.value.email,
                name: newMember.value.name,
                expiry_date: newMember.value.expiry_date
            }
        })

        // Reset e chiusura
        showAddMemberModal.value = false
        newMember.value = { email: '', name: '', expiry_date: '' }

        // Aggiorna la tabella
        await refreshMembers()
        alert('Socio registrato correttamente')
    } catch (e) {
        alert(e.statusMessage || 'Errore nel salvataggio')
    } finally {
        isSubmitting.value = false
    }
}

const formatDate = (date) => new Date(date).toLocaleDateString('it-IT')

// Funzione per aprire il modal in modalità "Modifica"
const openEditModal = (member) => {
    isEditing.value = true
    editingMemberId.value = member._id
    newMember.value = {
        email: member.email,
        name: member.name,
        // Formattiamo la data per l'input HTML (YYYY-MM-DD)
        expiry_date: new Date(member.expiry_date).toISOString().split('T')[0]
    }
    showAddMemberModal.value = true
}

// Funzione per resettare il modal quando si preme "+ Aggiungi"
const openAddModal = () => {
    isEditing.value = false
    editingMemberId.value = null
    newMember.value = { email: '', name: '', expiry_date: '' }
    showAddMemberModal.value = true
}
</script>

<template>
    <div class="min-h-screen bg-slate-50">
        <nav class="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl" :style="{ backgroundColor: asd?.theme_color || '#000' }"></div>
                <div>
                    <h1 class="text-xl font-black text-slate-900 italic uppercase">{{ asd?.name }}</h1>
                    <p class="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Manager Panel</p>
                </div>
            </div>
            <NuxtLink to="/admin/dashboard" class="text-xs font-bold text-slate-500 hover:text-slate-900">Torna a
                Platform Admin</NuxtLink>
        </nav>

        <main class="p-8 max-w-6xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <p class="text-slate-400 text-xs font-bold uppercase mb-1">Soci Totali</p>
                    <p class="text-3xl font-black text-slate-900">{{ members?.length || 0 }}</p>
                </div>
            </div>

            <section class="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div class="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h2 class="text-xl font-black text-slate-900 italic">Anagrafica Soci</h2>
                    <button @click="showAddMemberModal = true"
                        class="bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-bold transition-transform active:scale-95">
                        + Aggiungi Socio
                    </button>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50">
                                <th class="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Nominativo</th>
                                <th class="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email
                                </th>
                                <th class="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Iscrizione</th>
                                <th class="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scadenza
                                </th>
                                <th class="p-6"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="member in members" :key="member._id"
                                class="hover:bg-slate-50/50 transition-colors">
                                <td class="p-6">
                                    <p class="font-bold text-slate-900">{{ member.name }}</p>
                                </td>
                                <td class="p-6">
                                    <p class="text-sm text-slate-500">{{ member.email }}</p>
                                </td>
                                <td class="p-6">
                                    <p class="text-sm text-slate-900">{{ formatDate(member.start_date) }}</p>
                                </td>
                                <td class="p-6">
                                    <span :class="getStatusClass(member.expiry_date)"
                                        class="px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                        {{ formatDate(member.expiry_date) }}
                                    </span>
                                </td>
                                <td class="p-6 text-right">
                                    <button @click="openEditModal(member)"
                                        class="text-blue-600 hover:text-blue-800 font-black text-[10px] uppercase tracking-widest">
                                        Edit / Rinnova
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-if="!members?.length" class="p-12 text-center text-slate-400 italic">
                        Nessun socio registrato per questa associazione.
                    </div>
                </div>
            </section>
        </main>


        <div v-if="showAddMemberModal"
            class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div class="bg-white p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl">
                <h2 class="text-2xl font-black text-slate-900 mb-2 italic">{{ isEditing ? 'Modifica Socio' : 'Nuova Membership' }}</h2>
                <p class="text-slate-500 text-sm mb-6">{{ isEditing ? 'Aggiorna i dati o rinnova la scadenza' : 'Inserisci i dati del socio' }} per {{ asd?.name }}</p>

                <div class="space-y-4">
                    <input v-model="newMember.name" type="text" placeholder="Nome Completo"
                        class="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all">
                    <input v-model="newMember.email" type="email" placeholder="Email Socio"
                        class="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Scadenza
                            Tessera</label>
                        <input v-model="newMember.expiry_date" type="date"
                            class="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all">
                    </div>
                </div>

                <div class="flex gap-4 mt-8">
                    <button @click="showAddMemberModal = false"
                        class="flex-1 py-4 text-sm font-bold text-slate-400">Annulla</button>
                    <button @click="addMember" :disabled="isSubmitting"
                        class="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl disabled:opacity-50">
                        {{ isSubmitting ? 'SALVATAGGIO...' : (isEditing ? 'AGGIORNA' : 'CONFERMA') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>