<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-chess-dark/90 backdrop-blur-sm" @click="$emit('close')"></div>

    <div class="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
      <div class="bg-chess-dark p-6 text-white flex flex-col items-center">
        <div class="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 border border-white/20">
          <Icon :name="roleIcon" size="32" :class="(props.user.role === 'MANAGER')?'text-red-500':'text-chess-gold'"/>
        </div>
        <h3 class="text-xl font-black uppercase tracking-tight text-chess-gold">{{ user.name }} {{ user.surname }}</h3>
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">{{ roleLabel }}</p>
      </div>

      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between py-2 border-b border-gray-50">
          <span class="text-[10px] font-black text-gray-400 uppercase">Email</span>
          <span class="text-sm font-bold text-chess-dark">{{ user.email }}</span>
        </div>

        <div v-if="user.expiry_date" class="flex items-center justify-between py-2 border-b border-gray-50">
          <span class="text-[10px] font-black text-gray-400 uppercase">Scadenza Tessera</span>
          <span class="text-sm font-bold" :class="isExpired ? 'text-red-500' : 'text-green-600'">
            {{ formatDate(user.expiry_date) }}
          </span>
        </div>

        <div class="mt-6 pt-6 border-t-2 border-dashed border-gray-100">
          <label class="text-[10px] font-black text-chess-chocolate uppercase tracking-widest block mb-3 text-center">
            Hai un nuovo codice di accesso?
          </label>
          <NuxtLink 
            :to="`/${asdSlug}/join?force=1`" 
            @click="$emit('close')"
            class="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-chess-gold hover:text-chess-dark transition-all py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-chess-dark"
          >
            <Icon name="fa6-solid:plug" /> Inserisci il Token
          </NuxtLink>
        </div>
      </div>

      <button 
        @click="$emit('close')"
        class="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-chess-dark transition-colors border-t border-gray-50"
      >
        Chiudi
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  user: Object,
  asdSlug: String
})

defineEmits(['close'])

const roleLabel = computed(() => {
  if (props.user.role === 'ADMIN') return 'Amministratore Globale'
  if (props.user.role === 'MANAGER') return 'Club Manager'
  return 'Socio Verificato'
})

const roleIcon = computed(() => {
  if (props.user.role === 'ADMIN') return 'fa6-solid:crown'
  if (props.user.role === 'MANAGER') return 'fa6-solid:user-shield'
  return 'fa6-solid:user'
})

const isExpired = computed(() => {
  if (!props.user.expiry_date) return false
  return new Date(props.user.expiry_date) < new Date()
})

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>