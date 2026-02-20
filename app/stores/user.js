import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    // Lista delle identità dell'utente (una per ogni ASD visitata)
    // Struttura: { asd_slug: { email, name, start_date, expiry_date, role } }
    identities: {},
    // Array degli slug visitati per mantenere l'ordine e facilitare il menu switch
    followedAsds: [],
    // Token FCM per le notifiche
    fcmToken: null
  }),

  actions: {
    // Inizializza lo store caricando i dati dal localStorage
    initStore() {
      if (process.server) return
      const saved = localStorage.getItem('user_data')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.$patch(parsed) // Metodo rapido di Pinia per aggiornare lo stato
        console.log('📦 Store caricato dal LocalStorage:', parsed)
      }
    },

    // Salva lo stato attuale nel localStorage
    saveToLocal() {
      if (process.server) return
      const dataToSave = {
        identities: this.identities,
        followedAsds: this.followedAsds,
        fcmToken: this.fcmToken
      }
      localStorage.setItem('user_data', JSON.stringify(dataToSave))
      console.log('💾 Dati salvati nel LocalStorage:', dataToSave)
    },
    /**
     * Registra l'interesse per una ASD e inizializza il profilo se nuovo
     */
    trackAsdVisit(slug) {
      if (!slug) return // Sicurezza
      if (!this.followedAsds.includes(slug)) {
        this.followedAsds.push(slug)
        this.identities[slug] = {
          email: null,
          name: 'Visitatore',
          expiry_date: null,
          role: 'GUEST'
        }
        this.saveToLocal()
      }
    },

    /**
     * Collega i dati reali di un socio (da QR o Email) a una specifica ASD
     */
    setAsdProfile(slug, profileData) {
      this.identities[slug] = {
        ...this.identities[slug],
        ...profileData
      }
      // Se non era già nei seguiti, lo aggiungiamo
      if (!this.followedAsds.includes(slug)) {
        this.followedAsds.push(slug)
      }
      this.saveToLocal()
    },

    setFcmToken(token) {
      this.fcmToken = token
    }
  },

})