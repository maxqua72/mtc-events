// server/middleware/auth.ts
// Protegge tutte le API di scrittura e gestione:
//   /api/admin/**          -> solo amministratori (is_admin riletto dal DB)
//   /api/manager/{slug}/** -> solo manager di QUELLO slug (o amministratori)
// Le altre rotte non vengono toccate.
export default defineEventHandler(async (event) => {
  let pathname: string
  try {
    pathname = decodeURIComponent(getRequestURL(event).pathname)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Percorso non valido.' })
  }

  // Normalizziamo per evitare aggiramenti con slash doppi o maiuscole
  const normalized = pathname.replace(/\/{2,}/g, '/')
  const lower = normalized.toLowerCase()

  if (lower === '/api/admin' || lower.startsWith('/api/admin/')) {
    event.context.authUser = await requireAdmin(event)
    return
  }

  if (lower === '/api/manager' || lower.startsWith('/api/manager/')) {
    const slug = normalized.split('/')[3] || ''
    const { user, asd } = await requireAsdManager(event, slug)
    event.context.authUser = user
    event.context.authAsd = asd
  }
})
