<script setup>
const route = useRoute()
const slug = route.params.asd_slug
const email = ref('')
const message = ref({ type: '', text: '' })
const isSubmitting = ref(false)

const handleLogin = async () => {
  if (!email.value) return
  
  isSubmitting.value = true
  message.value = { type: 'info', text: 'Verifica in corso...' }

  try {
    // 1. Verifichiamo se l'utente ha una membership attiva per questa ASD
    const { data: membership, error } = await useFetch(`/api/asd/${slug}/membership`, {
      query: { email: email.value }
    })

    if (error.value || !membership.value) {
      message.value = { 
        type: 'error', 
        text: 'Nessuna iscrizione trovata per questa email in questa associazione.' 
      }
    } else {
      // 2. Simulazione Magic Link / Successo
      // Salviamo l'identità nel localStorage specifica per questa ASD (Requisito Multi-ASD)
      const authData = {
        email: email.value,
        name: membership.value.name,
        timestamp: new Date().getTime()
      }
      
      localStorage.setItem(`auth_${slug}`, JSON.stringify(authData))
      
      message.value = { type: 'success', text: 'Accesso eseguito con successo!' }
      
      // 3. Reindirizziamo alla pagina membership dopo un breve delay
      setTimeout(() => {
        navigateTo(`/${slug}/membership`)
      }, 1500)
    }
  } catch (e) {
    message.value = { type: 'error', text: 'Si è verificato un errore tecnico.' }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col items-center justify-center p-6">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-block p-4 bg-slate-50 rounded-full mb-4">
          <span class="text-4xl">✉️</span>
        </div>
        <h1 class="text-2xl font-black text-slate-900">Accesso Rapido</h1>
        <p class="text-slate-500 mt-2">Inserisci l'email con cui sei iscritto a <br><span class="font-bold text-slate-800">{{ slug }}</span></p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Email del Socio</label>
          <input 
            v-model="email"
            type="email" 
            placeholder="esempio@email.it"
            class="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white transition-all outline-none"
            required
          >
        </div>

        <button 
          type="submit"
          :disabled="isSubmitting"
          class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform disabled:opacity-50"
        >
          {{ isSubmitting ? 'Verifica...' : 'Continua' }}
        </button>
      </form>

      <div v-if="message.text" 
           :class="message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'"
           class="mt-6 p-4 rounded-xl border text-center text-sm font-medium">
        {{ message.text }}
      </div>

      <div class="mt-8 text-center">
        <NuxtLink :to="`/${slug}`" class="text-slate-400 text-sm hover:text-slate-600">
          Torna alla lista eventi
        </NuxtLink>
      </div>
    </div>
  </div>
</template>