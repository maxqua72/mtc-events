<template>
  <div class="min-h-screen bg-chess-surface flex items-center justify-center p-6 font-sans">
    <div class="max-w-md w-full text-center">
      <div class="mb-8 relative inline-block">
        <Icon name="fa6-solid:chess-king" size="80" class="text-chess-dark opacity-10" />
        <Icon name="fa6-solid:circle-exclamation" size="30" class="absolute -bottom-2 -right-2 text-red-500" />
      </div>

      <h1 class="text-64 font-black text-chess-dark leading-none mb-2">404</h1>
      <h2 class="text-xl font-bold text-chess-chocolate uppercase tracking-widest mb-4">Mossa non valida</h2>
      
      <p class="text-gray-500 mb-8 leading-relaxed">
        {{ error.statusMessage || "Spiacenti, l'associazione sportiva che stai cercando non esiste o è stata rimossa." }}
      </p>

      <button 
        @click="handleClearError"
        class="bg-chess-dark text-chess-gold px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
      >
        Torna alla Home
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  error: Object
})

const handleClearError = () => {
  // Pulisce l'errore e reindirizza alla home
  clearError({ redirect: '/' })
}
</script>