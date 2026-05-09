<template>
  <div class="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="space-y-2 text-center">
      <h2 class="text-white text-2xl font-black uppercase tracking-tight">
        Quasi fatto, {{ memberName }}!
      </h2>
      <p class="text-chess-gold/60 text-sm">
        Per attivare il tuo profilo, conferma l'accettazione dei termini legali.
      </p>
    </div>

    <div class="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
      <!--
      <div class="space-y-4">
        <label class="flex items-start gap-3 cursor-pointer group">
          <div class="relative flex items-center">
            <input 
              type="checkbox" 
              v-model="consent"
              class="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-white/20 bg-white/5 checked:border-chess-gold checked:bg-chess-gold transition-all"
            />
            <Icon 
              name="fa6-solid:check" 
              class="absolute h-3.5 w-3.5 text-black opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
            />
          </div>
          <span class="text-white/70 text-[11px] leading-relaxed uppercase font-bold tracking-wider">
            Accetto i <a href="/legal/terms" target="_blank" class="text-chess-gold underline hover:text-white">Termini e Condizioni</a> 
            e la <a href="/legal/privacy" target="_blank" class="text-chess-gold underline hover:text-white">Privacy Policy</a> di MTC Events.
          </span>
        </label>
      </div>

      <button 
        @click="$emit('confirm')" 
        :disabled="!consent || loading"
        class="w-full py-4 font-black uppercase rounded-xl transition-all shadow-lg
               disabled:bg-white/5 disabled:text-white/20
               enabled:bg-chess-gold enabled:text-black enabled:hover:scale-[1.02] enabled:active:scale-95 flex items-center justify-center gap-2"
      >
        <div v-if="loading" class="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
        {{ loading ? 'Attivazione...' : 'Conferma e Attiva' }}
      </button>
      -->  
      <!-- Lista Documenti per consultazione rapida -->
      <div class="grid grid-cols-1 gap-2">
         <a v-for="(doc, key) in availableDocs" :key="key" 
            :href="doc.url" target="_blank"
            class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-chess-gold/50 transition-all group">
            <span class="text-[10px] text-white/60 uppercase font-black tracking-widest group-hover:text-white">
              {{ labelMap[key] }}
            </span>
            <Icon name="fa6-solid:arrow-up-right-from-square" class="text-chess-gold text-xs" />
         </a>
      </div>

      <div class="space-y-4 pt-2">
        <label class="flex items-start gap-4 cursor-pointer group">
          <div class="relative flex items-center mt-1">
            <input 
              type="checkbox" 
              v-model="consent"
              class="peer h-6 w-6 cursor-pointer appearance-none rounded border-2 border-white/20 bg-white/5 checked:border-chess-gold checked:bg-chess-gold transition-all"
            />
            <Icon 
              name="fa6-solid:check" 
              class="absolute h-4 w-4 text-black opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
            />
          </div>
          <span class="text-white/70 text-[11px] leading-relaxed uppercase font-bold tracking-wider">
            Dichiaro di aver letto e accettato i 
            <span class="text-chess-gold">Termini di Servizio</span>, la 
            <span class="text-chess-gold">Privacy Policy</span> e la 
            <span class="text-chess-gold">Cookie Policy</span> sopra indicati.
          </span>
        </label>
      </div>

      <button 
        @click="$emit('confirm')" 
        :disabled="!consent || loading"
        class="w-full py-4 font-black uppercase rounded-xl transition-all shadow-lg
               disabled:bg-white/5 disabled:text-white/20
               enabled:bg-chess-gold enabled:text-black enabled:hover:scale-[1.02] enabled:active:scale-95 flex items-center justify-center gap-2"
      >
        <Icon v-if="!loading" name="fa6-solid:shield-check" />
        <div v-else class="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
        {{ loading ? 'Registrazione...' : 'Conferma e Attiva' }}
      </button>
    </div>

    <button @click="$emit('back')" class="text-white/20 text-[10px] uppercase font-black tracking-widest hover:text-white w-full">
      Torna all'inserimento codice
    </button>
  </div>
</template>

<script setup>
defineProps({
  memberName: String,
  loading: Boolean,
  availableDocs: Object // Passiamo qui i dati da legalDocs.value
})
defineEmits(['confirm', 'back'])
const consent = ref(false)
const labelMap = {
  terms: 'Termini e Condizioni',
  privacy: 'Privacy Policy',
  cookies: 'Cookie Policy'
}
</script>