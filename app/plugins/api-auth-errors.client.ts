// app/plugins/api-auth-errors.client.ts
// Gestione centralizzata delle risposte 401/403 delle API /api/admin/** e /api/manager/**.
// Dalla 1.1.1 il server rilegge i ruoli dal DB: il cookie può dire "admin" o "manager"
// anche quando il permesso è stato tolto. Qui l'interfaccia si allinea al server.
//   401 -> la sessione non vale più: si cancella e si torna al login (o a /<slug>/join)
//   403 -> la sessione c'è ma il permesso no: pagina "Permesso negato"
// I dati del socio nel localStorage non vengono toccati.
export default defineNuxtPlugin(() => {
  const router = useRouter()
  let handling = false

  const handle = async (request: unknown, status: number | undefined, message?: string) => {
    const action = resolveApiAuthAction(request, status, router.currentRoute.value.fullPath)
    if (action.type === 'none' || handling) return
    handling = true

    try {
      if (action.type === 'relogin') {
        const { clear } = useUserSession()
        await clear().catch(() => {})
        useUserStore().auth = null
        await navigateTo(action.to)
      } else {
        showError({
          statusCode: 403,
          statusMessage: message || 'Non hai più i permessi per questa operazione.',
          fatal: true
        })
      }
    } finally {
      // Dopo il redirect le chiamate ancora in volo non devono ripetere la gestione
      setTimeout(() => { handling = false }, 1000)
    }
  }

  globalThis.$fetch = $fetch.create({
    onResponseError({ request, response }) {
      const message = (response as any)?._data?.message || (response as any)?._data?.statusMessage
      return handle(request, response.status, message)
    }
  }) as typeof $fetch
})
