// server/api/manager/[slug]/memberships.get.ts
import { ObjectId } from 'mongodb'

// Definiamo la forma del socio (Membership)
interface Membership {
  _id: ObjectId;
  name: string;
  surname: string; // Criptato
  email: string;
  member_code: string;
  expiry_date: Date;
  status: string;
  [key: string]: any; // Permette altri campi extra dal DB
}

// Definiamo la forma della mail in coda
interface PendingEmail {
  recipient: string;
  scheduled_at: Date;
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db = await getDb()

  // 1. Identificazione del ruolo dell'utente dalla sessione
  // Utilizziamo il tuo store/sistema di sessione server side (es. nuxt-auth-utils o simili)
  const session = await getUserSession(event)
  const user = session.user as any

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sessione non valida o scaduta' })
  }

  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) return []

  // 3. Controllo Incrociato Ruoli / Permessi
  const isAdminGlobal = user.is_admin === true || user.is_admin === "true"

  console.log(`[DEBUG] User ${user.email} - isAdminGlobal: ${isAdminGlobal}`)

  // Controlliamo se questo utente è formalmente un manager di QUESTA specifica ASD
  const isLocalManager = await db.collection('managers').findOne({
    user_id: new ObjectId(user.id),
    association_id: new ObjectId(asd._id)
  })

 console.log(`[DEBUG] User_id ${user.id} - association_id ${asd._id} - isLocalManager:`, !!isLocalManager)

  console.log(`[DEBUG] User ${user.email} - isLocalManager for ${asd.name}:`, !!isLocalManager)

  // La regola d'oro: Se sei il manager locale, vedi in chiaro. 
  // Se sei Admin globale MA NON gestisci questa ASD, i dati vengono mascherati.
  let shouldMask = false
  if (isAdminGlobal && !isLocalManager) {
    shouldMask = true
  }

  console.log(`[DEBUG] User ${user.email} - shouldMask:`, shouldMask)

  // 1. Recupero parallelo
  const [members, pendingEmails] = await Promise.all([
    db.collection('memberships')
      .find({ association_id: asd._id })
      .sort({ expiry_date: 1 })
      .toArray() as Promise<Membership[]>, // <--- Cast del tipo qui

    db.collection('email_queue')
      .find({ asd_slug: slug, status: 'pending' })
      .project({ recipient: 1, scheduled_at: 1 })
      .toArray() as Promise<PendingEmail[]> // <--- Cast del tipo qui
  ])

  // 2. Creazione Map tipizzata
  // Ora 'e' viene riconosciuto come PendingEmail
  const pendingMap = new Map<string, Date>(
    pendingEmails.map((e: PendingEmail) => [
      e.recipient.trim().toLowerCase(),
      e.scheduled_at
    ])
  )

  // 3. Arricchimento soci
  // Ora 'm' viene riconosciuto come Membership
  const enrichedMembers = members.map((m: Membership) => {
    // Normalizziamo anche l'email del socio prima di cercare
    //const normalizedEmail = (m.email || "").trim().toLowerCase()

    // DECRIPTAZIONE
    let decryptedEmail = ''
    let decryptedSurname = ''
    
    try {
      decryptedEmail = m.email ? decrypt(m.email).trim().toLowerCase() : ''
      decryptedSurname = m.surname ? decrypt(m.surname) : ''
    } catch (e) {
      console.error(`Errore decriptazione per socio ${m._id}:`, e)
      decryptedEmail = "[ERRORE]"
      decryptedSurname = "[ERRORE]"
    }

    const isPending = pendingMap.has(decryptedEmail)

    // Applichiamo il mascheramento solo se l'utente ha i requisiti di restrizione (Admin puro)
    let finalEmail = decryptedEmail
    let finalSurname = decryptedSurname

    if (shouldMask) {
      finalEmail = decryptedEmail ? maskEmail(decryptedEmail) : 'N/D'
      finalSurname = decryptedSurname ? maskSurname(decryptedSurname) : 'N/D'
    }

    return {
      ...m,
      email: finalEmail,   // Al Manager mostriamo il dato in chiaro
      surname: finalSurname, // Al Manager mostriamo il dato in chiaro
      is_email_pending: isPending,
      scheduled_at: isPending ? pendingMap.get(decryptedEmail) : null,
      // Se i dati devono essere mascherati, proteggiamo anche i token fcm
      ...(shouldMask && { fcm_tokens: [] })
    }
  })

  return enrichedMembers
})
/*export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db = await getDb()
  
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) return []

  // Recuperiamo tutte le membership attive per questa ASD
  return await db.collection('memberships')
    .find({ association_id: asd._id })
    .sort({ expiry_date: 1 }) // Mostra prima chi sta per scadere
    .toArray()
})*/