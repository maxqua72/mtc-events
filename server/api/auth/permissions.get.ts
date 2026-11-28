// server/api/auth/permissions.get.ts
// Restituisce i permessi dell'utente DELLA SESSIONE.
// Il parametro ?email= non viene più accettato: prima permetteva a chiunque
// di scoprire se un'email apparteneva a un admin o a un manager.
export default defineEventHandler(async (event) => {
  const user = await requireSessionDbUser(event)
  const db = await getDb()

  const fullUser = await db.collection('users').findOne(
    { _id: user._id },
    { projection: { email: 1, name: 1, surname: 1, is_admin: 1 } }
  )

  const managedAsds = await db.collection('managers').aggregate([
    { $match: { user_id: user._id } },
    { $lookup: {
        from: 'associations',
        localField: 'association_id',
        foreignField: '_id',
        as: 'asd'
    }},
    { $unwind: '$asd' },
    { $project: { _id: 0, role: 1, asd_slug: '$asd.slug', asd_name: '$asd.name' } }
  ]).toArray()

  return {
    email: fullUser?.email,
    name: fullUser?.name || 'Utente',
    surname: fullUser?.surname,
    is_admin: fullUser?.is_admin === true || fullUser?.is_admin === 'true',
    managed_asds: managedAsds,
    member_identities: [] as any[]
  }
})
