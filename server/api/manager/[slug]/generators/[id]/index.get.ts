import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const id = getRouterParam(event, 'id')
  
  const generator = await db.collection('generators').findOne({ 
    _id: new ObjectId(id) 
  })

  if (!generator) {
    throw createError({ statusCode: 404, message: 'Matrice non trovata' })
  }

  return generator
})