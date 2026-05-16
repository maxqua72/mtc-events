// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  // 1. Saltiamo il controllo se siamo sul Server
  //if (import.meta.server) return

  const userStore = useUserStore()

  // 1. Identifichiamo se la rotta richiede protezione
  const isAdminPath = to.path.startsWith('/admin')
  const isManagerPath = to.path.includes('/manager')
  const slug = to.params.asd_slug 

  if (!isAdminPath && !isManagerPath ) return

  // Evitiamo loop infiniti se siamo già sulla pagina di login
  if (to.path === '/login' || to.path.endsWith('/join')) return

  // 1. Controllo Autenticazione Generica tramite lo Store unificato
  if (!userStore.auth) {
    /*
    throw createError({
      statusCode: 401,
      statusMessage: 'Sessione non valida o scaduta. Effettua nuovamente il login.',
      fatal: true 
    })
      */
     console.log(`[AUTH MIDDLEWARE] 🔒 Sessione assente o scaduta per la rotta: ${to.path}`);

    // COMPORTAMENTO ADMIN: Se tentava di andare in /admin, lo mandiamo alla pagina di join dell'ultima ASD visitata (o login)
    if (isAdminPath) {
      const lastAsd = userStore.lastVisitedAsd || slug
      if (lastAsd) {
        return navigateTo(`/${lastAsd}/join`)
      }
      return navigateTo('/') // Fallback se non c'è traccia dell'ASD
    }

    // COMPORTAMENTO MANAGER / CLUB ROUTE: Se salta la sessione, lo mandiamo alla pagina eventi pubblica del club
    if (isManagerPath && slug) {
      console.log(`[AUTH MIDDLEWARE] ↩️ Reindirizzo il manager/visitatore a: /${slug}/events`);
      return navigateTo(`/${slug}/events`)
    }

    return // Evita il blocco, prosegui come visitatore generico
  }

  /*
  // 2. Recuperiamo l'auth dal cookie (disponibile sia su Server che Client)
  // useCookie senza parametri legge tutti i cookie, specifichiamo il nome
  const auth = useCookie<Record<string, any>>('user_auth').value

  // 3. Se non c'è auth -> Login
  if (!auth) {
   
   // Invece di /login, lanciamo un errore 401 (Unauthorized)
    throw createError({
      statusCode: 401,
      statusMessage: 'Sessione non valida o scaduta. Accedi tramite il link ricevuto via email.',
      fatal: true 
    })
  }*/

  // Caso A: Admin

  // Se l'utente è l'Admin Globale, ha il passaporto per QUALSIASI rotta
  if (userStore.isAdmin) return
  
  if (isAdminPath && !userStore.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accesso riservato agli amministratori di sistema.',
      fatal: true // Importante per attivare error.vue lato server
    })
  }

  // Caso B: Manager
  if (isManagerPath && slug) {
    //const slug = to.params.asd_slug

    //if (userStore.isAdmin) return // Il SuperAdmin passa sempre

    const isManagerOfThisAsd = userStore.isManager(slug)
    /*
    const hasAccess = auth.managed_asds?.some(
      (asd: { asd_slug: string, role: string }) => asd.asd_slug === slug && asd.role === 'MANAGER'
    )*/

    if (!isManagerOfThisAsd) {
      // Usiamo throw createError invece di abortNavigation per attivare error.vue
      throw createError({
        statusCode: 403,
        statusMessage: `Non hai i permessi di gestione per il club: ${slug}`,
        fatal: true 
      })
    }
  }

  

})