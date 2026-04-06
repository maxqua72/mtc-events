<script setup>
const config = useRuntimeConfig()
const version = config.public.version
const isStandalone = ref(false)

onMounted(() => {
  // 2. Eseguiamo il controllo solo quando il componente è montato nel browser
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches 
                      || window.navigator.standalone 
                      || document.referrer.includes('android-app://');
})
</script>

<template>
  <div class="flex items-center gap-1.5 opacity-30 hover:opacity-100 transition-opacity duration-300 cursor-default select-none">
    <span class="font-mono text-[9px] font-medium uppercase tracking-[0.15em] text-chess-gold">
      v{{ version }} {{ isStandalone ? 'PWA' : 'Web' }}
    </span>
  </div>
</template>