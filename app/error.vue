<script setup>
const props = defineProps({
  error: Object
})

const handleRecover = () => {
  // 1. Controlliamo se è un Manager/Admin (Cookie)
  const auth = useCookie('user_auth').value
  
  if (auth && auth.managed_asds?.length > 0) {
    // Se è manager, lo mandiamo alla dashboard della sua prima ASD
    const firstSlug = auth.managed_asds[0].asd_slug
    return clearError({ redirect: `/${firstSlug}/manager/dashboard` })
  }

  // 2. Se non è manager, controlliamo se è un Visitatore/Socio (LocalStorage)
  if (import.meta.client) {
    const userData = localStorage.getItem('user_data')
    if (userData) {
      const parsed = JSON.parse(userData)
      if (parsed.followedAsds?.length > 0) {
        // Lo mandiamo agli eventi dell'ultima ASD valida visitata
        const lastAsd = parsed.followedAsds[parsed.followedAsds.length - 1]
        return clearError({ redirect: `/${lastAsd}` })
      }
    }
  }

  // 3. Fallback estremo: se non abbiamo proprio nulla, facciamo un refresh pulito
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="fixed inset-0 z-[1000] bg-chess-dark flex items-center justify-center p-6 font-sans">
    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" 
         style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 32px 32px;">
    </div>

    <div class="max-w-md w-full relative">
      <div class="bg-chess-iron border border-white/10 rounded-2xl p-10 shadow-2xl text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

        <div class="mb-8 flex justify-center">
          <div class="w-20 h-20 bg-white/5 border border-red-500/20 rounded-2xl flex items-center justify-center">
            <Icon 
              :name="error.statusCode === 403 ? 'fa6-solid:user-lock' : 'fa6-solid:ghost'" 
              class="text-red-500/80 text-4xl" 
            />
          </div>
        </div>

        <h1 class="text-5xl font-black text-white leading-none mb-3 tracking-tighter">
          {{ error.statusCode }}
        </h1>
        
        <h2 class="text-xs font-black text-red-400 uppercase tracking-[0.3em] mb-6">
          {{ error.statusCode === 404 ? 'ASD Non Trovata' : 'Accesso Negato' }}
        </h2>
        
        <div class="mb-10 text-gray-400 text-sm leading-relaxed font-medium">
          {{ error.message || "L'identificativo dell'associazione non è corretto o è stato rimosso." }}
        </div>

        <button 
          @click="handleRecover"
          class="w-full bg-chess-gold hover:bg-yellow-500 text-chess-dark py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl flex items-center justify-center gap-3"
        >
          <Icon name="fa6-solid:arrow-rotate-left" />
          Riprendi Navigazione
        </button>
      </div>
    </div>
  </div>
</template>