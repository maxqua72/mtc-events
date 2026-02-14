// server/api/events/[id].get.ts
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = await getDb()

  try {
    const eventData = await db.collection('events').findOne({ 
      _id: new ObjectId(id) 
    })

    if (!eventData) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    return eventData
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Event ID' })
  }
})