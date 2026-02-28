import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const id = getRouterParam(event, 'id')
  const slug = getRouterParam(event, 'slug')

  // Nota: Idealmente dovresti verificare che il generatore appartenga all'ASD dello slug
  const result = await db.collection('generators').deleteOne({ 
    _id: new ObjectId(id) 
  })

  if (result.deletedCount === 0) {
    throw createError({ statusCode: 404, message: 'Generatore non trovato' })
  }

  return { success: true }
})