// server/api/asd/[slug]/membership.get.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const { email } = getQuery(event)
  const db = await getDb()

  // 1. Troviamo prima l'ASD corretta
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404, message: 'ASD not found' })

  // 2. Troviamo la membership specifica per questo utente in questa ASD
  const membership = await db.collection('memberships').findOne({ 
    association_id: asd._id,
    email: email 
  })

  // Se non esiste, restituiamo null (l'utente è un visitatore anonimo per questa ASD)
  return membership
})