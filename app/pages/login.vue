<script setup>
// 1. Importa lo store
const userStore = useUserStore()
const email = ref('')
const message = ref({ type: '', text: '' })
const isSubmitting = ref(false)

const handleLogin = async () => {
  if (!email.value) return
  
  isSubmitting.value = true
  message.value = { type: 'info', text: 'Verifica autorizzazioni...' }

  try {
    const permissions = await $fetch('/api/auth/permissions', {
      query: { email: email.value }
    })

    if (!permissions || (!permissions.is_admin && (!permissions.managed_asds || permissions.managed_asds.length === 0))) {
      message.value = { 
        type: 'error', 
        text: 'Accesso negato. Email non autorizzata.' 
      }
      return
    }

    // Salva nello store [cite: 2026-02-07]
    userStore.setAuth(permissions) 

    message.value = { type: 'success', text: 'Accesso eseguito.' }
/*
    setTimeout(() => {
      if (permissions.is_admin === true || permissions.is_admin === "true") {
        navigateTo('/admin')
      } else {
        // MANAGER: lo mandiamo alla prima ASD gestita [cite: 2026-02-07]
        const firstSlug = permissions.managed_asds[0]?.asd_slug
        navigateTo(`/${firstSlug}/manager/dashboard`)
      }
    }, 800) */

    setTimeout(() => {
      // Usiamo il valore appena ricevuto o quello nello store
      if (permissions.is_admin) {
        navigateTo('/admin')
      } else {
        const firstSlug = permissions.managed_asds[0]?.asd_slug
        navigateTo(`/${firstSlug}/manager/dashboard`)
      }
    }, 500)

  } catch (e) {
    message.value = { 
      type: 'error', 
      text: e.response?._data?.message || 'Errore di connessione.' 
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[999] bg-chess-dark flex items-center justify-center p-4">
    
    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" 
         style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 30px 30px;">
    </div>

    <div class="w-full max-w-[400px] relative">
      <div class="bg-chess-iron border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
        
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-chess-gold to-transparent"></div>

        <div class="text-center mb-10">
          <div class="w-16 h-16 bg-white/5 border border-chess-gold/20 rounded-xl mx-auto flex items-center justify-center mb-6 shadow-xl">
            <Icon name="fa6-solid:chess-knight" class="text-chess-gold text-3xl" />
          </div>
          <h1 class="text-xl font-black text-white uppercase tracking-[0.2em]">Area Riservata</h1>
          <p class="text-gray-500 text-sm font-bold  tracking-[0.3em] mt-2 italic">Gestori e Amministratori</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-2">
            <label class="block text-[10px] font-black text-chess-gold uppercase tracking-widest ml-1">
              Email di Sistema
            </label>
            <div class="relative">
              <Icon name="fa6-solid:envelope" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size="14" />
              <input 
                v-model="email"
                type="email" 
                placeholder="nome@esempio.com"
                class="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:border-chess-gold/50 outline-none transition-all placeholder:text-gray-700 font-medium"
                required
              >
            </div>
          </div>

          <button 
            type="submit"
            :disabled="isSubmitting"
            class="w-full bg-chess-gold hover:bg-yellow-500 disabled:bg-gray-700 text-chess-dark py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98] shadow-lg shadow-chess-gold/5"
          >
            <span v-if="!isSubmitting" class="flex items-center justify-center gap-2">
              Accedi <Icon name="fa6-solid:arrow-right-to-bracket" size="12" />
            </span>
            <span v-else class="flex items-center justify-center gap-2 animate-pulse">
              Verifica in corso...
            </span>
          </button>
        </form>

        <div v-if="message.text" 
             class="mt-8 p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
             :class="message.type === 'error' 
               ? 'bg-red-500/10 border-red-500/20 text-red-400' 
               : 'bg-green-500/10 border-green-500/20 text-green-400'">
          <Icon :name="message.type === 'error' ? 'fa6-solid:triangle-exclamation' : 'fa6-solid:circle-check'" />
          {{ message.text }}
        </div>
      </div>
      
      
    </div>
  </div>
</template>

<style scoped>
/* Transizione fluida */
.v-enter-active, .v-leave-active { transition: opacity 0.4s ease; }
.v-enter-from, .v-leave-to { opacity: 0; }
</style>