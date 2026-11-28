// server/utils/auth.ts
// Controlli di autorizzazione lato server.
// Il cookie di sessione serve solo a sapere CHI è l'utente (user.id):
// i ruoli (is_admin, ASD gestite) vengono sempre riletti dal database,
// così una modifica sul DB (revoca di un manager, rimozione di is_admin) ha effetto subito.
import type { H3Event } from 'h3'
import { ObjectId } from 'mongodb'

const isAdminFlag = (value: unknown) => value === true || value === 'true'

/**
 * Restituisce l'utente della sessione riletto dal DB, oppure null se non c'è una sessione valida.
 */
export const getSessionDbUser = async (event: H3Event) => {
  const session = await getUserSession(event)
  const id = (session?.user as any)?.id

  if (typeof id !== 'string' || !ObjectId.isValid(id)) return null

  const db = await getDb()
  return db.collection('users').findOne(
    { _id: new ObjectId(id) },
    { projection: { _id: 1, email: 1, is_admin: 1, managed_asds: 1 } }
  )
}

/**
 * Richiede un utente autenticato (401 altrimenti).
 */
export const requireSessionDbUser = async (event: H3Event) => {
  const user = await getSessionDbUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Autenticazione richiesta.' })
  }
  return user
}

/**
 * Richiede un amministratore di sistema (is_admin letto dal DB).
 */
export const requireAdmin = async (event: H3Event) => {
  const user = await requireSessionDbUser(event)
  if (!isAdminFlag(user.is_admin)) {
    throw createError({ statusCode: 403, statusMessage: 'Accesso riservato agli amministratori.' })
  }
  return user
}

/**
 * Verifica, senza lanciare errori, se l'utente può gestire l'ASD indicata.
 * L'admin può gestire tutte le ASD.
 */
export const canManageAsd = async (user: any, asd: any) => {
  if (!user) return false
  if (isAdminFlag(user.is_admin)) return true
  if (!asd?._id) return false

  const db = await getDb()
  const relation = await db.collection('managers').findOne(
    { user_id: user._id, association_id: asd._id },
    { projection: { _id: 1 } }
  )
  if (relation) return true

  // Compatibilità: utenti storici con le ASD gestite salvate nel documento utente
  return Array.isArray(user.managed_asds) &&
    user.managed_asds.some((a: any) => a?.asd_slug === asd.slug)
}

/**
 * Richiede che l'utente sia manager dell'ASD con questo slug (o admin).
 * Restituisce { user, asd }; per l'admin asd può essere null se lo slug non esiste.
 */
export const requireAsdManager = async (event: H3Event, slug: string) => {
  const user = await requireSessionDbUser(event)

  const db = await getDb()
  const asd = typeof slug === 'string' && slug
    ? await db.collection('associations').findOne({ slug })
    : null

  if (isAdminFlag(user.is_admin)) return { user, asd }

  if (!asd || !(await canManageAsd(user, asd))) {
    throw createError({ statusCode: 403, statusMessage: 'Non sei autorizzato a gestire questa associazione.' })
  }
  return { user, asd }
}
