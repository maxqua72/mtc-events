// server/api/manager/[slug]/events/[id].put.ts
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = await getDb()
  const body = await readBody(event)

  // Rimuoviamo _id dal body per evitare errori di MongoDB nel rimpiazzo
  const { _id, ...updateData } = body

  await db.collection('events').updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        ...updateData, 
        updated_at: new Date() 
      } 
    }
  )

  return { success: true }
})