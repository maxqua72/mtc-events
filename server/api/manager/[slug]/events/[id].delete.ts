// server/api/manager/[slug]/events/[id].delete.ts
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = await getDb()

  await db.collection('events').deleteOne({ _id: new ObjectId(id) })
  return { success: true }
})