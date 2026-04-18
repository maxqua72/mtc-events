// stores/pwa.js
import { defineStore } from 'pinia'

export const usePwaStore = defineStore('pwa', {
  state: () => ({
    deferredPrompt: null,    // L'evento per Android/PC
    //isInstalled: false,      // Stato calcolato o confermato
    showInstallGuidance: false, // Per il modal di iOS
    platform: 'unknown',     // 'ios', 'android', 'desktop'
    isAlreadyStandalone: false
  }),

  getters: {
    // Getter per sapere se mostrare il tasto "Installa"
    canInstall: (state) => {
      // Se siamo già in modalità standalone (PWA aperta), non mostriamo nulla
      if (process.server) return false
      if (state.isAlreadyStandalone) return false
      if (state.platform === 'ios') return true
      return !!state.deferredPrompt
    }
  },

  actions: {
    initPwaDetection() {
      if (process.server) return

      this.isAlreadyStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone

      // 1. Rilevamento Piattaforma
      const ua = navigator.userAgent
      if (/iPad|iPhone|iPod/.test(navigator.platform) || (ua.includes("Mac") && "ontouchend" in document)) {
        this.platform = 'ios'
      } else if (/Android/.test(ua)) {
        this.platform = 'android'
      } else {
        this.platform = 'desktop'
      }
/*
      // 2. Ascolto evento installazione (Android/PC)
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        this.deferredPrompt = e
        console.log('✅ Evento beforeinstallprompt intercettato')
      })

      // 3. Ascolto installazione avvenuta
      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null
        this.isInstalled = true
        console.log('🎉 PWA installata con successo')
      })*/
    },

    async installApp() {
      if (this.platform === 'ios') {
        // Su iOS non c'è automatismo, mostriamo il tuo tutorial
        this.showInstallGuidance = true
      } else if (this.deferredPrompt) {
        // Su Android/PC scateniamo il prompt nativo
        this.deferredPrompt.prompt()
        const { outcome } = await this.deferredPrompt.userChoice
        if (outcome === 'accepted') {
          this.deferredPrompt = null
        }
      }
    }
  }
})