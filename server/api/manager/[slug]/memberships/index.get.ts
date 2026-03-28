// server/api/manager/[slug]/memberships.get.ts
import { ObjectId } from 'mongodb'

// Definiamo la forma del socio (Membership)
interface Membership {
  _id: ObjectId;
  name: string;
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

  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) return []

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
    const normalizedEmail = (m.email || "").trim().toLowerCase()
    const isPending = pendingMap.has(normalizedEmail)

    return {
      ...m,
      is_email_pending: isPending,
      scheduled_at: isPending ? pendingMap.get(normalizedEmail) : null
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