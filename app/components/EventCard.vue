<template>
  <NuxtLink :to="slug"
    class="bg-chess-pearl border rounded-lg overflow-hidden transition-all hover:shadow-xl group flex flex-col h-full cursor-pointer relative"
    :class="[
      // Se non è pubblicato, bordo tratteggiato e ambra, altrimenti bordo grigio standard
      !event.is_published
        ? 'border-dashed border-gray-400/100 bg-yellow-50/80'
        : 'border-gray-200 hover:border-chess-gold/30'
    ]">


    <div v-if="!event.is_published"
      class="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.05] select-none flex flex-wrap justify-center items-center">
      <div v-for="n in 12" :key="n" class="text-[24px] font-black uppercase tracking-[0.1em] -rotate-45 whitespace-nowrap p-4 
           ">
        Bozza
      </div>
    </div>
    <div class="relative z-10 flex flex-col h-full">

      <div class="absolute top-2.5 left-3 z-20">
        <span v-if="!event.is_published"
          class="text-[10px] font-black bg-amber-500 text-white px-2 py-1 rounded shadow-sm uppercase tracking-wider">
          Bozza
        </span>
      </div>

      <div class="h-12 overflow-hidden relative border-b border-gray-100 bg-chess-dark">
        <img :src="displayImage" :alt="event.title" format="webp"
          class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          :class="{ 'grayscale-[0.4] opacity-80': !event.is_published }" />

        <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>

        <div class="absolute bottom-3 right-3">
          <span
            class="text-[12px] font-black text-chess-gold uppercase tracking-[0.15em] py-1 px-2 bg-chess-dark/90 rounded shadow-sm">
            {{ event.category }}
          </span>
        </div>
      </div>

      <div class="p-5 flex-1 flex flex-col justify-center">
        <p class="text-[11px] font-black text-chess-chocolate tracking-widest mb-1.5">
          <span class="uppercase">{{ formattedDate }}</span> <span class="mx-1 opacity-30">|</span><span>{{ timeRange
          }}</span>
        </p>

        <div class="flex items-start gap-3 mb-2 group">
          <div v-if="circuitLogo" class="flex-shrink-0 w-8 h-8 p-0 flex items-center justify-center ">
            <img :src="circuitLogo" class="max-w-full max-h-full object-contain" alt="Logo Circuito" />
          </div>

          <h3
            class="text-xl font-bold text-chess-dark leading-tight group-hover:text-chess-brown transition-colors line-clamp-2">
            {{ event.title }}
          </h3>
        </div>



        <div class="mt-auto pt-2">
          <component :is="event.link_map ? 'button' : 'div'" @click.stop.prevent="event.link_map ? openMap() : null"
            class="flex items-center gap-1.5 text-xs font-medium transition-colors w-fit"
            :class="event.link_map ? 'text-chess-gold hover:text-chess-gold/80 cursor-pointer' : 'text-gray-400'">
            <Icon name="fa6-solid:location-dot" :class="event.link_map ? 'text-chess-gold' : 'text-chess-gold/60'"
              size="12" />
            <span :class="{ 'underline underline-offset-2 decoration-chess-gold/30': event.link_map }">
              {{ event.location }}
            </span>
          </component>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps(['event', 'slug'])
const asdStore = useAsdStore()

const formattedDate = computed(() => {
  const date = new Date(props.event.start_date)
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: '2-digit',
    month: 'short'
  }).replace(/^\w/, (c) => c.toUpperCase())
})

// Gestione dinamica "dalle ... alle"
const timeRange = computed(() => {
  const start = new Date(props.event.start_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  if (props.event.end_time && (!props.event.end_date || props.event.end_date === props.event.start_date)) {
    const end = new Date(props.event.start_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    return `dalle ${start} alle ${end}`
  }

  return `ore ${start}`
})

const openMap = () => {
  if (props.event.link_map) {
    window.open(props.event.map_url, '_blank')
  }
}

// Logica immagine (inclusa correzione case-insensitive)
const displayImage = computed(() => {
  if (props.event.image_url) return props.event.image_url

  const category = props.event.category?.toLowerCase()
  if (category === 'torneo') return '/img/torneo.png'
  if (category === 'corso') return '/img/corsi.png'

  return '/img/torneo.png'
})

const circuitLogo = computed(() => {
  if (!props.event.circuit || props.event.circuit === 'none') return null

  if (props.event.circuit === 'fsi') return '/img/Logo_FSI_opt.svg'
  if (props.event.circuit === 'uisp') return '/img/Logo_UISP_opt.png'
  if (props.event.circuit === 'fide') return '/img/Logo_FIDE.webp'

  // Se interno, prendiamo il logo dallo store dell'ASD attuale
  if (props.event.circuit === 'internal') {
    return asdStore.info?.logo_url
  }

  return null
})
</script>