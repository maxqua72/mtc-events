import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        isInitialized: false,
        // Lista delle identità dell'utente (una per ogni ASD visitata)
        // Struttura: { asd_slug: { id_membership, id_manager, email, name, start_date, expiry_date, role } }
        identities: {},
        // Array degli slug visitati per mantenere l'ordine e facilitare il menu switch
        followedAsds: [],
        // Token FCM per le notifiche
        fcmToken: null,
        isNotificationSupported: false,
        //auth: useCookie('user_auth').value || null, // Per Admin e Manager (UC1) - { email, is_admin, managed_asds }
        // RIMOSSO: auth: useCookie('user_auth').value
        // Usiamo una variabile reattiva interna che viene popolata dalla sessione sicura
        auth: null,
        lastVisitedAsd: null,
    }),

    getters: {
        // Controlla se l'utente è Admin Globale
        //isAdmin: (state) => !!state.auth?.is_admin,
        // L'identità ora deriva esclusivamente dalla sessione criptata
        isAdmin: (state) => !!state.auth?.is_admin,

        // Controlla se è Manager di una specifica ASD (dal cookie auth)
        /*
        isManager: (state) => (slug) => {
            if (state.auth?.is_admin) return true; // L'admin è manager ovunque
            return state.auth?.managed_asds?.some(asd => asd.asd_slug === slug) || false;
        },*/
        isManager: (state) => (slug) => {
            if (state.auth?.is_admin) return true;
            return state.auth?.managed_asds?.some(asd => asd.asd_slug === slug) || false;
        },
        isManagerOf: (state) => (slug) => {
            return state.auth?.managed_asds?.some(asd => asd.asd_slug === slug) || false;
        },

        // Controlla se è Socio attivo di una specifica ASD (dalle identities)
        isMember: (state) => (slug) => {
            const identity = state.identities[slug];
            //return identity?.role === 'MEMBER' || identity?.role === 'MANAGER';
            return !!identity?.id_membership;
        },

        // Restituisce l'identità specifica per lo slug (comodo per i componenti)
        getIdentity: (state) => (slug) => state.identities[slug] || null
    },

    actions: {
        // Inizializza lo store caricando i dati dal localStorage
        async initStore() {

            

            if (this.isInitialized) return

            // TRACCIAMENTO INITIAL
            console.log(`[STORE INIT] 🚀 Partito su: ${import.meta.server ? 'SERVER' : 'CLIENT'}`);

            console.log('🔄 Avvio idratazione store...');

            /*
            // Se siamo sul client e l'auth c'è già (passato dal server tramite payload),
            // marchiamo come inizializzato e non rifacciamo i controlli server.
            if (import.meta.client && this.auth) {
                this.isInitialized = true
                console.log('📦 [CLIENT] Store idratato automaticamente dal payload del Server.');
                return
            }
*/
            // 1. RECUPERO SESSIONE SICURA (L'identificatore 10/10)
            // useUserSession è il composable di nuxt-auth-utils
            const { user, loggedIn } = useUserSession()

            console.log(`[STORE INIT] 🔑 Stato sessione pre-fetch - loggedIn: ${loggedIn.value}, email: ${user.value?.email || 'nessuna'}`);


            // TRUCCO: Se siamo su client, forziamo un fetch() per essere sicuri 
            // che il cookie blindato sia stato letto prima di decidere chi è l'utente
            /*
            if (import.meta.client && loggedIn.value) {
                try {
                    console.log(`[STORE INIT] ⏳ Forzo fetch() su Client...`);
                    await fetch()
                } catch (err) {
                    console.error("⚠️ Impossibile forzare il fetch della sessione sul client:", err)
                    console.log(`[STORE INIT] ✅ Fetch completato - loggedIn: ${loggedIn.value}, email: ${user.value?.email || 'nessuna'}`);
                }
            }
            */
            // 2. CONFIGURAZIONE DEI FLUSSI
            /*
            if (import.meta.server) {
                // Se siamo sul server, leggiamo la sessione dal cookie iniziale
                if (user.value) {
                    this.auth = user.value
                }
            } else {
                // Se siamo sul client e l'SSR ci ha passato un utente loggato, 
                // NON facciamo il 'return' vuoto: forziamo la fetch per aggiornare il cookie!
                if (loggedIn.value) {
                    try {
                        console.log(`[STORE INIT] ⏳ Forzo fetch() su Client per Rolling Session...`);
                        await fetch() // Questo invoca l'endpoint API e attiva il Set-Cookie!

                        if (user.value) {
                            this.auth = user.value // Aggiorna lo store con il nuovo updatedAt
                        }
                    } catch (err) {
                        console.error("⚠️ Errore fetch rolling sul client:", err)
                    }
                }
            }
                */
            // 3. ASSEGNAZIONE DELLA FONTE DI VERITÀ
            // Se la sessione esiste (letta da server tramite cookie o da client tramite fetch), 
            // popoliamo lo stato 'auth' usato dai tuoi getter (isAdmin, isManager).
            if (user.value) {
                //this.auth = user.value
                // Creiamo una copia profonda per non mutare l'oggetto originale di Nuxt Auth
                const cleanedUser = { ...user.value }

                if (cleanedUser.managed_asds && Array.isArray(cleanedUser.managed_asds)) {
                // Raggruppiamo per asd_slug eliminando i duplicati al volo nel frontend
                const cleanedMap = new Map(
                    cleanedUser.managed_asds.map((item) => [item.asd_slug, item])
                )
                cleanedUser.managed_asds = Array.from(cleanedMap.values())
    }

    this.auth = cleanedUser

                console.log(`[STORE INIT] 🛡️ Auth impostato nello store per:`, this.auth.email);
                console.log(`🛡️ [${process.server ? 'SERVER' : 'CLIENT'}] Sessione sicura caricata per:`, user.value.email);

            } else {
                console.log(`🔒 [${process.server ? 'SERVER' : 'CLIENT'}] Nessuna sessione sicura trovata.`);
            }

            /*
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
*/
            // 🔥 IL MECCANISMO DI ROLLING DEFINITIVO
            /*
            if (import.meta.client && loggedIn.value) {
                try {
                    console.log(`[STORE INIT] ⏳ Invoco /api/auth/refresh per estendere il cookie...`);

                    // Chiamiamo il nostro endpoint POST personalizzato
                    const response = await $fetch('/api/api/auth/refresh', { method: 'POST' })

                    if (response.success && response.user) {
                        this.auth = response.user
                        console.log(`[STORE INIT] ✅ Cookie esteso con successo. Nuovo updatedAt:`, this.auth.updatedAt);
                    }
                } catch (err) {
                    console.error("⚠️ Errore durante il refresh della sessione:", err)
                }
            }*/
            // 4. ISOLEMENTO DATI BROWSER (localStorage)
            // Il localStorage esiste SOLO sul browser. Isolarlo qui previene gli errori di Hydration Mismatch.
            if (import.meta.client) {
                const saved = localStorage.getItem('user_data')
                console.log(`[STORE INIT] 📦 Dati trovati in localStorage:`, !!saved);
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved)

                        // Usiamo l'assegnazione diretta per non triggerare saveToLocal accidentalmente
                        this.followedAsds = parsed.followedAsds || []
                        this.identities = parsed.identities || {}
                        this.fcmToken = parsed.fcmToken || null
                        this.lastVisitedAsd = parsed.lastVisitedAsd || null
                        console.log('✅ Dati recuperati dal localStorage');

                        console.log('📦 Store idratato e unito:', { slugs: this.followedAsds })
                    } catch (e) {
                        console.error("Errore parsing localStorage", e);
                    }
                }

            }
            this.isInitialized = true
            console.log('📦 Store idratato con successo')
            console.log(`[STORE INIT] 🏁 Fine inizializzazione CLIENT. Stato auth finale:`, this.auth);
        },

        // Salva lo stato attuale nel localStorage
        saveToLocal() {
            if (process.server || !this.isInitialized) return
            const dataToSave = {
                identities: this.identities,
                followedAsds: this.followedAsds,
                fcmToken: this.fcmToken,
                lastVisitedAsd: this.lastVisitedAsd
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

            // 📌 Registriamo l'ultimo slug valido visitato
            this.lastVisitedAsd = slug

            if (!this.followedAsds.includes(slug)) {
                this.followedAsds.push(slug)
                this.identities[slug] = {
                    email: null,
                    name: 'Visitatore',
                    expiry_date: null,
                    role: 'GUEST',
                    id_membership: null,
                    id_manager: null
                }
            }

            if (import.meta.client) {
                this.saveToLocal()
            }
        },

        // Chiamata dopo il login Admin o riscatto Token Manager
        // Non scriviamo più cookie manualmente, lo fa il server!
        async syncWithServerSession() {
            const { fetch } = useUserSession()
            await fetch() // Forza il refresh della sessione dal server
            this.initStore()
        },

        /**
         * Collega i dati reali di un socio (da QR o Email) a una specifica ASD
         */
        setAsdProfile(slug, profileData) {
            const current = this.identities[slug] || { role: 'GUEST' };

            this.identities[slug] = {
                ...current,
                ...profileData,
                // Logica cumulativa: se era socio e ora aggiungiamo manager, 
                // manteniamo l'id_membership esistente
                id_membership: profileData.id_membership || current.id_membership,
                id_manager: profileData.id_manager || current.id_manager
            }

            if (!this.followedAsds.includes(slug)) this.followedAsds.push(slug)
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


        /*
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
        },*/

        /**
         * Gestisce l'autenticazione "forte" (Admin con JWT o Manager con cookie)
         */
        /*
        setAdminAuth(authPayload) {
            this.auth = {
                email: authPayload.email,
                is_admin: authPayload.is_admin || false,
                jwt: authPayload.jwt || null, // Per Admin
                managed_asds: authPayload.managed_asds || []
            }

            const authCookie = useCookie('user_auth', { maxAge: 60 * 60 * 24 * 7, path: '/' })
            authCookie.value = this.auth

            // Se l'auth payload contiene informazioni su identità socio trovate via email
            if (authPayload.identities) {
                Object.entries(authPayload.identities).forEach(([slug, data]) => {
                    this.setAsdProfile(slug, data);
                });
            }
        },*/
        async setAdminAuth(authPayload) {
            // 1. SINCRONIZZAZIONE SERVER
            // Come per il manager, il backend (api/auth/login) ha già sigillato
            // il cookie crittografato. Dobbiamo solo "tirarlo giù".
            try {
                const { fetch, user } = useUserSession();
                await fetch();

                // 2. Popoliamo auth (la fonte di verità per i tuoi getter)
                if (user.value) {
                    this.auth = user.value;
                    //this.auth = user.value; // Se usi 'auth' nei getter, usa questo
                }
            } catch (err) {
                console.error("Errore sincronizzazione Admin:", err);
            }

            // 3. Gestione Identità (Socio)
            // Se l'admin è anche socio di alcune ASD, popoliamo le identities locali
            if (authPayload.identities) {
                Object.entries(authPayload.identities).forEach(([slug, data]) => {
                    this.setAsdProfile(slug, data);
                });
            }

            // 4. ELIMINAZIONE COOKIE IN CHIARO (Addio insicurezza)
            // Non serve più impostare 'user_auth'. Lo rimuoviamo se esiste.
            const oldCookie = useCookie('user_auth');
            oldCookie.value = null;

            this.saveToLocal();
        },

        // Chiamata quando un Manager riscatta un Token 9
        /*
        addManagerAccess(payload, slug) {
            // 1. Aggiorna l'identità locale (accumulando id_membership e id_manager)
            this.setAsdProfile(slug, payload.asd_profile);

            // 2. Aggiorna il Cookie Auth in modo ADDITIVO
            const currentAuth = this.auth || { 
                email: payload.email, 
                is_admin: false, 
                managed_asds: [] 
            };

            // Aggiungiamo la nuova ASD gestita solo se non c'è già
            const exists = currentAuth.managed_asds.some(a => a.asd_slug === slug);
            if (!exists) {
                currentAuth.managed_asds.push(payload.new_managed_asd);
            }

            this.auth = { ...currentAuth };
            const authCookie = useCookie('user_auth', { maxAge: 60 * 60 * 24 * 7, path: '/' });
            authCookie.value = this.auth;
            
            this.saveToLocal();
        },*/
        async addManagerAccess(payload, slug) {
            // 1. Aggiorniamo le info estetiche (logo, nome ASD) che non sono critiche per la sicurezza
            // Queste possono stare nello store o in localStorage perché non danno permessi
            this.setAsdProfile(slug, payload.asd_profile);

            // 2. SINCRONIZZAZIONE CON IL SERVER
            // Il backend ha già fatto il setUserSession() prima di rispondere a questa chiamata.
            // Noi dobbiamo solo dire a Nuxt di scaricare i nuovi dati cifrati.
            try {
                const { fetch, user } = useUserSession();
                await fetch();

                // 3. Ora la fonte di verità è SOLO user.value (il cookie crittografato)
                if (user.value) {
                    this.auth = user.value; // Sovrascriviamo lo stato locale con i dati certi
                }
            } catch (err) {
                console.error("Errore critico: sessione non sincronizzata", err);
            }

            // 4. Pulizia (LEGACY REMOVAL)
            // Rimuoviamo il vecchio cookie se esistente per evitare confusione
            const oldCookie = useCookie('user_auth');
            oldCookie.value = null;

            this.saveToLocal();
        },

        /*
        // MODIFICA: Rimuovi il cookie
        logout() {
            this.auth = null
            const authCookie = useCookie('user_auth')
            authCookie.value = null
            // Se vuoi resettare anche i dati socio:
            if (import.meta.client) localStorage.removeItem('user_data')
        },
            */
        async logout() {
            const { clear } = useUserSession()
            await clear() // Cancella il cookie criptato sul server
            this.auth = null

            if (import.meta.client) {
                localStorage.removeItem('user_data')
                this.identities = {}
                this.followedAsds = []
            }
        },
    },
    /*
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
    */

})