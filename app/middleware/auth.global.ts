// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
    // 1. Saltiamo il controllo se siamo sul Server
  if (import.meta.server) return

  // 1. Identifichiamo se la rotta richiede protezione
  const isAdminPath = to.path.startsWith('/admin')
  const isManagerPath = to.path.includes('/manager')

  if (!isAdminPath && !isManagerPath) return

  // Evitiamo loop infiniti se siamo già sulla pagina di login
  if (to.path === '/admin/login') return

  // 2. Recuperiamo l'identità dell'utente (es. dalla sessione o localStorage per ora)
  // Nota: In produzione useresti un token JWT o un cookie di sessione
  const savedUser = localStorage.getItem('user_auth') 
  if (!savedUser) return navigateTo('/login')

  const { email } = JSON.parse(savedUser)

  // 3. Chiediamo al server i permessi reali
  const { data: permissions } = await useFetch('/api/auth/permissions', {
    query: { email }
  })

  if (!permissions.value) return navigateTo('/login')

  // --- LOGICA DI CONTROLLO ---

  // Caso A: Accesso a /admin (SuperAdmin)
  if (isAdminPath) {
    if (!permissions.value.is_admin) {
      return abortNavigation('Accesso negato: richiesti privilegi Admin')
    }
  }

  // Caso B: Accesso a /[slug]/manager
  if (isManagerPath) {
    const slug = to.params.asd_slug
    
    // Un SuperAdmin può entrare in qualunque area manager
    if (permissions.value.is_admin) return

    // Altrimenti, verifichiamo se l'utente è MANAGER di quella specifica ASD
    const hasAccess = permissions.value.managed_asds.some(
      (asd) => asd.asd_slug === slug && asd.role === 'MANAGER'
    )

    if (!hasAccess) {
      return abortNavigation('Accesso negato: non sei il Manager di questa associazione')
    }
  }
})