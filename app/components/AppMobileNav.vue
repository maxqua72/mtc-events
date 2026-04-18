<template>

  <nav
    class="md:hidden fixed bottom-0 w-full bg-chess-dark text-white border-t border-white/10 h-16 flex justify-around items-center px-2 z-50">

    <NuxtLink :to="asdSlug ? `/${asdSlug}/events` : '/'" class="flex flex-col items-center gap-1 text-white/50 w-full"
      active-class="!text-chess-gold">
      <Icon name="fa6-solid:calendar-check" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">Eventi</span>
    </NuxtLink>

    <NuxtLink v-if="isManager || isAdmin" :to="asdSlug ? `/${asdSlug}/manager/dashboard` : '/search'"
      class="flex flex-col items-center gap-1 text-white/50 w-full" active-class="!text-chess-gold">
      <Icon :name="asdSlug ? 'fa6-solid:chess-board' : 'fa6-solid:magnifying-glass'" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">
        {{ asdSlug ? 'Dash' : 'Cerca' }}
      </span>
    </NuxtLink>

    <NuxtLink v-if="isManager || isAdmin" :to="adminLink" class="flex flex-col items-center gap-1 text-white/50 w-full"
      active-class="!text-chess-gold">
      <Icon :name="isAdmin && !asdSlug ? 'fa6-solid:screwdriver-wrench' : 'fa6-solid:pen-to-square'" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">
        {{ isAdmin && !asdSlug ? 'Global' : 'Edita' }}
      </span>
    </NuxtLink>

    <NuxtLink v-if="asdSlug && isManager" :to="`/${asdSlug}/manager/memberships`"
      class="flex flex-col items-center gap-1 text-white/50 w-full" active-class="!text-chess-gold">
      <Icon name="fa6-solid:users-rectangle" size="20" />
      <span class="text-[9px] font-bold uppercase tracking-tighter">Soci</span>
    </NuxtLink>

    <button v-if="pwaStore.canInstall && !isPWA()" @click="pwaStore.installApp()"
      class="flex flex-col items-center gap-1 text-chess-coral w-full">
      <div class="relative">
        <Icon name="fa6-solid:circle-down" size="20" class="text-xl group-active:scale-95 transition-transform" />
        
      </div>
      <span class="text-[9px] font-black uppercase tracking-tighter">Installa</span>
    </button>

    <NuxtLink v-if="asdSlug && !isMember && !isManager" :to="`/${asdSlug}/join`"
      class="flex flex-col items-center gap-1 text-white/50 w-full">
      <Icon name="fa6-solid:id-card"  size="20" class="text-xl animate-pulse" />
      <span class="text-[9px] font-bold uppercase italic tracking-tighter text-center leading-[1.1]">
        Sei<br />Socio?
      </span>
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
const pwaStore = usePwaStore()
const { isPWA } = usePwaUtils()

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

const isMember = computed(() => {
  // Accediamo all'identità specifica usando lo slug reattivo
  const identity = userStore.identities[asdSlug.value]

  // Verifichiamo email esistente e stato attivo
  return !!identity?.email //&& identity?.status === 'active'
})
</script>

<style scoped>
/* Rende il tocco più facile su mobile senza ingrandire le icone */
a {
  -webkit-tap-highlight-color: transparent;
}
</style>