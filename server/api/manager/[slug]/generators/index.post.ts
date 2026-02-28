import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)
  const slug = getRouterParam(event, 'slug')

  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404, message: 'ASD non trovata' })

  // Rimuoviamo eventuali ID sporchi passati dal body per evitare conflitti
  const { _id, association_id, ...cleanBody } = body

  const newGenerator = {
    ...cleanBody,
    association_id: new ObjectId(asd._id), // Forza sempre ObjectId
    recurrence: {
      ...cleanBody.recurrence,
      last_rolling_date: null
    },
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  }

  const result = await db.collection('generators').insertOne(newGenerator)
  return { _id: result.insertedId }
})