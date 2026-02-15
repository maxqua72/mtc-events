// server/api/manager/[slug]/events/[id].put.ts
import { ObjectId, GridFSBucket } from 'mongodb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = await getDb()
  const body = await readBody(event)

  // Estraiamo _id e asd_slug per NON salvarli nel documento evento
  // asd_slug viene rimosso qui così non finisce nel database come campo extra
  const { _id, asd_slug, ...updateData } = body

  // 1. GESTIONE PULIZIA IMMAGINI (Logica per evitare file orfani)
  const oldEvent = await db.collection('events').findOne({ _id: new ObjectId(id) })

  // Se il resource_id è cambiato, controlliamo se il vecchio era un file privato da eliminare
  if (oldEvent?.resource_id && String(oldEvent.resource_id) !== String(updateData.resource_id)) {
    const oldFile = await db.collection('resources.files').findOne({ 
      _id: new ObjectId(oldEvent.resource_id),
      'metadata.is_event_private': true 
    })

    if (oldFile) {
      const bucket = new GridFSBucket(db, { bucketName: 'resources' })
      try {
        await bucket.delete(oldFile._id)
      } catch (err) {
        console.error("Errore eliminazione vecchio file orfano:", err)
      }
    }
  }

  // 2. CONVERSIONE TIPI (ObjectId e Date)
  if (updateData.association_id && typeof updateData.association_id === 'string') {
    updateData.association_id = new ObjectId(updateData.association_id)
  }
  
  // Convertiamo anche il resource_id se presente
  if (updateData.resource_id && typeof updateData.resource_id === 'string') {
    updateData.resource_id = new ObjectId(updateData.resource_id)
  }

  if (updateData.start_date) updateData.start_date = new Date(updateData.start_date)
  if (updateData.end_date) updateData.end_date = new Date(updateData.end_date)
  if (updateData.registration_time) updateData.registration_time = new Date(updateData.registration_time)

  // 3. AGGIORNAMENTO SUL DB
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