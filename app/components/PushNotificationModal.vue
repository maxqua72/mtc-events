<script setup>
const props = defineProps({
  member: { type: Object, required: true },
  asdSlug: { type: String, required: true }
})

const emit = defineEmits(['close'])

const notification = ref({
  title: 'Comunicazione ASD',
  body: ''
})

const isSending = ref(false)
const errorMessage = ref(null) // Stato per l'errore

const sendPush = async () => {
  // Reset errore a ogni tentativo
  errorMessage.value = null
  
  if (!notification.value.body.trim()) {
    errorMessage.value = 'Il corpo del messaggio non può essere vuoto.'
    return
  }
  
  isSending.value = true
  try {
    await $fetch(`/api/manager/${props.asdSlug}/send-test-push`, {
      method: 'POST',
      body: {
        email: props.member.email,
        title: notification.value.title,
        body: notification.value.body
      }
    })
    emit('close')
  } catch (err) {
    // Recuperiamo il messaggio specifico se disponibile, altrimenti uno generico
    errorMessage.value = err.data?.statusMessage || 'Errore durante l\'invio della notifica.'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-chess-dark/50 backdrop-blur-sm">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
      
      <div class="p-6 border-b border-gray-100 bg-gray-50">
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 bg-orange-100 text-orange-600 rounded-lg">
            <Icon name="fa6-solid:paper-plane" size="20" />
          </div>
          <h3 class="text-lg font-black text-chess-dark uppercase tracking-tight">Invia Notifica Push</h3>
        </div>
        <p class="text-[11px] text-gray-500 font-bold uppercase">
          Destinatario: <span class="text-chess-chocolate">{{ member.name }} {{ member.surname }}</span>
        </p>
      </div>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="errorMessage" class="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600">
          <Icon name="fa6-solid:circle-exclamation" class="shrink-0" />
          <span class="text-[11px] font-bold uppercase tracking-tight">{{ errorMessage }}</span>
        </div>
      </Transition>

      <div class="p-6 space-y-4">
        <div>
          <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Titolo Notifica</label>
          <input v-model="notification.title" type="text"
            class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-chess-gold/20 transition-all" />
        </div>

        <div>
          <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Messaggio</label>
          <textarea v-model="notification.body" rows="4"
            placeholder="Scrivi qui il messaggio per il socio..."
            :class="errorMessage && !notification.body ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'"
            class="w-full p-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-chess-gold/20 resize-none transition-all"></textarea>
        </div>
      </div>

      <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
        <button @click="$emit('close')" 
          class="px-4 py-2 text-[11px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors">
          Annulla
        </button>
        <button @click="sendPush" :disabled="isSending"
          class="bg-chess-dark text-chess-gold px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100">
          <Icon v-if="isSending" name="svg-spinners:ring-resize" class="mr-2" />
          {{ isSending ? 'Invio in corso...' : 'Invia Ora' }}
        </button>
      </div>
    </div>
  </div>
</template>