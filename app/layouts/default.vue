<template>
  <div class="min-h-screen bg-chess-surface flex flex-col font-sans text-chess-dark">



    <AppHeader :info="asdInfo" :isManager="isManager" />


    <div class="flex flex-1 w-full">

      <AppSidebar v-if="isManager" />

      <main class="flex-1 px-4 pb-4 pt-4 md:p-10 max-w-7xl mx-auto w-full">
        <div class="md:hidden mb-2">
          <div class="relative">
            <Icon name="fa6-solid:magnifying-glass" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cerca eventi o soci..."
              class="w-full bg-white border border-gray-200 rounded-xl px-11 py-3 text-sm shadow-sm focus:border-chess-gold focus:ring-0 outline-none">
          </div>
        </div>

        <slot />
      </main>
    </div>

    <AppMobileNav :isManager="isManager" />
  </div>
</template>

<script setup>
import { useAsdStore } from '~/stores/asd'
const asdStore = useAsdStore()
const userStore = useUserStore()
const route = useRoute()

const asdInfo = computed(() => asdStore.info)

const isManager = computed(() => {
  const auth = userStore.auth
  if (!auth) return false

  // Se è SuperAdmin ha poteri di gestione ovunque
  if (auth.is_admin) return true

  // Altrimenti controlliamo se lo slug attuale è nella sua lista di gestione
  const currentSlug = route.params.asd_slug
  return auth.managed_asds?.some(asd => asd.asd_slug === currentSlug)
})
</script>

<style scoped>
.bg-chess-surface {
  background-color: #f4f4f2;
  position: relative;
  z-index: 0;
  /* Rimuoviamo i gradienti invisibili e usiamo un unico gradiente di profondità */
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%);
  background-attachment: fixed;
}

/* Onda Superiore */
.bg-chess-surface::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 400px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23e9e9e7' fill-opacity='1' d='M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,202.7C960,224,1056,224,1152,202.7C1248,181,1344,139,1392,117.3L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: cover;
  z-index: -1;
  pointer-events: none;
}

/* Onda Inferiore */
.bg-chess-surface::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 400px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23e9e9e7' fill-opacity='1' d='M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: cover;
  z-index: -1;
  pointer-events: none;
}
</style>