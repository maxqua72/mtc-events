// server/api/admin/associations/[id].put.ts
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = await getDb()
  const body = await readBody(event)

  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID ASD non valido' })
  }

  // Rimuoviamo _id per evitare errori di MongoDB durante l'update
  const { _id, ...updateData } = body
  updateData.updated_at = new Date()

  const result = await db.collection('associations').updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  )

  if (result.matchedCount === 0) {
    throw createError({ statusCode: 404, statusMessage: 'ASD non trovata' })
  }

  return { success: true }
})