import { ObjectId } from 'mongodb'
export default defineEventHandler(async (event) => {
  const db = await getDb()
  const slug = getRouterParam(event, 'slug')

  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) return []

  // 2. Assicuriamoci di avere l'ID in formato stringa o ObjectId puro
  // asd._id potrebbe essere già un ObjectId o una stringa a seconda del driver/setup
  const targetId = typeof asd._id === 'string' ? new ObjectId(asd._id) : asd._id

  console.log("Cerco generatori per ID:", targetId) // Debug log

  // Restituiamo tutti i generatori dell'associazione
  return await db.collection('generators')
    .find({ association_id: targetId })
    .sort({ created_at: -1 })
    .toArray()
})