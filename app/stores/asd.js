// app/stores/asd.js
import { defineStore } from 'pinia'

export const useAsdStore = defineStore('asd', {
  state: () => ({
    info: null,
    loading: false
  }),
  actions: {
    async loadAsd(slug) {
      if (this.info?.slug === slug) return
      this.loading = true
      try {
        const { data } = await useFetch(`/api/asd/${slug}`)
        if (data.value) this.info = data.value
      } finally {
        this.loading = false
      }
    }
  }
})