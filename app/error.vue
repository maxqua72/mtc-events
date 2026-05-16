<script setup>
const props = defineProps({
  error: Object
})

const userStore = useUserStore()

const handleRecover = () => {
  // Se l'errore è 401 (non loggato), puliamo tutto e torniamo in home
  // Inutile cercare di recuperare se non c'è il cookie
  if (props.error.statusCode === 401) {
    return clearError({ redirect: '/' })
  }

  //const auth = useCookie('user_auth').value
  const auth = userStore.auth
  
  // Se è un Manager/Admin (Cookie)
  if (auth && auth.managed_asds?.length > 0) {
    const firstSlug = auth.managed_asds[0].asd_slug
    return clearError({ redirect: `/${firstSlug}/manager/dashboard` })
  }

  // Se è l'Admin globale senza ASD specifiche assegnate
  if (userStore.isAdmin) {
    return clearError({ redirect: '/admin' }) // o la tua rotta admin principale
  }

  // Se è un Visitatore (LocalStorage)
  if (import.meta.client) {
    const userData = localStorage.getItem('user_data')
    if (userData) {
      const parsed = JSON.parse(userData)
      if (parsed.followedAsds?.length > 0) {
        const lastAsd = parsed.followedAsds[parsed.followedAsds.length - 1]
        return clearError({ redirect: `/${lastAsd}` })
      }
    }
  }

  clearError({ redirect: '/' })
}

// Helper per i testi dinamici
const errorDetails = computed(() => {
  switch (props.error.statusCode) {
    case 401:
      return {
        icon: 'fa6-solid:key',
        label: 'Sessione Scaduta',
        color: 'text-chess-gold',
        msg: 'La tua sessione di accesso non è più valida. Usa il link ricevuto via email per rientrare.'
      }
    case 403:
      return {
        icon: 'fa6-solid:user-lock',
        label: 'Permesso Negato',
        color: 'text-red-500',
        msg: props.error.statusMessage || "Non disponi delle autorizzazioni per accedere a questa area."
      }
    default:
      return {
        icon: 'fa6-solid:ghost',
        label: 'Pagina Non Trovata',
        color: 'text-gray-400',
        msg: "L'indirizzo inserito non è corretto o la pagina è stata spostata."
      }
  }
})
</script>

<template>
  <div class="fixed inset-0 z-[1000] bg-chess-dark flex items-center justify-center p-6 font-sans">
    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" 
         style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 32px 32px;">
    </div>

    <div class="max-w-md w-full relative">
      <div class="bg-chess-iron border border-white/10 rounded-2xl p-10 shadow-2xl text-center relative overflow-hidden">
        
        <div 
          class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent"
          :class="errorDetails.color"
        ></div>

        <div class="mb-8 flex justify-center">
          <div 
            class="w-20 h-20 bg-white/5 border rounded-2xl flex items-center justify-center"
            :class="errorDetails.color.replace('text-', 'border-').replace('500', '500/20')"
          >
            <Icon 
              :name="errorDetails.icon" 
              class="text-4xl" 
              :class="errorDetails.color"
            />
          </div>
        </div>

        <h1 class="text-5xl font-black text-white leading-none mb-3 tracking-tighter">
          {{ error.statusCode }}
        </h1>
        
        <h2 
          class="text-xs font-black uppercase tracking-[0.3em] mb-6"
          :class="errorDetails.color"
        >
          {{ errorDetails.label }}
        </h2>
        
        <div class="mb-10 text-gray-400 text-sm leading-relaxed font-medium">
          {{ errorDetails.msg }}
        </div>

        <button 
          @click="handleRecover"
          class="w-full bg-chess-gold hover:bg-yellow-500 text-chess-dark py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl flex items-center justify-center gap-3"
        >
          <Icon :name="error.statusCode === 401 ? 'fa6-solid:house' : 'fa6-solid:arrow-rotate-left'" />
          {{ error.statusCode === 401 ? 'Torna alla Home' : 'Riprendi Navigazione' }}
        </button>
      </div>
    </div>
  </div>
</template>