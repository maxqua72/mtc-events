// middleware/load.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const asdStore = useAsdStore()
  const userStore = useUserStore()

  // 1. ESCLUSIONE SISTEMA E ADMIN
  // Non eseguire il middleware se:
  // - La rotta inizia con /admin
  // - La rotta inizia con /api (anche se di solito i middleware non intercettano le API, meglio essere sicuri)
  // - È un file statico (contiene un punto) o una rotta interna Nuxt (_nuxt)
  if (
    to.path.startsWith('/admin') || 
    to.path.startsWith('/login') || 
    to.path.startsWith('/api') ||
    to.path.startsWith('/img') ||
    to.path.includes('.') ||
    to.path.startsWith('/_')
  ) {
    return
  }
  
  // Estraiamo lo slug dai parametri della rotta
  // Assicurati che la cartella in pages si chiami [asd_slug]
  const slug = to.params.asd_slug

  if (slug) {
    // Ottimizzazione: se l'ASD è già caricata e lo slug coincide, non fare nulla
    if (asdStore.info?.slug === slug) {
      userStore.trackAsdVisit(slug)
      return
    }
    
    // Altrimenti carichiamo i dati
    try {
      await asdStore.loadAsd(slug)
    } catch (e) {
    throw createError({
      statusCode: 404,
      message: `L'associazione "${slug}" non è censita nei nostri sistemi.`,
      fatal: true
    })
  }

    // Se dopo il caricamento l'info è ancora null, l'ASD non esiste
    if (!asdStore.info) {
      throw createError({
        statusCode: 404,
        message: `L'associazione "${slug}" non è censita nei nostri sistemi.`,
        fatal: true // Importante: forza la visualizzazione della pagina di errore anche lato client
      })
    }

    // --- INIZIO SYNC SILENZIOSO ---
    // Se l'utente ha un'identità salvata per questa ASD, verifichiamo se è ancora valida
    if (userStore.identities[slug]) {
      // Non usiamo 'await' perché vogliamo che la pagina si carichi subito.
      // Il sync avverrà in background.
      userStore.syncMembership(slug)
    }
    // --- FINE SYNC SILENZIOSO ---

    // 2. NUOVA LOGICA: Registra l'interesse dell'utente per questa ASD
    // Questo permette l'installazione progressiva della dashboard multi-associazione
    userStore.trackAsdVisit(slug)

  } else if (!to.path.startsWith('/admin')) {
    // Opzionale: se non siamo in una rotta ASD e nemmeno in admin, 
    // potremmo voler resettare lo store
    asdStore.info = null 
  }
})