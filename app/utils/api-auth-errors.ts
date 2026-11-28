// app/utils/api-auth-errors.ts
// Decide cosa fare quando un'API protetta risponde 401 o 403.
// Funzione pura: usata dal plugin api-auth-errors.client.ts e dai test.

export type ApiAuthAction =
  | { type: 'none' }
  // Sessione non più valida (utente cancellato, cookie non riconosciuto): si esce e si rientra
  | { type: 'relogin'; to: string }
  // Sessione valida ma permesso tolto (revoca di admin o manager): pagina 403
  | { type: 'forbidden' }

const pathOf = (request: unknown): string => {
  try {
    const raw = typeof request === 'string' ? request : (request as any)?.url ?? String(request)
    // "//api/..." verrebbe letto come host "api": si comprimono gli slash iniziali, come fa h3
    const url = new URL(String(raw).replace(/^[/\\]+/, '/'), 'http://localhost')
    return decodeURIComponent(url.pathname).replace(/\/{2,}/g, '/').toLowerCase()
  } catch {
    return ''
  }
}

/**
 * @param request URL (o Request) della chiamata fallita
 * @param status  codice HTTP della risposta
 * @param currentRoute percorso della pagina attuale (es. "/admin" o "/club/manager/dashboard")
 */
export const resolveApiAuthAction = (request: unknown, status: number | undefined, currentRoute: string): ApiAuthAction => {
  if (status !== 401 && status !== 403) return { type: 'none' }

  const path = pathOf(request)
  const isProtectedApi = /^\/api\/(admin|manager)(\/|$)/.test(path)
  if (!isProtectedApi) return { type: 'none' }

  if (status === 403) return { type: 'forbidden' }

  // 401: si torna al punto d'ingresso adatto alla pagina in cui si trova l'utente
  const route = currentRoute || '/'
  if (route.startsWith('/admin')) {
    return { type: 'relogin', to: `/login?redirect=${encodeURIComponent(route)}` }
  }
  const managerPage = /^\/([^/]+)\/manager(\/|$)/.exec(route)
  if (managerPage) return { type: 'relogin', to: `/${managerPage[1]}/join` }
  return { type: 'relogin', to: '/login' }
}
