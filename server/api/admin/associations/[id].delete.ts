// server/api/admin/associations/[id].delete.ts
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = await getDb()

  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID ASD non valido' })
  }

  const asdObjectId = new ObjectId(id)

  // 1. Rimuoviamo i legami dei MANAGER
  await db.collection('managers').deleteMany({ association_id: asdObjectId })

  // 2. Rimuoviamo le MEMBERSHIP (i soci legati a questa ASD)
  await db.collection('memberships').deleteMany({ association_id: asdObjectId })

  // 3. Rimuoviamo gli EVENTI dell'ASD
  await db.collection('events').deleteMany({ association_id: asdObjectId })

  // 4. Rimuoviamo l'ASD stessa
  const result = await db.collection('associations').deleteOne({ _id: asdObjectId })

  if (result.deletedCount === 0) {
    throw createError({ statusCode: 404, statusMessage: 'ASD non trovata' })
  }

  return { success: true, message: 'ASD e tutte le relative relazioni rimosse' }
})