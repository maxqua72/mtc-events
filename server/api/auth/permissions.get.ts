// server/api/auth/permissions.get.ts
export default defineEventHandler(async (event) => {
  const { email } = getQuery(event)
  const db = await getDb()

  // Inizializziamo sempre la stessa struttura
  const response = {
    email: email,
    name: '',
    is_admin: false,
    managed_asds: [] as any[],
    member_identities: [] as any[]
  }

  const user = await db.collection('users').findOne({ email })
  
  // Se l'utente non esiste, restituiamo subito la struttura base "vuota"
  if (!user) return response

  response.is_admin = !!user.is_admin
  response.name = user.name || 'Utente'
/*
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
*/

  // 1. Recupera le ASD dove è MANAGER
  const managerRoles = await db.collection('managers').aggregate([
    { $match: { user_id: user._id } },
    { $lookup: {
        from: 'associations',
        localField: 'association_id',
        foreignField: '_id',
        as: 'asd'
    }},
    { $unwind: '$asd' },
    { $project: { role: 1, asd_slug: '$asd.slug', asd_name: '$asd.name' }}
  ]).toArray()
  response.managed_asds = managerRoles

  // 2. Recupera le ASD dove è SOCIO (Membership)
  const memberships = await db.collection('memberships').aggregate([
    { $match: { email: email, status: 'active' } },
    { $lookup: {
        from: 'associations',
        localField: 'association_id',
        foreignField: '_id',
        as: 'asd'
    }},
    { $unwind: '$asd' },
    { $project: {
        asd_slug: '$asd.slug',
        name: 1,
        email: 1,
        expiry_date: 1,
        start_date: 1,
        member_code: 1
    }}
  ]).toArray()
  response.member_identities = memberships

  //response.managed_asds = memberships
  return response
})