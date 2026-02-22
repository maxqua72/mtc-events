// app/stores/asd.js
import { defineStore } from 'pinia'

export const useAsdStore = defineStore('asd', {
  state: () => ({
    info: null,
    loading: false
  }),
  actions: {
    async loadAsd(slug) {
      // Doppia sicurezza: evitiamo chiamate doppie
      if (this.info?.slug === slug) return
      
      this.loading = true
      try {
        // Usiamo $fetch per le chiamate dentro le actions
        const data = await $fetch(`/api/asd/${slug}`)
        if (data) {
          this.info = data
          console.log(`✅ Store ASD popolato per: ${slug}`)
        }
      } catch (error) {
        console.error("❌ Errore caricamento ASD nello store:", error)
        this.info = null
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})