<template>
  <div class="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
    <button 
      v-for="filter in filters" 
      :key="filter"
      @click="$emit('update:modelValue', filter)"
      class="px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap"
      :class="modelValue === filter 
        ? 'bg-chess-dark text-chess-gold border-chess-dark shadow-md' 
        : 'bg-white/50 text-gray-500 border-gray-300 hover:border-chess-dark hover:text-chess-dark'"
    >
      {{ filter }}
    </button>
  </div>
</template>

<script setup>
defineProps(['modelValue', 'filters'])
defineEmits(['update:modelValue'])
</script>