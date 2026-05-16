<template>
  <header
    class="w-full h-16 bg-chess-dark text-white border-b border-white/10 sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between shadow-lg">
    <div class="flex items-center gap-4 relative">
      <div class="w-9 h-9 rounded flex items-center justify-center overflow-hidden">
        <img v-if="info?.logo_url" :src="info.logo_url" class="w-full h-full object-contain" />
        <Icon v-else name="fa6-solid:chess-knight" class="text-chess-gold text-lg" />
      </div>

      <div class="relative">
        <button @click="toggleDropdown" class="flex items-center gap-3 transition-colors group"
          :class="canSwitch ? 'cursor-pointer hover:text-chess-gold' : 'cursor-default'">
          <h1 class="font-bold text-xs md:text-sm uppercase tracking-[0.15em] text-white group-hover:text-inherit">
            {{ info?.name }}
          </h1>
          <Icon v-if="canSwitch" name="fa6-solid:chevron-down" size="10"
            class="text-white/30 group-hover:text-chess-gold transition-transform"
            :class="{ 'rotate-180': isDropdownOpen }" />
        </button>

        <div v-if="isDropdownOpen"
          class="absolute top-full left-0 mt-4 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in slide-in-from-top-2 duration-200">
          <div class="p-3 bg-gray-50 border-b border-gray-100">
            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">I tuoi Club</p>
          </div>
          <div class="max-h-60 overflow-y-auto">
            <NuxtLink v-for="slug in otherAsds" :key="slug" :to="`/${slug}/`" @click="isDropdownOpen = false"
              class="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors group text-chess-dark">
              <div
                class="w-8 h-8 rounded bg-chess-dark flex items-center justify-center text-[10px] font-bold text-white uppercase group-hover:bg-chess-gold transition-colors">
                {{ slug.substring(0, 2) }}
              </div>
              <span class="text-xs font-bold uppercase tracking-tight">{{ slug }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="hidden md:block flex-1 mx-8">
      <div class="relative">
        <Icon name="fa6-solid:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          size="14" />
        <input 
          v-model="searchQuery"
          type="text" placeholder="Cerca nel club..."
          class="w-full bg-white/5 border border-white/10 rounded-md py-1.5 pl-10 text-xs text-white focus:bg-white/10 focus:border-chess-gold outline-none transition-all">
      </div>
    </div>

    <NuxtLink 
      v-if="currentUser.role === 'GUEST' && info?.slug" 
      :to="`/${info.slug}/join`"
      class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all mr-4 text-xs font-medium tracking-wide"
    >
      <Icon name="fa6-solid:id-card" size="13" />
      <span>Sei Socio?</span>
    </NuxtLink>

    <div v-if="currentUser.role !== 'GUEST'"
      @click="showProfileModal = true"
      class="flex items-center gap-3 pl-4 border-l border-white/10 animate-in fade-in slide-in-from-right-2">
      <div class="text-right hidden sm:block">
        <p class="text-[9px] font-black uppercase tracking-widest leading-none mb-1" :class="{
          'text-red-400': currentUser.role === 'MANAGER',
          'text-chess-gold': currentUser.role === 'ADMIN' || currentUser.role === 'MEMBER'
        }">
          {{
            currentUser.role === 'ADMIN' ? 'Admin' :
              (currentUser.role === 'MANAGER' ? 'Club Manager' : 'Socio Verificato')
          }}
        </p>
        <p class="text-xs font-bold text-white truncate max-w-[120px]">
          {{ currentUser.name }}
        </p>
      </div>

      <div class="w-9 h-9 rounded-lg flex items-center justify-center border transition-all shadow-inner" :class="{
        'bg-red-500/10 border-red-500/30 text-red-500': currentUser.role === 'MANAGER',
        'bg-chess-gold/10 border-chess-gold/30 text-chess-gold': currentUser.role === 'ADMIN' || currentUser.role === 'MEMBER'
      }">
        <Icon :name="currentUser.role === 'ADMIN' ? 'fa6-solid:crown' :
            (currentUser.role === 'MANAGER' ? 'fa6-solid:user-shield' : 'fa6-solid:user')
          " size="16" />
      </div>
    </div>

    

    <div v-if="isDropdownOpen" @click="isDropdownOpen = false" class="fixed inset-0 z-40"></div>
  </header>

  <Teleport to="body">
    <ProfileModal 
      v-if="showProfileModal" 
      :user="currentUser" 
      :asd-slug="info?.slug"
      @close="showProfileModal = false" 
    />
  </Teleport>
</template>

<script setup>
const { searchQuery, executeSearch } = useSearch()
const route = useRoute()
// Esegui la ricerca quando l'utente scrive (con un piccolo debounce)
watch(searchQuery, () => {
  const slug = route.params.asd_slug
  if (slug) executeSearch(slug, props.isManager)
})

const props = defineProps({
  info: Object,
  isManager: Boolean
})

const userStore = useUserStore()
const isDropdownOpen = ref(false)
const showProfileModal = ref(false)

const canSwitch = computed(() => userStore.followedAsds.length > 1)

const otherAsds = computed(() => {
  return userStore.followedAsds.filter(slug => slug !== props.info?.slug)
})

const toggleDropdown = () => {
  if (canSwitch.value) {
    isDropdownOpen.value = !isDropdownOpen.value
  }
}

const currentUser = computed(() => {
  const slug = props.info?.slug
  const authData = userStore.auth // Dati di login (Admin/Manager) [cite: 2026-02-07]
  const profile = slug ? userStore.identities[slug] : null

  
  // Dati base per tutti i ruoli loggati
  const baseData = {
    name: authData?.name || profile?.name || 'Utente',
    surname: authData?.surname || profile?.surname || '',
    email: authData?.email || profile?.email || '',
    expiry_date: profile?.expiry_date || null
  }

  if (authData?.is_admin === true || authData?.is_admin === "true") {
    return { ...baseData, role: 'ADMIN' }
  }

  if (props.isManager && authData) {
    return { ...baseData, role: 'MANAGER' }
  }

  if (profile && profile.role !== 'GUEST') {
    return { ...baseData, role: 'MEMBER' }
  }
  return { name: 'Visitatore', role: 'GUEST' }
})
</script>