<script setup>
const email = ref('')
const message = ref({ type: '', text: '' })
const isSubmitting = ref(false)

const handleAdminLogin = async () => {
  if (!email.value) return
  
  isSubmitting.value = true
  message.value = { type: 'info', text: 'Autenticazione in corso...' }

  try {
    // 1. Verifichiamo i permessi dell'utente
    const { data: permissions, error } = await useFetch('/api/auth/permissions', {
      query: { email: email.value }
    })

    if (error.value || (!permissions.value.is_admin && permissions.value.managed_asds.length === 0)) {
      message.value = { 
        type: 'error', 
        text: 'Accesso negato. Questa email non è associata a profili amministrativi.' 
      }
    } else {
      // 2. Salviamo l'identità per il middleware
      localStorage.setItem('user_auth', JSON.stringify({
        email: email.value,
        login_at: new Date().getTime()
      }))

      message.value = { type: 'success', text: 'Bentornato! Reindirizzamento...' }

      // 3. Reindirizzamento intelligente
      setTimeout(() => {
        if (permissions.value.is_admin) {
          navigateTo('/admin/dashboard')
        } else {
          // Se gestisce una sola ASD, lo mandiamo direttamente lì
          const firstAsd = permissions.value.managed_asds[0].asd_slug
          navigateTo(`/${firstAsd}/manager/dashboard`)
        }
      }, 1000)
    }
  } catch (e) {
    message.value = { type: 'error', text: 'Errore di connessione.' }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center p-6">
    <div class="w-full max-w-sm">
      <div class="bg-white rounded-[2.5rem] p-10 shadow-2xl">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 rotate-3">
            <span class="text-white text-2xl font-black">A</span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 italic">Admin Portal</h1>
          <p class="text-slate-400 text-sm mt-1">Gestione Piattaforma & ASD</p>
        </div>

        <form @submit.prevent="handleAdminLogin" class="space-y-6">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Personale</label>
            <input 
              v-model="email"
              type="email" 
              placeholder="admin@email.com"
              class="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none text-slate-700"
              required
            >
          </div>

          <button 
            type="submit"
            :disabled="isSubmitting"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {{ isSubmitting ? 'Verifica...' : 'Accedi al Sistema' }}
          </button>
        </form>

        <div v-if="message.text" 
             :class="message.type === 'error' ? 'text-red-500' : 'text-green-500'"
             class="mt-6 text-center text-xs font-bold uppercase tracking-tight">
          {{ message.text }}
        </div>
      </div>
      
      <p class="text-center mt-8 text-slate-500 text-xs">
        Riservato esclusivamente ai gestori autorizzati
      </p>
    </div>
  </div>
</template>