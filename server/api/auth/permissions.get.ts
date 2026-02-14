// server/api/auth/permissions.get.ts
export default defineEventHandler(async (event) => {
  const { email } = getQuery(event)
  const db = await getDb()

  // Inizializziamo sempre la stessa struttura
  const response = {
    is_admin: false,
    managed_asds: [] as any[]
  }

  const user = await db.collection('users').findOne({ email })
  
  // Se l'utente non esiste, restituiamo subito la struttura base "vuota"
  if (!user) return response

  response.is_admin = user.is_admin || false

  const memberships = await db.collection('managers').aggregate([
    { $match: { user_id: user._id } },
    { $lookup: {
        from: 'associations',
        localField: 'association_id',
        foreignField: '_id',
        as: 'asd_info'
    }},
    { $unwind: '$asd_info' },
    { $project: {
        _id: 0,
        role: 1,
        asd_name: '$asd_info.name',
        asd_slug: '$asd_info.slug'
    }}
  ]).toArray()

  response.managed_asds = memberships
  return response
})