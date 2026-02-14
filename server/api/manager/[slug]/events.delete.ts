// server/api/manager/[slug]/events.delete.ts
import { ObjectId } from 'mongodb'
export default defineEventHandler(async (event) => {
  const body = await readBody(event) // Riceviamo l'ID dell'evento
  const db = await getDb()

  if (!body.id) throw createError({ statusCode: 400, statusMessage: 'ID mancante' })

  const result = await db.collection('events').deleteOne({
    _id: new ObjectId(body.id) // <--- Fondamentale l'uso di new ObjectId()
  })

  return { success: result.deletedCount > 0 }
})