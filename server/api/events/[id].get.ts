// server/api/events/[id].get.ts
// Dettaglio pubblico di un evento: le bozze (is_published != true)
// sono visibili solo ai manager della relativa ASD e agli admin.
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Event ID' })
  }

  const db = await getDb()
  const eventData = await db.collection('events').findOne({ _id: new ObjectId(id) })

  if (!eventData) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  if (eventData.is_published !== true) {
    const user = await getSessionDbUser(event)
    const asd = eventData.association_id
      ? await db.collection('associations').findOne({ _id: eventData.association_id })
      : null

    if (!(await canManageAsd(user, asd))) {
      // Stessa risposta di un evento inesistente: non riveliamo che la bozza esiste
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }
  }

  return eventData
})
