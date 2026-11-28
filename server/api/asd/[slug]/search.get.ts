// server/api/asd/[slug]/search.get.ts
// Ricerca pubblica sugli eventi di un'ASD.
// - I visitatori vedono solo gli eventi pubblicati.
// - I soci vengono cercati SOLO se l'utente in sessione è manager dell'ASD (o admin),
//   e vengono restituiti solo i campi mostrati nei risultati (niente token).
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const safeDecrypt = (value: any) => {
  try {
    return decrypt(value)
  } catch {
    return '****'
  }
}

export default defineEventHandler(async (event) => {
  const params = event.context.params as { slug: string }
  const slug = params?.slug

  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q.slice(0, 100) : ''
  const wantsMembers = query.includeMembers === 'true'

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing ASD slug' })
  }

  const db = await getDb()
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) {
    throw createError({ statusCode: 404, message: 'Associazione non trovata' })
  }

  const user = await getSessionDbUser(event)
  const isManager = await canManageAsd(user, asd)

  const searchRegex = new RegExp(escapeRegex(q), 'i')

  // 1. Eventi: ai non-manager solo quelli pubblicati
  const eventsFilter: any = {
    association_id: asd._id,
    $or: [
      { title: searchRegex },
      { category: searchRegex }
    ]
  }
  if (!isManager) eventsFilter.is_published = true

  const eventsPromise = db.collection('events').find(eventsFilter).limit(10).toArray()

  // 2. Soci: solo per manager/admin di questa ASD
  let membersPromise: Promise<any[]> = Promise.resolve([])
  if (wantsMembers && isManager) {
    membersPromise = db.collection('memberships').find(
      {
        association_id: asd._id,
        $or: [
          { name: searchRegex },
          { surname: searchRegex },
          { email: searchRegex },
          { member_code: searchRegex }
        ]
      },
      { projection: { name: 1, surname: 1, email: 1, member_code: 1, status: 1, expiry_date: 1 } }
    ).limit(10).toArray()
      .then(list => list.map(m => ({
        ...m,
        surname: safeDecrypt(m.surname),
        email: safeDecrypt(m.email)
      })))
  }

  const [foundEvents, foundMembers] = await Promise.all([eventsPromise, membersPromise])

  return {
    events: foundEvents,
    members: foundMembers
  }
})
