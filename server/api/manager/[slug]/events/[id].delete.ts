// server/api/manager/[slug]/events/[id].delete.ts
import { ObjectId, GridFSBucket } from 'mongodb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = await getDb()

  // 1. Trova l'evento prima di cancellarlo per vedere se ha una risorsa privata
  const eventDoc = await db.collection('events').findOne({ _id: new ObjectId(id) })

  if (eventDoc && eventDoc.resource_id) {
    // 2. Controlla se la risorsa è "privata"
    const file = await db.collection('resources.files').findOne({ 
        _id: new ObjectId(eventDoc.resource_id),
        'metadata.is_event_private': true 
    })

    if (file) {
      try {
        const bucket = new GridFSBucket(db, { bucketName: 'resources' })
        await bucket.delete(file._id) 
        console.log(`File privato ${file._id} eliminato con l'evento.`)
      } catch (err) {
        console.error("Errore durante l'eliminazione del file GridFS:", err)
        // Non blocchiamo la cancellazione dell'evento se il file fallisce
      }
    }
  }

  // 3. Cancella l'evento
  await db.collection('events').deleteOne({ _id: new ObjectId(id) })

  return { success: true }
})