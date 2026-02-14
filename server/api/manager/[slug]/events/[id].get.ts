// server/api/manager/[slug]/events/[id].get.ts
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  // 1. Recuperiamo i parametri dalla rotta
  // Lo slug dell'ASD (per eventuale validazione incrociata) e l'ID dell'evento
  const slug = getRouterParam(event, 'slug')
  const id = getRouterParam(event, 'id')
  
  const db = await getDb()

  // 2. Validazione dell'ID
  if (!id || !ObjectId.isValid(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID Evento non valido o mancante',
    })
  }

  // 3. Ricerca dell'evento
  // Cerchiamo l'evento tramite il suo ID univoco
  const eventData = await db.collection('events').findOne({ 
    _id: new ObjectId(id) 
  })

  // 4. Gestione errore se l'evento non esiste
  if (!eventData) {
    throw createError({
      statusCode: 404,
      statusMessage: `Evento con ID ${id} non trovato`,
    })
  }

  // 5. Restituiamo l'oggetto singolo (non un array!)
  // Questo permetterà a EventEditor di popolare correttamente il form
  return eventData
})