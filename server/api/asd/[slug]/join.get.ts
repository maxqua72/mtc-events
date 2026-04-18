import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const { t: rawToken } = getQuery(event)
  const db = await getDb()

  if (!rawToken) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token mancante'
    })
  }

  // Prepariamo le due versioni del token:
  // 1. Quella "As Is" per il token lungo (preserva i trattini dell'UUID)
  const longTokenSearch = rawToken.toString().trim()
  
  // 2. Quella "Normalizzata" per il token corto (rimuove trattini e uppercase)
  const shortTokenSearch = rawToken.toString().replace(/-/g, '').trim().toUpperCase()

  // 1. Trova l'ASD per assicurarci che lo slug sia corretto
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) {
    throw createError({ statusCode: 404, statusMessage: 'Associazione non trovata' })
  }

  // 2. Cerca la membership corrispondente al token e all'ASD
  const membership = await db.collection('memberships').findOne({
    association_id: asd._id,
    status: 'active', // Solo soci attivi possono fare la join
    $or: [
      { join_token: longTokenSearch },  // Cerca l'UUID completo (con trattini)
      { short_token: shortTokenSearch } // Cerca il codice corto (senza trattini)
    ]
  })

  if (!membership) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Link non valido, scaduto o socio non attivo'
    })
  }

  // 3. Verifichiamo se la data di scadenza è già passata
  const now = new Date()
  if (new Date(membership.expiry_date) < now) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Iscrizione scaduta. Contatta il manager.'
    })
  }

  // 4. Restituiamo solo i dati necessari allo store dell'utente
  // Non restituiamo l'intero documento per privacy
  return {
    name: membership.name,
    email: membership.email,
    member_code: membership.member_code,
    start_date: membership.start_date,
    expiry_date: membership.expiry_date,
    role: 'MEMBER' // Identifichiamo l'utente come socio da ora in poi
  }
})