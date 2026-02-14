<script setup>
const route = useRoute()
const slug = route.params.asd_slug
const membership = ref(null)
const loading = ref(true)

// Caricamento della membership specifica per questa associazione
onMounted(async () => {
  const savedIdentity = localStorage.getItem(`auth_${slug}`)
  
  if (savedIdentity) {
    const { email } = JSON.parse(savedIdentity)
    
    // Chiamata all'endpoint aggiornato
    const { data } = await useFetch(`/api/asd/${slug}/membership`, {
      query: { email }
    })
    
    if (data.value) {
      membership.value = data.value
    }
  }
  loading.value = false
})

const logout = () => {
  localStorage.removeItem(`auth_${slug}`)
  membership.value = null
  navigateTo(`/${slug}`)
}

const formatDate = (date) => date ? new Date(date).toLocaleDateString('it-IT') : 'N/A'
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-white p-6 border-b border-slate-200">
      <h1 class="text-xl font-bold text-slate-900">Iscrizione ASD</h1>
      <p class="text-sm text-slate-500 uppercase font-semibold">{{ slug.replace('-', ' ') }}</p>
    </header>

    <main class="max-w-md mx-auto p-4">
      <div v-if="loading" class="text-center py-10 text-slate-400">
        Verifica iscrizione in corso...
      </div>

      <div v-else-if="membership" class="space-y-6">
        <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <div class="absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded bg-green-100 text-green-700 uppercase">
            Attivo
          </div>

          <div class="text-center">
            <div class="w-20 h-20 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              {{ membership.name.charAt(0) }}
            </div>
            <h2 class="text-2xl font-black text-slate-900">{{ membership.name }}</h2>
            <p class="text-slate-500 text-sm">{{ membership.email }}</p>
          </div>
          
          <div class="mt-8 grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Data Inizio</p>
              <p class="font-bold text-slate-700">{{ formatDate(membership.start_date) }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Scadenza Tessera</p>
              <p :class="new Date(membership.expiry_date) < new Date() ? 'text-red-600' : 'text-blue-600'" class="font-bold">
                {{ formatDate(membership.expiry_date) }}
              </p>
            </div>
            <div class="col-span-2">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Codice Membership</p>
              <p class="font-mono text-lg font-bold text-slate-900">{{ membership.member_code }}</p>
            </div>
          </div>
        </div>

        <button @click="logout" class="w-full py-4 text-red-400 text-xs font-bold uppercase tracking-widest">
          Scollega questo profilo
        </button>
      </div>

      <div v-else class="text-center py-20 px-6">
        <div class="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">
          👋
        </div>
        <h2 class="text-2xl font-bold text-slate-900">Benvenuto</h2>
        <p class="text-slate-500 mt-2 mb-8">Non risulta alcun profilo collegato a questa associazione su questo dispositivo.</p>
        
        <NuxtLink 
          :to="`/${slug}/auth`" 
          class="block w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-200"
        >
          Identificati come Socio
        </NuxtLink>
      </div>
    </main>
  </div>
</template>