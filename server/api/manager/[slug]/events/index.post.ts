// server/api/manager/[slug]/events/index.post.ts
export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)
  const slug = getRouterParam(event, 'slug')

  // Recuperiamo l'ASD per avere l'association_id
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404, message: 'ASD non trovata' })

  const newEvent = {
    ...body,
    association_id: asd._id,
    created_at: new Date(),
    updated_at: new Date()
  }

  const result = await db.collection('events').insertOne(newEvent)
  return { _id: result.insertedId }
})