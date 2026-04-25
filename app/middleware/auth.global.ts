// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  // 1. Saltiamo il controllo se siamo sul Server
  //if (import.meta.server) return

  // 1. Identifichiamo se la rotta richiede protezione
  const isAdminPath = to.path.startsWith('/admin')
  const isManagerPath = to.path.includes('/manager')

  if (!isAdminPath && !isManagerPath) return

  // Evitiamo loop infiniti se siamo già sulla pagina di login
  if (to.path === '/login') return

  // 2. Recuperiamo l'auth dal cookie (disponibile sia su Server che Client)
  // useCookie senza parametri legge tutti i cookie, specifichiamo il nome
  const auth = useCookie<Record<string, any>>('user_auth').value

  // 3. Se non c'è auth -> Login
  if (!auth) {
    /*return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath } // Salviamo dove voleva andare l'utente
    })*/
   // Invece di /login, lanciamo un errore 401 (Unauthorized)
    throw createError({
      statusCode: 401,
      statusMessage: 'Sessione non valida o scaduta. Accedi tramite il link ricevuto via email.',
      fatal: true 
    })
  }

  // Caso A: Admin
  if (isAdminPath && !auth.is_admin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accesso riservato agli amministratori di sistema.',
      fatal: true // Importante per attivare error.vue lato server
    })
  }

  // Caso B: Manager
  if (isManagerPath) {
    const slug = to.params.asd_slug
    if (auth.is_admin) return // Il SuperAdmin passa sempre

    const hasAccess = auth.managed_asds?.some(
      (asd: { asd_slug: string, role: string }) => asd.asd_slug === slug && asd.role === 'MANAGER'
    )

    if (!hasAccess) {
      // Usiamo throw createError invece di abortNavigation per attivare error.vue
      throw createError({
        statusCode: 403,
        statusMessage: `Non hai i permessi di gestione per il club: ${slug}`,
        fatal: true 
      })
    }
  }

  /*
  // Se lo store è vuoto (es. refresh pagina), proviamo a recuperare dal localStorage
  const userStore = useUserStore()
  if (!userStore.auth) {

    const saved = localStorage.getItem('user_auth')
    if (saved) {
      // In un'app reale qui faresti una validazione token, 
      // per ora ripopoliamo lo store con i dati salvati
      userStore.auth = JSON.parse(saved)
    }
  }

  // Se dopo il tentativo non c'è ancora nulla -> Login
  if (!userStore.auth) return navigateTo('/login')

  const auth = userStore.auth

  // Caso A: Admin
  if (isAdminPath && !auth.is_admin) {
    return abortNavigation('Privilegi Admin richiesti')
  }

  // Caso B: Manager
  if (isManagerPath) {
    const slug = to.params.asd_slug
    if (auth.is_admin) return // Il SuperAdmin passa sempre

    const hasAccess = auth.managed_asds.some(
      asd => asd.asd_slug === slug && asd.role === 'MANAGER'
    )

    if (!hasAccess) return abortNavigation('Non sei autorizzato per questa ASD')
  }
*/

})