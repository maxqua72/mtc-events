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
    registerType: 'autoUpdate',
    manifest: {
      id: '/',
      name: 'MTC Events',
      short_name: 'MTCEvents',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: 'pwa-192x192.png', // DEVE ESSERE IN /public
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png', // DEVE ESSERE IN /public
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      screenshots: [
        {
          src: '/screenshot-mobile.png',
          sizes: '1170x2532', // Valore esatto segnalato da Chrome
          type: 'image/png',
          label: 'MTC Events Mobile'
        },
        {
          src: '/screenshot-desktop.png',
          sizes: '1280x720', // Valore esatto segnalato da Chrome
          type: 'image/png',
          form_factor: 'wide',
          label: 'MTC Events Desktop'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      // Opzionale: evita che le API vengano intercettate dal fallback
      navigateFallbackDenylist: [/^\/api/], 
    },
    devOptions: {
      enabled: true,
      type: 'module',
    }
  }
})