// server/api/manager/[slug]/memberships.get.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db = await getDb()
  
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) return []

  // Recuperiamo tutte le membership attive per questa ASD
  return await db.collection('memberships')
    .find({ association_id: asd._id })
    .sort({ expiry_date: 1 }) // Mostra prima chi sta per scadere
    .toArray()
})