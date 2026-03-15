import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        isInitialized: false,
        // Lista delle identità dell'utente (una per ogni ASD visitata)
        // Struttura: { asd_slug: { email, name, start_date, expiry_date, role } }
        identities: {},
        // Array degli slug visitati per mantenere l'ordine e facilitare il menu switch
        followedAsds: [],
        // Token FCM per le notifiche
        fcmToken: null,
        isNotificationSupported: false,
        auth: useCookie('user_auth').value || null, // Per Admin e Manager (UC1) - { email, is_admin, managed_asds }
    }),

    actions: {
        // Inizializza lo store caricando i dati dal localStorage
        initStore() {
            if (process.server || this.isInitialized) return

            console.log('🔄 Avvio idratazione store...');

            // 1. SINCRONIZZAZIONE FORZATA AUTH (Manager/Admin)
            // Leggiamo il valore REALE del cookie in questo istante
            const actualCookie = useCookie('user_auth').value
            
            if (!actualCookie && this.auth) {
                // Caso: Il cookie è sparito ma lo store ha ancora i vecchi dati
                console.log('🧹 Pulizia sessione: Cookie non trovato, resetto auth.');
                this.auth = null;
            } else if (actualCookie) {
                // Caso: Il cookie esiste, aggiorniamo lo store per sicurezza
                this.auth = actualCookie;
            }

            const saved = localStorage.getItem('user_data')
            if (saved) {
                try {
                const parsed = JSON.parse(saved)

                // Uniamo gli slug: prendiamo quelli salvati e aggiungiamo quelli 
                // eventualmente già presenti nello stato (caricati dal server)
            /*    const combinedSlugs = [...new Set([...parsed.followedAsds, ...this.followedAsds])]

                // Uniamo le identità
                const combinedIdentities = { ...parsed.identities, ...this.identities }

                this.followedAsds = combinedSlugs
                this.identities = combinedIdentities
                this.fcmToken = parsed.fcmToken || this.fcmToken */
                
                // Usiamo l'assegnazione diretta per non triggerare saveToLocal accidentalmente
                this.followedAsds = parsed.followedAsds || []
                this.identities = parsed.identities || {}
                this.fcmToken = parsed.fcmToken || null
                console.log('✅ Dati recuperati dal localStorage');
                
                console.log('📦 Store idratato e unito:', { slugs: this.followedAsds })
                } catch (e) {
                    console.error("Errore parsing localStorage", e);
                }
            }
            this.isInitialized = true
            console.log('📦 Store idratato con successo')
        },

        // Salva lo stato attuale nel localStorage
        saveToLocal() {
            if (process.server || !this.isInitialized) return
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

            // Forza l'idratazione se non è ancora avvenuta
            if (!this.isInitialized) this.initStore()
/*
            // Se siamo sul client e non abbiamo ancora caricato i vecchi dati, facciamolo ora
            // (Piccola sicurezza extra se onMounted di app.vue ritarda)
            if (import.meta.client && this.followedAsds.length <= 1 && localStorage.getItem('user_data')) {
                const saved = JSON.parse(localStorage.getItem('user_data'))
                if (!this.followedAsds.includes(saved.followedAsds[0])) {
                    this.initStore()
                }
            }
*/
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
        },

        async syncMembership(slug) {
            try {
                // 1. Recuperiamo il profilo locale per questa ASD
                const localProfile = this.identities[slug]

                // Se non c'è un'email, non possiamo sincronizzare nulla
                if (!localProfile?.email) return

                // 2. Chiamata al server passando l'email negli headers
                const data = await $fetch(`/api/asd/${slug}/sync-status`, {
                    headers: {
                        'x-user-email': localProfile.email // Passiamo l'identità al server
                    }
                })

                if (data.active) {
                    // 3a. Il server conferma che è attivo: aggiorniamo i dati (nome, scadenza, etc.)
                    this.setAsdProfile(slug, data.profile)
                } else {
                    // 3b. Il server dice che NON è più attivo: lo declassiamo a visitatore
                    delete this.identities[slug]
                    this.saveToLocal()

                    // Opzionale: se l'utente era in una pagina riservata, potresti voler ricaricare
                    // o mostrare un messaggio, ma per ora il cambio dell'header basta.
                }
            } catch (e) {
                // Se il server è giù o c'è un errore di rete, non cancelliamo i dati locali, 
                // riproveremo alla prossima navigazione.
                console.error("Errore sync identità:", e)
            }
        },

        // AUTH
        // Gestione permessi Staff (Manager/Admin)
        /*
        setAuth(authData) {
            this.auth = authData
            localStorage.setItem('user_auth', JSON.stringify(authData))
        },
        logout() {
            this.auth = null
            localStorage.removeItem('user_auth')
        },
        */
       /*
        setAuth(authData) {
            this.auth = authData
            const authCookie = useCookie('user_auth', {
                maxAge: 60 * 60 * 24 * 7, // 7 giorni
                path: '/'
            })
            authCookie.value = authData
            
            localStorage.removeItem('user_auth')
        },
        */

        setAuth(permissions) {
            this.auth = {
                email: permissions.email,
                is_admin: permissions.is_admin,
                managed_asds: permissions.managed_asds
            }
            
            // 1. Salviamo il cookie per la parte gestione
            const authCookie = useCookie('user_auth', { maxAge: 60 * 60 * 24 * 7, path: '/' })
            authCookie.value = this.auth

            // 2. Popoliamo le IDENTITIES dallo storage (per i push e dati socio)
            // Per ogni membership trovata, aggiorniamo il profilo socio
            permissions.member_identities.forEach(m => {
                this.identities[m.asd_slug] = {
                email: m.email,
                name: m.name,
                expiry_date: m.expiry_date,
                start_date: m.start_date,
                role: 'MEMBER' // È un socio effettivo
                }
                if (!this.followedAsds.includes(m.asd_slug)) this.followedAsds.push(m.asd_slug)
            })

            // 3. Se è un MANAGER ma NON è socio di quell'ASD, creiamo comunque l'identità minima 
            // per permettere il funzionamento dei push del manager
            permissions.managed_asds.forEach(managed => {
                if (!this.identities[managed.asd_slug]) {
                this.identities[managed.asd_slug] = {
                    email: permissions.email,
                    name: permissions.name,
                    role: 'MANAGER', // È solo manager, non socio
                    expiry_date: null
                }
                if (!this.followedAsds.includes(managed.asd_slug)) this.followedAsds.push(managed.asd_slug)
                } else {
                // Se è sia socio che manager, manteniamo i dati socio ma aggiungiamo il flag manager se serve
                this.identities[managed.asd_slug].is_manager = true
                }
            })

            if (import.meta.client) this.saveToLocal()
        },

        // MODIFICA: Rimuovi il cookie
        logout() {
            this.auth = null
            const authCookie = useCookie('user_auth')
            authCookie.value = null
            // Se vuoi resettare anche i dati socio:
            if (import.meta.client) localStorage.removeItem('user_data')
        },
    },

    async saveTokenToDatabase(token, asdSlug) {
      if (!this.auth?.email) return;

      try {
        await $fetch(`/api/asd/${asdSlug}/members/sync-fcm-token`, {
          method: 'POST',
          body: { 
            email: this.auth.email, 
            token: token 
          }
        });
        this.fcmToken = token;
      } catch (err) {
        console.error("Errore salvataggio token su DB", err);
      }
    }


})