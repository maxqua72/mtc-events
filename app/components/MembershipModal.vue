<script setup>
const props = defineProps({
  membership: { type: Object, default: null },
  asdId: { type: String, required: true },
  asdSlug: { type: String, required: true }
})

const emit = defineEmits(['close', 'save'])
const isSubmitting = ref(false)

const form = ref({
  name: '',
  email: '',
  member_code: '',
  start_date: new Date().toISOString().split('T')[0],
  expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  status: 'active'
})

onMounted(() => {
  if (props.membership) {
    form.value = { 
      ...props.membership,
      // Formattiamo le date per l'input HTML type="date"
      start_date: props.membership.start_date ? new Date(props.membership.start_date).toISOString().split('T')[0] : '',
      expiry_date: props.membership.expiry_date ? new Date(props.membership.expiry_date).toISOString().split('T')[0] : ''
    }
  }
})

const submit = async () => {
  isSubmitting.value = true
  try {
    const method = 'POST'
    const url = `/api/manager/${props.asdSlug}/memberships`

    await $fetch(url, {
      method,
      body: { 
        ...form.value, 
        _id: props.membership?._id,
        association_id: props.asdId // Iniettiamo sempre l'ID dell'ASD di competenza
      }
    })
    emit('save')
  } catch (e) {
    alert("Errore: " + (e.statusMessage || "Impossibile salvare il socio"))
  } finally {
    isSubmitting.value = false
  }
}

const handleSendEmail = () => {
  if (!form.value.email) return alert("Inserisci un'email valida per inviare il link!")
  alert(`Implementazione futura: Invio email a ${form.value.email} con link join e token ${props.membership.join_token}`)
}

const handleRegenerate = async () => {
  if (confirm('ATTENZIONE: Rigenerando il link, quello precedente non funzionerà più. Il socio dovrà ricollegarsi. Procedere?')) {
    try {
      isSubmitting.value = true
      await $fetch(`/api/manager/${props.asdSlug}/memberships/${props.membership._id}/regenerate-token`, { method: 'PATCH' })
      emit('save') // Chiude e ricarica per mostrare il nuovo token
    } catch (e) {
      alert("Errore nella rigenerazione del token")
    } finally {
      isSubmitting.value = false
    }
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-chess-dark/80 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
      
      <div class="bg-chess-iron p-6 text-white flex justify-between items-center border-b border-chess-gold/20">
        <div>
          <h3 class="text-xl font-black uppercase tracking-tight">
            {{ membership ? 'Modifica Socio' : 'Nuova Iscrizione' }}
          </h3>
          <p class="text-chess-gold text-[10px] font-bold uppercase tracking-widest mt-1">Gestione Anagrafica</p>
        </div>
        <button @click="$emit('close')" class="text-white/50 hover:text-white transition-colors">
          <Icon name="fa6-solid:xmark" size="20" />
        </button>
      </div>

      <form @submit.prevent="submit" class="p-8 space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="md:col-span-2 space-y-2">
            <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">Nome Completo</label>
            <input v-model="form.name" type="text" required class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-chess-gold" />
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">Email (Opzionale)</label>
            <input v-model="form.email" type="email" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold outline-none" placeholder="Genitore o Personale" />
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">Codice Tessera</label>
            <input v-model="form.member_code" type="text" placeholder="TESS-2026-..." class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold outline-none" />
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">Data Inizio</label>
            <input v-model="form.start_date" type="date" required class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold outline-none" />
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-black text-chess-chocolate uppercase tracking-widest">Data Scadenza</label>
            <input v-model="form.expiry_date" type="date" required class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold outline-none" />
          </div>
        </div>

        <div v-if="membership?.join_token" class="space-y-4">
          
          <div class="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-between">
            <div>
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Token di Accesso</label>
              <code class="text-xs font-mono text-chess-iron font-bold">{{ membership.join_token }}</code>
            </div>
            <div class="flex items-center gap-2">
               <span class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
               <span class="text-[9px] font-black text-green-600 uppercase">Attivo</span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-chess-chocolate uppercase tracking-widest">Comunicazione e Sicurezza</label>
            <div class="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                @click="handleSendEmail"
                class="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-all border border-blue-100"
              >
                <Icon name="fa6-solid:paper-plane" size="12" /> Invia Link
              </button>
              
              <button 
                type="button" 
                @click="handleRegenerate"
                class="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black uppercase hover:bg-orange-100 transition-all border border-orange-100"
              >
                <Icon name="fa6-solid:rotate" size="12" /> Rigenera Link
              </button>
            </div>
          </div>
        </div>

        <div class="pt-6 flex gap-3">
          <button type="button" @click="$emit('close')" class="flex-1 px-6 py-3 rounded-lg text-[11px] font-black uppercase border border-gray-200 text-gray-400 hover:bg-gray-50">Annulla</button>
          <button type="submit" :disabled="isSubmitting" class="flex-1 bg-chess-dark text-chess-gold px-6 py-3 rounded-lg text-[11px] font-black uppercase hover:scale-105 transition-all shadow-lg">
            {{ isSubmitting ? 'Salvataggio...' : 'Salva Socio' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>