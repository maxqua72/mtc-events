<template>
  <!--
  <nav class="md:hidden fixed bottom-0 w-full bg-chess-dark text-white border-t border-white/10 h-16 flex justify-around items-center px-4 z-50">
    <button class="flex flex-col items-center gap-1 text-chess-gold">
      <Icon name="fa6-solid:calendar-check" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">Eventi</span>
    </button>
    <button class="flex flex-col items-center gap-1 text-white/50">
      <Icon name="fa6-solid:magnifying-glass" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">Cerca</span>
    </button>
    <button v-if="isManager" class="flex flex-col items-center gap-1 text-white/50">
      <Icon name="fa6-solid:user-gear" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">Admin</span>
    </button>
  </nav>
  -->
  <nav class="md:hidden fixed bottom-0 w-full bg-chess-dark text-white border-t border-white/10 h-16 flex justify-around items-center px-2 z-50">
    
    <NuxtLink 
      :to="asdSlug ? `/${asdSlug}/events` : '/'" 
      class="flex flex-col items-center gap-1 text-white/50 w-full"
      active-class="!text-chess-gold"
    >
      <Icon name="fa6-solid:calendar-check" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">Eventi</span>
    </NuxtLink>

    <NuxtLink 
      v-if="isManager || isAdmin"
      :to="asdSlug ? `/${asdSlug}/manager/dashboard` : '/search'" 
      class="flex flex-col items-center gap-1 text-white/50 w-full"
      active-class="!text-chess-gold"
    >
      <Icon :name="asdSlug ? 'fa6-solid:chess-board' : 'fa6-solid:magnifying-glass'" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">
        {{ asdSlug ? 'Dash' : 'Cerca' }}
      </span>
    </NuxtLink>

    <NuxtLink 
      v-if="isManager || isAdmin"
      :to="adminLink" 
      class="flex flex-col items-center gap-1 text-white/50 w-full"
      active-class="!text-chess-gold"
    >
      <Icon :name="isAdmin && !asdSlug ? 'fa6-solid:screwdriver-wrench' : 'fa6-solid:pen-to-square'" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">
        {{ isAdmin && !asdSlug ? 'Global' : 'Edita' }}
      </span>
    </NuxtLink>

    <NuxtLink 
      v-if="asdSlug && isManager"
      :to="`/${asdSlug}/manager/memberships`" 
      class="flex flex-col items-center gap-1 text-white/50 w-full"
      active-class="!text-chess-gold"
    >
      <Icon name="fa6-solid:users-rectangle" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">Soci</span>
    </NuxtLink>
  </nav>
</template>

<script setup>
import { useUserStore } from '~/stores/user'

const props = defineProps({
  isManager: Boolean
})

const route = useRoute()
const userStore = useUserStore()

// Recuperiamo lo slug dalla rotta attuale
const asdSlug = computed(() => route.params.asd_slug)

// Verifica Admin (Uniformata alla sidebar)
const isAdmin = computed(() => {
  return userStore.auth?.is_admin === true || userStore.auth?.is_admin === "true"
})

// Logica per il link Admin dinamico
const adminLink = computed(() => {
  // 1. Se siamo Admin globale e non c'è uno slug, andiamo alla gestione ASD
  if (isAdmin.value && !asdSlug.value) return '/admin'
  
  // 2. Se c'è uno slug, andiamo alla gestione eventi di quel club
  if (asdSlug.value) return `/${asdSlug.value}/manager/events`
  
  // 3. Fallback
  return '/'
})
</script>

<style scoped>
/* Rende il tocco più facile su mobile senza ingrandire le icone */
a {
  -webkit-tap-highlight-color: transparent;
}
</style>