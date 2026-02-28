import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  // 1. PULIZIA PAYLOAD
  // Rimuoviamo _id (per evitare errori Mongo) e asd_slug (che non deve stare nel DB)
  const { _id, asd_slug, ...updateData } = body

  // 2. CONVERSIONE DATE (Fondamentale per non "rompere" la lista)
  if (updateData.start_date) updateData.start_date = new Date(updateData.start_date)
  if (updateData.end_date) updateData.end_date = new Date(updateData.end_date)
  if (updateData.registration_time) updateData.registration_time = new Date(updateData.registration_time)
  
  // Gestione specifica per l'ultimo rolling (se presente nel payload)
  if (updateData.recurrence?.last_rolling_date) {
    updateData.recurrence.last_rolling_date = new Date(updateData.recurrence.last_rolling_date)
  }

  // 3. CONVERSIONE OBJECTID
  if (updateData.association_id && typeof updateData.association_id === 'string') {
    updateData.association_id = new ObjectId(updateData.association_id)
  }
  if (updateData.resource_id && typeof updateData.resource_id === 'string') {
    updateData.resource_id = new ObjectId(updateData.resource_id)
  }

  // 4. AGGIORNAMENTO
  const result = await db.collection('generators').updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        ...updateData, 
        updated_at: new Date() 
      } 
    }
  )

  // Restituiamo success: true se il documento è stato trovato (anche se non modificato)
  // o se è stato effettivamente modificato.
  return { success: result.matchedCount > 0 }
})