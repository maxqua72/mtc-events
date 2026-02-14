// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt', '@nuxtjs/tailwindcss', '@nuxt/icon', '@pinia/nuxt', '@nuxt/image'],
  image: {
    format: ['webp'],
    // Opzionale: definisci dimensioni standard per le tue card
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
    },
  },
  icon: {
    serverBundle: process.env.NODE_ENV === 'production' ? 'local' : 'remote', // Scarica le icone solo quando servono durante lo sviluppo
  },
  runtimeConfig: {
    // Le chiavi qui dentro sono visibili solo Server-side
    mongodbUri: process.env.MONGODB_URI || 'mongodb://0.0.0.0:27017/mtc_events',
    
  },
  css: ['@/assets/css/main.css'],
  pwa: {
    // configurazione minima per ora
    manifest: {
      name: 'MTC Events',
      short_name: 'MTCEvents',
      theme_color: '#ffffff',
    },
    workbox: {
      navigateFallback: '/',
    },
    devOptions: {
      enabled: true, // Permette di testare la PWA anche in locale
      type: 'classic',
    }
  }
})