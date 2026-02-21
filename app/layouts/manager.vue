<template>
  <div class="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-100">
    <header class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 w-full z-50 px-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-7 h-7 rounded-lg shadow-sm border border-black/5" :style="{ backgroundColor: asd?.theme_color }"></div>
        <h1 class="font-extrabold text-sm tracking-tight uppercase">{{ asd?.name }}</h1>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="hidden md:block text-right">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsabile</p>
          <p class="text-xs font-semibold">Area Manager</p>
        </div>
        <button @click="logout" class="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
          <span class="text-lg">↳</span>
        </button>
      </div>
    </header>

    <aside class="hidden md:flex flex-col w-64 fixed top-16 bottom-0 border-r border-slate-200 bg-white p-4">
      <nav class="space-y-1 flex-1">
        <NuxtLink :to="`/${asdSlug}/manager/dashboard`" class="nav-link" active-class="nav-active">
          <span class="icon">📊</span> Dashboard
        </NuxtLink>
        <NuxtLink :to="`/${asdSlug}/manager/memberships`" class="nav-link" active-class="nav-active">
          <span class="icon">👥</span> Soci
        </NuxtLink>
        <NuxtLink :to="`/${asdSlug}/manager/events`" class="nav-link" active-class="nav-active">
          <span class="icon">📅</span> Eventi
        </NuxtLink>
      </nav>
      
      <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <p class="text-[10px] font-bold text-slate-400 uppercase mb-2">Supporto</p>
        <p class="text-xs text-slate-600 leading-relaxed">Hai bisogno di aiuto con la piattaforma?</p>
      </div>
    </aside>

    <nav class="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 h-16 flex justify-around items-center z-50 pb-safe">
      <NuxtLink :to="`/${asdSlug}/manager/dashboard`" 
        class="flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400" 
        active-class="text-slate-900">
        <Icon name="fa6-solid:chart-line" size="20" /> <span>Dashboard</span>
      </NuxtLink>
      <NuxtLink :to="`/${asdSlug}/manager/memberships`" 
      class="flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400" 
        active-class="text-slate-900">
        <Icon name="fa6-solid:users" size="20" /> <span>Soci</span>
      </NuxtLink>
      <NuxtLink :to="`/${asdSlug}/manager/events`" 
        class="flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400" 
        active-class="text-slate-900">
        <Icon name="fa6-solid:calendar-days" size="20" /> <span>Eventi</span>
      </NuxtLink>
    </nav>

    <main class="pt-16 pb-20 md:pb-0 md:pl-64 min-h-screen">
      <div class="p-4 md:p-10 max-w-6xl mx-auto">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.nav-link {
  @apply flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all;
}
.nav-active {
  @apply bg-slate-900 text-white hover:bg-slate-800 hover:text-white shadow-lg shadow-slate-200;
}
.icon {
  @apply text-lg;
}
</style>

<script setup>
const route = useRoute()
const asdSlug = route.params.asd_slug
const { data: asd } = await useFetch(`/api/manager/${asdSlug}/info`)

const logout = () => {
  localStorage.removeItem('user_auth')
  navigateTo('/login')
}
</script>