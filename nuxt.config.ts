// https://nuxt.com/docs/api/configuration/nuxt-config
import pkg from './package.json'

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

    // Variabili solo lato server (es. per inviare notifiche)
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,

    public: {
      version: pkg.version, // Rende la versione dell'app accessibile anche lato client
      // Variabili accessibili anche lato client (per ricevere notifiche)
      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
        vapidKey: process.env.NUXT_PUBLIC_FIREBASE_VAPID_KEY
      }
    }

  },
  css: ['@/assets/css/main.css'],
  pwa: {
    disable: process.dev, // Disabilita PWA in sviluppo per evitare cache aggressive
    registerType: 'autoUpdate', //-- aggiorna senza avvertire l'utente (non ideale per app con dati dinamici come la nostra)
    //registerType: 'prompt',
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
      ],

      protocol_handlers: [
        {
          protocol: "web+mtcevents",
          url: "/join?t=%s"
        }
      ],

    },
    workbox: {
      navigateFallback: '/',
      // Opzionale: evita che le API vengano intercettate dal fallback
      navigateFallbackDenylist: [/^\/api/],
      skipWaiting: false,   // Impedisce l'aggiornamento automatico silente
      clientsClaim: true,   // Permette al nuovo SW di prendere il controllo subito dopo l'attivazione
      cleanupOutdatedCaches: true,
      // Evita che workbox blocchi le icone e le api
      //globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/.*$/,
          handler: 'NetworkOnly', // Non cercare in cache, vai sempre dritto al server
        }
      ],

      // firebase 
      importScripts: ['/firebase-messaging-sw.js']
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600 // Controlla ogni ora
      //periodicSyncForUpdates: 60 // Controlla ogni ora
    },
    devOptions: {
      enabled: true,
      type: 'module',
    }
  },
  nitro: {
    // Forza Nitro a includere queste librerie direttamente nel bundle index.mjs
    // Invece di cercarle nella cartella node_modules del server
    experimental: {
      openAPI: false // opzionale, per snellire
    },
    externals: {
      inline: [
        'firebase-admin',
        '@google-cloud/firestore',
        '@iconify/utils',
        'mongodb',
        'bson',
        'mongodb-connection-string-url',
        '@mongodb-js/saslprep',
        'resend',      
        'date-fns'     
      ]
    }
  },
  // Importante per le icone: forziamo il build locale

  build: {
    transpile: [
      'firebase-admin',
      '@google-cloud/firestore',
      'google-gax',
      '@iconify/utils',
      'mongodb',
      'resend'        
    ]
  }
})