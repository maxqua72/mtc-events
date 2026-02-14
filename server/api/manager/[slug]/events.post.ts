// server/api/manager/[slug]/events.post.ts
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)
  const db = await getDb()

  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404, statusMessage: 'ASD non trovata' })

  // Prepariamo i dati
  const eventData = {
    association_id: asd._id,
    title: body.title,
    description: body.description,
    start_date: new Date(body.start_date),
    end_date: body.end_date ? new Date(body.end_date) : new Date(body.start_date),
    start_time: body.start_time,
    end_time: body.end_time,
    location: body.location,
    updated_at: new Date()
  }

  // LOGICA EDIT vs CREATE
  if (body._id) {
    // MODIFICA
    const result = await db.collection('events').updateOne(
      { _id: new ObjectId(body._id) }, // <--- Trasforma la stringa in ObjectId
      { $set: eventData }
    )
    return { success: result.modifiedCount > 0, mode: 'update' }
  } else {
    // CREAZIONE
    const result = await db.collection('events').insertOne({ 
      ...eventData, 
      created_at: new Date() 
    })
    return { success: true, mode: 'insert' }
  }
})