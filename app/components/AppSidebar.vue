<template>
  <aside class="hidden md:block w-64 bg-chess-iron border-r border-gray-600/20 shadow-sm">
    <div class="sticky top-16 p-6 h-[calc(100vh-16px)] flex flex-col">
      <nav class="flex-1 space-y-8">

        <div v-if="isAdmin">
          <p class="text-[10px] font-bold text-chess-gold uppercase tracking-[0.2em] mb-4">
            Admin
          </p>
          <ul class="space-y-1">
            <li>
              <NuxtLink to="/admin"
                class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-black text-white bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                active-class="!text-chess-gold !border-chess-gold/50 shadow-lg shadow-black/20">
                <Icon name="fa6-solid:screwdriver-wrench" size="14" />
                <span>Gestione ASD</span>
              </NuxtLink>
            </li>
          </ul>
          <div class="mt-6 border-t border-white/10"></div>
        </div>
        <div v-if="asdSlug">
          <p class="text-[10px] font-bold text-chess-gold/100 uppercase tracking-[0.2em] mb-4">
            Club Management
          </p>

          
          <ul class="space-y-1">
            <li v-for="item in menuItems" :key="item.label">
              <NuxtLink :to="item.to"
                class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all group"
                active-class="!text-chess-gold bg-white/10">
                <Icon :name="item.icon" size="14" class="opacity-80" />
                <span>{{ item.label }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div v-else-if="isAdmin" class="p-4 bg-black/10 rounded-lg border border-white/5">
          <p class="text-[10px] text-gray-400 italic">
            Seleziona un club dalla dashboard per accedere alla gestione specifica.
          </p>
        </div>
      </nav>

      <div class="pt-4 border-t border-white/10 flex items-center gap-3">
        <div class="w-6 h-6 rounded bg-black/20 flex items-center justify-center">
          <Icon :name="isAdmin ? 'fa6-solid:shield-halved' : 'fa6-solid:user-tie'" class="text-gray-400 text-[10px]" />
        </div>
        <span class="text-[10px] font-bold text-gray-400 tracking-tighter uppercase">
          {{ isAdmin ? 'Admin Mode' : 'Manager Mode' }}
        </span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useUserStore } from '~/stores/user'
const route = useRoute()
const userStore = useUserStore()
const asdSlug = computed(() => route.params.asd_slug)

const isAdmin = computed(() => {
  // Gestiamo sia il booleano che la stringa per sicurezza [cite: 2026-02-07]
  return userStore.auth?.is_admin === true || userStore.auth?.is_admin === "true"
})

// 3. I menuItems devono essere reattivi allo slug attuale
const menuItems = computed(() => {
  if (!asdSlug.value) return []
  
  return [
    { label: 'Dashboard', icon: 'fa6-solid:chess-board', to: `/${asdSlug.value}/manager/dashboard` },
    { label: 'Eventi Pubblicati', icon: 'fa6-solid:calendar-days', to: `/${asdSlug.value}/events` },
    { label: 'Gestione Eventi', icon: 'fa6-solid:calendar-check', to: `/${asdSlug.value}/manager/events` },
    { label: 'Anagrafica Soci', icon: 'fa6-solid:users-rectangle', to: `/${asdSlug.value}/manager/memberships` },
    { label: 'Risorse', icon: 'fa6-solid:folder-open', to: `/${asdSlug.value}/manager/resources` },
  ]
})
</script>