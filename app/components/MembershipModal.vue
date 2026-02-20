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