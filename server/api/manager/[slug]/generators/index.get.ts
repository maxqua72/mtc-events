import { ObjectId } from 'mongodb'
export default defineEventHandler(async (event) => {
  const db = await getDb()
  const slug = getRouterParam(event, 'slug')

  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) return []

  // Restituiamo tutti i generatori dell'associazione
  return await db.collection('generators')
    .find({ association_id: new ObjectId(asd._id) })
    .sort({ created_at: -1 })
    .toArray()
})