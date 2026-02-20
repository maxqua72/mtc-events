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

                // Uniamo gli slug: prendiamo quelli salvati e aggiungiamo quelli 
                // eventualmente già presenti nello stato (caricati dal server)
                const combinedSlugs = [...new Set([...parsed.followedAsds, ...this.followedAsds])]

                // Uniamo le identità
                const combinedIdentities = { ...parsed.identities, ...this.identities }

                this.followedAsds = combinedSlugs
                this.identities = combinedIdentities
                this.fcmToken = parsed.fcmToken || this.fcmToken

                console.log('📦 Store idratato e unito:', { slugs: this.followedAsds })
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
            if (!slug) return

            // Se siamo sul client e non abbiamo ancora caricato i vecchi dati, facciamolo ora
            // (Piccola sicurezza extra se onMounted di app.vue ritarda)
            if (import.meta.client && this.followedAsds.length <= 1 && localStorage.getItem('user_data')) {
                const saved = JSON.parse(localStorage.getItem('user_data'))
                if (!this.followedAsds.includes(saved.followedAsds[0])) {
                    this.initStore()
                }
            }

            if (!this.followedAsds.includes(slug)) {
                this.followedAsds.push(slug)
                this.identities[slug] = {
                    email: null,
                    name: 'Visitatore',
                    expiry_date: null,
                    role: 'GUEST'
                }
            }

            if (import.meta.client) {
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